import { styled } from "goober";
import * as React from "react";

import { WIDTH_SWITCH } from "./constants";
import { ColoredSpan, FlexRow } from "./goober/styled";
import { Processor } from "./Processor/Processor";
import { Optional } from "./type-utils";
import { ProcessorReducerState } from "./useProcessorReducer";

interface MemoryDisplayProps {
  state: Pick<ProcessorReducerState, "memory" | "labels"> & {
    registers: Pick<ProcessorReducerState["registers"], "PC">;
  };
}

const MemoryGrid = styled("div")`
  display: grid;
  grid-template: repeat(16, 1fr) / repeat(16, 1fr);
  gap: 1px 1px;
  background-color: black;
  border: 1px solid black;
  width: calc(100% - (16 - 1) * 1px - 2 * 1px);
  height: 100%;
  @media screen and (max-width: ${WIDTH_SWITCH}px) {
    height: unset;
  }
`;

interface MemoryCellProps {
  address: number;
  memory: string;
  labels: ProcessorReducerState["labels"];
  PC: ProcessorReducerState["registers"]["PC"];
}

const MemoryCellDisplay = styled("pre")`
  margin: 0;
  @media screen and (max-width: ${WIDTH_SWITCH}px) {
    font-size: 10%;
  }
`;

const MemoryCell = ({ address, memory, labels, PC }: MemoryCellProps): JSX.Element => {
  const currentLabel = labels[address] as Optional<typeof labels[typeof address]>;
  const color =
    PC === address ? "#afa" : currentLabel ? "#ffa" : memory === "0000" ? "#fdd" : "#fff";

  return (
    <FlexRow $alignItems={"center"} $justifyContent={"center"} $backgroundColor={color}>
      <MemoryCellDisplay>
        <ColoredSpan $color={"#0015b3"}>{address.toString().padStart(3, "0")}</ColoredSpan>:{"\n"}
        {memory}
        <ColoredSpan $color={"#ad8100"}>{currentLabel ? "\n" + currentLabel : ""}</ColoredSpan>
      </MemoryCellDisplay>
    </FlexRow>
  );
};

export const MemoryDisplay = ({
  state: {
    memory,
    labels,
    registers: { PC },
  },
}: MemoryDisplayProps): JSX.Element => {
  return (
    <MemoryGrid>
      {
        // display the memory as a grid of cells
        Processor.toStringMemorySlice(memory).map((memory, address) => (
          <MemoryCell key={`memory-display-${address}`} {...{ address, memory, labels, PC }} />
        ))
      }
    </MemoryGrid>
  );
};
