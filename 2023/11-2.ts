/* --- Part Two ---
The galaxies are much older (and thus much farther apart) than the researcher initially estimated.

Now, instead of the expansion you did before, make each empty row or column one million times larger. That is, each empty row should be replaced with 1000000 empty rows, and each empty column should be replaced with 1000000 empty columns.

(In the example above, if each empty row or column were merely 10 times larger, the sum of the shortest paths between every pair of galaxies would be 1030. If each empty row or column were merely 100 times larger, the sum of the shortest paths between every pair of galaxies would be 8410. However, your universe will need to expand far beyond these values.)

Starting with the same initial image, expand the universe according to these new rules, then find the length of the shortest path between every pair of galaxies. What is the sum of these lengths? */

const TEST_UNIVERSE_IMAGE = `...#......
.......#..
#.........
..........
......#...
.#........
.........#
..........
.......#..
#...#.....`;

const TEST_GALAXIES: {
  universe: string;
  expansionSize: number;
  sumShortestPaths: number;
}[] = [
  {
    universe: TEST_UNIVERSE_IMAGE,
    expansionSize: 1,
    sumShortestPaths: 374,
  },
  { universe: TEST_UNIVERSE_IMAGE, expansionSize: 9, sumShortestPaths: 1030 },
  { universe: TEST_UNIVERSE_IMAGE, expansionSize: 99, sumShortestPaths: 8410 },
];

type CompressedCell = { r: number; c: number };
type Row = (string | CompressedCell)[];

// Most of this is copied verbatim from part 1. The modified parts have been marked with
// NOTE: annotations.
function expandUniverse(universe: string[][], expansionSize: number): Row[] {
  if (!universe.length) return universe;
  // NOTE: We're not going to literally represent every expansion in the string. Instead,
  // we'll represent a compressed version. If a row has been expanded because it was
  // empty, instead of being a row of "." characters, it will now be a row of {r:
  // expansionSize + 1, c: 1} objects.
  let newUniverse: Row[] = universe;
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
    const galaxies = row.join("").matchAll(/#/g);
    let next = galaxies.next();
    // If there are no occurrence, we need to expand this row.
    if (next.done) {
      // NOTE: Rather than add new rows, we'll actually replace the elements in this row
      // with a representation of how many rows have been condensed into it.
      const newRow = new Array(row.length).fill({ r: expansionSize + 1, c: 1 });
      newUniverse = newUniverse
        .slice(0, rowIndex)
        .concat([newRow], universe.slice(rowIndex + 1));
    } else {
      // Otherwise, for each galaxy encountered, mark it on our columns record.
      while (next.done !== true) {
        const col = next.value.index!;
        columns[col] = 1;
        next = galaxies.next();
      }
    }
    rowIndex = rowIndex + 1;
  }

  // Now we need to expand again for any columns, based on the columns that we found
  // didn't contain any galaxies. If there aren't any, though, let's bail out early.
  if (Object.values(columns).indexOf(1) === -1) {
    return newUniverse;
  }

  // Otherwise, we'll go one row at a time, so that we only need to modify a row once,
  // rather than as many times as there are empty columns.
  rowIndex = 0;
  while (rowIndex < newUniverse.length) {
    let row = newUniverse[rowIndex]!;
    let colIndex = 0;
    while (colIndex < row.length) {
      // If we found that the column was empty...
      if (columns[colIndex] === 0) {
        const cell = row[colIndex]!;
        // NOTE: Create a new compressed cell, or update the existing one, to capture the number
        // of columns expanded.
        const newCell =
          typeof cell === "string"
            ? { r: 1, c: expansionSize + 1 }
            : { r: cell.r, c: expansionSize + 1 };
        // And insert that new cell in place of the existing one.
        row = row
          .slice(0, colIndex)
          .concat(newCell)
          .concat(row.slice(colIndex + 1));
        newUniverse[rowIndex] = row;
      }
      // Otherwise, there's nothing to do in this column; move onto the next one.
      colIndex = colIndex + 1;
    }
    rowIndex = rowIndex + 1;
  }

  return newUniverse;
}

function countShortestPaths(universe: Row[]): Record<number, number[]> {
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

// Almost identical to part 1, except now this helper function returns the *virtual*
// coordinates (uncompressed row, uncompressed column) of each galaxy in the universe.
// Technically this is repeating work from the expansion step and could probably be used
// in that function, too, if refactored, but I didn't realize both steps needed this
// earlier, so whoops!
function findGalaxies(universe: Row[]): [row: number, column: number][] {
  const coordinates: [row: number, column: number][] = [];

  let rowIndex = 0;
  // We also need to track the virtual row index, i.e. the index we would be at if
  // all the compressed empty rows were expanded.
  let virtualRowIndex = 0;
  while (rowIndex < universe.length) {
    const row = universe[rowIndex]!;
    let colIndex = 0;
    // We also need to track the virtual column index, i.e. the index we would be at if
    // all the compressed empty columns were expanded.
    let virtualColIndex = 0;
    while (colIndex < row.length) {
      const cell = row[colIndex]!;
      if (cell === "#") {
        // When we encounter a galaxy, add it's virtual coordinates, so that we can
        // calculate distances appropriately.
        coordinates.push([virtualRowIndex, virtualColIndex]);
      }
      colIndex = colIndex + 1;
      // Update the virtual column index: add 1 if it's a normal (uncompressed) column, or
      // else add the count of columns represented by it.
      virtualColIndex =
        typeof cell === "string"
          ? virtualColIndex + 1
          : virtualColIndex + cell.c;
    }
    rowIndex = rowIndex + 1;
    // Update the virtual row index: add 1 if it's a normal (uncompressed) row, or else
    // add the count of rows represented by it. Since a row should all have the same level
    // of row expansion, it doesn't matter which cell we look at.
    virtualRowIndex =
      typeof row[0]! === "string"
        ? virtualRowIndex + 1
        : virtualRowIndex + row[0]!.r;
  }

  return coordinates;
}

// Test cases
for (const { universe, sumShortestPaths, expansionSize } of TEST_GALAXIES) {
  const universeArr = universe.split(/\n/).map((row) => row.split(""));
  const expanded = expandUniverse(universeArr, expansionSize);
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
  const universe = rawFile
    .toString()
    .split(/\n/)
    .map((row) => row.split(""));
  const expanded = expandUniverse(universe, 999999);
  const shortedPaths = countShortestPaths(expanded);
  const sum = Object.values(shortedPaths).reduce(
    (sum, paths) =>
      sum + paths.reduce((sumFromOne, path) => sumFromOne + path, 0),
    0
  );
  console.log(sum);
});
