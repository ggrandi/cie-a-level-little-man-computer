import { Reducer, useReducer } from "react";

import { Processor } from "./Processor/Processor";
import { translator } from "./Processor/translator";
import { ToReducerActions } from "./type-utils";
import { createUndoable, redo, setNext, undo, Undoable } from "./undoable";
import { examples } from "./examples";

/** the different types of actions the reducer can have */
export type ProcessorActions = ToReducerActions<{
  setCode: {
    code: string;
  };
  loadCode: Record<string, never>;
  runCode: {
    PC?: number;
  };
  runNextInstruction: Record<string, never>;
  undo: Record<string, never>;
  redo: Record<string, never>;
  loadExample: { example: keyof typeof examples };
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
  doneRunning: boolean;
  error?: number;
  previousInstruction: ReturnType<Processor["getRegisters"]>["PC"] | undefined;
}

/** function to actually use the state and actions */
const processorReducer: Reducer<ProcessorReducerState, ProcessorActions> = (prevState, action) => {
  switch (action.type) {
    case "setCode": {
      // updates the code
      const code = setNext(prevState.code, action.code);

      return { ...prevState, code };
    }
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

      // set the previous instruction to undefined
      const previousInstruction = undefined;

      return {
        ...prevState,
        memory,
        charOutput,
        labels,
        translatorErrors,
        registers,
        previousInstruction,
        doneRunning: false,
      };
    }
    case "runCode": {
      // don't run if the program has terminated
      if (prevState.doneRunning) {
        return prevState;
      }

      // create a character output based on the previous state
      let charOutput = prevState.charOutput;

      // creates a new processor based on the current state
      const processor = new Processor({
        memory: prevState.memory,
        IX: prevState.registers.IX,
        ACC: prevState.registers.ACC,
        PC: prevState.registers.PC,
        SR: prevState.registers.SR,
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

      // set the previous instruction to one before because the last instruction had to be `END`
      const previousInstruction = processor.PC - 1;

      return {
        ...prevState,
        memory,
        charOutput,
        registers,
        previousInstruction,
        doneRunning: true,
      };
    }
    case "runNextInstruction": {
      // don't run if the program has terminated
      if (prevState.doneRunning) {
        return prevState;
      }

      // gets the previous charOutput
      let charOutput = prevState.charOutput;

      // set the previous instruction to the previous PC
      const previousInstruction = prevState.registers.PC;

      // creates a new processor based on the current state
      const processor = new Processor({
        memory: prevState.memory,
        IX: prevState.registers.IX,
        ACC: prevState.registers.ACC,
        PC: prevState.registers.PC,
        SR: prevState.registers.SR,
        output(char) {
          charOutput += char;
        },
      });

      // runs the next instruction
      const res = processor.runNextInstruction();

      // checks if it is done running
      const doneRunning = Boolean(res && res?.end);

      // fetches the memory from the processor
      const memory = processor.getMemorySlice();

      // fetches the registers from the processor
      const registers = processor.getRegisters();

      return { ...prevState, memory, charOutput, registers, previousInstruction, doneRunning };
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
    case "loadExample": {
      // gets the code for the example
      const example = examples[action.example];

      // sets the example code as the next state
      const code = setNext(prevState.code, example);

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
  doneRunning: true,
  previousInstruction: undefined,
});

/** Dispatcher type for the processor reducer */
export type ProcessorReducerDispatch = React.Dispatch<ProcessorActions>;

/** hook to use the processor reducer */
export const useProcessorReducer = (): [ProcessorReducerState, ProcessorReducerDispatch] => {
  return useReducer(processorReducer, examples["Hello World!"], initializeProcessorReducerState);
};
