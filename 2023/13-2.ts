/* --- Part Two ---
You resume walking through the valley of mirrors and - SMACK! - run directly into one. Hopefully nobody was watching, because that must have been pretty embarrassing.

Upon closer inspection, you discover that every mirror has exactly one smudge: exactly one . or # should be the opposite type.

In each pattern, you'll need to locate and fix the smudge that causes a different reflection line to be valid. (The old reflection line won't necessarily continue being valid after the smudge is fixed.)

Here's the above example again:

#.##..##.
..#.##.#.
##......#
##......#
..#.##.#.
..##..##.
#.#.##.#.

#...##..#
#....#..#
..##..###
#####.##.
#####.##.
..##..###
#....#..#
The first pattern's smudge is in the top-left corner. If the top-left # were instead ., it would have a different, horizontal line of reflection:

1 ..##..##. 1
2 ..#.##.#. 2
3v##......#v3
4^##......#^4
5 ..#.##.#. 5
6 ..##..##. 6
7 #.#.##.#. 7
With the smudge in the top-left corner repaired, a new horizontal line of reflection between rows 3 and 4 now exists. Row 7 has no corresponding reflected row and can be ignored, but every other row matches exactly: row 1 matches row 6, row 2 matches row 5, and row 3 matches row 4.

In the second pattern, the smudge can be fixed by changing the fifth symbol on row 2 from . to #:

1v#...##..#v1
2^#...##..#^2
3 ..##..### 3
4 #####.##. 4
5 #####.##. 5
6 ..##..### 6
7 #....#..# 7
Now, the pattern has a different horizontal line of reflection between rows 1 and 2.

Summarize your notes as before, but instead use the new different reflection lines. In this example, the first pattern's new horizontal line has 3 rows above it and the second pattern's new horizontal line has 1 row above it, summarizing to the value 400.

In each pattern, fix the smudge and find the different line of reflection. What number do you get after summarizing the new reflection line in each pattern in your notes? */

const PATTERN_TEST_CASES: {
  pattern: string;
  reflection: {
    direction: "vertical" | "horizontal";
    between: [rc1: number, rc2: number];
  };
  summarized: number;
}[] = [
  {
    pattern: `#.##..##.
..#.##.#.
##......#
##......#
..#.##.#.
..##..##.
#.#.##.#.`,
    reflection: { direction: "horizontal", between: [2, 3] },
    summarized: 300,
  },
  {
    pattern: `#...##..#
#....#..#
..##..###
#####.##.
#####.##.
..##..###
#....#..#`,
    reflection: { direction: "horizontal", between: [0, 1] },
    summarized: 100,
  },
  {
    pattern: `#.##.##.##.##
#..#.##.#..##
...##..##....
#.#......#.##
.###.#..###..
..##.##.##...
#..#....#..##
##.######.###
#..######..##
####....#####
#..##..##..##
..#......#...
#.#......#.##
#....##....##
####.##.#####`,
    reflection: { direction: "vertical", between: [5, 6] },
    summarized: 6,
  },
];

// Form strings for every column.
// Form strings for every row.
// From l -> r, look for two consecutive matching strings or off-by-one strings.
// When we find them, check if the previous + next pair match or are off-by-one.
// Keep track of if we've needed to use our off-by-one pass.
// Then the previous + next, etc. until we hit one edge of the pattern.
// If we ever need a second off-by-one, or we never used our first one, it's a false alarm
// and keep going l -> r.
function findReflection(
  pattern: string
): ["vertical" | "horizontal", [rc1: number, rc2: number]] {
  // Split the pattern by row.
  const rows = pattern.split(/\n/);
  try {
    // First check rows.
    const [row1, row2] = findReflectionRows(rows);
    return ["horizontal", [row1, row2]];
  } catch (err) {
    // If we couldn't find a reflection point with rows, try columns.
    // Rotate the sketch 90 counter-clockwise and form a row for every column.
    const cols = [];
    let colIndex = 0;
    while (colIndex < rows[0]!.length) {
      // Form an array with all the elements from a given column, then join it back
      // together as a string.
      const col = rows.map((row) => row[colIndex]!).join("");
      cols.push(col);
      colIndex = colIndex + 1;
    }

    // Now we can look for column reflections as if they were rows.
    try {
      const [col1, col2] = findReflectionRows(cols);
      return ["vertical", [col1, col2]];
    } catch (err) {
      throw err;
    }
  }
}

function findReflectionRows(rows: string[]): [row1: number, row2: number] {
  // First, we'll take every pair of consecutive rows and look for matches.
  let topRowIndex = 0;
  while (topRowIndex + 1 < rows.length) {
    const current = rows[topRowIndex]!;
    const current2 = rows[topRowIndex + 1]!;
    // Test if the rows match or are off-by-one.
    const match = matches(current, current2);
    if (match === true || match === "ONE_OFF") {
      // We need to find exactly one smudge. Let's track if we've found a one-off match
      // yet, so that if we ever encounter a second one, or we get to the end and never
      // found any, we disqualify this reflection point.
      let oneOffUsed = match === "ONE_OFF";

      // If we found a one-off match in the very first two columns or the last two
      // columns, there's nothing else to compare so we're done.
      if (
        oneOffUsed &&
        (topRowIndex === 0 || topRowIndex + 1 === rows.length - 1)
      ) {
        return [topRowIndex, topRowIndex + 1];
      }
      // Matching rows indicates maybe we found the mirror point. Let's try to check the
      // previous and next rows to see if they also match or are one-off.
      let prevIndex = topRowIndex - 1;
      let nextIndex = topRowIndex + 2;
      while (prevIndex >= 0 && nextIndex < rows.length) {
        const prev = rows[prevIndex]!;
        const next = rows[nextIndex]!;
        // If we've already used our one-off, we know we should only look for exact
        // matches going forward. Otherwise, one-offs are still valid.
        const prevNextMatch = matches(prev, next, oneOffUsed);
        // If ever they don't match, this isn't actually the mirror point.
        if (prevNextMatch === false) {
          break;
        }
        // If we found our one-off match, make sure we record it.
        if (prevNextMatch === "ONE_OFF") {
          oneOffUsed = true;
        }
        // If we reach either edge without breaking and did use our one-off, this *was*
        // actually the mirror point! Return it.
        if (oneOffUsed && (prevIndex === 0 || nextIndex === rows.length - 1)) {
          return [topRowIndex, topRowIndex + 1];
        }
        prevIndex = prevIndex - 1;
        nextIndex = nextIndex + 1;
      }
    }
    topRowIndex = topRowIndex + 1;
  }
  throw new Error("no reflection point found!");
}

// Helper matches compares two string rows and returns whether or not they are the same.
// If they are only off by a single character, it will return "ONE_OFF" unless the option
// `exactOnly` was true.
function matches(
  row1: string,
  row2: string,
  exactOnly = false
): boolean | "ONE_OFF" {
  if (row1 === row2) {
    return true;
  }

  if (exactOnly) {
    return false;
  }

  // Otherwise, check if the rows only differ by one character.
  let charIndex = 0;
  let smudgeFound = false;
  // Scan each character in order for both rows.
  while (charIndex < row1.length) {
    // If we find a difference...
    if (row1[charIndex]! !== row2[charIndex]!) {
      // If it's not the first time, the rows aren't off by one.
      if (smudgeFound) {
        return false;
      }
      // Otherwise, record that we found our one permitted smudge.
      smudgeFound = true;
    }
    charIndex = charIndex + 1;
  }

  return smudgeFound ? "ONE_OFF" : false;
}

function summarize(
  pattern: string,
  reflection: {
    direction: "vertical" | "horizontal";
    between: [number, number];
  }
): number {
  switch (reflection.direction) {
    case "vertical":
      // Add up the number of columns to the left of each vertical line of reflection.
      const leftIndex = reflection.between[0];
      return pattern.split(/\n/)[0]!.slice(0, leftIndex + 1).length;
    case "horizontal":
      // Add 100 multiplied by the number of rows above each horizontal line of reflection.
      const topIndex = reflection.between[0];
      return pattern.slice(0, topIndex + 1).length * 100;
  }
}

// Test cases
console.log(matches("###", "###") === true);
console.log(matches("###", "###", true) === true);
console.log(matches("###", "###", false) === true);
console.log(matches("###", "##.") === "ONE_OFF");
console.log(matches("..#", ".##") === "ONE_OFF");
console.log(matches("##.", "###") === "ONE_OFF");
console.log(matches("##.", "###", true) === false);
console.log(matches("##.", "###", false) === "ONE_OFF");
console.log(matches("#..", "###") === false);
console.log(matches("...", "###") === false);
for (const { pattern, reflection, summarized } of PATTERN_TEST_CASES) {
  const [direction, between] = findReflection(pattern);
  if (direction !== reflection.direction) {
    console.error(
      "❌, got wrong direction, expected",
      reflection.direction,
      "but got",
      direction
    );
  } else {
    if (
      between[0] !== reflection.between[0] ||
      between[1] !== reflection.between[1]
    ) {
      console.error(
        "❌, got wrong reflection point, expected",
        reflection.between,
        "but got",
        between
      );
    } else {
      const result = summarize(pattern, reflection);
      if (summarized !== result) {
        console.error(
          "❌, got wrong summary, expected",
          summarized,
          "but got",
          result
        );
      } else {
        console.log("✅");
      }
    }
  }
}

// Now let's try for the real sketches!
import * as fs from "fs";

fs.readFile("./2023/13.txt", (err, rawFile) => {
  if (err) throw err;

  // Split the file into individual sketches.
  const sketches = rawFile.toString().split(/\n\n/);
  let sum = 0;
  for (const sketch of sketches) {
    const [direction, between] = findReflection(sketch);
    sum = sum + summarize(sketch, { direction, between });
  }
  console.log(sum);
});
