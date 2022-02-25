import { styled } from "goober";
import * as React from "react";

import { examples } from "./examples";
import { FlexRow, WidthHeight } from "./goober/styled";
import { isKeyOf } from "./Processor/type-guards";
import { DeepPick } from "./type-utils";
import { ProcessorReducerDispatch, ProcessorReducerState } from "./useProcessorReducer";

interface ControlButtonsProps {
  state: DeepPick<ProcessorReducerState, "doneRunning">;
  dispatch: ProcessorReducerDispatch;
}

const ControlButton = styled("button")`
  flex: 1;
  height: 100%;
`;

/** Buttons to give instructions to the processor */
export const ControlButtons = ({ state, dispatch }: ControlButtonsProps): JSX.Element => {
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
          disabled={state.doneRunning}
          onClick={(_ev) => {
            // run the code starting from PC 0
            dispatch({ type: "runCode", PC: 0 });
          }}>
          run code
        </ControlButton>
        <ControlButton
          type="button"
          disabled={state.doneRunning}
          onClick={(_ev) => {
            // runs the next instruction
            dispatch({ type: "runNextInstruction" });
          }}>
          step by one
        </ControlButton>
        <select
          title="code examples"
          defaultValue=""
          onChange={(ev) => {
            const example = ev.currentTarget.value;

            if (isKeyOf(example, examples)) {
              dispatch({ type: "loadExample", example });
              ev.currentTarget.value = "";
            }
          }}>
          <option value="" />
          {Object.keys(examples).map((exampleName) => (
            <option key={`code-examples-option-${exampleName}`} value={exampleName}>
              {exampleName}
            </option>
          ))}
        </select>
      </FlexRow>
    </WidthHeight>
  );
};
