/* --- Day 21: Step Counter ---
You manage to catch the airship right as it's dropping someone else off on their
all-expenses-paid trip to Desert Island! It even helpfully drops you off near the gardener
and his massive farm.

"You got the sand flowing again! Great work! Now we just need to wait until we have enough
sand to filter the water for Snow Island and we'll have snow again in no time."

While you wait, one of the Elves that works with the gardener heard how good you are at
solving problems and would like your help. He needs to get his steps in for the day, and
so he'd like to know which garden plots he can reach with exactly his remaining 64 steps.

He gives you an up-to-date map (your puzzle input) of his starting position (S), garden
plots (.), and rocks (#). For example:

...........
.....###.#.
.###.##..#.
..#.#...#..
....#.#....
.##..S####.
.##..#...#.
.......##..
.##.#.####.
.##..##.##.
...........

The Elf starts at the starting position (S) which also counts as a garden plot. Then, he
can take one step north, south, east, or west, but only onto tiles that are garden plots.
This would allow him to reach any of the tiles marked O:

...........
.....###.#.
.###.##..#.
..#.#...#..
....#O#....
.##.OS####.
.##..#...#.
.......##..
.##.#.####.
.##..##.##.
...........

Then, he takes a second step. Since at this point he could be at either tile marked O, his
second step would allow him to reach any garden plot that is one step north, south, east,
or west of any tile that he could have reached after the first step:

...........
.....###.#.
.###.##..#.
..#.#O..#..
....#.#....
.##O.O####.
.##.O#...#.
.......##..
.##.#.####.
.##..##.##.
...........

After two steps, he could be at any of the tiles marked O above, including the starting
position (either by going north-then-south or by going west-then-east).

A single third step leads to even more possibilities:

...........
.....###.#.
.###.##..#.
..#.#.O.#..
...O#O#....
.##.OS####.
.##O.#...#.
....O..##..
.##.#.####.
.##..##.##.
...........

He will continue like this until his steps for the day have been exhausted. After a total
of 6 steps, he could reach any of the garden plots marked O:

...........
.....###.#.
.###.##.O#.
.O#O#O.O#..
O.O.#.#.O..
.##O.O####.
.##.O#O..#.
.O.O.O.##..
.##.#.####.
.##O.##.##.
...........

In this example, if the Elf's goal was to get exactly 6 more steps today, he could use
them to reach any of 16 garden plots.

However, the Elf actually needs to get 64 steps today, and the map he's handed you is much
larger than the example map.

Starting from the garden plot marked S on your map, how many garden plots could the Elf
reach in exactly 64 steps? */

// What we immediately notice with the example illustrations above is that the places we
// can reach in 2 steps is the superset of the places we can reach in 0 steps and the
// places we can reach in 2 steps _without backtracking_. Likewise, the number we could
// reach in 3 is the superset of the number reachable in 1 step and the number reachable
// in 3 steps without backtracking. Thus, to find the places we could reach in 64 steps,
// we could build up the set of places we can reach in 2 steps, then 2 steps from that
// without backtracking, then 2 steps from that without backtracking, etc. until we reach
// 64 steps total!

export type Position = { row: number; column: number };
type Direction = "N" | "S" | "E" | "W";

// This function does the main work; it takes as inputs a garden map, starting position,
// and number of steps to follow per path. It then traces all the possible paths through
// from the starting position up to `numberOfSteps` away *without backtracking*, then
// returns the list of positions it reached as well as the updated map with plots that
// were visited marked as "V".
function spotsReachableNoBackTrack(
  gardenMap: string[],
  startingPos: Position,
  numberOfSteps = 2
): [updatedMap: string[], reachablePlots: Position[]] {
  const reachablePlots: Position[] = [];
  // Make a copy of the map so we can update it to mark garden plots as visited.
  let updatedMap = [...gardenMap];

  // We'll only move one step at a time, so we'll keep a queue of partially-followed paths
  // we still have to finish exploring, starting with our inputs.
  const incompletePaths: [currPos: Position, stepsLeft: number][] = [
    [startingPos, numberOfSteps],
  ];

  // While we still have paths left to finish following...
  while (incompletePaths.length) {
    // Take the next incomplete path.
    const [currPos, stepsLeft] = incompletePaths.shift()!;
    // Check what occupies the plot in each cardinal direction.
    for (const direction of ["N", "S", "E", "W"] as const) {
      const { row, column } = move(currPos, direction);
      const plot = updatedMap[row]?.[column];
      // We can only move here if the plot is unvisited garden.
      if (plot === ".") {
        // Update the row on the map to mark that this plot has now been visited.
        updatedMap[row] =
          updatedMap[row]!.slice(0, column) +
          "V" +
          updatedMap[row]!.slice(column + 1);
        // If this is the end of the path (there would be no more steps left), record this
        // as a new reachable position.
        if (stepsLeft - 1 === 0) {
          reachablePlots.push({ row, column });
        } else {
          // Otherwise, add this new position and the remaining steps to the queue to keep following.
          incompletePaths.push([{ row, column }, stepsLeft - 1]);
        }
      }
    }
  }

  return [updatedMap, reachablePlots];
}

// Helper function which takes a starting `Position` and a `Direction` and returns the new
// `Position` that moving one step in that direction would lead to.
function move({ row, column }: Position, direction: Direction): Position {
  switch (direction) {
    case "N":
      return { row: row - 1, column };
    case "S":
      return { row: row + 1, column };
    case "E":
      return { row, column: column + 1 };
    case "W":
      return { row, column: column - 1 };
  }
}

// This function will perform the "outer loop", finding the total set of plots
// reachable in `numberOfSteps` on a garden map with backtracking allowed by combining
// together the plots reachable by non-backtracking paths of every increment of 2 up
// to `numberOfSteps`. It returns the resultant list of all plots reachable.
export function spotsReachable(
  gardenMap: string[],
  startingPos: Position,
  numberOfSteps = 64
): number {
  // If `numberOfSteps` is even, we want to look for plots reachable in even numbers
  // of steps (0, 2, 4...`numberOfSteps`). If `numberOfSteps` is odd, we want to look for
  // plots reachable in odd numbers of steps (1, 3, 5...`numberOfSteps`). Thus, if
  // `numberOfSteps` is even, initially our only reachable plot is the starting
  // position, which we can reach in 0 steps. However, if `numberOfSteps` is odd, we
  // initially look for plots reachable in 1 step.
  let [updatedMap, initialPlotsReachable] =
    numberOfSteps % 2 === 0
      ? [[...gardenMap], [startingPos]]
      : spotsReachableNoBackTrack(gardenMap, startingPos, 1);

  // For debugging, we'll keep all reachable plots in this array. It will start with the
  // initial set we could reach in 0 or 1 steps.
  // const allPlotsReachable: Position[] = [...initialPlotsReachable];
  // For performance reasons, if `returnArray` is false, we'll actually just return the
  // count of plots instead.
  let allPlotsReachableCount: number = initialPlotsReachable.length;

  // We need to track how many steps away we've looked in total, since we'll only follow
  // paths up to 2 away at a time. We start with the appropriate number of steps away for
  // if our `numberOfSteps` was even or odd.
  let totalStepsTraveled = numberOfSteps % 2 === 0 ? 0 : 1;
  // We also need to track the last set of reachable plots, so that we know where to
  // start from when we move 2 more steps forward.
  let lastPlotsReached: Position[] = [...initialPlotsReachable];

  while (totalStepsTraveled < numberOfSteps) {
    // For each plot we were last able to reach, use it as a new starting position and
    // look for the plots reachable 2 more steps away.
    const nextPlotsReachable: Position[] = [];
    for (const position of lastPlotsReached) {
      let plots: Position[];
      [updatedMap, plots] = spotsReachableNoBackTrack(updatedMap, position);
      // Record these plots as reachable.
      // allPlotsReachable.push(...plots);
      allPlotsReachableCount = allPlotsReachableCount + plots.length;
      nextPlotsReachable.push(...plots);
    }
    // Once we've explored 2 steps away for all of `lastPlotsReached`, update our total
    // steps traveled and repeat the process for `nextPlotsReachable`.
    totalStepsTraveled = totalStepsTraveled + 2;
    lastPlotsReached = nextPlotsReachable;
  }

  return allPlotsReachableCount;
}

const TEST_MAP = [
  "...........",
  ".....###.#.",
  ".###.##..#.",
  "..#.#...#..",
  "....#.#....",
  ".##..S####.",
  ".##..#...#.",
  ".......##..",
  ".##.#.####.",
  ".##..##.##.",
  "...........",
];

const testSpotsReachable = spotsReachable(TEST_MAP, { row: 5, column: 5 }, 6);
console.log(
  testSpotsReachable === 16 ? "✅" : "❌, expected 16 but got",
  testSpotsReachable
);

// Now try for our real garden map input.
import * as fs from "fs";

fs.readFile("./2023/21.txt", (err, rawFile) => {
  if (err) throw err;

  const map = rawFile.toString().split("\n");
  // Locate our starting position.
  let startingPos: Position = { row: -1, column: -1 };
  let rowIndex = 0;
  while (rowIndex < map.length) {
    const row = map[rowIndex]!;
    if (row.indexOf("S") !== -1) {
      startingPos = { row: rowIndex, column: row.indexOf("S") };
      break;
    }
    rowIndex = rowIndex + 1;
  }
  if (startingPos.row === -1 || startingPos.column === -1) {
    throw new Error("could not locate starting position in input");
  }

  console.log("part 1:", spotsReachable(map, startingPos));
});
