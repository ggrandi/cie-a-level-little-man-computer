export enum Opcodes {
  /** `END`             Return control to the operating system */
  END = 0x00,
  /** `LDM #n`          Immediate addressing. Load the number n to ACC  */
  LDM,
  /** `LDD <address>`   Direct addressing. Load the contents of the location at the given address to ACC*/
  LDD,
  /** `LDI <address>`   Indirect addressing. The address to be used is at the given address. Load the contents of this second address to ACC */
  LDI,
  /** `LDX <address>`   Indexed addressing. Form the address from <address> + the contents of the index register. Copy the contents of this calculated address to ACC */
  LDX,
  /** `LDR #n`          Immediate addressing. Load the number n to IX */
  LDR,
  /** `MOV <register>`  Move the contents of the accumulator to the given register (IX) */
  MOV,
  /** `STO <address>`   Store the contents of ACC at the given address */
  STO,
  /** `ADD <address>`   Add the contents of the given address to the ACC */
  ADDA,
  /** `ADD #n`          Add the denary number n to the ACC */
  ADDN,
  /** `SUB <address>`   Subtract the contents of the given address from the ACC */
  SUBA,
  /** `SUB #n`          Subtract the denary number n from the ACC */
  SUBN,
  /** `INC <register>`  Add 1 to the contents of the register (ACC or IX) */
  INC,
  /** `DEC <register>`  Subtract 1 from the contents of the register (ACC or IX) */
  DEC,
  /** `JMP <address>`   Jump to the given address */
  JMP,
  /** `CMP <address>`   Compare the contents of ACC with the contents of <address> */
  CMPA,
  /**  `CMP #n`         Compare the contents of ACC with number n*/
  CMPN,
  /** `CMI <address>`   Indirect addressing. The address to be used is at the given address.
   * Compare the contents of ACC with the contents of this second address */
  CMI,
  /** `JPE <address>`   Following a compare instruction, jump to <address> if the compare was True */
  JPE,
  /** `JPN <address>`    Following a compare instruction, jump to <address> if the compare was False */
  JPN,
  /** `IN`              Key in a character and store its ASCII value in ACC */
  IN,
  /** `OUT`             Output to the screen the character whose ASCII value is stored in ACC */
  OUT,
  /** `BRK`             adds a breakpoint and prints dumps the current memory */
  BRK,
  /** `ERR #n`          Errors with error code n */
  ERR = 0xff,
}
