/* --- Day 22: Sand Slabs ---
Enough sand has fallen; it can finally filter water for Snow Island.

Well, almost.

The sand has been falling as large compacted bricks of sand, piling up to form an
impressive stack here near the edge of Island Island. In order to make use of the sand to
filter water, some of the bricks will need to be broken apart - nay, disintegrated - back
into freely flowing sand.

The stack is tall enough that you'll have to be careful about choosing which bricks to
disintegrate; if you disintegrate the wrong brick, large portions of the stack could
topple, which sounds pretty dangerous.

The Elves responsible for water filtering operations took a snapshot of the bricks while
they were still falling (your puzzle input) which should let you work out which bricks are
safe to disintegrate. For example:

1,0,1~1,2,1
0,0,2~2,0,2
0,2,3~2,2,3
0,0,4~0,2,4
2,0,5~2,2,5
0,1,6~2,1,6
1,1,8~1,1,9

Each line of text in the snapshot represents the position of a single brick at the time
the snapshot was taken. The position is given as two x,y,z coordinates - one for each end
of the brick - separated by a tilde (~). Each brick is made up of a single straight line
of cubes, and the Elves were even careful to choose a time for the snapshot that had all
of the free-falling bricks at integer positions above the ground, so the whole snapshot is
aligned to a three-dimensional cube grid.

A line like 2,2,2~2,2,2 means that both ends of the brick are at the same coordinate - in
other words, that the brick is a single cube.

Lines like 0,0,10~1,0,10 or 0,0,10~0,1,10 both represent bricks that are two cubes in
volume, both oriented horizontally. The first brick extends in the x direction, while the
second brick extends in the y direction.

A line like 0,0,1~0,0,10 represents a ten-cube brick which is oriented vertically. One end
of the brick is the cube located at 0,0,1, while the other end of the brick is located
directly above it at 0,0,10.

The ground is at z=0 and is perfectly flat; the lowest z value a brick can have is
therefore 1. So, 5,5,1~5,6,1 and 0,2,1~0,2,5 are both resting on the ground, but
3,3,2~3,3,3 was above the ground at the time of the snapshot.

Because the snapshot was taken while the bricks were still falling, some bricks will still
be in the air; you'll need to start by figuring out where they will end up. Bricks are
magically stabilized, so they never rotate, even in weird situations like where a long
horizontal brick is only supported on one end. Two bricks cannot occupy the same position,
so a falling brick will come to rest upon the first other brick it encounters.

Here is the same example again, this time with each brick given a letter so it can be
marked in diagrams:

1,0,1~1,2,1   <- A
0,0,2~2,0,2   <- B
0,2,3~2,2,3   <- C
0,0,4~0,2,4   <- D
2,0,5~2,2,5   <- E
0,1,6~2,1,6   <- F
1,1,8~1,1,9   <- G

At the time of the snapshot, from the side so the x axis goes left to right, these bricks
are arranged like this:

 x
012
.G. 9
.G. 8
... 7
FFF 6
..E 5 z
D.. 4
CCC 3
BBB 2
.A. 1
--- 0

Rotating the perspective 90 degrees so the y axis now goes left to right, the same bricks
are arranged like this:

 y
012
.G. 9
.G. 8
... 7
.F. 6
EEE 5 z
DDD 4
..C 3
B.. 2
AAA 1
--- 0

Once all of the bricks fall downward as far as they can go, the stack looks like this,
where ? means bricks are hidden behind other bricks at that location:

 x
012
.G. 6
.G. 5
FFF 4
D.E 3 z
??? 2
.A. 1
--- 0

Again from the side:

 y
012
.G. 6
.G. 5
.F. 4
??? 3 z
B.C 2
AAA 1
--- 0

Now that all of the bricks have settled, it becomes easier to tell which bricks are
supporting which other bricks:

- Brick A is the only brick supporting bricks B and C.
- Brick B is one of two bricks supporting brick D and brick E.
- Brick C is the other brick supporting brick D and brick E.
- Brick D supports brick F.
- Brick E also supports brick F.
- Brick F supports brick G.
- Brick G isn't supporting any bricks.

Your first task is to figure out which bricks are safe to disintegrate. A brick can be
safely disintegrated if, after removing it, no other bricks would fall further directly
downward. Don't actually disintegrate any bricks - just determine what would happen if,
for each brick, only that brick were disintegrated. Bricks can be disintegrated even if
they're completely surrounded by other bricks; you can squeeze between bricks if you need
to.

In this example, the bricks can be disintegrated as follows:

- Brick A cannot be disintegrated safely; if it were disintegrated, bricks B and C would
  both fall.
- Brick B can be disintegrated; the bricks above it (D and E) would still be supported by
  brick C.
- Brick C can be disintegrated; the bricks above it (D and E) would still be supported by
  brick B.
- Brick D can be disintegrated; the brick above it (F) would still be supported by brick
  E.
- Brick E can be disintegrated; the brick above it (F) would still be supported by brick
  D.
- Brick F cannot be disintegrated; the brick above it (G) would fall.
- Brick G can be disintegrated; it does not support any other bricks.

So, in this example, 5 bricks can be safely disintegrated.

Figure how the blocks will settle based on the snapshot. Once they've settled, consider
disintegrating a single brick; how many bricks could be safely chosen as the one to get
disintegrated? */

type Coordinate = {
  x: number;
  y: number;
  z: number;
};

type BrickIndex = number;

type Brick = {
  // The original index where the brick occurred in the input file.
  index: BrickIndex;
  start: Coordinate;
  end: Coordinate;
};

type BrickSupportInfo = Record<
  BrickIndex,
  {
    // How many bricks support this brick.
    supportedBy: number;
    // Which bricks this brick supports.
    supports: BrickIndex[];
  }
>;

function playTetris(unsortedBricks: Brick[]): BrickSupportInfo {
  // Start by sorting the bricks from furthest-to-the-ground to closest-from-the-ground (z
  // starting coordinate).
  const bricks = unsortedBricks.sort((b1, b2) => {
    return b1.start.z < b2.start.z ? 1 : -1;
  });

  // Now work from bottom to top, dropping bricks lower as necessary until they land on
  // another brick or the ground.

  const brickSupportInfo: BrickSupportInfo = {};

  // How many bricks directly support brick with given index.
  const numberOfSupportsPerBrick: Record<BrickIndex, number> = {};

  // Which bricks does a brick with a given index directly support?
  const bricksSupportedByBrick: Record<BrickIndex, BrickIndex[]> = {};

  // As we play tetris, record what level bricks land on so that we can easily check
  // subsequent bricks at higher levels.
  const landedBricksPerZLevel: Record<number, Brick[]> = {};

  while (bricks.length) {
    // Take the next brick.
    const nextBrick = bricks.pop()!;
    // Initialize this brick's support info
    brickSupportInfo[nextBrick.index] = {
      supportedBy: 0,
      supports: [],
    };

    // Look at its start z (z0).
    const startZ = nextBrick.start.z;

    // Using our end-z-indexed list of bricks, look from z0-1 down to the ground until we
    // encounter a brick whose x-y coordinates intersects our current brick. This tells us
    // the level (or ground) the brick will fall to.
    let levelToCheck = startZ - 1;
    // We'll keep moving down levels until we either hit a level with bricks that could
    // support this one, at which point we'll manually break. If we exit because we hit
    // the ground, we'll handle that after the loop concludes.
    while (levelToCheck > 0) {
      console.log;
      // Check the next level for bricks.
      const bricksAtLevel = landedBricksPerZLevel[levelToCheck];
      // If there are no bricks recorded at this level, initialize it to an empty array to make it easier to update in the future.
      if (!bricksAtLevel) {
        landedBricksPerZLevel[levelToCheck] = [];
      }
      // If there are bricks here, check each of them to see if they intersect.
      if (bricksAtLevel?.length) {
        let foundIntersection = false;
        for (const brickAtLevel of bricksAtLevel) {
          if (intersects(nextBrick, brickAtLevel)) {
            foundIntersection = true;
            // Record that that brick supports this one.
            brickSupportInfo[brickAtLevel.index]!.supports.push(
              nextBrick.index
            );
            // Add 1 to number of bricks that this brick is supported by
            brickSupportInfo[nextBrick.index]!.supportedBy++;
          }
        }
        if (foundIntersection) {
          // Move this brick to sit at the next level up
          const height = nextBrick.end.z - nextBrick.start.z;
          nextBrick.start.z = levelToCheck + 1;
          const endZ = levelToCheck + 1 + height;
          nextBrick.end.z = endZ;
          // Add it to the map of bricks whose top surface is at that level.
          landedBricksPerZLevel[endZ] = [
            ...(landedBricksPerZLevel[endZ] || []),
            nextBrick,
          ];
          // We don't need to check any further levels down.
          break;
        }
      }

      levelToCheck = levelToCheck - 1;
    }
    // If we reached the ground
    if (levelToCheck === 0) {
      // Just move the brick to the ground and be done with it.
      const height = nextBrick.end.z - nextBrick.start.z;
      nextBrick.start.z = 1;
      nextBrick.end.z = height + 1;
      landedBricksPerZLevel[height + 1] = [
        ...(landedBricksPerZLevel[height + 1] || []),
        nextBrick,
      ];
    }
  }

  return brickSupportInfo;
}

function countDisintegratable(brickSupportInfo: BrickSupportInfo): number {
  let numberDisintegratable = 0;
  for (const brickIndex in brickSupportInfo) {
    const { supports } = brickSupportInfo[brickIndex]!;
    // A brick can only be disintegrated if, for every brick it supports, that brick it
    // supported by at least 2 bricks total (e.g. this brick and at least one other)
    const supportsWithoutAnyOtherSupport = supports.filter((supportedIndex) => {
      const { supportedBy } = brickSupportInfo[supportedIndex]!;
      // Keep it if it's only supported by 1 brick; that means we can't disintegrate the
      // brick we were checking.
      return supportedBy === 1;
    });
    // If any bricks are solely supported by this one, it can't be disintegrated. Otherwise, we're good!
    if (!supportsWithoutAnyOtherSupport.length) {
      numberDisintegratable = numberDisintegratable + 1;
    }
  }

  return numberDisintegratable;
}

// Utility function which takes two bricks as inputs and returns whether or not they would
// intersect in the x and y dimensions if overlaid on the same level.
function intersects(brick1: Brick, brick2: Brick): boolean {
  // Two bricks would intersect if both their x ranges and y ranges intersect.
  return (
    // If they intersect in x dimension
    ((brick2.start.x <= brick1.end.x && brick2.end.x >= brick1.start.x) ||
      (brick1.start.x <= brick2.end.x && brick1.end.x >= brick2.start.x)) &&
    // AND they intersect in y dimension
    ((brick2.start.y <= brick1.end.y && brick2.end.y >= brick1.start.y) ||
      (brick1.start.y <= brick2.end.y && brick1.end.y >= brick2.start.y))
  );
}

function parseBrick(line: string, index: number): Brick {
  const [start, end] = line.split("~");
  if (!start || !end) throw new Error(`Invalid brick format: ${line}`);
  const [x0, y0, z0] = start.split(",").map((num) => parseInt(num, 10));
  const [x1, y1, z1] = end.split(",").map((num) => parseInt(num, 10));

  return {
    index,
    start: { x: x0!, y: y0!, z: z0! },
    end: { x: x1!, y: y1!, z: z1! },
  };
}

// Test case
const testInput = [
  "1,0,1~1,2,1",
  "0,0,2~2,0,2",
  "0,2,3~2,2,3",
  "0,0,4~0,2,4",
  "2,0,5~2,2,5",
  "0,1,6~2,1,6",
  "1,1,8~1,1,9",
];

const testInitialBricks = testInput.map((line, index) =>
  parseBrick(line, index)
);
const testCount = countDisintegratable(playTetris(testInitialBricks));
if (testCount === 5) {
  console.log("✅");
} else {
  console.error("❌, expected 5 disintegratable bricks but got", testCount);
}

import readline from "readline";
import * as fs from "fs";

const rl = readline.createInterface(fs.createReadStream("./2023/22.txt"));

const inputBricks: Brick[] = [];

rl.on("line", (line) => {
  const brick = parseBrick(line, inputBricks.length);
  // We would like to assume that the starting coordinate is always closer to the "origin"
  // (0, 0, 0) than the ending coordinate. Let's validate that before proceeding.
  if (
    brick.start.x > brick.end.x ||
    brick.start.y > brick.end.y ||
    brick.start.z > brick.end.z
  ) {
    throw new Error(`Encountered brick with reversed coordinates: ${line}`);
  }
  inputBricks.push(brick);
});

rl.on("close", () => {
  // Play tetris with the bricks.
  const brickSupportInfo = playTetris(inputBricks);
  // Count how many can be disintegrated.
  const disintegratable = countDisintegratable(brickSupportInfo);
  console.log("Part 1:", disintegratable);
});
