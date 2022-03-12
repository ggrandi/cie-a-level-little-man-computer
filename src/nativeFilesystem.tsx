import * as React from "react";

import { Err, Ok, Result } from "./result";
import { Optional } from "./type-utils";
import { sleep } from "./utils";

interface SaveFileParams {
  content: string;
}

const fileExtension = ".lcie";
const mimeType = "text/plain";

type SaveFile = (opts: SaveFileParams) => Promise<boolean>;

const saveFn: SaveFile = async ({ content }) => {
  try {
    // create a new handle
    const newHandle = await showSaveFilePicker({
      types: [{ accept: { [mimeType]: fileExtension } }],
    });

    // create a FileSystemWritableFileStream to write to
    const writableStream = await newHandle.createWritable();

    // write our file
    await writableStream.write(new TextEncoder().encode(content));

    // close the file and write the contents to disk.
    await writableStream.close();

    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

const saveFnFallback: SaveFile = async ({ content }) => {
  try {
    const file = new Blob([content], { type: mimeType });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = `code${fileExtension}`;

    a.click();

    return true;
  } catch {
    return false;
  }
};

/** saves a file to the user's computer */
export const saveFile = typeof window.showOpenFilePicker !== "undefined" ? saveFn : saveFnFallback;

type UseLoadFile = () => [loadFile: () => Promise<Result<File, Error>>, loadFileComp?: JSX.Element];

const useLoadFileFn: UseLoadFile = () => [
  async () => {
    try {
      // create a new handle
      const [fileHandle] = await showOpenFilePicker({
        multiple: false,
        excludeAcceptAllOption: true,
        types: [
          {
            accept: {
              [mimeType]: fileExtension,
            },
          },
        ],
      });

      // get the file from the handle
      const file = await fileHandle.getFile();

      return Ok(file);
    } catch (e) {
      console.error(e);

      if (e instanceof Error) return Err(e);

      return Err(new Error(JSON.stringify(e, null, 2)));
    }
  },
];

let onChange: Optional<AbortController>;

const useLoadFileFallback: UseLoadFile = () => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const input = <input type="file" hidden accept={fileExtension} ref={inputRef} />;

  return [
    async () => {
      try {
        if (onChange) {
          onChange.abort();
        }

        onChange = new AbortController();

        const input = inputRef.current;

        if (!input) throw new Error("Input didn't appear");

        input.value = "";

        const changed = new Promise<unknown>((res, rej) => {
          input.addEventListener("change", res, {
            once: true,
            signal: onChange?.signal,
          });

          onChange?.signal.addEventListener("abort", () => rej("The eventlistener was removed"), {
            once: true,
          });
        });

        await sleep();

        input.click();

        await Promise.race([changed]);

        onChange = undefined;

        const file = input.files?.[0];

        if (!file) {
          throw new Error("Couldn't find the file");
        }

        return Ok(file);
      } catch (e) {
        onChange?.abort();

        console.error(e);

        if (e instanceof Error) return Err(e);

        return Err(new Error(JSON.stringify(e, null, 2)));
      }
    },
    input,
  ];
};
/** saves a file to the user's computer */
export const useLoadFile =
  typeof window.showOpenFilePicker !== "undefined" ? useLoadFileFn : useLoadFileFallback;
