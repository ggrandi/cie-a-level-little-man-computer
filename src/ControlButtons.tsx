import { styled } from "goober";
import * as React from "react";

import { examples } from "./examples";
import { FlexRow, WidthHeight } from "./goober/styled";
import { useLoadFile } from "./nativeFilesystem";
import { isKeyOf } from "./Processor/type-guards";
import { isOk } from "./result";
import { DeepPick } from "./type-utils";
import { useFullscreen } from "./useFullscreen";
import { ProcessorReducerDispatch, ProcessorReducerState } from "./useProcessorReducer";

interface ControlButtonsProps {
  state: DeepPick<ProcessorReducerState, "doneRunning">;
  dispatch: ProcessorReducerDispatch;
  supportsFullscreen: ReturnType<typeof useFullscreen>[0];
  requestFullscreen: ReturnType<typeof useFullscreen>[1];
}

const ControlButton = styled("button")`
  flex: 1;
  height: 100%;
  overflow: none;
`;

/** Buttons to give instructions to the processor */
export const ControlButtons = ({
  state: { doneRunning },
  dispatch,
  supportsFullscreen,
  requestFullscreen,
}: ControlButtonsProps): JSX.Element => {
  const [loadFile, helper] = useLoadFile();

  return (
    <WidthHeight $height="5%">
      <FlexRow $alignItems={"center"} $justifyContent={"space-evenly"}>
        <ControlButton
          type="button"
          onClick={(_ev) => {
            // make the reducer load the code into the processor
            dispatch({ type: "loadCode" });
          }}>
          load into ram
        </ControlButton>
        <ControlButton
          type="button"
          disabled={doneRunning}
          onClick={(_ev) => {
            // run the code starting from PC 0
            dispatch({ type: "runCode", PC: 0 });
          }}>
          run code
        </ControlButton>
        <ControlButton
          type="button"
          disabled={doneRunning}
          onClick={(_ev) => {
            // runs the next instruction
            dispatch({ type: "runNextInstruction" });
          }}>
          step by one
        </ControlButton>
      </FlexRow>
      <FlexRow $alignItems={"center"} $justifyContent={"space-evenly"}>
        <select
          title="code examples"
          defaultValue=""
          onChange={(ev) => {
            const { value } = ev.currentTarget;

            if (isKeyOf(value, examples)) {
              dispatch({ type: "loadExample", example: value });
            } else if (value === "suggest") {
              dispatch({ type: "submitExample" });
            }

            ev.currentTarget.value = "";
          }}>
          <option value="" />
          {Object.keys(examples).map((exampleName) => (
            <option key={`code-examples-option-${exampleName}`} value={exampleName}>
              {exampleName}
            </option>
          ))}
          <option value="-" />
          <option value="suggest">Suggest An Example</option>
        </select>
        <ControlButton
          type="button"
          onClick={(_ev) => {
            dispatch({ type: "saveFile" });
          }}>
          save code
        </ControlButton>
        <ControlButton
          type="button"
          onClick={async (_ev) => {
            const res = await loadFile();

            console.log(res);

            if (isOk(res)) {
              const fileBuffer = await res.data.arrayBuffer();

              const code = new TextDecoder().decode(fileBuffer);

              dispatch({ type: "setCode", code, cursorPos: 0 });
            }
          }}>
          load code
        </ControlButton>
        {helper}
        {supportsFullscreen && (
          <ControlButton
            type="button"
            onClick={(_ev) => {
              // requests fullscreen
              requestFullscreen?.();
            }}>
            fullscreen editor
          </ControlButton>
        )}
      </FlexRow>
    </WidthHeight>
  );
};
