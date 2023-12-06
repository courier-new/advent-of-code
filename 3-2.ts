/* --- Part Two ---
The engineer finds the missing part and installs it in the engine! As the engine springs to life, you jump in the closest gondola, finally ready to ascend to the water source.

You don't seem to be going very fast, though. Maybe something is still wrong? Fortunately, the gondola has a phone labeled "help", so you pick it up and the engineer answers.

Before you can explain the situation, she suggests that you look out the window. There stands the engineer, holding a phone in one hand and waving with the other. You're going so slowly that you haven't even left the station. You exit the gondola.

The missing part wasn't the only issue - one of the gears in the engine is wrong. A gear is any * symbol that is adjacent to exactly two part numbers. Its gear ratio is the result of multiplying those two numbers together.

This time, you need to find the gear ratio of every gear and add them all up so that the engineer can figure out which gear needs to be replaced.

Consider the same engine schematic again:

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
In this schematic, there are two gears. The first is in the top left; it has part numbers 467 and 35, so its gear ratio is 16345. The second gear is in the lower right; its gear ratio is 451490. (The * adjacent to 617 is not a gear because it is only adjacent to one part number.) Adding up all of the gear ratios produces 467835.

What is the sum of all of the gear ratios in your engine schematic? */

const NUMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
// Regex for one or more digits, followed by either a non-digit character or the end of
// the input.
const CONSECUTIVE_DIGITS_REGEX = new RegExp("(\\d+)([^\\d]|$)", "g");

function sumGearRatios(schematic: string): [gearRatios: number[], sum: number] {
  const gearRatios: number[] = [];
  let sum = 0;

  // Split the schematic into an array per line.
  const lines = schematic.split("\n");

  // Keep track of which line of the schematic we're actively considering.
  let lineIndex = 0;
  while (lineIndex < lines.length) {
    // Take the previous line, the current line, and the next line. We need the previous
    // and next lines to look for part numbers that might be above, below, or at a
    // diagonal from gear in the current line.
    const previousLine = lines[lineIndex - 1];
    const currentLine = lines[lineIndex]!;
    const nextLine = lines[lineIndex + 1];

    // Look for any potential gears in the line.
    const matches = currentLine.matchAll(/\*/g);
    let next = matches.next();
    while (next.done !== true) {
      const gearIndex = next.value.index;
      if (gearIndex !== undefined) {
        // The gear is only valid if it's adjacent to exactly two part numbers. Thus, we
        // need to look for digits in a square around the part number in any of the
        // following positions:
        // ###
        // #*#
        // ###
        // We assume each line of the schematic document has the same length. The earliest
        // index a digit could exist in is gearIndex - 1, and the latest index
        // it could exist in is gearIndex + 1. We account for being at the beginning of the
        // line by clamping to 0. It's okay if we go beyond the end of the line; the slice
        // will just stop at the end.
        const earliestIndex = gearIndex === 0 ? 0 : gearIndex - 1;

        // We first count up the number of independent part numbers adjacent to the gear.
        // For both above and below the gear, it's possible there are 0, 1, or 2 part
        // numbers:
        // - If there are 0 part numbers, all the characters will be non-digits.
        // - If there is 1 part number, all of the digit characters that are present will
        //   be consecutive.
        // - If there are 2 part numbers, the first and last character will be digits, and
        //   the middle character will be a non-digit.
        // We will use regex to look for one or more digits followed by either a
        // non-digit character or the end of the sequence.
        const matchesAbove = Array.from(
          previousLine
            ?.slice(earliestIndex, gearIndex + 2)
            .matchAll(CONSECUTIVE_DIGITS_REGEX) || []
        );
        const matchesBelow = Array.from(
          nextLine
            ?.slice(earliestIndex, gearIndex + 2)
            .matchAll(CONSECUTIVE_DIGITS_REGEX) || []
        );

        // For left and right of the gear, there's either a part number there or there's not.
        const matchLeft = NUMS.includes(currentLine[gearIndex - 1] || "")
          ? 1
          : 0;
        const matchRight = NUMS.includes(currentLine[gearIndex + 1] || "")
          ? 1
          : 0;

        // Only if we have exactly 2 matches around the gear is it valid.
        if (
          matchesAbove.length + matchesBelow.length + matchLeft + matchRight ===
          2
        ) {
          // Now we need to capture the full part number for each of the 2 matches. It's
          // possible it's only a single character (e.g. "9") or a sequence of multiple
          // characters making up a single number (e.g. "918").
          const partNumbers = [];
          for (const { index } of matchesAbove) {
            if (index !== undefined && previousLine !== undefined) {
              // index is relative to the 3-character long slice we looked at above the
              // gear. The actual index, then, is gearIndex + index - 1.
              const partNumber = extractPartNumber(
                previousLine,
                gearIndex + index - 1
              );
              partNumbers.push(partNumber);
            }
          }
          for (const { index } of matchesBelow) {
            if (index !== undefined && nextLine !== undefined) {
              // index is relative to the 3-character long slice we looked at below the
              // gear. The actual index, then, is gearIndex + index - 1.
              const partNumber = extractPartNumber(
                nextLine,
                gearIndex + index - 1
              );
              partNumbers.push(partNumber);
            }
          }
          if (matchLeft) {
            const partNumber = extractPartNumber(currentLine, gearIndex - 1);
            partNumbers.push(partNumber);
          }
          if (matchRight) {
            const partNumber = extractPartNumber(currentLine, gearIndex + 1);
            partNumbers.push(partNumber);
          }

          // This should always be the case, this is just a safety guard.
          if (partNumbers.length === 2) {
            // Multiply the two part numbers together to get the gear ratio.
            const gearRatio = partNumbers[0]! * partNumbers[1]!;
            gearRatios.push(gearRatio);
            sum = sum + gearRatio;
          }
        }
      }

      // Move onto the next potential gear.
      next = matches.next();
    }

    // Move onto the next line.
    lineIndex = lineIndex + 1;
  }

  return [gearRatios, sum];
}

// Helper function which, starting at a knownIndex in a line where a digit is present,
// will look in both directions from knownIndex to capture additional digits until it
// encounters a non-digit, and return the subsequent full integer parsed from that string.
function extractPartNumber(line: string, knownIndex: number): number {
  // Starting at the knownIndex, look at the previous character.
  let beginningIndex = knownIndex;
  let previousChar = line[beginningIndex - 1] || "";
  // If it's a digit...
  while (NUMS.includes(previousChar)) {
    // Update our index and look at the next previous character.
    beginningIndex = beginningIndex - 1;
    previousChar = line[beginningIndex - 1] || "";
  }
  // Once the loop concludes, we've found where the part number begins.

  // Starting at knownIndex, look at the next character.
  let endingIndex = knownIndex;
  let nextChar = line[endingIndex + 1] || "";
  // If it's a digit...
  while (NUMS.includes(nextChar)) {
    // Update our index and look at the next next character.
    endingIndex = endingIndex + 1;
    nextChar = line[endingIndex + 1] || "";
  }
  // Once the loop concludes, we've found where the part number ends.

  // Return the integer we parse from the slice from beginningIndex to endingIndex,
  // inclusive of endingIndex.
  return parseInt(line.slice(beginningIndex, endingIndex + 1), 10);
}

// Test cases.
const TEST_SCHEMATICS: {
  schematic: string;
  gearRatios: number[];
  sum: number;
}[] = [
  {
    schematic: `467.114...
...*17....
..35..633.
......#...
617*10....
.....+.58.
..592.....
......755.
...$.*....
.664.598..`,
    gearRatios: [6170, 451490],
    sum: 457660,
  },
  {
    schematic: `
  ..487.599...........411...........................................574..679.136.........
  .*......*............^...........586.................*........375...@..*....../.....835
  833........304...&.862............&..203..........922.125...............819...........@
  ...........+...994..........#.........-..244.457.................867.........829..*....`,
    gearRatios: [405671, 556101, 115250],
    sum: 1077022,
  },
];

for (const { schematic, gearRatios, sum } of TEST_SCHEMATICS) {
  // Create a copy of the expected list of gear ratios and sort it, so that it's easier to
  // compare with the output from our functions.
  const sortedGearRatios = [...gearRatios].sort((a, b) => a - b);

  const [resultGearRatios, resultSum] = sumGearRatios(schematic);
  // Sort our output to compare with the expected list.
  const sortedResultGearRatios = [...resultGearRatios].sort((a, b) => a - b);
  // While either list still has gear ratios left to check...
  while (sortedResultGearRatios.length > 0 || sortedGearRatios.length > 0) {
    // Take the last value off of both lists and compare them.
    const r0 = sortedGearRatios.pop();
    const r1 = sortedResultGearRatios.pop();
    // If we ever find a mismatch, fail the test.
    if (r0 !== r1) {
      console.error(
        "❌, found mismatch, expected",
        gearRatios.join(","),
        "but got",
        resultGearRatios.join(",")
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
  const [_, sum] = sumGearRatios(rawFile.toString());
  console.log("result", sum);
});
