/* --- Day 1: Trebuchet?! ---
Something is wrong with global snow production, and you've been selected to take a look. The Elves have even given you a map; on it, they've used stars to mark the top fifty locations that are likely to be having problems.

You've been doing this long enough to know that to restore snow operations, you need to check all fifty stars by December 25th.

Collect stars by solving puzzles. Two puzzles will be made available on each day in the Advent calendar; the second puzzle is unlocked when you complete the first. Each puzzle grants one star. Good luck!

You try to ask why they can't just use a weather machine ("not powerful enough") and where they're even sending you ("the sky") and why your map looks mostly blank ("you sure ask a lot of questions") and hang on did you just say the sky ("of course, where do you think snow comes from") when you realize that the Elves are already loading you into a trebuchet ("please hold still, we need to strap you in").

As they're making the final adjustments, they discover that their calibration document (your puzzle input) has been amended by a very young Elf who was apparently just excited to show off her art skills. Consequently, the Elves are having trouble reading the values on the document.

The newly-improved calibration document consists of lines of text; each line originally contained a specific calibration value that the Elves now need to recover. On each line, the calibration value can be found by combining the first digit and the last digit (in that order) to form a single two-digit number.

For example:

1abc2
pqr3stu8vwx
a1b2c3d4e5f
treb7uchet
In this example, the calibration values of these four lines are 12, 38, 15, and 77. Adding these together produces 142.

Consider your entire calibration document. What is the sum of all of the calibration values? */

function getCalibrationValue(line: string): number {
  // Get all digit characters from the line.
  const matches = line.match(new RegExp("\\d", "g"));
  // Make sure there's at least one match.
  if (!matches || matches.length < 1) {
    throw new Error(`Found no digits in the following line: ${line}`);
  }
  // Take the first and last matches. If there's only one, these will be the same value.
  const first = matches[0];
  const last = matches[matches.length - 1];
  // Concatenate the digit strings together and parse an integer from them.
  return parseInt(first + last, 10);
}

const CALIBRATION_TEST_CASES: [line: string, value: number][] = [
  ["1abc2", 12],
  ["pqr3stu8vwx", 38],
  ["a1b2c3d4e5f", 15],
  ["treb7uchet", 77],
];

for (const [line, value] of CALIBRATION_TEST_CASES) {
  const result = getCalibrationValue(line);
  if (value !== result) {
    console.error("❌, expected", value, "but got", result);
  } else {
    console.log("✅");
  }
}

// Now let's try with our actual calibration document.
import * as readline from "readline";
import * as fs from "fs";

const rl = readline.createInterface({
  input: fs.createReadStream("./2023/1.txt"),
});

// Keep track of the sum of all calibration values.
let sum = 0;
rl.on("line", (line: string) => {
  const value = getCalibrationValue(line);
  sum = sum + value;
});

rl.on("close", () => {
  console.log("Sum:", sum);
});

/* --- Part Two ---
Your calculation isn't quite right. It looks like some of the digits are actually spelled out with letters: one, two, three, four, five, six, seven, eight, and nine also count as valid "digits".

Equipped with this new information, you now need to find the real first and last digit on each line. For example:

two1nine
eightwothree
abcone2threexyz
xtwone3four
4nineeightseven2
zoneight234
7pqrstsixteen
In this example, the calibration values are 29, 83, 13, 24, 42, 14, and 76. Adding these together produces 281.

What is the sum of all of the calibration values? */

const SPELLED_OUT_DIGITS: Record<string, string> = {
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
};

// NOTE: This version didn't actually work at first because sometimes consecutive
// spelled-out digits share a character, e.g. "oneight", and when using line.match, we'd
// only identify the first one. This is because the regex match "consumes" (=reads into
// the buffer and advances its index to the position right after the currently matched
// character) the characters for the first match ("one"), leaving only a non-match
// ("ight"). The way to fix it is to use a zero-width assertion
// (https://stackoverflow.com/questions/20833295/how-can-i-match-overlapping-strings-with-regex).
// This is incorporated into the solution below.
function getCalibrationValue2(line: string): number {
  // Get all digit characters or spelled out digits from the line. Apparently zero doesn't
  // seem to count, and the values will only be lowercase. NOTE: This was my initial
  // regex. const matches = line.match( new
  // RegExp("(\\d|one|two|three|four|five|six|seven|eight|nine)", "g")
  // );
  // NOTE: This is the regex but with a zero-width assertion. We then have to use
  // line.matchAll and convert to an array instead of line.match.
  const regex = new RegExp(
    "(?=(\\d|one|two|three|four|five|six|seven|eight|nine))",
    "g"
  );
  const matches = Array.from(line.matchAll(regex), (x) => x[1] as string);
  // Make sure there's at least one match.
  if (matches.length < 1) {
    throw new Error(`Found no digits in the following line: ${line}`);
  }
  // Take the first and last matches. If there's only one, these will be the same value.
  let first = matches[0]!;
  let last = matches[matches.length - 1]!;

  // If necessary, convert spelled out digits into their numeric equivalents.
  first = SPELLED_OUT_DIGITS[first] ?? first;
  last = SPELLED_OUT_DIGITS[last] ?? last;

  // Concatenate the digit strings together and parse an integer from them.
  return parseInt(first + last, 10);
}

// This version replaces spelled-out digits with their numeric equivalents before finding
// digits. It does so non-destructively, meaning that for two consecutive spelled-out
// digits that share a character, e.g. "oneight", we will still identify both digits.
function getCalibrationValue3(line: string): number {
  // Replace any spelled-out digits with their numeric equivalents. Apparently zero
  // doesn't seem to count, and the values will only be lowercase.
  let line2 = line
    .replace(/one/g, "o1ne")
    .replace(/two/g, "t2wo")
    .replace(/three/g, "t3hree")
    .replace(/four/g, "f4our")
    .replace(/five/g, "f5ive")
    .replace(/six/g, "s6ix")
    .replace(/seven/g, "s7even")
    .replace(/eight/g, "e8ight")
    .replace(/nine/g, "n9ine");

  // Get all digit characters from the line.
  const matches = line2.match(new RegExp("\\d", "g"));
  // Make sure there's at least one match.
  if (!matches || matches.length < 1) {
    throw new Error(`Found no digits in the following line: ${line2}`);
  }
  // Take the first and last matches. If there's only one, these will be the same value.
  const first = matches[0];
  const last = matches[matches.length - 1];
  // Concatenate the digit strings together and parse an integer from them.
  return parseInt(first + last, 10);
}

const CALIBRATION_TEST_CASES2: [line: string, value: number][] = [
  ["two1nine", 29],
  ["eightwothree", 83],
  ["abcone2threexyz", 13],
  ["xtwone3four", 24],
  ["4nineeightseven2", 42],
  ["zoneight234", 14],
  ["7pqrstsixteen", 76],
  ["99lbqpxzzlbtvkmfrvrnmcxttseven", 97],
  ["q7cnfslbtpkvseven", 77],
  ["6threezlljtzcr1sdjkthree4cx", 64],
  ["21xfxfourmzmqbqp1", 21],
  ["lkdbjd5", 55],
  ["8three27", 87],
  ["21three", 23],
  ["3lqrzdq16", 36],
  ["49threenjdgrmgfnfhcgz", 43],
  // Examples with character overlap
  ["9963onefourthree6oneightq", 98],
  ["6dtklvddhlprphffpnkrksfseventwonek", 61],
];

for (const [line, value] of CALIBRATION_TEST_CASES2) {
  const result = getCalibrationValue2(line);
  if (value !== result) {
    console.error("❌, expected", value, "but got", result);
  } else {
    console.log("✅");
  }
}

// Now read from our actual calibration document again.
const rl2 = readline.createInterface({
  input: fs.createReadStream("./2023/1.txt"),
});

// Keep track of the sum of all calibration values.
let sum2 = 0;
rl2.on("line", (line: string) => {
  const value = getCalibrationValue2(line);
  const value2 = getCalibrationValue3(line);
  // Since my solution didn't initially work, I had a check in the test to compare the two
  // methods. I'm leaving it in here for posterity.
  if (value !== value2) {
    console.log("Mismatch!", line, value, value2);
  }
  sum2 = sum2 + value2;
});

rl2.on("close", () => {
  console.log("Sum:", sum2);
});
