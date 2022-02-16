import { styled } from "goober";
import React, { useState } from "react";
import { FlexRow } from "./goober/styled";
import { Border } from "./goober/styled/Border";
import { AsParamNames } from "./goober/styled/utils";
import { ProcessorReducerDispatch } from "./useProcessorReducer";

interface CodeEditorProps {
  code: string;
  dispatch: ProcessorReducerDispatch;
}

const Textarea = styled("textarea")`
  border: 0px;
  resize: none;
  width: calc(100% - 35px);
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: scroll;
  font-size: 1em;
  outline-color: transparent;
`;

const Pre = styled("pre")<AsParamNames<{ scrollTop: number }>>(
  ({ $scrollTop }) => `
  margin: 0;
  margin-top: 2px;
  font-size: 1em;
  transform: translate(0px, -${$scrollTop}px);
`
);

const Mask = styled("div")`
  height: 100%;
  overflow: hidden;
`;

export const CodeEditor = ({ code, dispatch }: CodeEditorProps) => {
  const [scrollTop, setScrollTop] = useState(0);

  return (
    <Border>
      <FlexRow $justifyContent={"space-between"}>
        <Mask>
          {/* translates the content up to simulate scrollTop in css */}
          <Pre $scrollTop={scrollTop}>
            {
              // turns the code into line numbers
              code
                .split("\n")
                .map((_, i) => `${i}.`)
                .join("\n")
            }
          </Pre>
        </Mask>
        <Textarea
          onChange={(ev) => {
            // dispatch the code to the reducer
            dispatch({ type: "setCode", code: ev.target.value });
            // change the scrollTop in the lines of code
            setScrollTop(ev.target.scrollTop);
          }}
          onScroll={(ev) =>
            // change the scrollTop in the lines of code
            setScrollTop((ev.target as HTMLTextAreaElement).scrollTop)
          }
          value={code}
          data-ms-editor={false}
          spellCheck={false}
        />
      </FlexRow>
    </Border>
  );
};
