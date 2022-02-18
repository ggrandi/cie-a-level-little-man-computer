import { Reducer, useReducer } from "react";

import { Processor } from "./Processor/Processor";
import { translator } from "./Processor/translator";
import { ToReducerActions } from "./type-utils";

/** the different types of actions the reducer can have */
export type ProcessorActions = ToReducerActions<{
  loadCode: Record<string, never>;
  runCode: {
    PC?: number;
  };
  setCode: {
    code: string;
  };
}>;

interface TranslatorErrors {
  lineNumber: number;
  errors: string[];
}

/** the state of the processor reducer */
export interface ProcessorReducerState {
  code: string;
  memory: Uint16Array;
  charOutput: string;
  labels: Record<string, number> & Record<number, string>;
  translatorErrors: TranslatorErrors[];
}

/** function to actually use the state and actions */
const processorReducer: Reducer<ProcessorReducerState, ProcessorActions> = (prevState, action) => {
  switch (action.type) {
    case "loadCode": {
      // creates a new processor
      const processor = new Processor();

      // clears the processor memory and output
      const charOutput = "";

      // creates the map to store the labels in
      const labels: ProcessorReducerState["labels"] = {};

      const translatorErrors: TranslatorErrors[] = [];

      // loads the code into the processor
      processor.loadMemory(
        translator.call(
          {
            getLabels(l) {
              for (const [label, address] of l.entries()) {
                labels[label] = address;
                labels[address] = label;
              }
            },
            getErrors(lineNumber, errors) {
              translatorErrors.push({ lineNumber, errors });
            },
          },
          prevState.code
        )
      );

      // fetches the memory from the processor
      const memory = processor.getMemorySlice();

      return { ...prevState, memory, charOutput, labels, translatorErrors };
    }
    case "runCode": {
      let charOutput = "";

      // loads the memory based on the current state and outputs to the declared variable
      const processor = new Processor({
        memory: prevState.memory,
        output(char) {
          charOutput += char;
        },
      });

      // runs the code in memory
      processor.runCode();

      // fetches the memory from the processor
      const memory = processor.getMemorySlice();

      return { ...prevState, memory, charOutput };
    }
    case "setCode": {
      // updates the code
      return { ...prevState, code: action.code };
    }
  }
};
// creates initial state for the reducer
const initializeProcessorReducerState = (): ProcessorReducerState => ({
  code: initialCode,
  memory: new Uint16Array(Processor.MAX_INT + 1),
  charOutput: "",
  labels: {},
  translatorErrors: [],
});

const initialCode = `// print out a string\nstart:\tLDX string\n\tCMP #0\n\tJPE end\n\tOUT\n\tINC IX\n\tJMP start\nend:\tEND\nstring:\t#&48\n\t#&65\n\t#&6C\n\t#&6C\n\t#&6F\n\t#&20\n\t#&57\n\t#&6F\n\t#&72\n\t#&6C\n\t#&64\n\t#&21\n\t#&0A\n`;

/** Dispatcher type for the processor reducer */
export type ProcessorReducerDispatch = React.Dispatch<ProcessorActions>;

/** hook to use the processor reducer */
export const useProcessorReducer = (): [ProcessorReducerState, ProcessorReducerDispatch] => {
  return useReducer(processorReducer, undefined, initializeProcessorReducerState);
};
