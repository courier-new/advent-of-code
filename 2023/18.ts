/* --- Day 18: Lavaduct Lagoon ---
Thanks to your efforts, the machine parts factory is one of the first factories up and running since the lavafall came back. However, to catch up with the large backlog of parts requests, the factory will also need a large supply of lava for a while; the Elves have already started creating a large lagoon nearby for this purpose.

However, they aren't sure the lagoon will be big enough; they've asked you to take a look at the dig plan (your puzzle input). For example:

R 6 (#70c710)
D 5 (#0dc571)
L 2 (#5713f0)
D 2 (#d2c081)
R 2 (#59c680)
D 2 (#411b91)
L 5 (#8ceee2)
U 2 (#caa173)
L 1 (#1b58a2)
U 2 (#caa171)
R 2 (#7807d2)
U 3 (#a77fa3)
L 2 (#015232)
U 2 (#7a21e3)

The digger starts in a 1 meter cube hole in the ground. They then dig the specified number of meters up (U), down (D), left (L), or right (R), clearing full 1 meter cubes as they go. The directions are given as seen from above, so if "up" were north, then "right" would be east, and so on. Each trench is also listed with the color that the edge of the trench should be painted as an RGB hexadecimal color code.

When viewed from above, the above example dig plan would result in the following loop of trench (#) having been dug out from otherwise ground-level terrain (.):

#######
#.....#
###...#
..#...#
..#...#
###.###
#...#..
##..###
.#....#
.######

At this point, the trench could contain 38 cubic meters of lava. However, this is just the edge of the lagoon; the next step is to dig out the interior so that it is one meter deep as well:

#######
#######
#######
..#####
..#####
#######
#####..
#######
.######
.######

Now, the lagoon can contain a much more respectable 62 cubic meters of lava. While the interior is dug out, the edges are also painted according to the color codes in the dig plan.

The Elves are concerned the lagoon won't be large enough; if they follow their dig plan, how many cubic meters of lava could it hold? */

const TEST_DIG_PLAN = `R 6 (#70c710)
D 5 (#0dc571)
L 2 (#5713f0)
D 2 (#d2c081)
R 2 (#59c680)
D 2 (#411b91)
L 5 (#8ceee2)
U 2 (#caa173)
L 1 (#1b58a2)
U 2 (#caa171)
R 2 (#7807d2)
U 3 (#a77fa3)
L 2 (#015232)
U 2 (#7a21e3)`;

/**
 * Our dig plan essentially gives us the outline of an arbitrary polygon. While we
 * technically are interested in the volume, since every 1x1 hole they did is also 1 meter
 * deep, volume = area x height = area x 1 = area, so we can effectively ignore the
 * vertical aspect of the problem and just try to solve for our polygon's area.
 *
 * The naive approach would be to follow the dig plan, creating a grid representation with
 * our boundary trench cells marked and summing the area of the boundary trench as we go.
 * Then we could perform a flood fill to identify all of the cells on the interior and
 * exterior of the boundary trench, and sum those on the interior.
 *
 * However, we did something similar for an earlier advent of code problem, and it doesn't
 * scale well due to the need to visit every cell in the grid at least once. So, what are
 * our other options for calculating the area?
 *
 * The Shoelace Formula is one commonly cited method for getting the area of an arbitrary
 * polygon: https://en.wikipedia.org/wiki/Shoelace_formula. It essentially breaks the
 * polygon down into triangles and sums the areas of each of those. In order to do so, it
 * requires an array of consecutive vertex coordinates of the polygon.
 *
 * However, it's unfortunately not trivial to find these coordinates for our trench. This
 * is because the digger doesn't start at a vertex, they start in the middle of a 1x1
 * cell:
 *  -1   0  1
 *     ·——·
 *  0  | x |
 *     ·——·
 *  1
 *
 * In this visual, the vertices are the dots, but the digger ("x") is right in the middle.
 * If we say that the digger starts at (0,0), the trench cell actually occupies the space
 * between (-0.5,-0.5) and (0.5,0.5) on the grid.
 *
 * We _could_ just transform the digger's coordinates as we go to make up this difference,
 * but it'd be extremely messy to code, and probably quite error-prone. Is there some
 * other, more elegant way we could get around this? Could we could use the area of the
 * polygon *enclosed by the digger's path* to infer something about the area of the
 * interior regions of the trench, or better yet the full trench?
 *
 * Fortunately, this isn't the only formula for areas of arbitrary polygons. Another one,
 * called Pick's Theorem, can be used when you know something specific about the interior
 * of the polygon: https://en.wikipedia.org/wiki/Pick%27s_theorem. It says that area can
 * be expressed as a relationship between the number of "boundary points" that make up the
 * outline of the polygon and the number of "interior points" that make up its interior.
 * Boundary points include normal vertices as well as any points along a side edge at
 * integer coordinates. Interior points are any integer coordinates that reside on the
 * interior of the polygon.
 *
 * Pick's Theorem by itself doesn't solve our vertex coordinates issue; it still relies on
 * knowing all the vertices and other integer points that make up the outline of the
 * trench. However, in this problem's situation there's actually a couple unique
 * properties of the digging plan grid we can take advantage of to put these two formulae
 * together to find our full trench area.
 *
 * To start out with, consider the "interior points" to Pick's Theorem. These points exist
 * at integer coordinates. To demonstrate, say our polygon is actually just a square with
 * a side length of 3. Observationally, we have 4 interior points, annotated with the "o"s
 * below:
 *
 *     0  1  2  3
 *   0 ·——·——·——·
 *     |        |
 *   1 ·  o  o  ·
 *     |        |
 *   2 ·  o  o  ·
 *     |        |
 *   3 ·——·——·——·
 *
 * Pick's Theorem also confirms this, if we isolate i:
 *   A = i + b/2 - 1    =>    i = A - b/2 + 1    =>    i = 9 - 12/2 + 1 = 4
 *
 * What if we shrunk our square by 0.5 all around, so that our corners move from
 * - (0,0) to (0.5, 0.5)
 * - (3,0) to (2.5, 0)
 * - (0,3) to (0, 2.5)
 * - (3,3) to (2.5, 2.5)
 *
 *     0  1  2  3
 *   0
 *       ·——·——·
 *   1   | o  o |
 *       ·      ·
 *   2   | o  o |
 *       ·——·——·
 *   3
 *
 * Our square shrinks to a side length of 2 this way, but notice that the 4 interior
 * points didn't change; these are still all the integer coordinates within the polygon.
 * Knowing that our cells are each 1x1, the number of interior points in this case is
 * actually equal to the area of the interior (4).
 *
 * The difference we just described is exactly the same as the difference between the
 * outline of the path that the digger walks and the outline of the interior of the
 * lagoon. Here's the same 3x3 grid, but now with the full trench cells drawn around the
 * cells carved by the digger's path, and the digger's positions along the path marked as
 * "x"s:
 *
 *   -1   0   1   2   3  4
 *     ·——·——·——·——·
 *   0 | x   x   x   x  |
 *     ·  .——.——.   ·
 *   1 | x  |  o    o |  x |
 *     ·  ·      ·  ·
 *   2 | x  |  o    o |  x |
 *     ·  .——.——.   ·
 *   3 | x   x   x   x  |
 *     ·——·——·——·——·
 *
 * If we connected the path drawn by our digger's positions, we have our initial square
 * with a side length of 3 and 4 interior points, based on its area of 9 and 12 boundary
 * points. Shrinking the square by 0.5 all around gives us our interior of the lagoon,
 * whose area is 4, the same as the number of interior points in it.
 *
 * Based on this relationship between the area of the interior of the lagoon and the shape
 * drawn by the digger's path, we're actually able to find the area of the interior of our
 * lagoon using a combination of Shoelace Formula and Pick's Theorem. Consider this
 * approach:
 * - Start by following the path of the digger. Since each step be move in a given
 *   direction moves 1 whole unit, the number of boundary points of the path is equal to
 *   the total distance the path travels, aka its perimeter. Record this perimeter, as
 *   well as each vertex that mades up the path.
 * - Use Shoelace formula and that list of vertices to calculate the area of the polygon
 *   enclosed by the digger's path.
 * - We know this area and the interior area of the lagoon _share the same number of
 *   interior points_.
 * - If we use the rearranged version of Pick's Theorem that isolates i, the number of
 *   interior points, we can solve for i using the area we just found and the number of
 *   boundary points on the digger's path.
 * - The number of boundary points aka the perimeter is *also* equal to the area formed by
 *   the initial trench, since each cell is 1x1.
 * - Therefore, if we sum the area of the interior lagoon, aka the number of interior
 *   points, with the area of the initial trench, aka the perimeter, aka the number of
 *   boundary points, we can get the total area of the whole lagoon!
 *
 * This is only possible because our digger digs 1x1 cells in order, so we can easily find
 * all the vertices that make up their path, use Shoelace to find that area, and then
 * reverse-solve for the interior points with that area using Pick's!
 */

type Vertex = { x: number; y: number };
type Direction = "U" | "D" | "L" | "R";
type Instruction = { direction: Direction; distance: number };

// Trace the path of the digger, assuming they start at 0,0.
function tracePath(instructions: Instruction[]): [Vertex[], perimeter: number] {
  const vertices: Vertex[] = [{ x: 0, y: 0 }];
  let perimeter: number = 0;

  let currenPos: Vertex = { x: 0, y: 0 };

  for (const { direction, distance } of instructions) {
    const nextVertex: Vertex = { ...currenPos };
    // Figure out where our digger moves to and update our next vertex.
    switch (direction) {
      case "U":
        nextVertex.y = nextVertex.y - distance;
        break;
      case "D":
        nextVertex.y = nextVertex.y + distance;
        break;
      case "R":
        nextVertex.x = nextVertex.x + distance;
        break;
      case "L":
        nextVertex.x = nextVertex.x - distance;
        break;
    }
    vertices.push(nextVertex);

    // The distance we moved is the length we need to add on to the perimeter.
    perimeter = perimeter + distance;
    // Update current position to move on to the next instruction.
    currenPos = nextVertex;
  }

  // Important! Our final instruction should move our digger back to 0,0 and add that as
  // the final vertex in the array. This will make it easier to calculate the Shoelace
  // formula for these vertices, as well as gives us a handy way to validate the loop was,
  // in fact, closed.
  if (currenPos.x !== 0 || currenPos.y !== 0) {
    throw new Error(
      `Digging plan did not yield a closed loop. Instructions ended at ${JSON.stringify(
        currenPos
      )}`
    );
  }

  return [vertices, perimeter];
}

// Helper function which parses an Instruction from a single string line.
function parseInstruction(line: string): Instruction {
  const { direction = "", distance: distanceStr = "" } =
    line.match(/(?<direction>[UDLR])\s+(?<distance>\d+)/)?.groups || {};

  if (!isDirection(direction)) {
    throw new Error(`Could not parse direction from instruction ${line}`);
  }

  const distance = parseInt(distanceStr, 10);
  if (isNaN(distance)) {
    throw new Error(`Could not parse distance from instruction ${line}`);
  }

  return { direction, distance };
}

// Helper function which asserts whether a string, s, is actually a Direction.
function isDirection(s: string): s is Direction {
  return s === "U" || s === "D" || s === "L" || s === "R";
}

// Implementation of the Shoelace formula for calculating the area of an arbitrary polygon
// given an array of its consecutive integer-value coordinates:
// https://en.wikipedia.org/wiki/Shoelace_formula
function calculateShoelaceArea(vertices: Vertex[]): number {
  // The formula sums up the cross products of each pair of consecutive vertices and then
  // divides the sum by two.
  let sum = 0;
  let [v1, ...rest] = vertices;
  // While we still have pairs left to sum...
  while (rest.length) {
    const v2 = rest.shift()!;
    // The cross product is defined as (x1 * y2) - (x2 * y1).
    sum = sum + (v1!.x * v2.y - v2.x * v1!.y);
    // Move onto the next pair.
    v1 = v2;
  }

  return sum / 2;
}

// Implementation of Pick's theorem for calculating the area of an arbitrary polygon,
// solved for the number of integer points interior to the polygon:
// https://en.wikipedia.org/wiki/Pick%27s_theorem
function calculateInteriorPoints(area: number, boundaryPoints: number): number {
  // Since A = i + b/2 - 1
  // then  i = A - b/2 + 1
  return area - boundaryPoints / 2 + 1;
}

// Test cases.
const testInstructions = TEST_DIG_PLAN.split("\n").map(parseInstruction);
const [testVertices, testPerimeter] = tracePath(testInstructions);
if (testPerimeter !== 38) {
  console.error("❌, expected perimeter to be 38 but got", testPerimeter);
}
const testPathArea = calculateShoelaceArea(testVertices);
if (testPathArea !== 42) {
  console.error(
    "❌, expected shoelace area of path to be 42 but got",
    testPathArea
  );
}
const testInteriorPoints = calculateInteriorPoints(testPathArea, testPerimeter);
if (testInteriorPoints !== 24) {
  console.error(
    "❌, expected number of interior points to be 24 but got",
    testInteriorPoints
  );
}
if (testPerimeter + testInteriorPoints !== 62) {
  console.error(
    "❌, expected result of 62 but got",
    testPerimeter + testInteriorPoints
  );
} else {
  console.log("✅");
}

// Now try for our actual dig plan.
import * as fs from "fs";

fs.readFile("./2023/18.txt", (err, rawFile) => {
  if (err) throw err;
  const instructions = rawFile.toString().split("\n").map(parseInstruction);
  const [vertices, perimeter] = tracePath(instructions);
  const pathArea = calculateShoelaceArea(vertices);
  const interiorArea = calculateInteriorPoints(pathArea, perimeter);
  console.log("area:", perimeter + interiorArea);
});
