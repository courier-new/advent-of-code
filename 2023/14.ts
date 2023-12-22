/* --- Day 14: Parabolic Reflector Dish ---
You reach the place where all of the mirrors were pointing: a massive parabolic reflector dish attached to the side of another large mountain.

The dish is made up of many small mirrors, but while the mirrors themselves are roughly in the shape of a parabolic reflector dish, each individual mirror seems to be pointing in slightly the wrong direction. If the dish is meant to focus light, all it's doing right now is sending it in a vague direction.

This system must be what provides the energy for the lava! If you focus the reflector dish, maybe you can go where it's pointing and use the light to fix the lava production.

Upon closer inspection, the individual mirrors each appear to be connected via an elaborate system of ropes and pulleys to a large metal platform below the dish. The platform is covered in large rocks of various shapes. Depending on their position, the weight of the rocks deforms the platform, and the shape of the platform controls which ropes move and ultimately the focus of the dish.

In short: if you move the rocks, you can focus the dish. The platform even has a control panel on the side that lets you tilt it in one of four directions! The rounded rocks (O) will roll when the platform is tilted, while the cube-shaped rocks (#) will stay in place. You note the positions of all of the empty spaces (.) and rocks (your puzzle input). For example:

O....#....
O.OO#....#
.....##...
OO.#O....O
.O.....O#.
O.#..O.#.#
..O..#O..O
.......O..
#....###..
#OO..#....
Start by tilting the lever so all of the rocks will slide north as far as they will go:

OOOO.#.O..
OO..#....#
OO..O##..O
O..#.OO...
........#.
..#....#.#
..O..#.O.O
..O.......
#....###..
#....#....
You notice that the support beams along the north side of the platform are damaged; to ensure the platform doesn't collapse, you should calculate the total load on the north support beams.

The amount of load caused by a single rounded rock (O) is equal to the number of rows from the rock to the south edge of the platform, including the row the rock is on. (Cube-shaped rocks (#) don't contribute to load.) So, the amount of load caused by each rock in each row is as follows:

OOOO.#.O.. 10
OO..#....#  9
OO..O##..O  8
O..#.OO...  7
........#.  6
..#....#.#  5
..O..#.O.O  4
..O.......  3
#....###..  2
#....#....  1
The total load is the sum of the load caused by all of the rounded rocks. In this example, the total load is 136.

Tilt the platform so that the rounded rocks all roll north. Afterward, what is the total load on the north support beams? */

function tiltNorth(col: string): string {
  // We will split the column into slices around each cube rock, which cannot move. Cubes
  // and the north-most edge represent boundaries.
  const sections: string[] = [];
  let nextSection = col;
  while (nextSection.length) {
    // Look for the next cube rock.
    const nextCubeIndex = nextSection.indexOf("#");
    // If we found one...
    if (nextCubeIndex !== -1) {
      // See if there was anything between our last boundary and this next cube rock.
      const section = nextSection.slice(0, nextCubeIndex);
      // If there was, save that as a section.
      if (section.length) sections.push(section);
      // Also push a section just for the cube rock, to preserve its position.
      sections.push("#");
      // Then look at whatever comes after the cube rock.
      nextSection = nextSection.slice(nextCubeIndex + 1);
    } else {
      // Otherwise, everything else can be a single section.
      sections.push(nextSection);
      break;
    }
  }

  // Now we'll individually tilt each section and build up the result.
  let tilted = "";
  // For each section...
  for (const section of sections) {
    // If there's less than 1 rock or empty space in the section, tilting won't change the
    // section, so just add it to the result and be done.
    if (section.length === 1) {
      tilted = tilted.concat(section);
    } else {
      // For every other section, tilting means all the round rocks slide (sort) to the
      // front, and all the empty space ends up (sorts) at the back.
      const sorted = section.split("").sort((a, b) => (a === "O" ? -1 : 1));
      tilted = tilted.concat(...sorted);
    }
  }

  return tilted;
}

function tiltPlatform(platform: string): string[] {
  // Split the platform by rows.
  const rows = platform.split(/\n/);
  // Then by columns.
  const cols: string[] = [];
  let rowIndex = 0;
  while (rowIndex < rows[0]!.length) {
    cols.push(rows.map((row) => row[rowIndex]!).join(""));
    rowIndex = rowIndex + 1;
  }

  // Then tilt each column north.
  const tiltedCols = cols.map(tiltNorth);
  // Then re-join them back to a single string.
  let tiltedRows: string[] = [];
  let colIndex = 0;
  while (colIndex < tiltedCols[0]!.length) {
    tiltedRows.push(tiltedCols.map((col) => col[colIndex]!).join(""));
    colIndex = colIndex + 1;
  }

  return tiltedRows;
}

function calculateLoad(rows: string[]): number {
  let load = 0;
  let rowIndex = 0;
  while (rowIndex < rows.length) {
    // The load for a rock in this row is equal to the number of rows from the rock to the
    // south edge of the platform, including the row the rock is on.
    const loadPerRock = rows.length - rowIndex;
    // Count the number of round rocks in the row.
    let numberRoundRocks = rows[rowIndex]!.match(/O/g)?.length || 0;
    // Add the additional load created by rocks in this row.
    load = load + loadPerRock * numberRoundRocks;
    rowIndex = rowIndex + 1;
  }
  return load;
}

// Test cases
console.log(tiltNorth(".O") === "O.");
console.log(tiltNorth("OO.O.O..##") === "OOOO....##");
console.log(tiltNorth("...OO#...O") === "OO...#O...");
console.log(tiltNorth("#.#..O#.##") === "#.#O..#.##");

const TEST_PLATFORM = `O....#....
O.OO#....#
.....##...
OO.#O....O
.O.....O#.
O.#..O.#.#
..O..#O..O
.......O..
#....###..
#OO..#....`;
const TEST_TILTED_PLATFORM = `OOOO.#.O..
OO..#....#
OO..O##..O
O..#.OO...
........#.
..#....#.#
..O..#.O.O
..O.......
#....###..
#....#....`;

console.log(tiltPlatform(TEST_PLATFORM).join("\n") === TEST_TILTED_PLATFORM);
console.log(calculateLoad(tiltPlatform(TEST_PLATFORM)) === 136);

// Now try for our actual platform.
import * as fs from "fs";

fs.readFile("./2023/14.txt", (err, rawFile) => {
  if (err) throw err;

  const tiltedRows = tiltPlatform(rawFile.toString());
  console.log(calculateLoad(tiltedRows));
});
