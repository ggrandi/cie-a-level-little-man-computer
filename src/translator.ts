import { Opcodes } from "./Opcodes.ts";
import { ErrorCodes, Processor, Registers } from "./Processor.ts";
import { isKeyOf, isStringKeyOf } from "./type-guards.ts";
import { CharsToStr, Last, MapKey, StrToChars } from "./type-utils.ts";
import { match, spaceString } from "./utils.ts";

import { red } from "https://deno.land/std@0.125.0/fmt/colors.ts";
import { Err, Ok, Result } from "./result.ts";

const enum InstructionTypes {
  N,
  Address,
  Register,
  AddressOrN,
  None,
}

/** returns whether the instruction can take an address parameter */
const isAddressInstruction = (
  instructionType: InstructionTypes,
): instructionType is InstructionTypes.Address | InstructionTypes.AddressOrN =>
  instructionType === InstructionTypes.Address || instructionType === InstructionTypes.AddressOrN;

/** returns whether the instruction can take an n parameter */
const isNInstruction = (
  instructionType: InstructionTypes,
): instructionType is InstructionTypes.N | InstructionTypes.AddressOrN =>
  instructionType === InstructionTypes.N || instructionType === InstructionTypes.AddressOrN;

// /** returns whether the instruction can take an AddressOrN parameter */
// const isAddressOrNInstruction = (
//   instructionType: InstructionTypes
// ): instructionType is InstructionTypes.N | InstructionTypes.Address | InstructionTypes.AddressOrN =>
//   instructionType === InstructionTypes.N ||
//   instructionType === InstructionTypes.Address ||
//   instructionType === InstructionTypes.AddressOrN;

// type generated from the opcodes of all the possible instructions
type Instructions = {
  [K in Exclude<keyof typeof Opcodes, number>]: Last<StrToChars<K>> extends [infer Last, infer Rest]
    ? Rest extends string[] // if the last character is A and there is an N variant, remove the A
    ? Last extends "A" ? `${CharsToStr<Rest>}N` extends keyof typeof Opcodes ? CharsToStr<Rest>
    : K
    : // if the last character is N and there is an A variant, remove the N
    Last extends "N" ? `${CharsToStr<Rest>}A` extends keyof typeof Opcodes ? CharsToStr<Rest>
    : K
    : K
    : K
    : K;
}[keyof typeof Opcodes];

// Record with the instructions and the type of their operands
const instructionTypesRecord = match<Readonly<Record<Instructions, InstructionTypes>>>()(
  {
    ADD: InstructionTypes.AddressOrN,
    BRK: InstructionTypes.None,
    CMI: InstructionTypes.Address,
    CMP: InstructionTypes.AddressOrN,
    DEC: InstructionTypes.Register,
    END: InstructionTypes.None,
    ERR: InstructionTypes.N,
    IN: InstructionTypes.None,
    INC: InstructionTypes.Register,
    JMP: InstructionTypes.Address,
    JPE: InstructionTypes.Address,
    JPN: InstructionTypes.Address,
    LDD: InstructionTypes.Address,
    LDI: InstructionTypes.Address,
    LDM: InstructionTypes.N,
    LDR: InstructionTypes.N,
    LDX: InstructionTypes.Address,
    MOV: InstructionTypes.Register,
    OUT: InstructionTypes.None,
    STO: InstructionTypes.Address,
    SUB: InstructionTypes.AddressOrN,
    LSL: InstructionTypes.N,
    LSR: InstructionTypes.N,
    AND: InstructionTypes.AddressOrN,
    OR: InstructionTypes.AddressOrN,
    XOR: InstructionTypes.AddressOrN,
  } as const,
);

// create the comment delimiter and regex to remove comments
const commentDelimiter = "//";
const commentRegex = new RegExp(`\\s*${commentDelimiter}.*$`);

/** whether a given integer is within the safe range of the Processor */
const isAllowedInt = (int: number) => Processor.MIN_INT <= int && Processor.MAX_INT >= int;

/** gets an assembly number from a string or gives a reason as to why it is invalid */
const getN = (n: string): Result<number, string> => {
  // checks if it has the correct prefix
  const hasPrefix = n[0] === "#";

  if (!hasPrefix) {
    return Err("have to prefix number with a #");
  }

  const hasNonDenaryBase = isNaN(Number(n[1]));

  if (hasNonDenaryBase && !"B&".includes(n[1])) {
    return Err(
      `the only other bases allowed are B (binary) or & (hexadecimal). '${
        n[1]
      }' was not recognized.`,
    );
  }

  // gets the number part
  const numberPart = n.slice(hasNonDenaryBase ? 2 : 1);

  // converts it into an integer
  const int = parseInt(numberPart, hasNonDenaryBase ? (n[1] === "B" ? 2 : 16) : 10);

  // checks if the integer is actually a number
  if (isNaN(int)) {
    return Err(`the number part '${numberPart}' is not a valid number`);
  }

  // checks if the integer is in the allowed range
  return isAllowedInt(int)
    ? Ok(int)
    : Err(`The number '${int}' is not in the allowed range for the processor`);
};

/** gets an address from a string */
const getAddress = (address: string): Result<number, string> => {
  // gets the address from the integer
  const int = parseInt(address, 10);

  // checks if it is an actual integer
  if (isNaN(int)) {
    return Err(`the address '${address}' has to be a base 10 number`);
  }

  // checks if it is an allowed integer
  return isAllowedInt(int)
    ? Ok(int)
    : Err(`the address '${address}' is not in the allowed range of the processor`);
};

/** gets the register from a specified string */
const getRegister = (register: string): Result<number, string> => {
  // cannot be a number in a string
  if (!isNaN(Number(register))) {
    return Err(`the register '${register}' is not an allowed register`);
  }

  // checks if the register is a key of the Registers enum
  return isStringKeyOf(register, Registers)
    ? Ok(Registers[register])
    : Err(`the register '${register}' is not an allowed register`);
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

  if (!checkedLabel.ok) {
    return checkedLabel;
  }

  // checks that label is declared properly
  if (label.at(-1) !== ":") {
    return Err("have to declare a label with a : at the end");
  }

  return checkedLabel;
};

/** gets an opcode type from a specified string */
const getInstructionType = (opcode: string): Result<InstructionTypes, string> => {
  if (!isKeyOf(opcode, instructionTypesRecord)) {
    return Err(`'${opcode}' is not a valid opcode`);
  }

  return Ok(instructionTypesRecord[opcode]);
};

const getOperand = (operand?: string) => {
  let type:
    | undefined
    | [InstructionTypes.N, Ok<typeof n>["data"]]
    | [InstructionTypes.Address, Ok<typeof address>["data"]]
    | [InstructionTypes.Register, Ok<typeof register>["data"]]
    | [InstructionTypes.AddressOrN, Ok<typeof label>["data"]];

  if (operand === undefined) {
    const invalidMessage = Err("have to pass an operand");
    return {
      n: invalidMessage as Err<typeof n>,
      address: invalidMessage as Err<typeof address>,
      register: invalidMessage as Err<typeof register>,
      label: invalidMessage as Err<typeof label>,
      type: [InstructionTypes.None, undefined] as [InstructionTypes.None, undefined],
    };
  }

  // checks if it is a number
  const n = getN(operand);
  if (n.ok) type = [InstructionTypes.N, n.data];

  // checks if it is a number
  const address = getAddress(operand);
  if (address.ok) type = [InstructionTypes.Address, address.data];

  // checks if it is a register
  const register = getRegister(operand);
  if (register.ok) type = [InstructionTypes.Register, register.data];

  // checks if it is a label
  const label = getLabel(operand);
  if (label.ok) type = [InstructionTypes.AddressOrN, label.data];

  if (type === undefined) {
    return {
      n: n as Err<typeof n>,
      address: address as Err<typeof address>,
      register: register as Err<typeof register>,
      label: label as Err<typeof label>,
      type: undefined,
    };
  }

  return { n, address, register, label, type };
};

type TranslatorLogger = (lineNumber: number, errors: string[]) => void;

/** the default logger for translator */
const defaultLogger: TranslatorLogger = (lineNumber: number, errors: string[]) => {
  const lineNumberWarning = `line ${lineNumber}: `;

  console.error(red(lineNumberWarning + errors.join(`\n${spaceString(lineNumberWarning.length)}`)));
};

/** the type to make translator output more values */
export type TranslatorThis = {
  logger?: TranslatorLogger | undefined;
  getLabels?: ((labelMap: ReadonlyMap<string, number>) => void) | undefined;
};

/**
 * loads the assembly code `code` into memory
 *
 * use `translator.bind` or `translator.apply` to make it output values elsewhere
 * @returns the memory to load
 */
export function translator(this: TranslatorThis | void, code: string): Uint16Array;
/**
 * loads the template literal code into memory
 *
 * use `translator.bind` or `translator.apply` to make it output values elsewhere
 * @returns the memory to load
 */
export function translator(
  this: TranslatorThis | void,
  code: TemplateStringsArray,
  ...separations: unknown[]
): Uint16Array;
export function translator(
  this: TranslatorThis | void,
  first: TemplateStringsArray | string,
  ...separations: unknown[]
): Uint16Array {
  let hasErrored = false;

  const logger: TranslatorLogger = this?.logger ?? defaultLogger;

  const logError: TranslatorLogger = (...args: Parameters<TranslatorLogger>) => {
    hasErrored = true;
    logger(...args);
  };

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
      address,
    ): Readonly<{
      opcode: number;
      operand: number | MapKey<typeof labelMap>;
      lineNumber: number;
    }> => {
      // errored instruction
      const malformedInstructionError = {
        opcode: Opcodes.ERR,
        operand: ErrorCodes.MalformedInstruction,
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

      if (labelDeclaration.ok) {
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
      if (instructionType.ok) {
        operators.shift();
      }

      const operand = getOperand(operators[0]);

      // check that the second parameter is correct
      if (!instructionType.ok && operand.type?.[0] !== InstructionTypes.N) {
        if (operators.length === 3 && !labelDeclaration.ok) {
          // there is an issue with the label
          logError(lineNumber, [labelDeclaration.error]);
        } else if (operators.length === 2) {
          // possible combinations (where INS is an instruction):
          // label: INS
          //        INS operand
          // label: #n

          const secondInstruction = getInstructionType(operators[1]);
          const secondOperand = getOperand(operators[1]);

          if (secondInstruction.ok && !labelDeclaration.ok) {
            // if the second value is an instruction, then there is an issue with the label
            logError(lineNumber, [labelDeclaration.error]);
          } else if (
            (secondOperand.type?.[0] === InstructionTypes.N ||
              secondOperand.type?.[0] === InstructionTypes.AddressOrN) &&
            !labelDeclaration.ok
          ) {
            // if the second value is a number, it could be either an address or a label issue
            logError(lineNumber, [
              `either label error: ${labelDeclaration.error}`,
              `or instruction error: ${instructionType.error}`,
            ]);
          } else {
            logError(lineNumber, [`an unknown error has occured near '${operators[0]}'`]);
          }
        } else if (operators.length === 1 && !operand.n.ok) {
          // it has to be either an opcode or a number and since both aren't true, display both error messages
          logError(lineNumber, [
            `either instruction error: ${instructionType.error}`,
            `or number error: ${operand.n.error}`,
          ]);
        } else {
          logError(lineNumber, [`an unknown error has occured near '${operators[0]}'`]);
        }

        return malformedInstructionError;
      }

      // means all of the checks have failed, if so error
      if (!operand.type) {
        logError(lineNumber, [`malformed operand '${operators[0]}'`]);

        return malformedInstructionError;
      }

      let opcode: Opcodes;

      // check that the operand matches up with the opcode
      if (instructionType.ok) {
        if (instructionType.data === InstructionTypes.AddressOrN) {
          const addressInstruction = instruction + "A";
          const numberInstruction = instruction + "N";

          if (isAddressInstruction(operand.type[0]) && isStringKeyOf(addressInstruction, Opcodes)) {
            // checks that the operand is an address
            opcode = Opcodes[addressInstruction];
          } else if (isNInstruction(operand.type[0]) && isStringKeyOf(numberInstruction, Opcodes)) {
            // checks that the operand is a number
            opcode = Opcodes[numberInstruction];
          } else {
            // operand is neither a number or address
            logError(lineNumber, [
              `the operand for ${instruction} should either be a number or address`,
            ]);
            return malformedInstructionError;
          }
        } else if (instructionType.data === InstructionTypes.N) {
          // checks that the operand is a number
          if (isNInstruction(operand.type[0]) && isStringKeyOf(instruction, Opcodes)) {
            opcode = Opcodes[instruction];
          } else {
            // operand is not a number so error
            logError(lineNumber, [`the operand for ${instruction} should be a number`]);

            return malformedInstructionError;
          }
        } else if (instructionType.data === InstructionTypes.Address) {
          // checks that the operand is an address
          if (isAddressInstruction(operand.type[0]) && isStringKeyOf(instruction, Opcodes)) {
            opcode = Opcodes[instruction];
          } else {
            // operand is not a address so error
            logError(lineNumber, [`the operand for ${instruction} should be an address`]);
            return malformedInstructionError;
          }
        } else if (instructionType.data === InstructionTypes.Register) {
          // checks that the operand is a register
          if (
            operand.type[0] === InstructionTypes.Register && isStringKeyOf(instruction, Opcodes)
          ) {
            opcode = Opcodes[instruction];
          } else {
            // operand is not a address so error
            logError(lineNumber, [`the operand for ${instruction} should be a register`]);
            return malformedInstructionError;
          }
        } else if (instructionType.data === InstructionTypes.None) {
          // checks that the operand is none
          if (operand.type[0] === InstructionTypes.None && isStringKeyOf(instruction, Opcodes)) {
            opcode = Opcodes[instruction];
          } else {
            // operand is not a address so error
            logError(lineNumber, [`the instruction ${instruction} should have no operands`]);
            return malformedInstructionError;
          }
        } else {
          logError(lineNumber, [
            `unknown instruction type '${instructionType.data}' at instruction ${instruction}`,
          ]);
          return malformedInstructionError;
        }
      } else if (operand.type[0] === InstructionTypes.N) {
        // the instruction just contains a number
        opcode = Opcodes.END;
      } else {
        logError(lineNumber, [`unknown error near '${instruction}'`]);
        return malformedInstructionError;
      }

      return {
        opcode: opcode,
        operand: operand.type[1] || 0x00,
        lineNumber,
      };
    },
  );

  // second pass
  for (let i = 0; i < parsedLines.length; i++) {
    let { opcode, operand, lineNumber } = parsedLines[i];

    // converts the labels into their value
    if (typeof operand === "string") {
      if (!labelMap.has(operand)) {
        logError(lineNumber, [`the label ${operand} has not been defined`]);

        operand = 0x00;
      } else {
        operand = labelMap.get(operand)!;
      }
    }

    // save the value in memory
    memory[i] = Processor.combineInstruction(opcode, operand);
  }

  // output the labels to the assigned
  if (this && this.getLabels) {
    this.getLabels(labelMap);
  }

  return hasErrored ? new Uint16Array(0) : memory;
}
