/* --- Day 10: Pipe Maze ---
You use the hang glider to ride the hot air from Desert Island all the way up to the floating metal island. This island is surprisingly cold and there definitely aren't any thermals to glide on, so you leave your hang glider behind.

You wander around for a while, but you don't find any people or animals. However, you do occasionally find signposts labeled "Hot Springs" pointing in a seemingly consistent direction; maybe you can find someone at the hot springs and ask them where the desert-machine parts are made.

The landscape here is alien; even the flowers and trees are made of metal. As you stop to admire some metal grass, you notice something metallic scurry away in your peripheral vision and jump into a big pipe! It didn't look like any animal you've ever seen; if you want a better look, you'll need to get ahead of it.

Scanning the area, you discover that the entire field you're standing on is densely packed with pipes; it was hard to tell at first because they're the same metallic silver color as the "ground". You make a quick sketch of all of the surface pipes you can see (your puzzle input).

The pipes are arranged in a two-dimensional grid of tiles:

| is a vertical pipe connecting north and south.
- is a horizontal pipe connecting east and west.
L is a 90-degree bend connecting north and east.
J is a 90-degree bend connecting north and west.
7 is a 90-degree bend connecting south and west.
F is a 90-degree bend connecting south and east.
. is ground; there is no pipe in this tile.
S is the starting position of the animal; there is a pipe on this tile, but your sketch doesn't show what shape the pipe has.
Based on the acoustics of the animal's scurrying, you're confident the pipe that contains the animal is one large, continuous loop.

For example, here is a square loop of pipe:

.....
.F-7.
.|.|.
.L-J.
.....
If the animal had entered this loop in the northwest corner, the sketch would instead look like this:

.....
.S-7.
.|.|.
.L-J.
.....
In the above diagram, the S tile is still a 90-degree F bend: you can tell because of how the adjacent pipes connect to it.

Unfortunately, there are also many pipes that aren't connected to the loop! This sketch shows the same loop as above:

-L|F7
7S-7|
L|7||
-L-J|
L|-JF
In the above diagram, you can still figure out which pipes form the main loop: they're the ones connected to S, pipes those pipes connect to, pipes those pipes connect to, and so on. Every pipe in the main loop connects to its two neighbors (including S, which will have exactly two pipes connecting to it, and which is assumed to connect back to those two pipes).

Here is a sketch that contains a slightly more complex main loop:

..F7.
.FJ|.
SJ.L7
|F--J
LJ...
Here's the same example sketch with the extra, non-main-loop pipe tiles also shown:

7-F7-
.FJ|7
SJLL7
|F--J
LJ.LJ
If you want to get out ahead of the animal, you should find the tile in the loop that is farthest from the starting position. Because the animal is in the pipe, it doesn't make sense to measure this by direct distance. Instead, you need to find the tile that would take the longest number of steps along the loop to reach from the starting point - regardless of which way around the loop the animal went.

In the first example with the square loop:

.....
.S-7.
.|.|.
.L-J.
.....
You can count the distance each tile in the loop is from the starting point like this:

.....
.012.
.1.3.
.234.
.....
In this example, the farthest point from the start is 4 steps away.

Here's the more complex loop again:

..F7.
.FJ|.
SJ.L7
|F--J
LJ...
Here are the distances for each tile on that loop:

..45.
.236.
01.78
14567
23...

Find the single giant loop starting at S. How many steps along the loop does it take to get from the starting position to the point farthest from the starting position? */

const TEST_MAZES: {
  maze: string;
  startingPoint: [row: number, column: number];
  farthestSteps: number;
}[] = [
  {
    maze: `.....
.S-7.
.|.|.
.L-J.
.....`,
    startingPoint: [1, 1],
    farthestSteps: 4,
  },
  {
    maze: `-L|F7
7S-7|
L|7||
-L-J|
L|-JF`,
    startingPoint: [1, 1],
    farthestSteps: 4,
  },
  {
    maze: `7-F7-
.FJ|7
SJLL7
|F--J
LJ.LJ`,
    startingPoint: [2, 0],
    farthestSteps: 8,
  },
];

function findStart(maze: string[]): [row: number, column: number] {
  let rowIndex = 0;
  // Iterate over every row
  while (rowIndex < maze.length) {
    const row = maze[rowIndex]!;
    let colIndex = 0;
    // Iterate over every column
    while (colIndex < row.length) {
      // When we find an "S", return the spot we found it
      if (row[colIndex] === "S") {
        return [rowIndex, colIndex];
      }
      colIndex = colIndex + 1;
    }
    rowIndex = rowIndex + 1;
  }
  // If we finish looping over every row and still couldn't find it, there's a problem.
  throw new Error(
    "Could not determine starting position in maze. Are you sure it contains an 'S'?"
  );
}

type Direction = "north" | "south" | "east" | "west";
type Mover = {
  row: number;
  column: number;
  connectsTo: Direction;
};

function traceFarthestSteps(
  maze: string[],
  [startingRow, startingCol]: [row: number, column: number]
): number {
  // First we need to figure out what type of pipe we're sitting on and which directions
  // we start our loop with. From the starting point, look above, below, to the left, and
  // to the right to inspect what type of pipes are there.
  const north = maze[startingRow - 1]?.[startingCol];
  const south = maze[startingRow + 1]?.[startingCol];
  const west = maze[startingRow]![startingCol - 1];
  const east = maze[startingRow]![startingCol + 1];

  // Test which of these pipes connects from our starting pipe by trying to follow where
  // each leads, assuming it came from our starting position.
  const connections: Record<Direction, Direction | null> = {
    north: pipeLeadsTo("south", north),
    south: pipeLeadsTo("north", south),
    west: pipeLeadsTo("east", west),
    east: pipeLeadsTo("west", east),
  };

  // Now let's prepare to start moving through in both directions simultaneously. If we
  // move in both directions at once, the farthest point will happen at the moment both of
  // our movers land on the same pipe again. First, then, we will put both of our movers
  // at the starting position. We'll represent their positions as a `Mover`, which
  // comprises a pair of row/col coordinates and the direction that the mover should move
  // to next by following where the pipe connects to. Iterate over each direction to
  // filter out the ones that don't connect, and convert the connected ones into `Mover`s.
  let [mover1, mover2, ...rest]: Mover[] = (
    Object.entries(connections) as [Direction, Direction | null][]
  )
    .filter(([_, connectsTo]) => connectsTo !== null)
    .map(([dir, _]) => ({
      row: startingRow,
      column: startingCol,
      connectsTo: dir,
    }));

  // There should be exactly 2 ways to go, if it's a single loop.
  if (!mover1 || !mover2 || rest.length) {
    throw new Error(
      "Did not find exactly 2 directions to go from starting point"
    );
  }

  let steps = 0;
  // Until our movers arrive on the same position again, keep tracing a path forward
  // through the maze, counting each step they take.
  while (
    steps === 0 ||
    mover1.row !== mover2.row ||
    mover1.column !== mover2.column
  ) {
    // Move the first mover.
    mover1 = moveMover(maze, mover1);
    // Move the second mover.
    mover2 = moveMover(maze, mover2);
    // Increment our steps.
    steps = steps + 1;
  }

  return steps;
}

// Helper function which returns the new row as a result of moving in a given direction.
function moveRow(row: number, direction: Direction): number {
  return direction === "north"
    ? row - 1
    : direction === "south"
    ? row + 1
    : row;
}

// Helper function which returns the new column as a result of moving in a given direction.
function moveCol(col: number, direction: Direction): number {
  return direction === "west" ? col - 1 : direction === "east" ? col + 1 : col;
}

// Helper function which returns the opposite of a given direction.
function flipDir(direction: Direction): Direction {
  switch (direction) {
    case "north":
      return "south";
    case "south":
      return "north";
    case "west":
      return "east";
    case "east":
      return "west";
  }
}

// Helper function which moves a `Mover` forward one step by following the direction the
// last pipe `connectsTo`, updating the position, and updating the direction the next pipe `connectsTo`.
function moveMover(maze: string[], mover: Mover): Mover {
  let { row, column, connectsTo } = mover;
  // Move the mover's coordinates to the next pipe.
  row = moveRow(row, connectsTo);
  column = moveCol(column, connectsTo);
  // Find the next pipe.
  const nextPipe = maze[row]?.[column];
  if (!nextPipe) {
    throw new Error(`mover 1 moved out of bounds: [${row}, ${column}]`);
  }
  // Check where it connects to. To know which direction we came from, flip the
  // direction we just moved.
  const nextConnectsTo = pipeLeadsTo(flipDir(connectsTo), nextPipe);
  if (!nextConnectsTo) {
    throw new Error(
      `mover 1 could not find a connecting pipe from ${flipDir(
        connectsTo
      )}: [${row}, ${column}]`
    );
  }
  // Return the updated mover
  return {
    row,
    column,
    connectsTo: nextConnectsTo,
  };
}

// Helper function which takes a direction of origin and a pipe character and returns the
// direction that the pipe leads to, or `null` if there is no pipe or the pipe does not
// connect to the origin.
function pipeLeadsTo(
  from: Direction,
  pipe: string | undefined
): Direction | null {
  switch (from) {
    case "north":
      return pipe === "|"
        ? "south"
        : pipe === "L"
        ? "east"
        : pipe === "J"
        ? "west"
        : null;
    case "south":
      return pipe === "|"
        ? "north"
        : pipe === "F"
        ? "east"
        : pipe === "7"
        ? "west"
        : null;
    case "east":
      return pipe === "-"
        ? "west"
        : pipe === "F"
        ? "south"
        : pipe === "L"
        ? "north"
        : null;
    case "west":
      return pipe === "-"
        ? "east"
        : pipe === "7"
        ? "south"
        : pipe === "J"
        ? "north"
        : null;
  }
}

// Test cases
for (const { maze, startingPoint, farthestSteps } of TEST_MAZES) {
  const mazeArr = maze.split(/\n/);
  const [row, column] = findStart(mazeArr);
  if (row !== startingPoint[0] || column !== startingPoint[1]) {
    console.error("❌, expected starting point", startingPoint, "but got", [
      row,
      column,
    ]);
  }

  const resultSteps = traceFarthestSteps(mazeArr, startingPoint);
  if (resultSteps !== farthestSteps) {
    console.error("❌, expected", farthestSteps, "but got", resultSteps);
  } else {
    console.log("✅");
  }
}

// Now try with our real maze sketch.
import * as fs from "fs";

fs.readFile("./2023/10.txt", (err, rawFile) => {
  if (err) throw err;
  const maze = rawFile.toString().split(/\n/);
  const start = findStart(maze);
  const steps = traceFarthestSteps(maze, start);
  console.log(steps);
});
