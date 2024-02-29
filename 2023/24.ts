/* --- Day 24: Never Tell Me The Odds ---
It seems like something is going wrong with the snow-making process. Instead of forming
snow, the water that's been absorbed into the air seems to be forming hail!

Maybe there's something you can do to break up the hailstones?

Due to strong, probably-magical winds, the hailstones are all flying through the air in
perfectly linear trajectories. You make a note of each hailstone's position and velocity
(your puzzle input). For example:

19, 13, 30 @ -2,  1, -2
18, 19, 22 @ -1, -1, -2
20, 25, 34 @ -2, -2, -4
12, 31, 28 @ -1, -2, -1
20, 19, 15 @  1, -5, -3

Each line of text corresponds to the position and velocity of a single hailstone. The
positions indicate where the hailstones are right now (at time 0). The velocities are
constant and indicate exactly how far each hailstone will move in one nanosecond.

Each line of text uses the format px py pz @ vx vy vz. For instance, the hailstone
specified by 20, 19, 15 @ 1, -5, -3 has initial X position 20, Y position 19, Z position
15, X velocity 1, Y velocity -5, and Z velocity -3. After one nanosecond, the hailstone
would be at 21, 14, 12.

Perhaps you won't have to do anything. How likely are the hailstones to collide with each
other and smash into tiny ice crystals?

To estimate this, consider only the X and Y axes; ignore the Z axis. Looking forward in
time, how many of the hailstones' paths will intersect within a test area? (The hailstones
themselves don't have to collide, just test for intersections between the paths they will
trace.)

In this example, look for intersections that happen with an X and Y position each at least
7 and at most 27; in your actual data, you'll need to check a much larger test area.
Comparing all pairs of hailstones' future paths produces the following results:

Hailstone A: 19, 13, 30 @ -2, 1, -2
Hailstone B: 18, 19, 22 @ -1, -1, -2
Hailstones' paths will cross inside the test area (at x=14.333, y=15.333).

Hailstone A: 19, 13, 30 @ -2, 1, -2
Hailstone B: 20, 25, 34 @ -2, -2, -4
Hailstones' paths will cross inside the test area (at x=11.667, y=16.667).

Hailstone A: 19, 13, 30 @ -2, 1, -2
Hailstone B: 12, 31, 28 @ -1, -2, -1
Hailstones' paths will cross outside the test area (at x=6.2, y=19.4).

Hailstone A: 19, 13, 30 @ -2, 1, -2
Hailstone B: 20, 19, 15 @ 1, -5, -3
Hailstones' paths crossed in the past for hailstone A.

Hailstone A: 18, 19, 22 @ -1, -1, -2
Hailstone B: 20, 25, 34 @ -2, -2, -4
Hailstones' paths are parallel; they never intersect.

Hailstone A: 18, 19, 22 @ -1, -1, -2
Hailstone B: 12, 31, 28 @ -1, -2, -1
Hailstones' paths will cross outside the test area (at x=-6, y=-5).

Hailstone A: 18, 19, 22 @ -1, -1, -2
Hailstone B: 20, 19, 15 @ 1, -5, -3
Hailstones' paths crossed in the past for both hailstones.

Hailstone A: 20, 25, 34 @ -2, -2, -4
Hailstone B: 12, 31, 28 @ -1, -2, -1
Hailstones' paths will cross outside the test area (at x=-2, y=3).

Hailstone A: 20, 25, 34 @ -2, -2, -4
Hailstone B: 20, 19, 15 @ 1, -5, -3
Hailstones' paths crossed in the past for hailstone B.

Hailstone A: 12, 31, 28 @ -1, -2, -1
Hailstone B: 20, 19, 15 @ 1, -5, -3
Hailstones' paths crossed in the past for both hailstones.

So, in this example, 2 hailstones' future paths cross inside the boundaries of the test
area.

However, you'll need to search a much larger test area if you want to see if any
hailstones might collide. Look for intersections that happen with an X and Y position each
at least 200000000000000 and at most 400000000000000. Disregard the Z axis entirely.

Considering only the X and Y axes, check all pairs of hailstones' future paths for
intersections. How many of these intersections occur within the test area? */

type Hailstone = {
  position: [x: number, y: number, z: number];
  velocity: [vx: number, vy: number, vz: number];
};

/**
 * Parses a string representation of a hailstone and returns its position and velocity.
 * @param line - The string representation of the hailstone.
 * @returns The parsed hailstone object containing position and velocity.
 * @throws Error if the hailstone string is invalid.
 */
function parseHailstone(line: string): Hailstone {
  const [position, velocity] = line.split(" @ ");
  if (!position || !velocity) throw new Error(`Invalid hailstone: ${line}`);

  const [px = 0, py = 0, pz = 0] = position
    .split(", ")
    .map((val) => parseInt(val, 10));
  const [vx = 0, vy = 0, vz = 0] = velocity
    .split(", ")
    .map((val) => parseInt(val, 10));

  if (
    isNaN(px) ||
    isNaN(py) ||
    isNaN(pz) ||
    isNaN(vx) ||
    isNaN(vy) ||
    isNaN(vz)
  ) {
    throw new Error(`Invalid hailstone: ${line}`);
  }

  return { position: [px, py, pz], velocity: [vx, vy, vz] };
}

/**
 * Given a hailstone's position and velocity, returns the standard form of the linear
 * equation representing the hailstone's path (ax + by = c).
 * @param hailstone - The hailstone to calculate the linear path for.
 * @returns A tuple of coefficients (a, b, c) for the linear path equation.
 */
function linearPath(hailstone: Hailstone): [a: number, b: number, c: number] {
  const [px, py] = hailstone.position;
  const [vx, vy] = hailstone.velocity;
  return [vy, -vx, vy * px - vx * py];
}

/**
 * Given two linear paths, returns the point of intersection between them.
 * @param path1 - The coefficients of the first linear path equation.
 * @param path2 - The coefficients of the second linear path equation.
 * @returns The point of intersection between the two paths.
 */
function intersection(
  path1: [a: number, b: number, c: number],
  path2: [a: number, b: number, c: number]
): [x: number, y: number] {
  const [a1, b1, c1] = path1;
  const [a2, b2, c2] = path2;
  // If the lines share the same slope, they are parallel and will never intersect.
  // The determinant of the coefficients matrix will be 0 in this case.
  const det = a1 * b2 - a2 * b1;
  if (det === 0) return [NaN, NaN];
  const x = (b2 * c1 - b1 * c2) / det;
  const y = (a1 * c2 - a2 * c1) / det;
  return [x, y];
}

/**
 * Determines if a given point was in the past relative to a hailstone's position and
 * velocity at time 0. The x delta and y delta should have the same sign as the velocity
 * components. If the delta and the velocity are both positive or both negative,
 * multiplying them together will yield a positive number. If they have different signs,
 * the result will be negative.
 *
 * @param hailstone - The hailstone object containing position and velocity information.
 * @param point - The point to check if it was in the past.
 * @returns True if the point was in the past, false otherwise.
 */
function wasInThePast(
  hailstone: Hailstone,
  point: [x: number, y: number]
): boolean {
  const [px, py] = hailstone.position;
  const [vx, vy] = hailstone.velocity;
  const [x, y] = point;
  // The x delta and y delta should have the same sign as the velocity components. If the
  // delta and the velocity are both positive or both negative, multiplying them together
  // will yield a positive number. If they have different signs, the result will be
  // negative.
  return (x - px) * vx < 0 || (y - py) * vy < 0;
}

/**
 * Checks if a given point is within the specified bounds.
 * @param point - The point to check, represented as [x, y].
 * @param bounds - The bounds to check against, represented as [min, max].
 * @returns True if the point is within the bounds, false otherwise.
 */
function isInTestBounds(
  point: [x: number, y: number],
  bounds: [min: number, max: number]
): boolean {
  const [x, y] = point;
  const [min, max] = bounds;
  return x >= min && x <= max && y >= min && y <= max;
}

function findIntersections(
  hailstones: Hailstone[],
  bounds: [min: number, max: number]
): number {
  let intersectionsCount = 0;

  for (let i = 0; i < hailstones.length; i++) {
    const first = hailstones[i]!;
    const firstPath = linearPath(first);

    for (let j = i + 1; j < hailstones.length; j++) {
      const other = hailstones[j]!;
      const otherPath = linearPath(other);

      const point = intersection(firstPath, otherPath);
      // If there *is* a point of intersection, and it's within the test bounds...
      if (point.every((val) => !isNaN(val)) && isInTestBounds(point, bounds)) {
        // ...check if it was in the past for either hailstone.
        const firstInPast = wasInThePast(first, point);
        const otherInPast = wasInThePast(other, point);
        // If it will occur in the future for both hailstones, increment the count.
        if (!firstInPast && !otherInPast) {
          intersectionsCount++;
        }
      }
    }
  }

  return intersectionsCount;
}

(function runTests() {
  const TEST_HAILSTONES = `19, 13, 30 @ -2,  1, -2
  18, 19, 22 @ -1, -1, -2
  20, 25, 34 @ -2, -2, -4
  12, 31, 28 @ -1, -2, -1
  20, 19, 15 @  1, -5, -3`;

  const testHailstones = TEST_HAILSTONES.split("\n").map(parseHailstone);
  const testIntersections = findIntersections(testHailstones, [7, 27]);
  console.assert(
    testIntersections === 2,
    `Expected 2 intersections, got ${testIntersections}`
  );
})();

const inputFile = Bun.file("./2023/24.txt");
const input = await inputFile.text();
const hailstones: Hailstone[] = input.split("\n").map(parseHailstone);
console.log(
  "Total intersections part 1:",
  findIntersections(hailstones, [200000000000000, 400000000000000])
);
