import { Reducer, useReducer } from "react";

import { Processor } from "./Processor/Processor";
import { translator } from "./Processor/translator";
import { ToReducerActions } from "./type-utils";
import { createUndoable, redo, setNext, undo, Undoable } from "./undoable";

/** the different types of actions the reducer can have */
export type ProcessorActions = ToReducerActions<{
  loadCode: Record<string, never>;
  runCode: {
    PC?: number;
  };
  setCode: {
    code: string;
  };
  undo: Record<string, never>;
  redo: Record<string, never>;
}>;

interface TranslatorErrors {
  lineNumber: number;
  errors: string[];
}

/** the state of the processor reducer */
export interface ProcessorReducerState {
  code: Undoable<string>;
  memory: Uint16Array;
  charOutput: string;
  labels: Record<string, number> & Record<number, string>;
  translatorErrors: TranslatorErrors[];
  registers: ReturnType<Processor["getRegisters"]>;
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
          prevState.code.present
        )
      );

      // fetches the memory from the processor
      const memory = processor.getMemorySlice();

      // fetches the registers from the processor
      const registers = processor.getRegisters();

      return { ...prevState, memory, charOutput, labels, translatorErrors, registers };
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

      // fetches the registers from the processor
      const registers = processor.getRegisters();

      return { ...prevState, memory, charOutput, registers };
    }
    case "setCode": {
      // updates the code
      const code = setNext(prevState.code, action.code);

      return { ...prevState, code };
    }
    case "undo": {
      // undo the code
      const code = undo(prevState.code);

      return { ...prevState, code };
    }
    case "redo": {
      // redo the code
      const code = redo(prevState.code);

      return { ...prevState, code };
    }
  }
};
// creates initial state for the reducer
const initializeProcessorReducerState = (code: string): ProcessorReducerState => ({
  code: createUndoable(code),
  memory: new Uint16Array(Processor.MAX_INT + 1),
  charOutput: "",
  labels: {},
  translatorErrors: [],
  registers: {
    ACC: 0,
    CIR: 0,
    IX: 0,
    MAR: 0,
    MDR: 0,
    PC: 0,
    SR: "0000",
  },
});

const initialCode = `// print out a string\nstart:\tLDX string\n\tCMP #0\n\tJPE end\n\tOUT\n\tINC IX\n\tJMP start\nend:\tEND\nstring:\t#&48\n\t#&65\n\t#&6C\n\t#&6C\n\t#&6F\n\t#&2C\n\t#&20\n\t#&57\n\t#&6F\n\t#&72\n\t#&6C\n\t#&64\n\t#&21\n\t#&0A\n`;

/** Dispatcher type for the processor reducer */
export type ProcessorReducerDispatch = React.Dispatch<ProcessorActions>;

/** hook to use the processor reducer */
export const useProcessorReducer = (): [ProcessorReducerState, ProcessorReducerDispatch] => {
  return useReducer(processorReducer, initialCode, initializeProcessorReducerState);
};
