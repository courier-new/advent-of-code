/* --- Day 3: Gear Ratios ---
You and the Elf eventually reach a gondola lift station; he says the gondola lift will take you up to the water source, but this is as far as he can bring you. You go inside.

It doesn't take long to find the gondolas, but there seems to be a problem: they're not moving.

"Aaah!"

You turn around to see a slightly-greasy Elf with a wrench and a look of surprise. "Sorry, I wasn't expecting anyone! The gondola lift isn't working right now; it'll still be a while before I can fix it." You offer to help.

The engineer explains that an engine part seems to be missing from the engine, but nobody can figure out which one. If you can add up all the part numbers in the engine schematic, it should be easy to work out which part is missing.

The engine schematic (your puzzle input) consists of a visual representation of the engine. There are lots of numbers and symbols you don't really understand, but apparently any number adjacent to a symbol, even diagonally, is a "part number" and should be included in your sum. (Periods (.) do not count as a symbol.)

Here is an example engine schematic:

467..114..
...*......
..35..633.
......#...
617*......
.....+.58.
..592.....
......755.
...$.*....
.664.598..
In this schematic, two numbers are not part numbers because they are not adjacent to a symbol: 114 (top right) and 58 (middle right). Every other number is adjacent to a symbol and so is a part number; their sum is 4361.

Of course, the actual engine schematic is much larger. What is the sum of all of the part numbers in the engine schematic? */

const NUMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
// I'm observationally guessing that these are all the possible symbols but I haven't
// confirmed this. 😬
const SYMBOLS_REGEX = new RegExp("[!@#\\$%\\^\\&\\*\\-\\+=\\?/\\\\~]");

function sumPartNumbers(
  schematic: string
): [partNumbers: number[], sum: number] {
  const partNumbers: number[] = [];
  let sum = 0;

  // Split the schematic into an array per line.
  const lines = schematic.split("\n");

  // Keep track of which line of the schematic we're actively considering.
  let lineIndex = 0;
  while (lineIndex < lines.length) {
    // Take the previous line, the current line, and the next line. We need the previous and
    // next lines to look for symbols that might be above, below, or at a diagonal from a
    // number in the current line.
    const previousLine = lines[lineIndex - 1];
    const currentLine = lines[lineIndex]!;
    const nextLine = lines[lineIndex + 1];

    // Keep track of the character in the line that we're actively considering.
    let charIndex = 0;
    while (charIndex < currentLine.length) {
      const currentChar = currentLine[charIndex]!;
      // If the current character isn't a digit, we don't need to think about it.
      if (!NUMS.includes(currentChar)) {
        // Move onto the next character.
        charIndex = charIndex + 1;
      } else {
        // Otherwise, it's a digit! We now need to check characters after this one to make
        // sure we capture the full part number and know the range of characters to check
        // all around it. It's possible it's only a single character (e.g. "9") or the
        // start of a sequence of multiple characters making up a single number (e.g.
        // "918"). We start by recording the index where this number started in the string.
        const startOfNumberIndex = charIndex;
        // Then get the next character in the line.
        charIndex = charIndex + 1;
        let nextChar = currentLine[charIndex] || "";
        // If it's also a digit
        while (NUMS.includes(nextChar)) {
          // Increment charIndex so that we know we've "consumed" these characters already
          // once we progress to checking the rest of the string for other part numbers.
          charIndex = charIndex + 1;
          // Keep looking forward.
          nextChar = currentLine[charIndex] || "";
        }
        // Once we hit a non-digit character, nextChar will be at the index of the last
        // digit. Now we can build the full number based on the slice of the string
        // between startOfNumberIndex and charIndex.
        const partNumberString = currentLine.slice(
          startOfNumberIndex,
          charIndex
        );
        // Now convert it into an integer
        const partNumber = parseInt(partNumberString, 10);

        // The part number is only valid if it's adjacent to at least one symbol. A symbol
        // could exist in a square around the part number in any of the following
        // positions:
        // xxxxx
        // x918x
        // xxxxx
        // We assume each line of the schematic document has the same length. The earliest
        // index a symbol could exist in is startOfNumberIndex - 1, and the latest index
        // it could exist in is charIndex. We account for being at the beginning of the
        // line by clamping to 0. It's okay if we go beyond the end of the line; the slice
        // will just stop at the end.
        const earliestIndex =
          startOfNumberIndex === 0 ? 0 : startOfNumberIndex - 1;
        // Check if the previous, current, or next line contain a symbol within this range.
        const previousLineHasSymbol = lineHasSymbol(
          previousLine,
          earliestIndex,
          charIndex
        );
        const currentLineHasSymbol = lineHasSymbol(
          currentLine,
          earliestIndex,
          charIndex
        );
        const nextLineHasSymbol = lineHasSymbol(
          nextLine,
          earliestIndex,
          charIndex
        );
        const hasSymbol =
          previousLineHasSymbol || currentLineHasSymbol || nextLineHasSymbol;

        if (partNumber === 203) {
          console.log(
            previousLineHasSymbol,
            currentLineHasSymbol,
            nextLineHasSymbol,
            nextLine?.slice(earliestIndex, charIndex + 1)
          );
        }

        // Only if we found a symbol adjacent to the part number, hold onto it and add it
        // to the sum.
        if (hasSymbol) {
          partNumbers.push(partNumber);
          sum = sum + partNumber;
        }
        // Otherwise, we'll move onto the next unconsumed character in the line. We've
        // already incremented charIndex for this.
      }
    }

    // Move onto the next line.
    lineIndex = lineIndex + 1;
  }

  return [partNumbers, sum];
}

// Helper function to search the provided line for a symbol within the range from
// earliestIndex to latestIndex, inclusive of latestIndex.
function lineHasSymbol(
  line: string | undefined,
  earliestIndex: number,
  latestIndex: number
): boolean {
  if (!line) {
    return false;
  }
  // String.search returns the index where the search term matches, or -1 if there is no
  // match. We'll return a boolean corresponding to whether or not we found a match, then.
  return (
    line.slice(earliestIndex, latestIndex + 1).search(SYMBOLS_REGEX) !== -1
  );
}

// Test cases.
const TEST_SCHEMATICS: {
  schematic: string;
  partNumbers: number[];
  sum: number;
}[] = [
  {
    schematic: `467..114..
...*......
..35..633.
......#...
617*......
.....+.58.
..592.....
......755.
...$.*....
.664.598..`,
    partNumbers: [467, 35, 633, 617, 592, 755, 664, 598],
    sum: 4361,
  },
  {
    schematic: `..487.599...........411...........................................574..679.136.........
.*......*............^...........586..........................375...@..*....../.....835
833........304...&.862............&..203..........922.125...............819...........@
...........+...994..........#.........-..244.457.....*...........867.........829.......`,
    partNumbers: [
      487, 599, 411, 574, 679, 136, 586, 835, 833, 304, 862, 203, 922, 125, 819,
      994,
    ],
    sum: 9369,
  },
];

for (const { schematic, partNumbers, sum } of TEST_SCHEMATICS) {
  // Create a copy of the expected list of part numbers and sort it, so that it's easier to
  // compare with the output from our functions.
  const sortedPartNumbers = [...partNumbers].sort((a, b) => a - b);

  const [resultPartNumbers, resultSum] = sumPartNumbers(schematic);
  // Sort our output to compare with the expected list.
  const sortedResultPartNumbers = [...resultPartNumbers].sort((a, b) => a - b);
  // While either list still has part numbers left to check...
  while (sortedResultPartNumbers.length > 0 || sortedPartNumbers.length > 0) {
    // Take the last value off of both lists and compare them.
    const p0 = sortedPartNumbers.pop();
    const p1 = sortedResultPartNumbers.pop();
    // If we ever find a mismatch, fail the test.
    if (p0 !== p1) {
      console.error(
        "❌, found mismatch, expected",
        partNumbers.join(","),
        "but got",
        resultPartNumbers.join(",")
      );
      break;
    }
    // If we didn't print anything, consider that a success!
  }
  if (sum !== resultSum) {
    console.error("❌, expected sum", sum, "but got", resultSum);
  } else {
    console.log("✅");
  }
}

// Now let's try with our actual engine schematic document.
import * as fs from "fs";

// We'll read the whole file in for this since we want to look at multiple lines
// simultaneously.
fs.readFile("./advent-of-code-2023/3.txt", (err, rawFile) => {
  if (err) throw err;
  const [_, sum] = sumPartNumbers(rawFile.toString());
  console.log("result", sum);
});
