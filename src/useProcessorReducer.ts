import { Reducer, useReducer } from "react";

import { ErrorCode, Processor } from "./Processor/Processor";
import { translator } from "./Processor/translator";
import { Optional, ToReducerActions } from "./type-utils";
import { createUndoable, redo, setNext, undo, Undoable } from "./undoable";
import { examples } from "./examples";

/** the different types of actions the reducer can have */
export type ProcessorActions = ToReducerActions<{
  setCode: {
    code: string;
    cursorPos: number;
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
  codeState: Undoable<{ code: string; cursorPos: number }>;
  memory: Uint16Array;
  charOutput: string;
  labels: Record<string, number> & Record<number, string>;
  translatorErrors: TranslatorErrors[];
  registers: ReturnType<Processor["getRegisters"]>;
  doneRunning: boolean;
  previousInstruction: Optional<ReturnType<Processor["getRegisters"]>["PC"]>;
  error: Optional<{ errorType: keyof typeof ErrorCode; errorCode: ErrorCode }>;
}

/** function to actually use the state and actions */
const processorReducer: Reducer<ProcessorReducerState, ProcessorActions> = (prevState, action) => {
  switch (action.type) {
    case "setCode": {
      // gets the next value of code from the action
      const { type: _, ...nextCode } = action;

      // updates the code
      const codeState = setNext(prevState.codeState, nextCode);

      return { ...prevState, codeState };
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
          prevState.codeState.present.code
        )
      );

      // fetches the memory from the processor
      const memory = processor.getMemorySlice();

      // fetches the registers from the processor
      const registers = processor.getRegisters();

      // set the previous instruction to undefined
      const previousInstruction = undefined;

      // only allow it to run if there where no errors
      const doneRunning = translatorErrors.length !== 0;

      return {
        ...prevState,
        memory,
        charOutput,
        labels,
        translatorErrors,
        registers,
        previousInstruction,
        doneRunning,
      };
    }
    case "runCode": {
      // don't run if the program has terminated
      if (prevState.doneRunning) {
        return prevState;
      }

      // create a character output based on the previous state
      let charOutput = prevState.charOutput;

      // create a variable to store a potential error
      let error: ProcessorReducerState["error"] = undefined;

      // create a variable to store whether the program is done running
      let doneRunning = true;

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
        errorHook(errorType, errorCode) {
          error = { errorType, errorCode };
        },
        breakHook() {
          doneRunning = false;
          // tells the program to end on a `BRK`
          return true;
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
        doneRunning,
        error,
      };
    }
    case "runNextInstruction": {
      // don't run if the program has terminated
      if (prevState.doneRunning) {
        return prevState;
      }

      // gets the previous charOutput
      let charOutput = prevState.charOutput;

      // create a variable to store a potential error
      let error: ProcessorReducerState["error"] = undefined;

      // set the previous instruction to the previous PC
      const previousInstruction = prevState.registers.PC;

      // creates a variable to store if a break has occured
      let encounteredBreak = false;

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
        errorHook(errorType, errorCode) {
          error = { errorType, errorCode };
        },
        breakHook() {
          encounteredBreak = true;
          // tells the program to end on a `BRK`
          return true;
        },
      });

      // runs the next instruction
      const res = processor.runNextInstruction();

      // checks if it is done running
      const doneRunning = Boolean(res && res?.end && !encounteredBreak);

      // fetches the memory from the processor
      const memory = processor.getMemorySlice();

      // fetches the registers from the processor
      const registers = processor.getRegisters();

      return {
        ...prevState,
        memory,
        charOutput,
        registers,
        previousInstruction,
        doneRunning,
        error,
      };
    }
    case "undo": {
      // undo the code
      const codeState = undo(prevState.codeState);

      return { ...prevState, codeState };
    }
    case "redo": {
      // redo the code
      const codeState = redo(prevState.codeState);

      return { ...prevState, codeState };
    }
    case "loadExample": {
      // gets the code for the example
      const code = examples[action.example];

      // sets the example code as the next state
      const codeState = setNext(prevState.codeState, { code, cursorPos: 0 });

      return { ...prevState, codeState };
    }
  }
};

// creates initial state for the reducer
const initializeProcessorReducerState = (code: string): ProcessorReducerState => ({
  codeState: createUndoable({ code, cursorPos: 0 }),
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
  error: undefined,
});

/** Dispatcher type for the processor reducer */
export type ProcessorReducerDispatch = React.Dispatch<ProcessorActions>;

/** hook to use the processor reducer */
export const useProcessorReducer = (): [ProcessorReducerState, ProcessorReducerDispatch] => {
  return useReducer(processorReducer, examples["Hello World!"], initializeProcessorReducerState);
};
