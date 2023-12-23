/* --- Day 16: The Floor Will Be Lava ---
With the beam of light completely focused somewhere, the reindeer leads you deeper still into the Lava Production Facility. At some point, you realize that the steel facility walls have been replaced with cave, and the doorways are just cave, and the floor is cave, and you're pretty sure this is actually just a giant cave.

Finally, as you approach what must be the heart of the mountain, you see a bright light in a cavern up ahead. There, you discover that the beam of light you so carefully focused is emerging from the cavern wall closest to the facility and pouring all of its energy into a contraption on the opposite side.

Upon closer inspection, the contraption appears to be a flat, two-dimensional square grid containing empty space (.), mirrors (/ and \), and splitters (| and -).

The contraption is aligned so that most of the beam bounces around the grid, but each tile on the grid converts some of the beam's light into heat to melt the rock in the cavern.

You note the layout of the contraption (your puzzle input). For example:

.|...\....
|.-.\.....
.....|-...
........|.
..........
.........\
..../.\\..
.-.-/..|..
.|....-|.\
..//.|....
The beam enters in the top-left corner from the left and heading to the right. Then, its behavior depends on what it encounters as it moves:

If the beam encounters empty space (.), it continues in the same direction.
If the beam encounters a mirror (/ or \), the beam is reflected 90 degrees depending on the angle of the mirror. For instance, a rightward-moving beam that encounters a / mirror would continue upward in the mirror's column, while a rightward-moving beam that encounters a \ mirror would continue downward from the mirror's column.
If the beam encounters the pointy end of a splitter (| or -), the beam passes through the splitter as if the splitter were empty space. For instance, a rightward-moving beam that encounters a - splitter would continue in the same direction.
If the beam encounters the flat side of a splitter (| or -), the beam is split into two beams going in each of the two directions the splitter's pointy ends are pointing. For instance, a rightward-moving beam that encounters a | splitter would split into two beams: one that continues upward from the splitter's column and one that continues downward from the splitter's column.
Beams do not interact with other beams; a tile can have many beams passing through it at the same time. A tile is energized if that tile has at least one beam pass through it, reflect in it, or split in it.

In the above example, here is how the beam of light bounces around the contraption:

>|<<<\....
|v-.\^....
.v...|->>>
.v...v^.|.
.v...v^...
.v...v^..\
.v../2\\..
<->-/vv|..
.|<<<2-|.\
.v//.|.v..
Beams are only shown on empty tiles; arrows indicate the direction of the beams. If a tile contains beams moving in multiple directions, the number of distinct directions is shown instead. Here is the same diagram but instead only showing whether a tile is energized (#) or not (.):

######....
.#...#....
.#...#####
.#...##...
.#...##...
.#...##...
.#..####..
########..
.#######..
.#...#.#..
Ultimately, in this example, 46 tiles become energized.

The light isn't energizing enough tiles to produce lava; to debug the contraption, you need to start by analyzing the current situation. With the beam starting in the top-left heading right, how many tiles end up being energized? */

type TileType = "." | "|" | "-" | "/" | "\\";
type Direction = "n" | "s" | "w" | "e";

type Tile = {
  content: TileType;
  // Represents which directions a beam has exited this tile, whenever it passed through
  // it.
  exitsEncountered: Direction[];
};

function isValidTile(char: string): char is TileType {
  return [".", "|", "-", "/", "\\"].includes(char);
}

function buildTileMap(layout: string): Tile[][] {
  const map: Tile[][] = [];

  // Split the layout into rows.
  const rows = layout.split(/\n/);
  for (const row of rows) {
    const mapRow: Tile[] = [];
    // For each tile in the row
    for (const tile of row) {
      if (!isValidTile(tile)) {
        throw new Error(`encountered invalid tile! ${tile}`);
      }
      mapRow.push({ content: tile, exitsEncountered: [] });
    }
    map.push(mapRow);
  }

  return map;
}

type Beam = {
  position: [row: number, column: number];
  headingDirection: Direction;
};

function traverse(map: Tile[][], startingBeam: Beam): [map: Tile[][], number] {
  let totalEnergizedTiles = 0;
  // Keep a stack of all the beams we still have to follow, to track any splits, and start
  // with one beam in the initial beam.
  const beams: Beam[] = [startingBeam];

  while (beams.length) {
    // Pop a beam off the stack.
    const beam = beams.pop()!;

    // Take the next position of the beam.
    let [nextRow, nextCol] = getNextPosition(beam);
    // If it's still in the bounds of the map...
    if (
      nextRow >= 0 &&
      nextCol >= 0 &&
      nextRow < map.length &&
      nextCol < map[0]!.length
    ) {
      const nextTile = map[nextRow]?.[nextCol];
      if (!nextTile) {
        throw new Error(
          `Could not find tile at location row: ${nextRow}, col: ${nextCol}`
        );
      }
      // Check if a beam has already passed through this next position tile.
      if (!nextTile.exitsEncountered.length) {
        // If it hasn't, increment our total energized tiles.
        totalEnergizedTiles = totalEnergizedTiles + 1;
      }
      // Calculate which direction(s) it would head from this next tile.
      const nextDirections: Direction[] = getNextDirection(
        nextTile.content,
        beam.headingDirection
      );

      // Look at each direction.
      for (const nextDirection of nextDirections) {
        // If a beam has not already exited out that direction...
        if (!nextTile.exitsEncountered.includes(nextDirection)) {
          // Record the exit and add the beam to the stack.
          map[nextRow]![nextCol] = {
            ...nextTile,
            exitsEncountered: nextTile.exitsEncountered.concat(nextDirection),
          };
          beams.push({
            position: [nextRow, nextCol],
            headingDirection: nextDirection,
          });
        } // Otherwise, we've already followed this path; ignore the rest of this beam's path.
      }
    } // Otherwise, the beam went off the map; ignore the rest of this beam's path.
  }

  return [map, totalEnergizedTiles];
}

// Helper function which takes a beam's current position and a target direction and
// returns the new position the beam would be at after it followed that direction.
function getNextPosition({
  position: [row, column],
  headingDirection,
}: Beam): [row: number, column: number] {
  switch (headingDirection) {
    case "n":
      return [row - 1, column];
    case "s":
      return [row + 1, column];
    case "e":
      return [row, column + 1];
    case "w":
      return [row, column - 1];
  }
}

// Helper function which looks at the content of a given tile and determines the direction(s)
// a beam would travel out of it, given the direction it was going when it entered the tile.
function getNextDirection(
  tile: TileType,
  entranceDirection: Direction
): Direction[] {
  switch (tile) {
    // If the beam encounters empty space (.), it continues in the same direction.
    case ".":
      return [entranceDirection];
    // If the beam encounters a mirror (/ or \), the beam is reflected 90 degrees
    // depending on the angle of the mirror.
    case "/":
      switch (entranceDirection) {
        case "n":
          return ["e"];
        case "e":
          return ["n"];
        case "s":
          return ["w"];
        case "w":
          return ["s"];
      }
    case "\\":
      switch (entranceDirection) {
        case "n":
          return ["w"];
        case "w":
          return ["n"];
        case "s":
          return ["e"];
        case "e":
          return ["s"];
      }
    case "|":
      switch (entranceDirection) {
        // If the beam encounters the pointy end of a splitter (| or -), the beam passes
        // through the splitter as if the splitter were empty space.
        case "n":
        case "s":
          return [entranceDirection];
        // If the beam encounters the flat side of a splitter (| or -), the beam is split
        // into two beams going in each of the two directions the splitter's pointy ends
        // are pointing.
        case "e":
        case "w":
          return ["n", "s"];
      }
    case "-":
      switch (entranceDirection) {
        // If the beam encounters the pointy end of a splitter (| or -), the beam passes
        // through the splitter as if the splitter were empty space.
        case "w":
        case "e":
          return [entranceDirection];
        // If the beam encounters the flat side of a splitter (| or -), the beam is split
        // into two beams going in each of the two directions the splitter's pointy ends
        // are pointing.
        case "n":
        case "s":
          return ["e", "w"];
      }
  }
}

const TEST_LAYOUT = `.|...\\....
|.-.\\.....
.....|-...
........|.
..........
.........\\
..../.\\\\..
.-.-/..|..
.|....-|.\\
..//.|....`;
// 0.|...\\....
// 1|.-.\\.....
// 2.....|-...
// 3........|.
// 4..........
// 5.........\\
// 6..../.\\\\..
// 7.-.-/..|..
// 8.|....-|.\\
// 9..//.|....
const map = buildTileMap(TEST_LAYOUT);
console.log(
  traverse(map, { position: [0, -1], headingDirection: "e" })[1] === 46
);

// Now try for the real layout
import * as fs from "fs";

fs.readFile("./2023/16.txt", (err, rawFile) => {
  if (err) throw err;
  const map = buildTileMap(rawFile.toString());
  console.log(
    "part 1 total",
    traverse(map, { position: [0, -1], headingDirection: "e" })[1]
  );
});
