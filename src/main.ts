#!/usr/local/bin/deno run
import { Processor } from "./Processor.ts";
import { translator } from "./translator.ts";

const p = new Processor();

const memory = translator`
  // Stores 'A' in address 13
  LDM #10
  ADD #55
  STO 13
  // Fetches 'A' with indexed addressing and outputs it
  LDM #0
  LDR #2
  LDX 11
  OUT
  // adds 32 to output 'a'
  ADD #32
  OUT
  // Loops until the user enters 'A'
  IN
  OUT
  CMP 13
  // ERR 1
  JPN 09
`;

console.log(memory);

p.loadMemory(memory);

p.runCode();

console.log(p.getMemorySlice(0, 16));
