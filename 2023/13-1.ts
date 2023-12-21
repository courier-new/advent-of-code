/* --- Day 13: Point of Incidence ---
With your help, the hot springs team locates an appropriate spring which launches you neatly and precisely up to the edge of Lava Island.

There's just one problem: you don't see any lava.

You do see a lot of ash and igneous rock; there are even what look like gray mountains scattered around. After a while, you make your way to a nearby cluster of mountains only to discover that the valley between them is completely full of large mirrors. Most of the mirrors seem to be aligned in a consistent way; perhaps you should head in that direction?

As you move through the valley of mirrors, you find that several of them have fallen from the large metal frames keeping them in place. The mirrors are extremely flat and shiny, and many of the fallen mirrors have lodged into the ash at strange angles. Because the terrain is all one color, it's hard to tell where it's safe to walk or where you're about to run into a mirror.

You note down the patterns of ash (.) and rocks (#) that you see as you walk (your puzzle input); perhaps by carefully analyzing these patterns, you can figure out where the mirrors are!

For example:

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
To find the reflection in each pattern, you need to find a perfect reflection across either a horizontal line between two rows or across a vertical line between two columns.

In the first pattern, the reflection is across a vertical line between two columns; arrows on each of the two columns point at the line between the columns:

123456789
    ><   
#.##..##.
..#.##.#.
##......#
##......#
..#.##.#.
..##..##.
#.#.##.#.
    ><   
123456789
In this pattern, the line of reflection is the vertical line between columns 5 and 6. Because the vertical line is not perfectly in the middle of the pattern, part of the pattern (column 1) has nowhere to reflect onto and can be ignored; every other column has a reflected column within the pattern and must match exactly: column 2 matches column 9, column 3 matches 8, 4 matches 7, and 5 matches 6.

The second pattern reflects across a horizontal line instead:

1 #...##..# 1
2 #....#..# 2
3 ..##..### 3
4v#####.##.v4
5^#####.##.^5
6 ..##..### 6
7 #....#..# 7
This pattern reflects across the horizontal line between rows 4 and 5. Row 1 would reflect with a hypothetical row 8, but since that's not in the pattern, row 1 doesn't need to match anything. The remaining rows match: row 2 matches row 7, row 3 matches row 6, and row 4 matches row 5.

To summarize your pattern notes, add up the number of columns to the left of each vertical line of reflection; to that, also add 100 multiplied by the number of rows above each horizontal line of reflection. In the above example, the first pattern's vertical line has 5 columns to its left and the second pattern's horizontal line has 4 rows above it, a total of 405.

Find the line of reflection in each of the patterns in your notes. What number do you get after summarizing all of your notes? */

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
    reflection: { direction: "vertical", between: [4, 5] },
    summarized: 5,
  },
  {
    pattern: `#...##..#
#....#..#
..##..###
#####.##.
#####.##.
..##..###
#....#..#`,
    reflection: { direction: "horizontal", between: [3, 4] },
    summarized: 400,
  },
  {
    pattern: `##
#.
#.
#.
#.`,
    reflection: { direction: "horizontal", between: [2, 3] },
    summarized: 300,
  },
  {
    pattern: `..##.###..###.##.
##..#..#..#..#..#
###..#..##..#.###
##..##########..#
###.####..####.##
..#...#.##.#...#.
##..#.#....#.#..#
..#.##.####.##.#.
..##.########.##.`,
    reflection: { direction: "vertical", between: [0, 1] },
    summarized: 1,
  },
  {
    pattern: `#..###.##.#.#...#
#.##.....#.###.#.
#.##..#.###.#.#.#
##........#..###.
#..##.#.###..#.#.
#..#.#...#....##.
#..#.#...#....##.
#..##.#.###..#.#.
##........#..###.
#.##..#.###.#.#.#
#.##.....#.###.#.
#..###.##...#...#
.##...##..#..##..
####.#...#...##..
..##.#..#..#.#.#.
##.##.#.#..#.#..#
##.##.#.#..#.#..#`,
    reflection: { direction: "horizontal", between: [15, 16] },
    summarized: 1600,
  },
];

// Form strings for every column.
// Form strings for every row.
// From l -> r, look for two consecutive matching strings.
// When we find them, check if the previous + next pair match.
// Then the previous + next, etc. until we hit one edge of the pattern.
// If they ever don't match, it's a false alarm and keep going l -> r.
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
    if (current === current2) {
      // If we find it in the very first two columns or the last two columns, there's
      // nothing else to compare so we're done.
      if (topRowIndex === 0 || topRowIndex + 1 === rows.length - 1) {
        return [topRowIndex, topRowIndex + 1];
      }
      // Matching rows indicates maybe we found the mirror point. Let's try to check the
      // previous and next rows to see if they also match.
      let prevIndex = topRowIndex - 1;
      let nextIndex = topRowIndex + 2;
      while (prevIndex >= 0 && nextIndex < rows.length) {
        const prev = rows[prevIndex];
        const next = rows[nextIndex];
        // If ever they don't match, this isn't actually the mirror point.
        if (prev !== next) {
          break;
        }
        // If we reach either edge without breaking, this *was* actually the mirror
        // point! Return it.
        if (prevIndex === 0 || nextIndex === rows.length - 1) {
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
