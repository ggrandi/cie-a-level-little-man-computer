# Little Man Computer

This repository contains my version of a little man computer but for the cie a level instruction set. It is hosted [here](https://ggrandi.github.io/cie-a-level-little-man-computer/).

## Instructions

these are all the possible instructions:

Possible operands:

- `#n`: a number either in denary as `#123`, binary as `#B1010`, or hex as `#&FE`
- `<address>`: an address of memory in the little man computer
- `<register>`: a register in the little man computer. Allowed registers are specified in the description
- nothing: no operand

| Instruction | Operand      | Description                                                                                                                                     |
| ----------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| END         |              | Return control to the operating system                                                                                                          |
| LDM         | `#n`         | Immediate addressing. Load the number `n` to ACC                                                                                                |
| LDD         | `<address>`  | Direct addressing. Load the contents of the location at the given address to ACC                                                                |
| LDI         | `<address>`  | Indirect addressing. The address to be used is at the given address. Load the contents of this second address to ACC                            |
| LDX         | `<address>`  | Indexed addressing. Form the address from `<address>` + the contents of the index register. Copy the contents of this calculated address to ACC |
| LDR         | `#n`         | Immediate addressing. Load the number n to IX                                                                                                   |
| MOV         | `<register>` | Move the contents of the accumulator to the given register (IX)                                                                                 |
| STO         | `<address>`  | Store the contents of ACC at the given address                                                                                                  |
| ADD         | `<address>`  | Add the contents of the given address to the ACC                                                                                                |
|             | `#n`         | Add the number n to the ACC                                                                                                                     |
| SUB         | `<address>`  | Subtract the contents of the given address from the ACC                                                                                         |
|             | `#n`         | Subtract the number n from the ACC                                                                                                              |
| INC         | `<register>` | Add 1 to the contents of the register (ACC or IX)                                                                                               |
| DEC         | `<register>` | Subtract 1 from the contents of the register (ACC or IX)                                                                                        |
| JMP         | `<address>`  | Jump to the given address                                                                                                                       |
| CMP         | `<address>`  | Compare the contents of ACC with the contents of `<address>`                                                                                    |
|             | `#n`         | Compare the contents of ACC with number n                                                                                                       |
| CMI         | `<address>`  | Indirect addressing. The address to be used is at the given address. Compare the contents of ACC with the contents of this second address       |
| JPE         | `<address>`  | Following a compare instruction, jump to `<address>` if the compare was True                                                                    |
| JPN         | `<address>`  | Following a compare instruction, jump to `<address>` if the compare was False                                                                   |
| IN          |              | Key in a character and store its ASCII value in ACC. Defaults to 0 if no character is entered                                                   |
| OUT         |              | Output to the screen the character whose ASCII value is stored in ACC                                                                           |
| LSL         | `#n`         | Bits in ACC are shifted logically n places to the left. Zeros are introduced on the right-hand end                                              |
| LSR         | `#n`         | Bits in ACC are shifted logically n places to the right. Zeros are introduced on the left-hand end                                              |
| AND         | `<address>`  | Bitwise AND operation of the contents of ACC with the contents of `<address>`                                                                   |
|             | `#n`         | Bitwise AND operation of the contents of ACC with the operand                                                                                   |
| OR          | `<address>`  | Bitwise OR operation of the contents of ACC with the contents of `<address>`                                                                    |
|             | `#n`         | Bitwise OR operation of the contents of ACC with the operand                                                                                    |
| XOR         | `<address>`  | Bitwise XOR operation of the contents of ACC with the contents of `<address>`                                                                   |
|             | `#n`         | Bitwise XOR operation of the contents of ACC with the operand                                                                                   |
| BRK         |              | **NON STANDARD INSTRUCTION.** adds a breakpoint in the browser console and dumps the current memory into the browser console                    |
| ERR         | `#n`         | **NON STANDARD INSTRUCTION.** Errors with error code `#n`                                                                                          |
