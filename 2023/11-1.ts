/* --- Day 11: Cosmic Expansion ---
You continue following signs for "Hot Springs" and eventually come across an observatory. The Elf within turns out to be a researcher studying cosmic expansion using the giant telescope here.

He doesn't know anything about the missing machine parts; he's only visiting for this research project. However, he confirms that the hot springs are the next-closest area likely to have people; he'll even take you straight there once he's done with today's observation analysis.

Maybe you can help him with the analysis to speed things up?

The researcher has collected a bunch of data and compiled the data into a single giant image (your puzzle input). The image includes empty space (.) and galaxies (#). For example:

...#......
.......#..
#.........
..........
......#...
.#........
.........#
..........
.......#..
#...#.....
The researcher is trying to figure out the sum of the lengths of the shortest path between every pair of galaxies. However, there's a catch: the universe expanded in the time it took the light from those galaxies to reach the observatory.

Due to something involving gravitational effects, only some space expands. In fact, the result is that any rows or columns that contain no galaxies should all actually be twice as big.

In the above example, three columns and two rows contain no galaxies:

   v  v  v
 ...#......
 .......#..
 #.........
>..........<
 ......#...
 .#........
 .........#
>..........<
 .......#..
 #...#.....
   ^  ^  ^
These rows and columns need to be twice as big; the result of cosmic expansion therefore looks like this:

....#........
.........#...
#............
.............
.............
........#....
.#...........
............#
.............
.............
.........#...
#....#.......
Equipped with this expanded universe, the shortest path between every pair of galaxies can be found. It can help to assign every galaxy a unique number:

....1........
.........2...
3............
.............
.............
........4....
.5...........
............6
.............
.............
.........7...
8....9.......
In these 9 galaxies, there are 36 pairs. Only count each pair once; order within the pair doesn't matter. For each pair, find any shortest path between the two galaxies using only steps that move up, down, left, or right exactly one . or # at a time. (The shortest path between two galaxies is allowed to pass through another galaxy.)

For example, here is one of the shortest paths between galaxies 5 and 9:

....1........
.........2...
3............
.............
.............
........4....
.5...........
.##.........6
..##.........
...##........
....##...7...
8....9.......
This path has length 9 because it takes a minimum of nine steps to get from galaxy 5 to galaxy 9 (the eight locations marked # plus the step onto galaxy 9 itself). Here are some other example shortest path lengths:

Between galaxy 1 and galaxy 7: 15
Between galaxy 3 and galaxy 6: 17
Between galaxy 8 and galaxy 9: 5
In this example, after expanding the universe, the sum of the shortest path between all 36 pairs of galaxies is 374.

Expand the universe, then find the length of the shortest path between every pair of galaxies. What is the sum of these lengths? */

const TEST_GALAXIES: { universe: string; sumShortestPaths: number }[] = [
  {
    universe: `...#......
.......#..
#.........
..........
......#...
.#........
.........#
..........
.......#..
#...#.....`,
    sumShortestPaths: 374,
  },
];

function expandUniverse(universe: string[]): string[] {
  if (!universe.length) return universe;
  // To avoid needing to separately iterate through rows and columns, we'll keep an object
  // whose keys are all the column indices and whose values start at 0. We'll mark columns
  // where we found a galaxy by setting them to 1 whenever we encounter one in that
  // column, so that at the end, only the columns that are still 0 are the empty ones that
  // need to be expanded.
  const columns: Record<number, 0 | 1> = new Array(universe[0]!.length)
    .fill(0)
    .reduce((acc, _, index) => {
      acc[index] = 0;
      return acc;
    }, {});

  let rowIndex = 0;
  while (rowIndex < universe.length) {
    const row = universe[rowIndex]!;
    // Find all galaxies in the row.
    const galaxies = row.matchAll(/#/g);
    let next = galaxies.next();
    // If there are no occurrence, we need to expand this row.
    if (next.done) {
      // Since expanded rows are just duplicated, it doesn't matter if it comes first or
      // second. We'll add it after and then increment our row index by one extra to make
      // sure we don't double-count it.
      universe = universe
        .slice(0, rowIndex)
        .concat([row, row])
        .concat(universe.slice(rowIndex + 1));
      rowIndex = rowIndex + 2;
    } else {
      // Otherwise, for each galaxy encountered, mark it on our columns record.
      while (next.done !== true) {
        const col = next.value.index!;
        columns[col] = 1;
        next = galaxies.next();
      }
      rowIndex = rowIndex + 1;
    }
  }

  // Now we need to expand again for any columns, based on the columns that we found
  // didn't contain any galaxies. If there aren't any, though, let's bail out early.
  if (Object.values(columns).indexOf(1) === -1) {
    return universe;
  }

  // Otherwise, we'll go one row at a time, so that we only need to modify a row once,
  // rather than as many times as there are empty columns.
  rowIndex = 0;
  while (rowIndex < universe.length) {
    let row = universe[rowIndex]!;
    // Keep track of how many times we've already expanded; the column indices will go up
    // as we add new columns, so we'll need to compensate.
    let colExpansions = 0;
    let colIndex = 0;
    while (colIndex < row.length) {
      const originalColIndex = colIndex - colExpansions;
      // If we found that the column was empty...
      if (columns[originalColIndex] === 0) {
        // Add an extra "." after it in the row string.
        row = row
          .slice(0, colIndex)
          .concat("..")
          .concat(row.slice(colIndex + 1));
        universe[rowIndex] = row;
        // Increment our column index an extra one, tally another to our total expansions.
        colIndex = colIndex + 2;
        colExpansions = colExpansions + 1;
      } else {
        // Otherwise, there's nothing to do in this column; move onto the next one.
        colIndex = colIndex + 1;
      }
    }
    rowIndex = rowIndex + 1;
  }

  return universe;
}

function countShortestPaths(universe: string[]): Record<number, number[]> {
  const galaxies = findGalaxies(universe);

  // If we treat every galaxy as having an index, i.e. 0 is the first galaxy encountered
  // in natural reading order (top left to bottom right), we'll build a mapping from a
  // galaxy index to an array of the shortest paths to every other galaxy.
  const shortestPaths: Record<number, number[]> = {};

  let galaxyIndex1 = 0;
  // To make sure we only record each pair once, we'll only record the distance between
  // one galaxy and all the ones that come after it. That way when we get to the end, we
  // won't have any others left to pair it with because we'll have already done that one
  // with all the ones that came before it.
  // While there are still pairs left to look at
  while (galaxyIndex1 < galaxies.length - 1) {
    shortestPaths[galaxyIndex1] = [];
    const [row1, col1] = galaxies[galaxyIndex1]!;
    let galaxyIndex2 = galaxyIndex1 + 1;
    while (galaxyIndex2 < galaxies.length) {
      const [row2, col2] = galaxies[galaxyIndex2]!;
      // The galaxies should be arranged in natural reading order, i.e. from top left to
      // bottom right, so row1 <= row2.
      const rowDelta = row2 - row1;
      // The columns could be in any order, so we'll just take the abs value to ensure it's
      // a positive distance.
      const colDelta = Math.abs(col2 - col1);
      shortestPaths[galaxyIndex1]!.push(rowDelta + colDelta);
      galaxyIndex2 = galaxyIndex2 + 1;
    }
    galaxyIndex1 = galaxyIndex1 + 1;
  }

  return shortestPaths;
}

// Helper function which returns the coordinates (row, column) of each galaxy in the
// universe. Technically this is repeating work from the expansion step and could probably
// be used in that function, too, if refactored, but I didn't realize both steps needed
// this earlier, so whoops!
function findGalaxies(universe: string[]): [row: number, column: number][] {
  const coordinates: [row: number, column: number][] = [];

  let rowIndex = 0;
  while (rowIndex < universe.length) {
    const row = universe[rowIndex]!;
    let colIndex = 0;
    while (colIndex < row.length) {
      if (row[colIndex]! === "#") {
        coordinates.push([rowIndex, colIndex]);
      }
      colIndex = colIndex + 1;
    }
    rowIndex = rowIndex + 1;
  }

  return coordinates;
}

// Test cases
for (const { universe, sumShortestPaths } of TEST_GALAXIES) {
  const universeArr = universe.split(/\n/);
  const expanded = expandUniverse(universeArr);
  const shortedPaths = countShortestPaths(expanded);
  const sum = Object.values(shortedPaths).reduce(
    (sum, paths) =>
      sum + paths.reduce((sumFromOne, path) => sumFromOne + path, 0),
    0
  );
  if (sum !== sumShortestPaths) {
    console.error("❌, expected", sumShortestPaths, "but got", sum);
  } else {
    console.log("✅");
  }
}

// Now try for our actual image of the universe
import * as fs from "fs";

fs.readFile("./2023/11.txt", (err, rawFile) => {
  if (err) throw err;
  const universe = rawFile.toString().split(/\n/);
  const expanded = expandUniverse(universe);
  const shortedPaths = countShortestPaths(expanded);
  const sum = Object.values(shortedPaths).reduce(
    (sum, paths) =>
      sum + paths.reduce((sumFromOne, path) => sumFromOne + path, 0),
    0
  );
  console.log(sum);
});
