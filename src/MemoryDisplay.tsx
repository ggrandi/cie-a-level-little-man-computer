import { styled } from "goober";
import * as React from "react";

interface MemoryDisplayProps {
  memory: string[];
}

const MemoryGrid = styled("div")`
  display: grid;
  grid-template: repeat(16, 1fr) / repeat(16, 1fr);
  height: 100%;
  width: 100%;
  align-items: space-around;
  justify-content: space-around;
`;

interface MemoryCellProps {
  address: number;
  memory: string;
}

const MemoryCellDisplay = styled("pre")`
  font-size: calc(100vh * 0.013);
  margin: 0;
`;

export const MemoryCell = ({ address, memory }: MemoryCellProps) => (
  <MemoryCellDisplay>
    {address}:{"\n"}
    {memory}
  </MemoryCellDisplay>
);

export const MemoryDisplay = ({ memory }: MemoryDisplayProps) => {
  return (
    <MemoryGrid>
      {
        // display the memory as a grid of cells
        memory.map((memory, address) => (
          <MemoryCell key={`memory-display-${address}`} {...{ address, memory }} />
        ))
      }
    </MemoryGrid>
  );
};
