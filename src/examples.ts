export const examples = {
  "Add Three Numbers": `
// adds three numbers together and stores them
start:	LDD first
	ADD second
	ADD third
	STO total
	CMP #&60	// makes sure the value stored was the correct sum in order to check the processor
	JPN err
	END

err:	ERR #5
first:	#&10
second:	#&30
third:	#&20
total:			// implied to start at 0
`.slice(1),
  "Hello World!": `
// print out a string
start:	LDX string	// loads the next value of the char[]
	CMP #0		// checks if that value exists
	JPE end		// if it doesn't exist, end the program

        OUT		// output the character
	INC IX		// increment the index register
	JMP start	// loop back to the beginning
end:	END
		// ASCII value:
string:	#&48	// H
	#&65	// e
	#&6C	// l
	#&6C	// l
	#&6F	// o
	#&2C	// ,
	#&20	//  
	#&57	// W
	#&6F	// o
	#&72	// r
	#&6C	// l
	#&64	// d
	#&21	// !
	#&0A	// \\n
`.slice(1),
  "Sum an Array": `
	LDM #0		// Load 0 into ACC
	STO total	// Store 0 in the total
	STO counter	// Store 0 in the counter
	LDR #0		// Set IX to 0
loop:	LDX number	// Load the number indexed by IX into ACC
	ADD total	// Add total to ACC
	STO total	// Store the result in total
	INC IX		// Add 1 to the contents of IX
	LDD counter	// Load the counter into ACC
	INC ACC		// Add 1 to ACC
	STO counter	// Load counter into ACC
	CMP #3		// Compare with #3
	JPN loop	// If the ACC != 3 then return to the start of the loop
	END

number:	#5
	#7
	#3

counter:
total:
`.slice(1),
  "Bitwise Operations": (() => {
    const a = 0b10101010;
    const b = 0b01011010;
    return `
shift:	LDM #${8}
	LSL #${1}
	// ensures the value is ${8 << 1}
	CMP #${8 << 1}
	JPN err
	// shifts it right by ${3}
	LSR #${3}
	// ensures the value is ${(8 << 1) >>> 3}
	CMP #${(8 << 1) >>> 3}
	JPN err

and:	LDM #${a}
	AND #${b}
	// ensures the value is ${a & b}
	CMP #${a & b}
	JPN err
	LDM #${b}
	AND val
	// ensures the value is ${a & b}
	CMP #${a & b}
	JPN err

or:	LDM #${a}
	OR #${b}
	// ensures the value is ${a | b}
	CMP #${a | b}
	JPN err
	LDM #${b}
	OR val
	// ensures the value is ${a | b}
	CMP #${a | b}
	JPN err

xor:	LDM #${a}
	XOR #${b}
	// ensures the value is ${a ^ b}
	CMP #${a ^ b}
	JPN err
	LDM #${b}
	XOR val
	// ensures the value is ${a ^ b}
	CMP #${a ^ b}
	JPN err

	END

err:	ERR #5
val:	#${a}
`.slice(1);
  })(),
};
