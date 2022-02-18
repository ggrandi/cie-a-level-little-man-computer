import { styled } from "goober";
import * as React from "react";

import { FlexRow, WidthHeight } from "./goober/styled";
import { ProcessorReducerDispatch } from "./useProcessorReducer";

interface ControlButtonsProps {
  dispatch: ProcessorReducerDispatch;
}

const ControlButton = styled("button")`
  flex: 1;
  height: 100%;
`;

/** Buttons to give instructions to the processor */
export const ControlButtons = ({ dispatch }: ControlButtonsProps): JSX.Element => {
  return (
    <WidthHeight $height="8%">
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
          onClick={(_ev) => {
            // run the code starting from PC 0
            dispatch({ type: "runCode", PC: 0 });
          }}>
          run code
        </ControlButton>
      </FlexRow>
    </WidthHeight>
  );
};
