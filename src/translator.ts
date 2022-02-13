import { Opcodes } from "./Opcodes.ts";
import { Processor, Registers, ErrorCodes } from "./Processor.ts";
import { isKeyOf, isStringKeyOf } from "./type-guards.ts";

/** regular expressions to parse a line */
const lineRegex = {
  /** lines with opcodes that take n as an operand */
  n: /^\s*(LDM|LDR|ADD|SUB|CMP)\s+(#[0-9]+|B[0-1]+)(\s+\/\/.*)?$/,
  /** lines with opcodes that take an address as an operand */
  address:
    /^ *(LDD|LDI|LDX|STO|ADD|SUB|JMP|CMP|CMI|JPE|JPN) +([0-9]+)(\s+\/\/.*)?$/,
  /** lines with opcodes that take a register as an operand */
  register: /^ *(MOV|INC|DEC) +([A-Z]+)(\s+\/\/.*)?$/,
  none: /^ *(END|IN|OUT|BRK)(\s+\/\/.*)?$/,
};

/**
 * loads the assembly code `code` into memory
 * @returns the memory to load
 */
export function translator(code: string): Uint16Array;
/**
 * loads the template literal code into memory
 * @returns the memory to load
 */
export function translator(
  code: TemplateStringsArray,
  ...separations: unknown[]
): Uint16Array;
export function translator(
  first: TemplateStringsArray | string,
  ...separations: unknown[]
): Uint16Array {
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

  const memory = new Uint16Array(lines.length);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let instruction;
    const isNumberInstruction = lineRegex.n.test(line);

    if (isNumberInstruction || lineRegex.address.test(line)) {
      let [, opcode, operand] =
        lineRegex[isNumberInstruction ? "n" : "address"].exec(line)!;

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

      instruction = Processor.combineInstruction(binOpcode, binOperand);
    } else if (lineRegex.register.test(line)) {
      let [, opcode, operand] = lineRegex.register.exec(line)!;

      if (!isKeyOf(opcode, Opcodes)) {
        // the opcode isn't recognized so it throws an error
        throw new Error(`${opcode.slice(0, -1)} isn't recognized as an opcode`);
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

      instruction = Processor.combineInstruction(binOpcode, binOperand);
    } else if (lineRegex.none.test(line)) {
      // parse the opcode from the command
      let [, opcode] = lineRegex.none.exec(line)!;

      if (!isKeyOf(opcode, Opcodes)) {
        // the opcode isn't recognized so it throws an error
        throw new Error(`${opcode.slice(0, -1)} isn't recognized as an opcode`);
      }

      // lookup the opcode from the opcodes enum
      const binOpcode = Opcodes[opcode];
      const binOperand = 0x00;

      instruction = Processor.combineInstruction(binOpcode, binOperand);
    } else {
      // the opcode / operand isn't recognized
      console.error(
        `the line '${line}' isn't a recognized command. Replaced it with an error command`
      );

      const binOpcode = Opcodes.ERR;
      const binOperand = ErrorCodes.UnrecognizedOpcode;

      instruction = Processor.combineInstruction(binOpcode, binOperand);
    }

    // save the instruction in memory
    memory[i] = instruction;
  }

  return memory;
}
