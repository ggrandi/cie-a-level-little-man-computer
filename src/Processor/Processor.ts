import { toBaseNString } from "../utils";

import { Opcodes } from "./Opcodes";
import { translator } from "./translator";
import { isKeyOf } from "./type-guards";

export enum Registers {
  ACC = 0x00,
  IX = 0x01,
}

export enum ErrorCodes {
  MalformedInstruction,
  UnrecognizedRegister,
  UnrecognizedOpcode,
  UnrecognizedInstruction,
  UnrecognizedOperand,
  FailedAssertion,
}

type InstructionReturns =
  | void
  | {
      /** the program should end */
      end: true;
      jump?: undefined;
    }
  | {
      end?: undefined;
      /** line number to jump to */
      jump: number;
    };

type ProcessorBase = {
  [K in Exclude<keyof typeof Registers, number>]: number;
} & {
  [Opcode in Opcodes]: (this: Processor, operand: number) => InstructionReturns;
};

export interface ProcessorConstructorOpts {
  output?(char: string): void;
  dumpLogger?(arg: {
    IX: number;
    PC: number;
    MAR: number;
    MDR: number;
    CIR: number;
    SR: string;
    ACC: number;
    memory: string[];
  }): void;
  memory?: Uint16Array;
  PC?: number;
  IX?: number;
  SR?: string;
  ACC?: number;
}

export class Processor implements ProcessorBase {
  #ACC = 0;
  /** index pointer */
  IX = 0;
  /** program counter */
  PC = 0;

  /** memory access register */
  MAR = 0;
  /** memory data register */
  MDR = 0;
  /** current instruction register */
  CIR = 0;

  #SR = 0x0000;

  /** max int for this vm */
  static readonly MAX_INT = 0xff;
  /** min int for this vm */
  static readonly MIN_INT = 0;

  output: Required<ProcessorConstructorOpts>["output"];
  dumpLogger: Required<ProcessorConstructorOpts>["dumpLogger"];

  /** representation of the memory */
  #memory: Uint16Array;
  constructor(opts?: ProcessorConstructorOpts) {
    this.output = opts?.output ?? console.log;
    this.dumpLogger = opts?.dumpLogger ?? console.info;

    const memoryLength = Processor.MAX_INT + 1;
    if (opts?.memory) {
      if (opts.memory.length !== memoryLength) {
        throw new Error(`The memory passed has to be of length ${memoryLength}`);
      }
      this.#memory = opts.memory;
    } else {
      this.#memory = new Uint16Array(memoryLength);
    }

    if (opts?.PC) {
      if (!Processor.isSafeInt(opts.PC)) {
        throw new Error(
          `The program counter (PC) ${opts.PC} has to be in the allowed range of the processor`
        );
      } else {
        this.PC = opts.PC;
      }
    }

    if (opts?.ACC) {
      if (!Processor.isSafeInt(opts.ACC)) {
        throw new Error(
          `The accumulator (ACC) ${opts.ACC} has to be in the allowed range of the processor`
        );
      } else {
        this.ACC = opts.ACC;
      }
    }

    if (opts?.IX) {
      if (!Processor.isSafeInt(opts.IX)) {
        throw new Error(
          `The index register (IX) ${opts.IX} has to be in the allowed range of the processor`
        );
      } else {
        this.IX = opts.IX;
      }
    }

    if (opts?.SR) {
      const SR = parseInt(opts.SR, 2);

      if (0 <= SR && SR < 2 ** 4) {
        this.#SR = SR;
      } else {
        throw new Error(`The status register (SR) ${opts.SR} has to be a 4 bit binary string`);
      }
    }
  }

  /** accumulator */
  get ACC(): number {
    return this.#ACC;
  }

  // private setter for the accumulator that automatically ensures that the value is an allowed integer
  private set ACC(value: number) {
    if (value > Processor.MAX_INT) {
      this.#setFlag(3, 0);
      this.#setFlag(2, 1);
      this.#setFlag(1, 1);
    } else if (value < Processor.MIN_INT) {
      this.#setFlag(3, 1);
      this.#setFlag(2, 1);
      this.#setFlag(1, 0);
    } else {
      this.#setFlag(0, 0);
      this.#setFlag(0, 0);
      this.#setFlag(0, 0);
    }

    this.#ACC = Processor.makeIntValid(value);
  }

  /**
   * Status register - 4 bit
   * ```plaintext
   * Organized as:
   * N - Negative flag
   * V - oVerflow flag
   * C - Carry flag
   * Z - set if the result of a logic operation is Zero
   * ```
   */
  get SR(): string {
    return toBaseNString(this.#SR, 2, 4);
  }

  /** set the negative flag */
  #setFlag(n: 3, bit: 0 | 1 | boolean): void;
  /** set the overflow flag */
  #setFlag(n: 2, bit: 0 | 1 | boolean): void;
  /** set the carry flag */
  #setFlag(n: 1, bit: 0 | 1 | boolean): void;
  /** set the zero flag */
  #setFlag(n: 0, bit: 0 | 1 | boolean): void;
  #setFlag(n: 0 | 1 | 2 | 3, bit: 0 | 1 | boolean): void {
    if (n !== 0 && n !== 1 && n !== 2 && n !== 3) {
      throw new Error(`tried to set a flag that's not valid. flag = ${n}`);
    }

    if (bit) {
      this.#SR |= 1 << n;
    } else {
      this.#SR &= 0xf - (1 << n);
    }
  }

  /** get the negative flag from the status register */
  getFlag(n: 3): 0 | 1;
  /** get the overflow flag from the status register */
  getFlag(n: 2): 0 | 1;
  /** get the carry flag from the status register */
  getFlag(n: 1): 0 | 1;
  /** get the zero flag from the status register */
  getFlag(n: 0): 0 | 1;
  getFlag(n: 0 | 1 | 2 | 3): 0 | 1 {
    if (n !== 0 && n !== 1 && n !== 2 && n !== 3) {
      throw new Error(`tried to get a flag that's not valid. flag = ${n}`);
    }
    return ((this.#SR & (1 << n)) >> n) as 0 | 1;
  }

  /** gets the value in memory at a given index */
  getMemoryAt(index: number): number | undefined {
    return this.#memory[index];
  }

  /** returns a slice of memory as 4 digit hexadecimal */
  getMemorySlice(start?: number, end?: number): Uint16Array {
    return this.#memory.slice(start, end);
  }

  /** returns a slice of memory as 4 digit hexadecimal */
  static toStringMemorySlice(memory: Uint16Array): string[] {
    return [...memory].map((n) => toBaseNString(n, 16, 4));
  }

  /** clears all the memory */
  clearMemory(): void {
    this.#ACC = 0;
    this.#SR = 0;
    this.IX = 0;

    for (let i = 0; i < this.#memory.length; i++) {
      this.#memory[i] = 0x0000;
    }
  }

  /** dump the current memory */
  dumpMemory(): void {
    this.dumpLogger({
      IX: this.IX,
      PC: this.PC,
      MAR: this.MAR,
      MDR: this.MDR,
      CIR: this.CIR,
      SR: this.SR,
      ACC: this.ACC,
      memory: Processor.toStringMemorySlice(this.getMemorySlice()),
    });
  }

  /** gets all the registers from the processor */
  getRegisters(): {
    IX: number;
    PC: number;
    MAR: number;
    MDR: number;
    CIR: number;
    SR: string;
    ACC: number;
  } {
    return {
      ACC: this.ACC,
      PC: this.PC,
      MAR: this.MAR,
      MDR: this.MDR,
      CIR: this.CIR,
      IX: this.IX,
      SR: this.SR,
    };
  }

  /** takes an int and performs underflow/overflow until it is within the necessary range */
  static makeIntValid(int: number): number {
    if (int > Processor.MAX_INT) {
      return Processor.makeIntValid(int % (Processor.MAX_INT + 1));
    } else if (int < Processor.MIN_INT) {
      return Processor.makeIntValid(int + Processor.MAX_INT + 1);
    } else {
      return int;
    }
  }

  #registerFromOperand(operand: number): keyof typeof Registers {
    // finds the correct register with the given operand
    const register = Registers[operand];

    // checks if the register exists
    if (!isKeyOf(register, Registers)) {
      throw new Error(`the register ${operand} is not a valid register`);
    }

    return register;
  }

  #getOpcode(address: number): number {
    // gets the opcode and operand from the memory address
    const data = this.#memory[address];

    // get the eight leading bits and shift them into the bottom eight
    const opcode = (data & 0xff00) >>> 8;

    return opcode;
  }

  #getOperand(address: number): number {
    // gets the opcode and operand from the memory address
    const data = this.#memory[address];

    // get the eight bottom bits
    const operand = data & 0xff;

    return operand;
  }

  static combineInstruction(opcode: number, operand: number): number {
    return (opcode << 8) + operand;
  }

  /** whether a given integer is within the safe range of the Processor */
  static isSafeInt(int: number): boolean {
    return Processor.MIN_INT <= int && Processor.MAX_INT >= int;
  }

  #setOperand(address: number, operand: number): void {
    // get the opcode
    const opcode = this.#getOpcode(address);

    // combines the opcode with the operand
    this.#memory[address] = Processor.combineInstruction(opcode, operand);
  }

  // #setOpcode(address: number, opcode: number) {
  //   // get the operand
  //   const operand = this.#getOperand(address);

  //   // combines the opcode with the operand
  //   this.#memory[address] = Processor.combineInstruction(opcode, operand);
  // }

  //#region Opcode implementations
  [Opcodes.BRK](_?: number): InstructionReturns {
    // adds a breakpoint and prints dumps the current memory
    this.dumpMemory();

    // sets a breakpoint in the code
    // eslint-disable-next-line no-debugger
    debugger;
  }

  [Opcodes.END](_?: number): InstructionReturns {
    //Returns true to signify the program should end
    return { end: true as const };
  }

  [Opcodes.INC](register: number): InstructionReturns {
    const registerName = this.#registerFromOperand(register);

    // increments the register and checks for overflow
    if (++this[registerName] > Processor.MAX_INT) {
      this[registerName] = Processor.MIN_INT;
    }
  }

  [Opcodes.DEC](register: number): InstructionReturns {
    const registerName = this.#registerFromOperand(register);

    // decrements the register and checks for overflow
    if (--this[registerName] < Processor.MIN_INT) {
      this[registerName] = Processor.MAX_INT;
    }
  }

  [Opcodes.ADDN](n: number): InstructionReturns {
    // Adds a denary number to the accumulator and checks for overflow
    this.ACC += n;
  }

  [Opcodes.ADDA](address: number): InstructionReturns {
    // fetches the data from the given address
    const data = this.#getOperand(address);

    // add the data into the accumulator;
    this.ACC += data;
  }

  [Opcodes.SUBN](n: number): InstructionReturns {
    // Subtracts a denary number from the accumulator and checks for underflow
    this.ACC = (this.ACC - n + Processor.MAX_INT + 1) % (Processor.MAX_INT + 1);
  }

  [Opcodes.SUBA](address: number): InstructionReturns {
    // fetches the data from the given address
    const data = this.#getOperand(address);

    // subtracts the data from the accumulator;
    this.ACC -= data;
  }

  [Opcodes.LDD](address: number): InstructionReturns {
    // loads the data from memory
    const data = this.#getOperand(address);

    // loads the data into the accumulator
    this.ACC = data;
  }

  [Opcodes.LDM](n: number): InstructionReturns {
    // loads the operand directly into the accumulator
    this.ACC = Processor.makeIntValid(n);
  }

  [Opcodes.LDI](address: number): InstructionReturns {
    // get the address stored at the operand
    const data = this.#getOperand(address);

    // load the value at address into the accumulator
    this.ACC = this.#getOperand(data);
  }

  [Opcodes.LDX](address: number): InstructionReturns {
    // calculates the address by summing the index pointer and the adress specified
    const calculatedAddress = Processor.makeIntValid(this.IX + address);

    // copy the contents at that address into the accumulator
    this.ACC = this.#getOperand(calculatedAddress);
  }

  [Opcodes.MOV](register: number): InstructionReturns {
    const registerName = this.#registerFromOperand(register);

    // copy the contents of the accumulator into the given register
    this[registerName] = this.ACC;
  }

  [Opcodes.STO](address: number): InstructionReturns {
    // Copy the accumulator into the given address
    this.#setOperand(address, this.ACC);
  }

  [Opcodes.LDR](n: number): InstructionReturns {
    //loads the number n directly into the IX
    this.IX = Processor.makeIntValid(n);
  }

  [Opcodes.JMP](address: number): InstructionReturns {
    // jumps to the given address
    return { jump: address };
  }

  [Opcodes.IN](_?: number): InstructionReturns {
    //input a character from the user
    const char = prompt("input a character: ");

    // gets the ascii for that character
    const ascii = (char || "\x00").charCodeAt(0);

    // stores the ascii into the accumulator
    this.ACC = ascii;
  }

  [Opcodes.OUT](_?: number): InstructionReturns {
    // gets the char from the ascii code in the ACC
    const char = String.fromCharCode(this.ACC);

    // outputs the char
    this.output(char);
  }

  [Opcodes.CMPN](n: number): InstructionReturns {
    // compare n and ACC
    const comparison = n === this.ACC;

    // set the zero flag to the comparison
    this.#setFlag(0, comparison);
  }

  [Opcodes.CMPA](address: number): InstructionReturns {
    // compare the contents of address and ACC
    const comparison = this.#getOperand(address) === this.ACC;

    // set the zero flag to the comparison
    this.#setFlag(0, comparison);
  }

  [Opcodes.CMI](address: number): InstructionReturns {
    // gets the stored address from the given address
    const storedAddress = this.#getOperand(address);

    // gets the data from the stored address
    const data = this.#getOperand(storedAddress);

    // compares the fetched data and ACC
    const comparison = this.ACC === data;

    // sets the comparison in the zero flag
    this.#setFlag(0, comparison);
  }

  [Opcodes.JPE](address: number): InstructionReturns {
    // if the comparison was true, jump to the given address
    if (this.getFlag(0) === 1) {
      return { jump: address };
    }

    return;
  }

  [Opcodes.JPN](address: number): InstructionReturns {
    // if the comparison was false, jump to the given address
    if (this.getFlag(0) === 0) {
      return { jump: address };
    }

    return;
  }

  [Opcodes.ERR](errorCode: number): InstructionReturns {
    if (isKeyOf(errorCode, ErrorCodes)) {
      throw new Error(`Error: ${ErrorCodes[errorCode]}, error code: ${errorCode}`);
    }

    throw new Error(`Errored with error code ${errorCode}`);
  }

  [Opcodes.LSL](n: number): InstructionReturns {
    // shift the accumulator by n bits left
    this.ACC <<= n;
  }

  [Opcodes.LSR](n: number): InstructionReturns {
    // logically shift the accumulator n bits right
    this.ACC >>>= n;
  }

  [Opcodes.ANDN](n: number): InstructionReturns {
    // ands the number and the contents of the accumulator
    this.ACC &= n;
  }

  [Opcodes.ANDA](address: number): InstructionReturns {
    // ands the value at address and the contents of the accumulator
    this.ACC &= this.#getOperand(address);
  }

  [Opcodes.ORN](n: number): InstructionReturns {
    // ors the number and the contents of the accumulator
    this.ACC |= n;
  }

  [Opcodes.ORA](address: number): InstructionReturns {
    // ors the value at address and the contents of the accumulator
    this.ACC |= this.#getOperand(address);
  }

  [Opcodes.XORN](n: number): InstructionReturns {
    // xors the number and the contents of the accumulator
    this.ACC ^= n;
  }

  [Opcodes.XORA](address: number): InstructionReturns {
    // xors the value at address and the contents of the accumulator
    this.ACC ^= this.#getOperand(address);
  }
  //#endregion

  /** loads the assembly code `code` into memory  */
  loadCode(code: string): Uint16Array {
    const memory = translator(code);

    this.loadMemory(memory);

    return memory;
  }

  /** loads a Uint16Array into memory */
  loadMemory(memory: Uint16Array): void {
    for (let i = 0; i < memory.length; i++) {
      this.#memory[i] = memory[i];
    }
  }

  /** runs the next instruction in memory */
  runNextInstruction(): InstructionReturns {
    // Part of Fetch Execute Cycle according to the AS textbook

    // MAR <- [PC]       contents of PC copied into MAR
    this.MAR = this.#memory[this.PC];

    // MDR <- [[MAR]]    data stored at address shown in MAR is copied into MDR
    this.MDR = this.#getOperand(this.PC);

    // CIR <- [MDR]      contents of MDR copied into CIR
    this.CIR = this.#getOpcode(this.PC);

    // PC  <- [PC] + 1   PC is incremented by 1
    this.PC++;

    const res = this[this.CIR as Opcodes](this.MDR);

    // debugger;

    if (res && typeof res?.jump === "number") {
      this.PC = res.jump;
    }

    return res;
  }

  /**
   * Runs a program in memory starting from the `PC`
   * @param PC the initial program counter (default: 0)
   */
  runCode(PC = 0): void {
    this.PC = PC;
    let res: InstructionReturns;

    do {
      // runs the next instruction in memory
      res = this.runNextInstruction();
    } while (!res || !res?.end);
  }
}
