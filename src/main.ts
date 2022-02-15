#!/usr/local/bin/deno run
import { Processor } from "./Processor.ts";
import { translator, TranslatorThis } from "./translator.ts";
import { cast } from "./utils.ts";

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
  LDM &a
  OUT
  // Loops until the user enters nothing
  IN
  // LDM #0
  OUT
  CMP #0
  JPN 12
  END
`;

p.runCode();

p.clearMemory();

console.log("\nPROGRAM 2");
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
total:         // implied to start at 0
`;

p.loadMemory(memory);

p.runCode();

console.log(`&10 + &30 + &20 =`, p.getMemoryAt(11));

p.clearMemory();

console.log("\nPROGRAM 3");
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

p.runCode();

p.clearMemory();

console.log("\nPROGRAM 4");
console.log("".padStart(20, "-"));
console.log(`counter controlled loop`);

// program from page 127 of the AS textbook
p.loadCode`
        LDM #0          // Load 0 into ACC
        STO total       // Store 0 in the total
        STO counter     // Store 0 in the counter
        LDR #0          // Set IX to 0
loop:   LDX number      // Load the number indexed by IX into ACC
        ADD total       // Add total to ACC
        STO total       // Store the result in total
        INC IX          // Add 1 to the contents of IX
        LDD counter     // Load the counter into ACC
        INC ACC         // Add 1 to ACC
        STO counter     // Load counter into ACC
        CMP #3          // Compare with #3
        JPN loop        // If the ACC != 3 then return to the start of the loop
        END

number: #5
        #7
        #3

counter: 
total:
`;

p.runCode();

console.log(`sum of array [#5, #7, #3] =`, p.getMemoryAt(18));

p.clearMemory();

console.log("\nTEST 1");
console.log("".padStart(20, "-"));
console.log(`showing logging errors with a different logger`);

// showing logging the errors with a different logger
translator.bind(
  cast<TranslatorThis>({
    logger: console.log,
  }),
)`
label #2
cow: ENS
     IN #1
     MOV 0
`;
