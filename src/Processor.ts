import { Opcodes } from "./Opcodes.ts";
import { isKeyOf, isString, isStringKeyOf } from "./type-guards.ts";

export enum Registers {
  ACC = 0x01,
  IX = 0x01,
}

export enum ErrorCodes {
  UnrecognizedRegister,
  UnrecognizedOpcode,
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
  [Opcode in Opcodes]?: (
    this: Processor,
    operand: number
  ) => InstructionReturns;
};

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

  /** representation of the memory */
  #memory = new Uint16Array(0xff);
  constructor() {}

  /** accumulator */
  get ACC() {
    return this.#ACC;
  }

  // private setter for the accumulator that automatically ensures that the value is an allowed integer
  private set ACC(value: number) {
    if (value > Processor.MAX_INT) {
    } else if (value < Processor.MIN_INT) {
    }

    this.#ACC = this.#makeIntValid(value);
  }

  /**
   * Status register - 4 bit
   * ```plaintext
   * Organized as:
   * N - Negative flag //TODO
   * V - oVerflow flag //TODO
   * C - Carry flag    //TODO
   * Z - set if the result of a logic operation is Zero
   * ```
   */
  get SR() {
    return this.#SR;
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
      this.#SR &= 0b1111 - (1 << n);
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
    return ((this.SR & (1 << n)) >> n) as 0 | 1;
  }

  getMemory(index: number) {
    return this.#memory[index];
  }

  /** returns a slice of memory as 4 digit hexadecimal */
  getMemorySlice(start?: number, end?: number) {
    return [...this.#memory.slice(start, end)].map((n) =>
      n.toString(16).padStart(4, "0")
    );
  }

  /** takes an int and performs underflow/overflow until it is within the necessary range */
  #makeIntValid(int: number): number {
    if (int > Processor.MAX_INT) {
      return this.#makeIntValid(int % (Processor.MAX_INT + 1));
    } else if (int < Processor.MIN_INT) {
      return this.#makeIntValid(int + Processor.MAX_INT + 1);
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

  #getOpcode(address: number) {
    // gets the opcode and operand from the memory address
    const data = this.#memory[address];

    // get the eight leading bits and shift them into the bottom eight
    const opcode = (data & 0xff00) >>> 8;

    return opcode;
  }

  #getOperand(address: number) {
    // gets the opcode and operand from the memory address
    const data = this.#memory[address];

    // get the eight bottom bits
    const operand = data & 0xff;

    return operand;
  }

  #combineInstruction(opcode: number, operand: number) {
    return (opcode << 8) + operand;
  }

  #setOperand(address: number, operand: number) {
    // get the opcode
    const opcode = this.#getOpcode(address);

    // combines the opcode with the operand
    this.#memory[address] = this.#combineInstruction(opcode, operand);
  }

  #setOpcode(address: number, opcode: number) {
    // get the operand
    const operand = this.#getOperand(address);

    // combines the opcode with the operand
    this.#memory[address] = this.#combineInstruction(opcode, operand);
  }

  //#region Opcode implementations
  [Opcodes.BRK](_?: number) {
    // adds a breakpoint and prints dumps the current memory
    console.log({
      ...this,
      SR: this.SR.toString(2).padStart(4, "0"),
      ACC: this.ACC,
      memory: this.#memory.slice(),
    });
    debugger;
  }

  [Opcodes.END](_?: number) {
    //Returns true to signify the program should end
    return { end: true as const };
  }

  [Opcodes.INC](register: number) {
    const registerName = this.#registerFromOperand(register);

    // increments the register and checks for overflow
    if (++this[registerName] > Processor.MAX_INT) {
      this[registerName] = Processor.MIN_INT;
    }
  }

  [Opcodes.DEC](register: number) {
    const registerName = this.#registerFromOperand(register);

    // decrements the register and checks for overflow
    if (--this[registerName] < Processor.MIN_INT) {
      this[registerName] = Processor.MAX_INT;
    }
  }

  [Opcodes.ADDN](n: number) {
    // Adds a denary number to the accumulator and checks for overflow
    this.ACC += n;
  }

  [Opcodes.ADDA](address: number) {
    // fetches the data from the given address
    const data = this.#getOperand(address);

    // add the data into the accumulator;
    this.ACC += data;
  }

  [Opcodes.SUBN](n: number) {
    // Subtracts a denary number from the accumulator and checks for underflow
    this.ACC = (this.ACC - n + Processor.MAX_INT + 1) % (Processor.MAX_INT + 1);
  }

  [Opcodes.SUBA](address: number) {
    // fetches the data from the given address
    const data = this.#getOperand(address);

    // subtracts the data from the accumulator;
    this.ACC -= data;
  }

  [Opcodes.LDD](address: number) {
    // loads the data from memory
    const data = this.#getOperand(address);

    // loads the data into the accumulator
    this.ACC = data;
  }

  [Opcodes.LDM](n: number) {
    // loads the operand directly into the accumulator
    this.ACC = this.#makeIntValid(n);
  }

  [Opcodes.LDI](address: number) {
    // get the address stored at the operand
    const data = this.#getOperand(address);

    // load the value at address into the accumulator
    this.ACC = this.#getOperand(data);
  }

  [Opcodes.LDX](address: number) {
    // calculates the address by summing the index pointer and the adress specified
    const calculatedAddress = this.#makeIntValid(this.IX + address);

    // copy the contents at that address into the accumulator
    this.ACC = this.#getOperand(calculatedAddress);
  }

  [Opcodes.MOV](register: number) {
    const registerName = this.#registerFromOperand(register);

    // copy the contents of the accumulator into the given register
    this[registerName] = this.ACC;
  }

  [Opcodes.STO](address: number) {
    // Copy the accumulator into the given address
    this.#setOperand(address, this.ACC);
  }

  [Opcodes.LDR](n: number) {
    //loads the number n directly into the IX
    this.IX = this.#makeIntValid(n);
  }

  [Opcodes.JMP](address: number) {
    // jumps to the given address
    return { jump: address };
  }

  [Opcodes.IN](_?: number) {
    //input a character from the user
    const char = (prompt("input a character: ") || "")[0];

    // gets the ascii for that character
    const ascii = char.charCodeAt(0);

    // stores the ascii into the accumulator
    this.ACC = ascii;
  }

  [Opcodes.OUT](_?: number) {
    // gets the char from the ascii code in the ACC
    const char = String.fromCharCode(this.ACC);

    // outputs the char
    console.log(char);
  }

  [Opcodes.CMPN](n: number) {
    // compare n and ACC
    const comparison = n === this.ACC;

    // set the zero flag to the comparison
    this.#setFlag(0, comparison);
  }

  [Opcodes.CMPA](address: number) {
    // compare the contents of address and ACC
    const comparison = this.#getOperand(address) === this.ACC;

    // set the zero flag to the comparison
    this.#setFlag(0, comparison);
  }

  [Opcodes.CMI](address: number) {
    // gets the stored address from the given address
    const storedAddress = this.#getOperand(address);

    // gets the data from the stored address
    const data = this.#getOperand(storedAddress);

    // compares the fetched data and ACC
    const comparison = this.ACC === data;

    // sets the comparison in the zero flag
    this.#setFlag(0, comparison);
  }

  [Opcodes.JPE](address: number) {
    // if the comparison was true, jump to the given address
    if (this.getFlag(0) === 1) {
      return { jump: address };
    }
  }

  [Opcodes.JPN](address: number) {
    // if the comparison was false, jump to the given address
    if (this.getFlag(0) === 0) {
      return { jump: address };
    }
  }

  [Opcodes.ERR](errorCode: number) {
    if (isKeyOf(errorCode, ErrorCodes)) {
      throw new Error(
        `Error: ${ErrorCodes[errorCode]}, error code: ${errorCode}`
      );
    }

    throw new Error(`Errored with error code ${errorCode}`);
  }
  //#endregion Opcode implementations

  /** runs a command
   * @param opcode the opcode of the command
   * @param operand the operand of the command
   * @returns whether the program should stop
   */
  runInstruction<Code extends Opcodes>(
    opcode: Code,
    operand: Parameters<Processor[Code]>[0]
  ): InstructionReturns {
    return this[opcode](operand as number);
  }

  /** regular expressions to parse a line */
  private static lineRegex = {
    /** lines with opcodes that take n as an operand */
    n: /^\s*(LDM|LDR|ADD|SUB|CMP)\s+(#[0-9]+|B[0-1]+)(\s+\/\/.*)?$/,
    /** lines with opcodes that take an address as an operand */
    address:
      /^ *(LDD|LDI|LDX|STO|ADD|SUB|JMP|CMP|CMI|JPE|JPN) +([0-9]+)(\s+\/\/.*)?$/,
    /** lines with opcodes that take a register as an operand */
    register: /^ *(MOV|INC|DEC) +([A-Z]+)(\s+\/\/.*)?$/,
    none: /^ *(END|IN|OUT|BRK)(\s+\/\/.*)?$/,
  };

  /** loads the assembly code `code` into memory  */
  loadCode(code: string): string;
  /** loads the template literal code into memory  */
  loadCode(code: TemplateStringsArray, ...separations: unknown[]): string;
  loadCode(first: TemplateStringsArray | string, ...separations: unknown[]) {
    const assemblyCode = (() => {
      // if first is a string set the assemblyCode to first directly
      if (typeof first === "string") {
        return first;
      } else {
        // if it is a template literal, join the template literal and set it as assemblyCode
        return (
          first[0] +
          first
            .slice(1)
            .map((str, i) => separations[i] + str)
            .join("")
        );
      }
    })();

    // split the code by lines and only take lines that have code
    const lines = assemblyCode.split("\n").filter((line) => {
      const strippedLine = line.replaceAll(/\s+(.*)\s+/g, "$1");
      return strippedLine !== "" && !strippedLine.startsWith("//");
    });

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let instruction;
      const isNumberInstruction = Processor.lineRegex.n.test(line);

      if (isNumberInstruction || Processor.lineRegex.address.test(line)) {
        let [, opcode, operand] =
          Processor.lineRegex[isNumberInstruction ? "n" : "address"].exec(
            line
          )!;

        if (!isKeyOf(opcode, Opcodes)) {
          // opcode either has an address or number operand, have to set it to use the correct version
          opcode += isNumberInstruction ? "N" : "A";

          // if it still doesn't exist, throw an error
          if (!isKeyOf(opcode, Opcodes)) {
            throw new Error(
              `${opcode.slice(0, -1)} isn't recognized as an opcode`
            );
          }
        }

        // lookup the opcode from the opcodes enum
        const binOpcode = Opcodes[opcode];

        // if it is a number instruction, extract the correct number, if not extract the correct address
        const binOperand = isNumberInstruction
          ? parseInt(
              // get the operand from the number portion
              operand.slice(1),
              // parse it using base 10 if preceeded by a # or base 2 if preceeded by B
              operand.charAt(0) === "#" ? 10 : 2
            )
          : parseInt(operand, 10);

        // check that the operand fits into the allowed space
        if (binOperand < Processor.MIN_INT || binOperand > Processor.MAX_INT) {
          throw new Error(
            `The operand ${operand} is not within the range of ${Processor.MIN_INT} <= operand <= ${Processor.MAX_INT}`
          );
        }

        instruction = this.#combineInstruction(binOpcode, binOperand);
      } else if (Processor.lineRegex.register.test(line)) {
        let [, opcode, operand] = Processor.lineRegex.register.exec(line)!;

        if (!isKeyOf(opcode, Opcodes)) {
          // the opcode isn't recognized so it throws an error
          throw new Error(
            `${opcode.slice(0, -1)} isn't recognized as an opcode`
          );
        }

        // lookup the opcode from the opcodes enum
        let binOpcode = Opcodes[opcode];
        let binOperand;

        if (!isStringKeyOf(operand, Registers)) {
          console.warn(
            `tried using an invalid register ${operand}. Turned this instruction into an error one.`
          );

          binOpcode = Opcodes.ERR;
          binOperand = ErrorCodes.UnrecognizedRegister;
        } else {
          binOperand = Registers[operand];
        }

        instruction = this.#combineInstruction(binOpcode, binOperand);
      } else if (Processor.lineRegex.none.test(line)) {
        // parse the opcode from the command
        let [, opcode] = Processor.lineRegex.none.exec(line)!;

        if (!isKeyOf(opcode, Opcodes)) {
          // the opcode isn't recognized so it throws an error
          throw new Error(
            `${opcode.slice(0, -1)} isn't recognized as an opcode`
          );
        }

        // lookup the opcode from the opcodes enum
        const binOpcode = Opcodes[opcode];
        const binOperand = 0x00;

        instruction = this.#combineInstruction(binOpcode, binOperand);
      } else {
        // the opcode / operand isn't recognized
        console.error(
          `the line '${line}' isn't a recognized command. Replaced it with an error command`
        );

        const binOpcode = Opcodes.ERR;
        const binOperand = ErrorCodes.UnrecognizedOpcode;

        instruction = this.#combineInstruction(binOpcode, binOperand);
      }

      // Do something with instruction
      this.#memory[i] = instruction;
    }

    return assemblyCode;
  }

  runCode(PC = 0) {
    this.PC = PC;
    let res: InstructionReturns;

    do {
      // Part of Fetch Execute Cycle according to the AS textbook

      // MAR ← [PC]       contents of PC copied into MAR
      this.MAR = this.#memory[this.PC];

      // MDR ← [[MAR]]    data stored at address shown in MAR is copied into MDR
      this.MDR = this.#getOperand(this.PC);

      // CIR ← [MDR]      contents of MDR copied into CIR
      this.CIR = this.#getOpcode(this.PC);

      // PC  ← [PC] + 1   PC is incremented by 1
      this.PC++;

      res = this.runInstruction(this.CIR as Opcodes, this.MDR);

      if (res?.jump) {
        this.PC = res.jump;
      }
    } while (!res?.end);
  }
}
