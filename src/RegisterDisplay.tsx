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
        Output:{"\n"}
        {state.charOutput}
      </pre>
      <pre>
        labels:{"\n"}
        {Object.entries(state.labels)
          .filter(([label]) => isNaN(Number(label)))
          .map(([label, address]) => `${label} => ${address}\n`)}
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
