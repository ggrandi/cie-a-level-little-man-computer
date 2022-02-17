import * as React from "react";

import { GlobalStyles } from "./goober/GlobalStyles";
import { FlexChild, FlexColumn, FlexRow } from "./goober/styled";
import "./goober";
import { CodeEditor } from "./CodeEditor";
import { ControlButtons } from "./ControlButtons";
import { MemoryDisplay } from "./MemoryDisplay";
import { useProcessorReducer } from "./useProcessorReducer";

/** the main component for the visualisation website */
export const App = (): JSX.Element => {
  const [state, dispatch] = useProcessorReducer();

  return (
    <>
      <GlobalStyles />
      <FlexRow>
        <FlexChild $flex={3}>
          <FlexColumn>
            <CodeEditor code={state.code} {...{ dispatch }} />
            <ControlButtons {...{ dispatch }} />
          </FlexColumn>
        </FlexChild>
        <FlexChild $flex={1}>
          <FlexColumn $alignItems={"center"} $justifyContent={"center"}>
            <p>Register Display:</p>
            <pre>
              Output:{"\n"}
              {state.charOutput}
            </pre>
            <pre>
              labels:{"\n"}
              {[...state.labels.entries()].map(([label, address]) => `${label} => ${address}\n`)}
            </pre>
          </FlexColumn>
        </FlexChild>
        <FlexChild $flex={4}>
          <FlexColumn $alignItems={"center"} $justifyContent={"center"}>
            <MemoryDisplay memory={state.memory} />
          </FlexColumn>
        </FlexChild>
      </FlexRow>
    </>
  );
};
