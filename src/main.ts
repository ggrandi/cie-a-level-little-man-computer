#!/usr/local/bin/deno run
import { Opcodes } from "./Opcodes.ts";
import { Processor } from "./Processor.ts";
import { translator } from "./translator.ts";

const p = new Processor();

console.log("PROGRAM 1");
console.log("".padStart(20, "-"));
console.log(`infinite loop until you enter nothing`);

p.loadCode`
  // Stores 'A' in address 20
  LDM #10
  ADD #55
  STO 20
  // Fetches 'A' with indexed addressing and outputs it
  LDM #0
  LDR #2
  LDX 18
  OUT
  // outputs a new line character
  LDM &A 
  OUT
  // adds 32 to output 'a'
  LDD 20
  ADD #32
  OUT
  // outputs a new line character
  LDM &A 
  OUT
  // Loops until the user enters nothing
  IN
  BRK
  OUT
  CMP #0
  JPN 12
  END
`;

console.log(p.getMemorySlice(0, 21));

p.runCode();

console.log(p.getMemorySlice(0, 21));

p.clearMemory();

console.log("PROGRAM 2");
console.log("".padStart(20, "-"));
console.log(`adds three numbers in memory`);

const memory = translator`
  // adds three numbers together and stores them
  start:  LDD first
          ADD second
          ADD third
          STO total
          CMP &60 // makes sure the value stored was the correct sum in order to check the processor
          JPN err
          END
  err:    ERR #5
  first:  &10
  second: &30
  third:  &20
  total:  #0
`;

console.log(memory);

p.loadMemory(memory);

p.runCode();

console.log(p.getMemorySlice(0, 16));

p.clearMemory();

console.log("PROGRAM 3");
console.log("".padStart(20, "-"));
console.log(`outputs a string stored in memory`);

p.loadCode`
// print out a string
start:  LDX string
        OUT
        CMP #0
        JPE end
        INC IX
        JMP start
end:    END
string: &48
        &65
        &6C
        &6C
        &6F
        &20
        &57
        &6F
        &72
        &6C
        &64
        &21
        &0A
`;

console.log(p.getMemorySlice(0, 16));

p.runCode();

console.log(p.getMemorySlice(0, 16));

p.clearMemory();
