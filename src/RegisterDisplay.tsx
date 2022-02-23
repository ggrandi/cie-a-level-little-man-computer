import * as React from "react";

import { ColoredP } from "./goober/styled";
import { Opcodes } from "./Processor/Opcodes";
import { formatTranslatorErrors } from "./Processor/translator";
import { ProcessorReducerState } from "./useProcessorReducer";
import { toBaseNString } from "./utils";

interface RegisterDisplayProps {
  state: ProcessorReducerState;
}

export const RegisterDisplay = ({ state }: RegisterDisplayProps): JSX.Element => {
  const r = state.registers;

  return (
    <>
      <pre>
        Registers:{"\n"}
        PC =&gt; {r.PC}
        {"\n"}
        MAR =&gt; {toBaseNString(r.MAR, 16, 4)}
        {"\n"}
        CIR =&gt; {Opcodes[r.CIR]}
        {"\n"}
        MDR =&gt; {r.MDR}
        {"\n"}
        SR =&gt; {r.SR}
        {"\n"}
        IX =&gt; {r.IX}
        {"\n"}
        ACC =&gt; {r.ACC}
        {"\n"}
      </pre>
      <pre>
        Output:{"\n"}
        {state.charOutput}
      </pre>
      {state.translatorErrors.length !== 0 && (
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
