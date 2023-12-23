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

function tilt(col: string, direction: "front" | "back"): string {
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
      // front or back, depending on which direction the tilt is.
      const sorted = section.split("").sort((a, b) => {
        if (direction === "front") {
          return a === "O" ? -1 : 1;
        } else {
          return a === "O" ? 1 : -1;
        }
      });
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
  const tiltedCols = cols.map((col) => tilt(col, "front"));
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
console.log(tilt(".O", "front") === "O.");
console.log(tilt(".O", "back") === ".O");
console.log(tilt("OO.O.O..##", "front") === "OOOO....##");
console.log(tilt("OO.O.O..##", "back") === "....OOOO##");
console.log(tilt("...OO#...O", "front") === "OO...#O...");
console.log(tilt("...OO#...O", "back") === "...OO#...O");
console.log(tilt("#.#.O.#.##", "front") === "#.#O..#.##");
console.log(tilt("#.#.O.#.##", "back") === "#.#..O#.##");

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
  console.log("part 1", calculateLoad(tiltedRows));
});

/* --- Part Two ---
The parabolic reflector dish deforms, but not in a way that focuses the beam. To do that, you'll need to move the rocks to the edges of the platform. Fortunately, a button on the side of the control panel labeled "spin cycle" attempts to do just that!

Each cycle tilts the platform four times so that the rounded rocks roll north, then west, then south, then east. After each tilt, the rounded rocks roll as far as they can before the platform tilts in the next direction. After one cycle, the platform will have finished rolling the rounded rocks in those four directions in that order.

Here's what happens in the example above after each of the first few cycles:

After 1 cycle:
.....#....
....#...O#
...OO##...
.OO#......
.....OOO#.
.O#...O#.#
....O#....
......OOOO
#...O###..
#..OO#....

After 2 cycles:
.....#....
....#...O#
.....##...
..O#......
.....OOO#.
.O#...O#.#
....O#...O
.......OOO
#..OO###..
#.OOO#...O

After 3 cycles:
.....#....
....#...O#
.....##...
..O#......
.....OOO#.
.O#...O#.#
....O#...O
.......OOO
#...O###.O
#.OOO#...O
This process should work if you leave it running long enough, but you're still worried about the north support beams. To make sure they'll survive for a while, you need to calculate the total load on the north support beams after 1000000000 cycles.

In the above example, after 1000000000 cycles, the total load on the north support beams is 64.

Run the spin cycle for 1000000000 cycles. Afterward, what is the total load on the north support beams? */

function tiltNorth(col: string): string {
  return tilt(col, "front");
}

function tiltSouth(col: string): string {
  return tilt(col, "back");
}

function tiltWest(row: string): string {
  return tilt(row, "front");
}

function tiltEast(row: string): string {
  return tilt(row, "back");
}

// Helper function which runs a single cycle (tilt N, tilt W, tilt S, tilt E) on a list of
// platform rows and returns the resultant list of rows. Input and output are stored in
// the cycle cache.
function spinCycle(rows: string[], cycleNumber: number): string[] {
  // Each cycle tilts the platform four times so that the rounded rocks roll north, then
  // west, then south, then east.

  // First split the platform into cols.
  const cols: string[] = [];
  let rowIndex = 0;
  while (rowIndex < rows[0]!.length) {
    cols.push(rows.map((row) => row[rowIndex]!).join(""));
    rowIndex = rowIndex + 1;
  }

  // Then tilt each column north.
  let tiltedCols = cols.map(tiltNorth);

  // Then put them back into rows.
  let tiltedRows: string[] = [];
  let colIndex = 0;
  while (colIndex < tiltedCols[0]!.length) {
    tiltedRows.push(tiltedCols.map((col) => col[colIndex]!).join(""));
    colIndex = colIndex + 1;
  }

  // console.log("\nTILTED NORTH\n\n", tiltedRows.join("\n "));

  // Then tilt each column west.
  tiltedRows = tiltedRows.map(tiltWest);

  // console.log("\nTILTED WEST\n\n", tiltedRows.join("\n "));

  // Then put them back into columns.
  tiltedCols = [];
  rowIndex = 0;
  while (rowIndex < tiltedRows[0]!.length) {
    tiltedCols.push(tiltedRows.map((row) => row[rowIndex]!).join(""));
    rowIndex = rowIndex + 1;
  }

  // Then tilt each column south.
  tiltedCols = tiltedCols.map(tiltSouth);

  // Then put them back into rows.
  tiltedRows = [];
  colIndex = 0;
  while (colIndex < tiltedCols[0]!.length) {
    tiltedRows.push(tiltedCols.map((col) => col[colIndex]!).join(""));
    colIndex = colIndex + 1;
  }

  // console.log("\nTILTED SOUTH\n\n", tiltedRows.join("\n "));

  // Finally, tilt each row east.
  tiltedRows = tiltedRows.map(tiltEast);

  return tiltedRows;
}

const TEST_SPIN_CYCLE_PLATFORM = `.....#....
....#...O#
...OO##...
.OO#......
.....OOO#.
.O#...O#.#
....O#....
......OOOO
#...O###..
#..OO#....`;

console.log(
  spinCycle(TEST_PLATFORM.split(/\n/), 1).join("\n") ===
    TEST_SPIN_CYCLE_PLATFORM
);

function runCycles(platform: string, numberOfCycles: number): string {
  const cycleCache: Record<string, string> = {};

  // We'll start by running cycles as many times as it takes to get our first cache hit.
  let cycleNumber = 1;
  let rows = platform.split(/\n/);
  let cacheKey = platform;
  while (cycleNumber <= numberOfCycles && cycleCache[cacheKey] === undefined) {
    // Perform spin cycle.
    rows = spinCycle(rows, cycleNumber);

    // Cache our result.
    const newPlatform = rows.join("\n");
    cycleCache[cacheKey] = newPlatform;

    // Prepare to run a new cycle on our new platform state.
    cycleNumber = cycleNumber + 1;
    cacheKey = newPlatform;
  }

  console.log("hit cache", cycleNumber);

  // Once we find our first cache hit, record where we are. We want to look for a
  // meta-cycle; in other words, how many additional spin cycles will it take for us to
  // reach this platform layout again?
  const metaCycleStart = cycleNumber;
  // We also want to record the platform layout after each step of the meta-cycle, so that
  // we can extrapolate out to figure out where N spin cycles would land.
  const metaCycleStartPlatform = cycleCache[cacheKey]!;
  const metaCycleSteps: string[] = [];

  // Now keep running the spin cycles until we encounter this platform layout again.
  while (
    cycleNumber <= numberOfCycles &&
    (cycleNumber === metaCycleStart ||
      cycleCache[cacheKey] !== metaCycleStartPlatform)
  ) {
    // Check for a cached result to reuse.
    const nextCacheEntry = cycleCache[cacheKey];
    if (nextCacheEntry !== undefined) {
      rows = nextCacheEntry.split(/\n/);
    } else {
      // Otherwise, just perform spin cycle again and cache the result.
      rows = spinCycle(rows, cycleNumber);
      // Cache our result.
      cycleCache[cacheKey] = rows.join("\n");
    }

    cycleNumber = cycleNumber + 1;
    cacheKey = rows.join("\n");
    // Record the result after running this spin cycle in the meta cycle.
    metaCycleSteps.push(cacheKey);
  }

  console.log("encountered first step again", cycleNumber);

  // Once we encounter the same platform again, we know how long the meta-cycle spans.
  const metaCycleLength = cycleNumber - metaCycleStart;

  // Now count up how many total cycles are remaining.
  const remainingCycles = numberOfCycles - cycleNumber;
  // The remainder if we divided this into the length of our meta cycle tells us the index
  // of the meta cycle of the platform layout we would end up on.
  const metaCycleIndex = remainingCycles % metaCycleLength;

  // For debugging; verifies that if we manually keep spin-cycling, we'll still arrive at
  // the same conclusion.
  // while (cycleNumber <= numberOfCycles) {
  //   // Check for a cached result to reuse.
  //   const nextCacheEntry = cycleCache[cacheKey];
  //   if (nextCacheEntry !== undefined) {
  //     if (nextCacheEntry === metaCycleStartPlatform) {
  //       console.log("cycle", cycleNumber, "found starting entry AGAIN!");
  //     }
  //     rows = nextCacheEntry.split(/\n/);
  //   } else {
  //     // Otherwise, just perform spin cycle again and cache the result.
  //     rows = spinCycle(rows, cycleNumber);
  //     // Cache our result.
  //     cycleCache[cacheKey] = rows.join("\n");
  //   }

  //   cycleNumber = cycleNumber + 1;
  //   cacheKey = rows.join("\n");
  // }

  // if (metaCycleSteps[metaCycleIndex] !== cacheKey) {
  //   throw new Error("DEBUGGING: brute force did not match extrapolation");
  // }

  return metaCycleSteps[metaCycleIndex]!;
}

console.log(runCycles(TEST_PLATFORM, 60));

// Now try for our actual platform.
fs.readFile("./2023/14.txt", (err, rawFile) => {
  if (err) throw err;

  const endPlatform = runCycles(rawFile.toString(), 1000000);
  console.log("part 2", calculateLoad(endPlatform.split(/\n/)));
});
