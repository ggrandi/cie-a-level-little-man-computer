import * as React from "react";

import { ColoredP } from "./goober/styled";
import { formatTranslatorErrors } from "./Processor/translator";
import { ProcessorReducerState } from "./useProcessorReducer";

interface RegisterDisplayProps {
  state: ProcessorReducerState;
}

export const RegisterDisplay = ({ state }: RegisterDisplayProps): JSX.Element => {
  return (
    <>
      <p>Register Display:</p>
      <pre>
        Registers:{"\n"}
        {Object.entries(state.registers).map(([register, value]) => `${register} => ${value}\n`)}
      </pre>
      <pre>
        Output:{"\n"}
        {state.charOutput}
      </pre>
      {state.translatorErrors.length != 0 && (
        <>
          <p>Translation Errors:</p>
          {state.translatorErrors.map(({ lineNumber, errors }) => (
            <ColoredP key={`translator-error { line: ${lineNumber} }`} $color="red">
              {formatTranslatorErrors(lineNumber, errors)}
            </ColoredP>
          ))}
        </>
      )}
    </>
  );
};
