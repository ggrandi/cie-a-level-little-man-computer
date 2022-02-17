import * as React from "react";

import { ProcessorReducerDispatch } from "./useProcessorReducer";

interface ControlButtonsProps {
  dispatch: ProcessorReducerDispatch;
}

/** Buttons to give instructions to the processor */
export const ControlButtons = ({ dispatch }: ControlButtonsProps): JSX.Element => {
  return (
    <>
      <button
        type="button"
        onClick={(_ev) => {
          // make the reducer load the code into the processor
          dispatch({ type: "loadCode" });
        }}>
        load into ram
      </button>
      <button
        type="button"
        onClick={(_ev) => {
          // run the code starting from PC 0
          dispatch({ type: "runCode", PC: 0 });
        }}>
        run code
      </button>
    </>
  );
};
