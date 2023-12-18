/* --- Part Two ---
You quickly reach the farthest point of the loop, but the animal never emerges. Maybe its nest is within the area enclosed by the loop?

To determine whether it's even worth taking the time to search for such a nest, you should calculate how many tiles are contained within the loop. For example:

...........
.S-------7.
.|F-----7|.
.||.....||.
.||.....||.
.|L-7.F-J|.
.|..|.|..|.
.L--J.L--J.
...........
The above loop encloses merely four tiles - the two pairs of . in the southwest and southeast (marked I below). The middle . tiles (marked O below) are not in the loop. Here is the same loop again with those regions marked:

...........
.S-------7.
.|F-----7|.
.||OOOOO||.
.||OOOOO||.
.|L-7OF-J|.
.|II|O|II|.
.L--JOL--J.
.....O.....
In fact, there doesn't even need to be a full tile path to the outside for tiles to count as outside the loop - squeezing between pipes is also allowed! Here, I is still within the loop and O is still outside the loop:

..........
.S------7.
.|F----7|.
.||OOOO||.
.||OOOO||.
.|L-7F-J|.
.|II||II|.
.L--JL--J.
..........
In both of the above examples, 4 tiles are enclosed by the loop.

Here's a larger example:

.F----7F7F7F7F-7....
.|F--7||||||||FJ....
.||.FJ||||||||L7....
FJL7L7LJLJ||LJ.L-7..
L--J.L7...LJS7F-7L7.
....F-J..F7FJ|L7L7L7
....L7.F7||L7|.L7L7|
.....|FJLJ|FJ|F7|.LJ
....FJL-7.||.||||...
....L---J.LJ.LJLJ...
The above sketch has many random bits of ground, some of which are in the loop (I) and some of which are outside it (O):

OF----7F7F7F7F-7OOOO
O|F--7||||||||FJOOOO
O||OFJ||||||||L7OOOO
FJL7L7LJLJ||LJIL-7OO
L--JOL7IIILJS7F-7L7O
OOOOF-JIIF7FJ|L7L7L7
OOOOL7IF7||L7|IL7L7|
OOOOO|FJLJ|FJ|F7|OLJ
OOOOFJL-7O||O||||OOO
OOOOL---JOLJOLJLJOOO
In this larger example, 8 tiles are enclosed by the loop.

Any tile that isn't part of the main loop can count as being enclosed by the loop. Here's another example with many bits of junk pipe lying around that aren't connected to the main loop at all:

FF7FSF7F7F7F7F7F---7
L|LJ||||||||||||F--J
FL-7LJLJ||||||LJL-77
F--JF--7||LJLJ7F7FJ-
L---JF-JLJ.||-FJLJJ7
|F|F-JF---7F7-L7L|7|
|FFJF7L7F-JF7|JL---7
7-L-JL7||F7|L7F-7F7|
L.L7LFJ|||||FJL7||LJ
L7JLJL-JLJLJL--JLJ.L
Here are just the tiles that are enclosed by the loop marked with I:

FF7FSF7F7F7F7F7F---7
L|LJ||||||||||||F--J
FL-7LJLJ||||||LJL-77
F--JF--7||LJLJIF7FJ-
L---JF-JLJIIIIFJLJJ7
|F|F-JF---7IIIL7L|7|
|FFJF7L7F-JF7IIL---7
7-L-JL7||F7|L7F-7F7|
L.L7LFJ|||||FJL7||LJ
L7JLJL-JLJLJL--JLJ.L
In this last example, 10 tiles are enclosed by the loop.

Figure out whether you have time to search for the nest by calculating the area within the loop. How many tiles are enclosed by the loop? */

import { Direction, findStart, moveMover, pipeLeadsTo } from "./10-1";

// We will start by upscaling our grid so that each tile is now 3x3. For example, take a
// "7" tile. We would upscale it to the following:
//  ___
//  ██_
//  _█_
// Here "_" represents space around a pipe, which can be moved through, and "█" represents
// a pipe pathway itself. We'll initialize an empty 2D array that is 3x the size of our
// input maze and first upscale tiles along the main loop of the maze.
//
// Since any "junk" tile (a pipe that's not part of the main loop) is functionally the
// same as a ground tile for the purposes of counting tiles enclosed by the loop, once
// we've run the course of the main loop and upscaled those, we can just fill in any
// missing tiles as ground tiles, which have space around them on every side. We
// distinguish these tiles as "G" so we can later preserve the number to count up. Both
// "_" and "G" tiles can be moved through. A ground tile looks like this:
// ___
// _G_
// ___
//
// Once we've build the upscaled version of the grid, we can perform flood fill from any
// edge inwards to find every reachable spot that is not enclosed by the loop. We can walk
// over every spot and replace "_" and "G" with "█". Once there are no more spots to fill,
// however many "G"s that are left is our final count. To ensure we can find a place to
// start the flood fill from easily, we'll add a buffer row of pure space (not ground)
// along the top to start from.

const TEST_MAZES: {
  maze: string;
  fullyEnclosedTiles: number;
}[] = [
  {
    maze: `...........
.S-------7.
.|F-----7|.
.||.....||.
.||.....||.
.|L-7.F-J|.
.|..|.|..|.
.L--J.L--J.
...........`,
    fullyEnclosedTiles: 4,
  },
  {
    maze: `...........
.S------7.
.|F----7|.
.||....||.
.||....||.
.|L-7F-J|.
.|..||..|.
.L--JL--J.
...........`,
    fullyEnclosedTiles: 4,
  },
  {
    maze: `S7
LJ`,
    fullyEnclosedTiles: 0,
  },
  {
    maze: `.F----7F7F7F7F-7....
.|F--7||||||||FJ....
.||.FJ||||||||L7....
FJL7L7LJLJ||LJ.L-7..
L--J.L7...LJS7F-7L7.
....F-J..F7FJ|L7L7L7
....L7.F7||L7|.L7L7|
.....|FJLJ|FJ|F7|.LJ
....FJL-7.||.||||...
....L---J.LJ.LJLJ...`,
    fullyEnclosedTiles: 8,
  },
  {
    maze: `FF7FSF7F7F7F7F7F---7
L|LJ||||||||||||F--J
FL-7LJLJ||||||LJL-77
F--JF--7||LJLJ7F7FJ-
L---JF-JLJ.||-FJLJJ7
|F|F-JF---7F7-L7L|7|
|FFJF7L7F-JF7|JL---7
7-L-JL7||F7|L7F-7F7|
L.L7LFJ|||||FJL7||LJ
L7JLJL-JLJLJL--JLJ.L`,
    fullyEnclosedTiles: 10,
  },
];

type PipeType = "-" | "|" | "7" | "F" | "J" | "L";

function countFullyEnclosedTiles(
  maze: string[],
  startingPoint: [row: number, column: number]
): number {
  const grid = traceAndUpscale(maze, startingPoint);

  // Now comes time to flood fill anything accessible from outside of the loop, so that we
  // can tell how many tiles are fully enclosed by whatever doesn't get flood-filled.
  // Starting at the top left, scan the whole grid and replace anything that's reachable
  // with "V" for visited.
  const filledGrid = floodFill(grid, [0, 0], "V");

  // Last of all, count up the number of "G" tiles that remain in the grid.
  return filledGrid.join("").match(/G/g)?.length || 0;
}

// Helper function traces the path of the main loop and returns and upscales the entire
// maze so that each tile is now 3x3. Tiles that are part of the main loop will be
// upscaled to have empty space around them, and tiles that are not part of the main loop
// will all be converted into ground tiles with space around them.
function traceAndUpscale(
  maze: string[],
  [startingRow, startingCol]: [row: number, column: number]
): string[] {
  const grid: string[][] = [];

  // First we need to figure out what type of pipe we're sitting on at and which
  // directions we start our loop with. From the starting point, look above, below, to the
  // left, and to the right to inspect what type of pipes are there.
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

  // We need to replace the "S" at our starting point with the actual pipe underneath it,
  // so that we know how to upscale it. Determine the type based on the connections.
  const startingPipe = getPipeFromConnections(connections);
  // Replace the starting row of our maze with a row which substitutes this actual pipe
  // for the "S".
  maze[startingRow] = maze[startingRow]!.slice(0, startingCol)
    .concat(startingPipe)
    .concat(maze[startingRow]!.slice(startingCol + 1));

  // Find the first valid connection that we can move through, aka the first direction
  // that leads to a non-null other direction.
  const firstDirection: Direction | undefined = (
    Object.keys(connections) as Direction[]
  ).find((dir) => connections[dir] !== null);

  if (!firstDirection) {
    throw new Error(
      "Could not find a valid direction to go from starting point"
    );
  }

  // Put a `Mover` on our starting point and orient them in the direction of the first
  // valid connection; a `Mover` comprises a pair of row/col coordinates and the direction
  // that the mover should move to next by following where the pipe connects to.
  let mover = {
    row: startingRow,
    column: startingCol,
    connectsTo: firstDirection,
  };

  // Until our mover arrives back at the starting point, trace a path forward through the
  // maze and upscale each pipe we move through.
  while (
    grid.length === 0 ||
    mover.row !== startingRow ||
    mover.column !== startingCol
  ) {
    const { row, column } = mover;

    // Upscale the current tile.
    const currentPipe = maze[row]![column]! as PipeType;
    const upscaledPipe = upscaleTile(currentPipe);
    const [upscaledRow1, upscaledRow2, upscaledRow3] = upscaledPipe;

    // Starting at row * 3, column * 3, insert our upscaled pipe into the new grid.
    const firstRow = grid[row * 3] || [];
    firstRow[column * 3] = upscaledRow1![0]!;
    firstRow[column * 3 + 1] = upscaledRow1![1]!;
    firstRow[column * 3 + 2] = upscaledRow1![2]!;
    grid[row * 3] = firstRow;
    const secondRow = grid[row * 3 + 1] || [];
    secondRow[column * 3] = upscaledRow2![0]!;
    secondRow[column * 3 + 1] = upscaledRow2![1]!;
    secondRow[column * 3 + 2] = upscaledRow2![2]!;
    grid[row * 3 + 1] = secondRow;
    const thirdRow = grid[row * 3 + 2] || [];
    thirdRow[column * 3] = upscaledRow3![0]!;
    thirdRow[column * 3 + 1] = upscaledRow3![1]!;
    thirdRow[column * 3 + 2] = upscaledRow3![2]!;
    grid[row * 3 + 2] = thirdRow;

    // Move the mover.
    mover = moveMover(maze, mover);
  }

  // Now that we've upscaled the tiles that are part of our main loop, we need to upscale
  // everything else. Pipe or ground, it doesn't matter what is initially in any other
  // position on the maze; they'll all only be counted if they're fully enclosed. As such,
  // we'll fill in every other tile *as if* it's a ground tile, just so that it's easier
  // to traverse and count them.
  let rowIndex = 0;
  // Our resultant grid should be 3x as big as our starting maze.
  while (rowIndex < maze.length * 3) {
    const row = grid[rowIndex] || [];
    let columnIndex = 0;
    // Each row of our resultant grid should be 3x as long as a row on our starting maze.
    while (columnIndex < maze[0]!.length * 3) {
      const tile = row[columnIndex];
      // If we encounter a tile that has yet to be filled...
      if (!tile) {
        // Insert a 3x3 ground tile.
        const firstRow = grid[rowIndex] || [];
        firstRow[columnIndex] = "_";
        firstRow[columnIndex + 1] = "_";
        firstRow[columnIndex + 2] = "_";
        grid[rowIndex] = firstRow;
        const secondRow = grid[rowIndex + 1] || [];
        secondRow[columnIndex] = "_";
        secondRow[columnIndex + 1] = "G";
        secondRow[columnIndex + 2] = "_";
        grid[rowIndex + 1] = secondRow;
        const thirdRow = grid[rowIndex + 2] || [];
        thirdRow[columnIndex] = "_";
        thirdRow[columnIndex + 1] = "_";
        thirdRow[columnIndex + 2] = "_";
        grid[rowIndex + 2] = thirdRow;
      }
      columnIndex = columnIndex + 3;
    }
    rowIndex = rowIndex + 3;
  }

  // Lastly, "flatten" our grid back to an array of strings now that we no longer need to
  // keep track of empty space, and return it.
  return grid.map((row) => row.join(""));
}

// Helper function which returns the type of pipe a given tile must be given the set of
// valid connections identified from it.
function getPipeFromConnections(
  connections: Record<Direction, Direction | null>
): PipeType {
  if (connections.north && connections.south) {
    return "|";
  } else if (connections.east && connections.west) {
    return "-";
  } else if (connections.north && connections.west) {
    return "J";
  } else if (connections.north && connections.east) {
    return "L";
  } else if (connections.south && connections.west) {
    return "7";
  }
  return "F";
}

// Helper function which converts a tile into its 3x3 counterpart.
function upscaleTile(pipe: PipeType): string[] {
  switch (pipe) {
    case "-":
      return ["___", "███", "___"];
    case "|":
      return ["_█_", "_█_", "_█_"];
    case "7":
      return ["___", "██_", "_█_"];
    case "F":
      return ["___", "_██", "_█_"];
    case "J":
      return ["_█_", "██_", "___"];
    case "L":
      return ["_█_", "_██", "___"];
    default:
      throw new Error(`unknown pipe character encountered: ${pipe}`);
  }
}

// Helper function which performs a basic flood fill algorithm. I initially wrote this
// recursively, but the real maze sketch is so big that the recursive calls exceeded the
// max call stack size in Node. So now it works by adding reachable coordinate positions
// to a stack of positions that need to be filled. While the stack is not empty, it fills
// the value of that position with `valueToFill` and then checks in all 4 cardinal
// directions to see if there are more positions to be filled. An adjacent tile is
// reachable and should be filled if it's not a pipe and does not go beyond the bounds of
// the grid. Finally, it returns the grid after filling all reachable tiles.
function floodFill(
  grid: string[],
  [startingRow, startingColumn]: [startingRow: number, startingColumn: number],
  valueToFill: string
): string[] {
  // Form a stack of positions we need to fill, starting with the initial position.
  const toFill: [number, number][] = [[startingRow, startingColumn]];

  // While we still have positions left to fill...
  while (toFill.length) {
    const [row, column] = toFill.pop()!;
    const currRow = grid[row];
    if (!currRow || column >= currRow.length) {
      throw new Error(
        `could not flood fill from [${row}, ${column}]: starting position is out of bounds`
      );
    }

    // Replace the value at our current position.
    grid[row] = currRow
      .slice(0, column)
      .concat(valueToFill)
      .concat(currRow.slice(column + 1));

    // Add additional positions to fill for all 4 cardinal directions, if they are reachable.
    const up = grid[row - 1]?.[column];
    if (up && up !== valueToFill && up !== "█") {
      toFill.push([row - 1, column]);
    }
    const left = currRow[column - 1];
    if (left && left !== valueToFill && left !== "█") {
      toFill.push([row, column - 1]);
    }
    const down = grid[row + 1]?.[column];
    if (down && down !== valueToFill && down !== "█") {
      toFill.push([row + 1, column]);
    }
    const right = currRow[column + 1];
    if (right && right !== valueToFill && right !== "█") {
      toFill.push([row, column + 1]);
    }
  }

  return grid;
}

// Test cases
for (const { maze, fullyEnclosedTiles } of TEST_MAZES) {
  const mazeArr = maze.split(/\n/);
  const start = findStart(mazeArr);
  const result = countFullyEnclosedTiles(mazeArr, start);
  if (result !== fullyEnclosedTiles) {
    console.error("❌, expected", fullyEnclosedTiles, "but got", result);
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
  const tiles = countFullyEnclosedTiles(maze, start);
  console.log("fully enclosed", tiles);
});
