// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { CharsToStr, Last, MapKey, Optional, StrToChars } from "../type-utils";
import { match, spaceString } from "../utils";
import { Err, isErr, isOk, Ok, Result } from "../result";

import { Opcodes } from "./Opcodes";
import { ErrorCode, Processor, Registers } from "./Processor";
import { isKeyOf, isStringKeyOf } from "./type-guards";

const enum InsType {
  None = "",
  N = "#n",
  Address = "<address>",
  Register = "<register>",
  BinN = "Bn",
  HexN = "&n",
}

// type generated from the opcodes of all the possible instructions
type Instructions = {
  [K in Exclude<keyof typeof Opcodes, number>]: Last<StrToChars<K>> extends [infer Last, infer Rest]
    ? Rest extends string[] // if the last character is A and there is an N variant, remove the A
      ? Last extends "A"
        ? `${CharsToStr<Rest>}N` extends keyof typeof Opcodes
          ? CharsToStr<Rest>
          : K
        : // if the last character is N and there is an A variant, remove the N
        Last extends "N"
        ? `${CharsToStr<Rest>}A` extends keyof typeof Opcodes
          ? CharsToStr<Rest>
          : K
        : K
      : K
    : K;
}[keyof typeof Opcodes];

// Record with the instructions and the type of their operands
const instructionTypesRecord = match<Readonly<Record<Instructions, ReadonlyArray<InsType>>>>()({
  LDM: [InsType.N],
  LDD: [InsType.Address],
  LDI: [InsType.Address],
  LDX: [InsType.Address],
  LDR: [InsType.N],
  MOV: [InsType.Register],
  STO: [InsType.Address],
  ADD: [InsType.Address, InsType.N, InsType.BinN, InsType.HexN],
  SUB: [InsType.Address, InsType.N, InsType.BinN, InsType.HexN],
  INC: [InsType.Register],
  DEC: [InsType.Register],
  JMP: [InsType.Address],
  CMP: [InsType.Address, InsType.N],
  CMI: [InsType.Address],
  JPE: [InsType.Address],
  JPN: [InsType.Address],
  IN: [InsType.None],
  OUT: [InsType.None],
  END: [InsType.None],
  AND: [InsType.Address, InsType.N, InsType.BinN, InsType.HexN],
  OR: [InsType.Address, InsType.N, InsType.BinN, InsType.HexN],
  XOR: [InsType.Address, InsType.N, InsType.BinN, InsType.HexN],
  LSL: [InsType.N],
  LSR: [InsType.N],

  BRK: [InsType.None],
  ERR: [InsType.N, InsType.BinN, InsType.HexN],
} as const);

// create the comment delimiter and regex to remove comments
const commentDelimiter = "//";
const commentRegex = new RegExp(`\\s*${commentDelimiter}.*$`);

/** creates an assembly number getter */
const createGetNumber = (prefix: string, base: number): ((n: string) => Result<number, string>) => {
  // checks that javascript can use the base
  if (base < 2 || base > 36) {
    throw new Error("The base must be between 2 and 36");
  }

  // creates a set with all the allowed numbers in that base
  const allowedChars = new Set(Array.from({ length: base }, (_, i) => i.toString(base)));

  return (n: string) => {
    const numberPrefix = n[0];
    n = n.slice(1);

    // checks if it has the correct prefix
    const hasPrefix = numberPrefix === prefix;

    if (!hasPrefix) {
      return Err(`have to prefix a base ${base} number with a ${prefix}`);
    }

    // checks that all the digits are allowed digits
    for (const char of n) {
      if (!allowedChars.has(char.toLowerCase())) {
        return Err(`The digit "${char}" is not allowed in base ${base}`);
      }
    }

    // parses the integer with a given base
    const parsedNum = parseInt(n, base);

    // checks if the integer is in the allowed range
    return Processor.isSafeInt(parsedNum)
      ? Ok(parsedNum)
      : Err(`The number "${parsedNum}" is not in the allowed range for the processor`);
  };
};

/** checks that the given number is accepted denary */
const getN = createGetNumber("#", 10);

/** checks that the given number is accepted binary */
const getBinN = createGetNumber("B", 2);

/** checks that the given number is accepted hexadecimal */
const getHexN = createGetNumber("&", 16);

/** gets an address from a string */
const getAddress = (address: string): Result<number, string> => {
  // gets the address from the integer
  const int = Number(address);

  // checks if it is an actual integer
  if (isNaN(int)) {
    return Err(`the address "${address}" has to be a base 10 number`);
  }

  // checks if it is an allowed integer
  return Processor.isSafeInt(int)
    ? Ok(int)
    : Err(`the address "${address}" is not in the allowed range of the processor`);
};

/** gets the register from a specified string */
const getRegister = (register: string): Result<number, string> => {
  // cannot be a number in a string
  if (!isNaN(Number(register))) {
    return Err(`the register "${register}" is not an allowed register`);
  }

  // checks if the register is a key of the Registers enum
  return isStringKeyOf(register, Registers)
    ? Ok(Registers[register])
    : Err(`the register "${register}" is not an allowed register`);
};

const labelFirstChars = /[a-zA-Z_$]/;
const labelChars = /[a-zA-Z_$0-9]/;

const getLabel = (label: string): Result<string, string> => {
  // checks that the label is not a register
  if (isStringKeyOf(label, Registers)) {
    return Err(`the label cannot be named ${label} because it is the same as a register`);
  }

  // checks that the label is not an opcode
  if (isStringKeyOf(label, instructionTypesRecord)) {
    return Err(`the label cannot be named ${label} because it is the same as an instruction`);
  }

  // first chars have to follow the labelFirstChars regex
  if (!labelFirstChars.test(label[0])) {
    return Err(`label cannot start with a char ${label[0]}`);
  }

  // checks the rest of the characters to see if they are valid characters
  for (let i = 1; i < label.length; i++) {
    if (!labelChars.test(label[i])) {
      return Err(`label cannot include char ${label[i]}`);
    }
  }

  return Ok(label);
};

/** gets a label declaration from a specified string */
const getLabelDeclaration = (label: string): Result<string, string> => {
  // checks if the label part is valid
  const checkedLabel = getLabel(label.slice(0, -1));

  if (isErr(checkedLabel)) {
    return checkedLabel;
  }

  // checks that label is declared properly
  if (label[label.length - 1] !== ":") {
    return Err("have to declare a label with a : at the end");
  }

  return checkedLabel;
};

/** gets an opcode type from a specified string */
const getInstructionType = (opcode: string): Result<ReadonlyArray<InsType>, string> => {
  if (!isKeyOf(opcode, instructionTypesRecord)) {
    return Err(`"${opcode}" is not a valid opcode`);
  }

  return Ok(instructionTypesRecord[opcode]);
};

type GetOperandReturn =
  | {
      n: Err<ReturnType<typeof getN>>;
      address: Err<ReturnType<typeof getAddress>>;
      register: Err<ReturnType<typeof getRegister>>;
      label: Err<ReturnType<typeof getLabel>>;
      hexN: Err<ReturnType<typeof getHexN>>;
      binN: Err<ReturnType<typeof getBinN>>;
      type: [InsType.None, undefined];
    }
  | {
      n: Err<ReturnType<typeof getN>>;
      address: Err<ReturnType<typeof getAddress>>;
      register: Err<ReturnType<typeof getRegister>>;
      label: Err<ReturnType<typeof getLabel>>;
      hexN: Err<ReturnType<typeof getHexN>>;
      binN: Err<ReturnType<typeof getBinN>>;
      type: undefined;
    }
  | {
      n: ReturnType<typeof getN>;
      address: ReturnType<typeof getAddress>;
      register: ReturnType<typeof getRegister>;
      label: ReturnType<typeof getLabel>;
      hexN: ReturnType<typeof getHexN>;
      binN: ReturnType<typeof getBinN>;
      type: SuccessfulOperand;
    };

type SuccessfulOperand =
  | undefined
  | [InsType.N, Ok<ReturnType<typeof getN>>["data"]]
  | [InsType.Address, Ok<ReturnType<typeof getAddress>>["data"]]
  | [InsType.Register, Ok<ReturnType<typeof getRegister>>["data"]]
  | [InsType.BinN, Ok<ReturnType<typeof getBinN>>["data"]]
  | [InsType.HexN, Ok<ReturnType<typeof getHexN>>["data"]]
  | [InsType.None, Ok<ReturnType<typeof getBinN>>["data"]]
  | [InsType.Address, Ok<ReturnType<typeof getLabel>>["data"]];

const getOperand = (operand?: string): GetOperandReturn => {
  let type: SuccessfulOperand;

  if (operand === undefined) {
    const invalidMessage = Err("have to pass an operand");
    return {
      n: invalidMessage,
      address: invalidMessage,
      register: invalidMessage,
      label: invalidMessage,
      binN: invalidMessage,
      hexN: invalidMessage,
      type: [InsType.None, undefined],
    };
  }

  // checks if it is a number
  const n = getN(operand);
  if (isOk(n)) type = [InsType.N, n.data];

  // checks if it is a number
  const address = getAddress(operand);
  if (isOk(address)) type = [InsType.Address, address.data];

  // checks if it is a register
  const register = getRegister(operand);
  if (isOk(register)) type = [InsType.Register, register.data];

  // checks if it is a label
  const label = getLabel(operand);
  if (isOk(label)) type = [InsType.Address, label.data];

  // checks if it is a label
  const hexN = getHexN(operand);
  if (isOk(hexN)) type = [InsType.HexN, hexN.data];

  // checks if it is a label
  const binN = getBinN(operand);
  if (isOk(binN)) type = [InsType.BinN, binN.data];

  if (type === undefined) {
    return {
      n,
      address,
      register,
      label,
      binN,
      hexN,
      type: undefined,
    };
  }

  return { n, address, register, label, binN, hexN, type };
};

type TranslatorErrorLogger = (lineNumber: number, errors: string[]) => void;

export const formatTranslatorErrors = (lineNumber: number, errors: string[]): string => {
  const lineNumberWarning = `line ${lineNumber}: `;
  return lineNumberWarning + errors.join(`\n${spaceString(lineNumberWarning.length)}`);
};

/** the default logger for translator */
const defaultErrorLogger: TranslatorErrorLogger = (lineNumber: number, errors: string[]) => {
  console.error(formatTranslatorErrors(lineNumber, errors));
};

/** the type to make translator output more values */
export type TranslatorThis = {
  getErrors?: TranslatorErrorLogger | undefined;
  getLabels?: ((labelMap: ReadonlyMap<string, number>) => void) | undefined;
};

/**
 * loads the assembly code `code` into memory
 *
 * use `translator.bind` or `translator.apply` to make it output values elsewhere
 * @returns the memory to load
 */
export function translator(this: TranslatorThis | void, assemblyCode: string): Uint16Array {
  let hasErrored = false;

  const getErrors: TranslatorErrorLogger = this?.getErrors ?? defaultErrorLogger;

  const logError: TranslatorErrorLogger = (...args: Parameters<TranslatorErrorLogger>) => {
    hasErrored = true;
    getErrors(...args);
  };

  // split the code by lines and only take lines that have code
  const lines = assemblyCode
    .split("\n")
    .map((line, lineNumber) => {
      line = line.replace(commentRegex, "");
      line = line.trim();
      return { line, lineNumber } as const;
    })
    .filter(({ line }) => line !== "");

  // checks that the processor can load the code into memory
  if (lines.length > Processor.MAX_INT) {
    logError(0, [
      `the program given is too long. The max amount of instructions is ${Processor.MAX_INT}.`,
    ]);

    return new Uint16Array(0);
  }

  // initialize the memory that I will be storing the lines in
  const memory = new Uint16Array(lines.length);

  // initialize the record to store the labels in
  const labelMap = new Map<string, number>();

  // do a first pass on the lines to extract the labels
  const parsedLines = lines.map(
    (
      { line, lineNumber },
      address
    ): Readonly<{
      opcode: number;
      operand: number | MapKey<typeof labelMap>;
      lineNumber: number;
    }> => {
      // errored instruction
      const malformedInstructionError = {
        opcode: Opcodes.ERR,
        operand: ErrorCode.MalformedInstruction,
        lineNumber,
      } as const;

      // split the line into its component parts
      const operators = line.split(/\s+/g);

      // error if too many operators on the same line
      if (operators.length > 3) {
        logError(lineNumber, [`cannot have more than three operators on a line`]);
        return malformedInstructionError;
      }

      const labelDeclaration = getLabelDeclaration(operators[0]);

      if (isOk(labelDeclaration)) {
        if (!labelMap.has(labelDeclaration.data)) {
          // store the label in the label map if it doesn't already exist
          labelMap.set(labelDeclaration.data, address);
        } else {
          // cannot overwrite label so error
          logError(lineNumber, [`the label ${labelDeclaration.data} has already been used`]);
        }

        // remove the label from the operators
        operators.shift();
      }

      if (operators.length === 0) {
        // line with only a label so implied `END 0` instruction
        return { lineNumber, opcode: 0, operand: 0 };
      }

      // next operand is either an opcode or a number so checks it
      const instructionType = getInstructionType(operators[0]);

      const instruction = operators[0] as keyof typeof instructionTypesRecord;

      // if it is an opcode, it removes it from the operators
      if (isOk(instructionType)) {
        operators.shift();
      }

      const operand = getOperand(operators[0]);

      const numberOperand = [operand.n, operand.binN, operand.hexN];

      // check that the second parameter is correct
      if (isErr(instructionType) && operand.type?.[0] !== InsType.N) {
        if (operators.length === 3 && isErr(labelDeclaration)) {
          // there is an issue with the label
          logError(lineNumber, [labelDeclaration.error]);
        } else if (operators.length === 2) {
          // possible combinations (where INS is an instruction):
          // label: INS
          //        INS operand
          // label: #n

          const secondInstruction = getInstructionType(operators[1]);
          const secondOperand = getOperand(operators[1]);

          if (isOk(secondInstruction) && isErr(labelDeclaration)) {
            // if the second value is an instruction, then there is an issue with the label
            logError(lineNumber, [labelDeclaration.error]);

            return malformedInstructionError;
          } else if (secondOperand.type?.[0] === InsType.N && isErr(labelDeclaration)) {
            // if the second value is a number, it could be either an address or a label issue
            logError(lineNumber, [
              `either label error: "${labelDeclaration.error}"`,
              `or instruction error: "${instructionType.error}"`,
            ]);
          } else {
            logError(lineNumber, [`an unknown error has occured near "${operators[0]}"`]);
          }

          return malformedInstructionError;
        } else if (operators.length === 1 && numberOperand.filter(isOk).length === 0) {
          // it has to be either an opcode or a number and since both aren't true, display both error messages
          logError(lineNumber, [
            `either instruction error: "${instructionType.error}"`,
            `or number error: "${numberOperand
              .filter(isErr)
              .map(({ error }) => error)
              .join(`" or "`)}"`,
          ]);
          return malformedInstructionError;
        }
      }

      if (operand.type === undefined) {
        logError(lineNumber, [`an unknown error has occured near "${operators[0]}"`]);
        return malformedInstructionError;
      }

      let opcode: Optional<Opcodes> = undefined;

      // check that the operand matches up with the opcode
      if (isOk(instructionType)) {
        const needsEnding = !isKeyOf(instruction, Opcodes);

        for (const type of [...instructionType.data, new Error()]) {
          if (type === operand.type[0]) {
            // if the instruction matches, it is valid so end the loop
            if (needsEnding) {
              // if it needs an ending, add A if the type is address if not add N
              opcode = Opcodes[`${instruction}${type === InsType.Address ? "A" : "N"}`];
            } else {
              // if not set the opcode to the instruction opcode
              opcode = Opcodes[instruction];
            }
            break;
          } else if (type instanceof Error) {
            logError(lineNumber, [
              `The instruction "${instruction}" needs a "${instructionType.data.join(
                `" or "`
              )}" operand and a "${operand.type[0]}" was provided instead`,
            ]);

            return malformedInstructionError;
          }
        }
      } else if (numberOperand.filter(isOk).length !== 0) {
        // the instruction just contains a number
        opcode = Opcodes.END;
      } else {
        logError(lineNumber, [`unknown error near "${instruction}"`]);
        return malformedInstructionError;
      }

      if (opcode === undefined) {
        logError(lineNumber, [`unknown error near "${instruction}"`]);
        return malformedInstructionError;
      }

      return {
        opcode: opcode,
        operand: operand.type[1] || 0x00,
        lineNumber,
      };
    }
  );

  // second pass
  for (let i = 0; i < parsedLines.length; i++) {
    const { opcode, lineNumber } = parsedLines[i];
    let { operand } = parsedLines[i];

    // converts the labels into their value
    if (typeof operand === "string") {
      if (!labelMap.has(operand)) {
        logError(lineNumber, [`the label ${operand} has not been defined`]);

        operand = 0x00;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        operand = labelMap.get(operand)!;
      }
    }

    // save the value in memory
    memory[i] = Processor.combineInstruction(opcode, operand);
  }

  // output the labels to the assigned
  if (!hasErrored && this && this.getLabels) {
    this.getLabels(labelMap);
  }

  return hasErrored ? new Uint16Array(0) : memory;
}
