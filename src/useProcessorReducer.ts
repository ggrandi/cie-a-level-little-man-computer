import { Reducer, useReducer } from "react";
import { Processor } from "./Processor/Processor";
import { translator } from "./Processor/translator";
import { ToReducerActions } from "./type-utils";

// place the processor will store characters
let charOutput = "";

// creates the processor
const processor = new Processor({
  output(char: string) {
    charOutput += char;
  },
});

/** the different types of actions the reducer can have */
export type ProcessorActions = ToReducerActions<{
  loadCode: {};
  runCode: {
    PC?: number;
  };
  setCode: {
    code: string;
  };
}>;

/** the state of the processor reducer */
export interface ProcessorReducerState {
  code: string;
  memory: string[];
  charOutput: string;
  labels: ReadonlyMap<string, number>;
}

/** function to actually use the state and actions */
const processorReducer: Reducer<ProcessorReducerState, ProcessorActions> = (prevState, action) => {
  switch (action.type) {
    case "loadCode": {
      // clears the processor memory and output
      processor.clearMemory();
      charOutput = "";

      // creates the map to store the labels in
      let labels: ReadonlyMap<string, number> = new Map();

      // loads the code into the processor
      processor.loadMemory(translator.call({ getLabels: (l) => (labels = l) }, prevState.code));
      
      // fetches the memory from the processor
      const memory = processor.getMemorySlice();
      
      return { ...prevState, memory, charOutput, labels };
    }
    case "runCode": {
      // runs the code from the given PC
      processor.runCode(action.PC);
      
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
  memory: processor.getMemorySlice(),
  charOutput,
  labels: new Map(),
});

const initialCode = `// print out a string
start:  LDX string
        CMP #0
        JPE end
        OUT
        INC IX
        JMP start
end:    END
string: #&48
        #&65
        #&6C
        #&6C
        #&6F
        #&20
        #&57
        #&6F
        #&72
        #&6C
        #&64
        #&21
        #&0A
`;

/** Dispatcher type for the processor reducer */
export type ProcessorReducerDispatch = React.Dispatch<ProcessorActions>;

/** hook to use the processor reducer */
export const useProcessorReducer = () => {
  return useReducer(processorReducer, undefined, initializeProcessorReducerState);
};
