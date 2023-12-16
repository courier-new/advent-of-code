/* --- Day 9: Mirage Maintenance ---
You ride the camel through the sandstorm and stop where the ghost's maps told you to stop. The sandstorm subsequently subsides, somehow seeing you standing at an oasis!

The camel goes to get some water and you stretch your neck. As you look up, you discover what must be yet another giant floating island, this one made of metal! That must be where the parts to fix the sand machines come from.

There's even a hang glider partially buried in the sand here; once the sun rises and heats up the sand, you might be able to use the glider and the hot air to get all the way up to the metal island!

While you wait for the sun to rise, you admire the oasis hidden here in the middle of Desert Island. It must have a delicate ecosystem; you might as well take some ecological readings while you wait. Maybe you can report any environmental instabilities you find to someone so the oasis can be around for the next sandstorm-worn traveler.

You pull out your handy Oasis And Sand Instability Sensor and analyze your surroundings. The OASIS produces a report of many values and how they are changing over time (your puzzle input). Each line in the report contains the history of a single value. For example:

0 3 6 9 12 15
1 3 6 10 15 21
10 13 16 21 30 45
To best protect the oasis, your environmental report should include a prediction of the next value in each history. To do this, start by making a new sequence from the difference at each step of your history. If that sequence is not all zeroes, repeat this process, using the sequence you just generated as the input sequence. Once all of the values in your latest sequence are zeroes, you can extrapolate what the next value of the original history should be.

In the above dataset, the first history is 0 3 6 9 12 15. Because the values increase by 3 each step, the first sequence of differences that you generate will be 3 3 3 3 3. Note that this sequence has one fewer value than the input sequence because at each step it considers two numbers from the input. Since these values aren't all zero, repeat the process: the values differ by 0 at each step, so the next sequence is 0 0 0 0. This means you have enough information to extrapolate the history! Visually, these sequences can be arranged like this:

0   3   6   9  12  15
  3   3   3   3   3
    0   0   0   0
To extrapolate, start by adding a new zero to the end of your list of zeroes; because the zeroes represent differences between the two values above them, this also means there is now a placeholder in every sequence above it:

0   3   6   9  12  15   B
  3   3   3   3   3   A
    0   0   0   0   0
You can then start filling in placeholders from the bottom up. A needs to be the result of increasing 3 (the value to its left) by 0 (the value below it); this means A must be 3:

0   3   6   9  12  15   B
  3   3   3   3   3   3
    0   0   0   0   0
Finally, you can fill in B, which needs to be the result of increasing 15 (the value to its left) by 3 (the value below it), or 18:

0   3   6   9  12  15  18
  3   3   3   3   3   3
    0   0   0   0   0
So, the next value of the first history is 18.

Finding all-zero differences for the second history requires an additional sequence:

1   3   6  10  15  21
  2   3   4   5   6
    1   1   1   1
      0   0   0
Then, following the same process as before, work out the next value in each sequence from the bottom up:

1   3   6  10  15  21  28
  2   3   4   5   6   7
    1   1   1   1   1
      0   0   0   0
So, the next value of the second history is 28.

The third history requires even more sequences, but its next value can be found the same way:

10  13  16  21  30  45  68
   3   3   5   9  15  23
     0   2   4   6   8
       2   2   2   2
         0   0   0
So, the next value of the third history is 68.

If you find the next value for each history in this example and add them together, you get 114.

Analyze your OASIS report and extrapolate the next value for each history. What is the sum of these extrapolated values? */

const TEST_OASIS_REPORTS: {
  history: number[];
  nextValue: number;
  // For part 2
  prevValue: number;
}[] = [
  {
    history: [0, 3, 6, 9, 12, 15],
    nextValue: 18,
    prevValue: -3,
  },
  {
    history: [1, 3, 6, 10, 15, 21],
    nextValue: 28,
    prevValue: 0,
  },
  {
    history: [10, 13, 16, 21, 30, 45],
    nextValue: 68,
    prevValue: 5,
  },
];

function extrapolateNext(history: number[]): number {
  // We need to look at each pair of numbers in the history and compute the difference
  // between them, for as many levels as it takes to get to all zeros. We'll keep a list of all the sequences of differences.
  const dLevels: number[][] = [history];
  // Starting with our initial history, which is not all zeros...
  let differences: number[] = history;
  let allZeros = false;
  while (!allZeros) {
    // Get the sequence of differences for this list. The result of this will be used for
    // the next level, if it's not all zeros, so we overwrite the differences array with
    // the result.
    [differences, allZeros] = getDifferences(differences);
    // Push it to our list of all the levels.
    dLevels.push(differences);
  }

  // Now we need to move backwards to extrapolate. Starting with the last level, sum the
  // last element of that level + the last element of the previous level, all the way back
  // to the first level. For example, if the levels were:
  // 10  13  16  21  30  45
  //   3   3   5   9  15
  //     0   2   4   6
  //       2   2   2
  //         0   0
  // Then we would sum...
  // 0 + 2 = 2
  //         2 + 6 = 8
  //                 8 + 15 = 23
  //                          23 + 45 = 68
  let sum = 0;
  while (dLevels.length) {
    // Pop the last element off of the last level and sum it.
    sum = sum + dLevels.pop()!.pop()!;
  }

  return sum;
}

// Helper function which takes a list of numbers and then, for every pair of number,
// subtracts the first from the second to get the difference. It returns the sequence of
// those differences. It also returns a boolean indicating whether the list is composed
// entirely of zeros, since this indicates we've reached the point where we have enough
// information to extrapolate the history. The list will thus be one element shorter than
// the input list.
function getDifferences(
  list: number[]
): [differences: number[], allZeros: boolean] {
  // Array for holding our differences.
  const differences: number[] = [];
  // Tracker for whether we encounter a value other than zero.
  let allZeros = true;

  // Destructure the first two elements and the rest from the list.
  let [first, second, ...rest] = list;
  // While we still have a pair of elements to compare...
  while (first !== undefined && second !== undefined) {
    // Take the difference between them.
    const difference = second - first;
    // Check if it's not zero.
    if (difference !== 0) {
      allZeros = false;
    }
    // Then push it to our array.
    differences.push(difference);
    // Now, form a new pair from the second element and the next one in the list.
    first = second;
    [second, ...rest] = rest;
  }

  return [differences, allZeros];
}

for (const { history, nextValue } of TEST_OASIS_REPORTS) {
  const result = extrapolateNext(history);
  if (result !== nextValue) {
    console.error("❌, expected", nextValue, "but got", result);
  } else {
    console.log("✅");
  }
}

import * as readline from "readline";
import * as fs from "fs";

const rl = readline.createInterface(fs.createReadStream("./2023/9.txt"));

let sumOfSums = 0;
rl.on("line", (rawLine) => {
  // Parse an array of numbers from the line.
  const line = rawLine.split(/\s+/).map((num) => parseInt(num, 10));
  sumOfSums = sumOfSums + extrapolateNext(line);
});

rl.on("close", () => {
  console.log("sum", sumOfSums);
});

/* --- Part Two ---
Of course, it would be nice to have even more history included in your report. Surely it's safe to just extrapolate backwards as well, right?

For each history, repeat the process of finding differences until the sequence of differences is entirely zero. Then, rather than adding a zero to the end and filling in the next values of each previous sequence, you should instead add a zero to the beginning of your sequence of zeroes, then fill in new first values for each previous sequence.

In particular, here is what the third example history looks like when extrapolating back in time:

5  10  13  16  21  30  45
  5   3   3   5   9  15
   -2   0   2   4   6
      2   2   2   2
        0   0   0
Adding the new values on the left side of each sequence from bottom to top eventually reveals the new left-most history value: 5.

Doing this for the remaining example data above results in previous values of -3 for the first history and 0 for the second history. Adding all three new values together produces 2.

Analyze your OASIS report again, this time extrapolating the previous value for each history. What is the sum of these extrapolated values? */

function extrapolatePrev(history: number[]): number {
  // We need to look at each pair of numbers in the history and compute the difference
  // between them, for as many levels as it takes to get to all zeros. We'll keep a list of all the sequences of differences.
  const dLevels: number[][] = [history];
  // Starting with our initial history, which is not all zeros...
  let differences: number[] = history;
  let allZeros = false;
  while (!allZeros) {
    // Get the sequence of differences for this list. The result of this will be used for
    // the next level, if it's not all zeros, so we overwrite the differences array with
    // the result.
    [differences, allZeros] = getDifferences(differences);
    // Push it to our list of all the levels.
    dLevels.push(differences);
  }

  // Now we need to move backwards to extrapolate. Starting with the last level, subtract
  // the first element of the previous level from the first element of that level, all the
  // way back to the first level. For example, if the levels were:
  // 10  13  16  21  30  45
  //   3   3   5   9  15
  //     0   2   4   6
  //       2   2   2
  //         0   0
  // Then we would subtract...
  // 2 - 0 = 2
  //         0 - 2 = -2
  //                  3 - (-2) = 5
  //                            10 - 5 = 5
  // In other words, the result of the subtraction at one level becomes the minuend for
  // the subtraction at the previous level.
  let nextMinuend = 0;
  while (dLevels.length) {
    // Shift the first element off of the last level and diff it with the first element of
    // the previous level.
    const subtrahend = dLevels.pop()!.shift()!;
    nextMinuend = subtrahend - nextMinuend;
  }

  return nextMinuend;
}

// Test cases
for (const { history, prevValue } of TEST_OASIS_REPORTS) {
  const result = extrapolatePrev(history);
  if (result !== prevValue) {
    console.error("❌, expected", prevValue, "but got", result);
  } else {
    console.log("✅");
  }
}

let sumOfMinuends = 0;
rl.on("line", (rawLine) => {
  // Parse an array of numbers from the line.
  const line = rawLine.split(/\s+/).map((num) => parseInt(num, 10));
  sumOfMinuends = sumOfMinuends + extrapolatePrev(line);
});

rl.on("close", () => {
  console.log("sum 2", sumOfMinuends);
});
