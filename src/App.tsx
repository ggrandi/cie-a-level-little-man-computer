import * as React from "react";

import { GlobalStyles } from "./goober/GlobalStyles";
import { FlexChild, FlexColumn, FlexRowMaxWidth } from "./goober/styled";
import "./goober";
import { CodeEditor } from "./CodeEditor";
import { ControlButtons } from "./ControlButtons";
import { MemoryDisplay } from "./MemoryDisplay";
import { useProcessorReducer } from "./useProcessorReducer";
import { RegisterDisplay } from "./RegisterDisplay";
import { useGlobalListener } from "./useGlobalListener";
import { useFullscreen } from "./useFullscreen";

/** the main component for the visualisation website */
export const App = (): JSX.Element => {
  const [state, dispatch] = useProcessorReducer();

  useGlobalListener("keydown", (ev) => {
    if (ev.ctrlKey || ev.metaKey) {
      switch (ev.key) {
        case "s":
          ev.preventDefault();
          dispatch({ type: "saveFile" });
          break;
      }
    }
  });

  const [supportsFullscreen, requestFullscreen, fullscreenElementRef] =
    useFullscreen<HTMLDivElement>();

  return (
    <>
      <GlobalStyles />
      <FlexRowMaxWidth>
        <FlexChild $flex={3}>
          <FlexColumn>
            <CodeEditor {...{ state, dispatch, fullscreenElementRef }} />
            <ControlButtons {...{ state, dispatch, requestFullscreen, supportsFullscreen }} />
          </FlexColumn>
        </FlexChild>
        <FlexChild $flex={1}>
          <FlexColumn $alignItems={"center"} $justifyContent={"center"}>
            <RegisterDisplay {...{ state }} />
          </FlexColumn>
        </FlexChild>
        <FlexChild $flex={4}>
          <FlexColumn $alignItems={"center"} $justifyContent={"center"}>
            <MemoryDisplay {...{ state }} />
          </FlexColumn>
        </FlexChild>
      </FlexRowMaxWidth>
    </>
  );
};
