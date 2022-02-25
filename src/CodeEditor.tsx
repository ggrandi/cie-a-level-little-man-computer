import { styled } from "goober";
import * as React from "react";

import { ColoredSpan, FlexRow } from "./goober/styled";
import { Border } from "./goober/styled/Border";
import { AsParamNames } from "./goober/styled/utils";
import { DeepPick } from "./type-utils";
import { ProcessorReducerDispatch, ProcessorReducerState } from "./useProcessorReducer";

interface CodeEditorProps {
  state: DeepPick<ProcessorReducerState, "codeState" | "translatorErrors">;
  dispatch: ProcessorReducerDispatch;
}

const Textarea = styled("textarea", React.forwardRef)`
  border: 0px;
  resize: none;
  width: calc(100% - 35px);
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: scroll;
  font-size: 1em;
  outline-color: transparent;
  font-family: monospace;
`;

const Pre = styled("pre")<AsParamNames<{ scrollTop: number }>>(
  ({ $scrollTop }) => `
  margin: 0;
  margin-top: 2px;
  font-size: 1em;
  transform: translate(0px, -${$scrollTop}px);
  font-family: monospace;
`
);

const Mask = styled("div")`
  height: 100%;
  overflow: hidden;
`;

export const CodeEditor = ({
  state: {
    codeState: {
      present: { code, cursorPos },
    },
    translatorErrors,
  },
  dispatch,
}: CodeEditorProps): JSX.Element => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const textareaRef = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      if (node) {
        node.selectionStart = node.selectionEnd = cursorPos;
      }
    },
    [cursorPos]
  );

  return (
    <Border>
      <FlexRow $justifyContent={"space-between"}>
        <Mask>
          {/* translates the content up to simulate scrollTop in css */}
          <Pre $scrollTop={scrollTop}>
            {
              // turns the code into line numbers
              code.split("\n").map((_, i) => {
                const lineText = `${i}.`.padEnd(4, " ");

                const lineIsError =
                  translatorErrors.find(({ lineNumber }) => lineNumber === i) !== undefined;

                return (
                  <React.Fragment key={`lineNumber for line ${i}`}>
                    {lineIsError ? (
                      <ColoredSpan $background={"red"}>{lineText}</ColoredSpan>
                    ) : (
                      lineText
                    )}
                    {"\n"}
                  </React.Fragment>
                );
              })
            }
          </Pre>
        </Mask>
        <Textarea
          ref={textareaRef}
          onChange={(ev) => {
            // dispatch the code to the reducer
            dispatch({
              type: "setCode",
              code: ev.target.value,
              cursorPos: ev.currentTarget.selectionStart,
            });
            // change the scrollTop in the lines of code
            setScrollTop(ev.target.scrollTop);
          }}
          onScroll={(ev) =>
            // change the scrollTop in the lines of code
            setScrollTop((ev.target as HTMLTextAreaElement).scrollTop)
          }
          onKeyDown={(ev) => {
            const target = ev.currentTarget;

            if (ev.key === "Tab") {
              // get caret position/selection
              const start = target.selectionStart;
              const end = target.selectionEnd;

              const value = target.value;

              // set textarea value to: text before caret + tab + text after caret
              dispatch({
                type: "setCode",
                code: value.substring(0, start) + "\t" + value.substring(end),
                cursorPos: ev.currentTarget.selectionStart + 1,
              });

              // put caret at right position again (add one for the tab)
              target.selectionStart = target.selectionEnd = start + 1;

              // prevent the focus lose
              ev.preventDefault();
            } else if (ev.metaKey || ev.ctrlKey) {
              if ((ev.shiftKey && ev.key === "z") || ev.key === "y") {
                dispatch({ type: "redo" });
                ev.preventDefault();
              } else if (ev.key === "z") {
                dispatch({ type: "undo" });
                ev.preventDefault();
              }
            }
          }}
          value={code}
          data-ms-editor={false}
          spellCheck={false}
        />
      </FlexRow>
    </Border>
  );
};
