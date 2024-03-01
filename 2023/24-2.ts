/* --- Part Two ---
Upon further analysis, it doesn't seem like any hailstones will naturally collide. It's up
to you to fix that!

You find a rock on the ground nearby. While it seems extremely unlikely, if you throw it
just right, you should be able to hit every hailstone in a single throw!

You can use the probably-magical winds to reach any integer position you like and to
propel the rock at any integer velocity. Now including the Z axis in your calculations, if
you throw the rock at time 0, where do you need to be so that the rock perfectly collides
with every hailstone? Due to probably-magical inertia, the rock won't slow down or change
direction when it collides with a hailstone.

In the example above, you can achieve this by moving to position 24, 13, 10 and throwing
the rock at velocity -3, 1, 2. If you do this, you will hit every hailstone as follows:

Hailstone: 19, 13, 30 @ -2, 1, -2
Collision time: 5
Collision position: 9, 18, 20

Hailstone: 18, 19, 22 @ -1, -1, -2
Collision time: 3
Collision position: 15, 16, 16

Hailstone: 20, 25, 34 @ -2, -2, -4
Collision time: 4
Collision position: 12, 17, 18

Hailstone: 12, 31, 28 @ -1, -2, -1
Collision time: 6
Collision position: 6, 19, 22

Hailstone: 20, 19, 15 @ 1, -5, -3
Collision time: 1
Collision position: 21, 14, 12

Above, each hailstone is identified by its initial position and its velocity. Then, the
time and position of that hailstone's collision with your rock are given.

After 1 nanosecond, the rock has exactly the same position as one of the hailstones,
obliterating it into ice dust! Another hailstone is smashed to bits two nanoseconds after
that. After a total of 6 nanoseconds, all of the hailstones have been destroyed.

So, at time 0, the rock needs to be at X position 24, Y position 13, and Z position 10.
Adding these three coordinates together produces 47. (Don't add any coordinates from the
rock's velocity.)

Determine the exact position and velocity the rock needs to have at time 0 so that it
perfectly collides with every hailstone. What do you get if you add up the X, Y, and Z
coordinates of that initial position? */

type Position = [x: number, y: number, z: number];
type Velocity = [vx: number, vy: number, vz: number];

type Hailstone = {
  position: Position;
  velocity: Velocity;
};

/**
 * [Taken exactly from part 1] Parses a string representation of a hailstone and returns
 * its position and velocity.
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
 * Groups the positions of hailstones in a given dimension by their velocity components.
 * This is because, for a pair of hailstones moving with the same velocity in a given
 * direction, one hailstone has a relative velocity to the other of 0, so the distance
 * between them in this direction will remain constant. We will leverage this fact to
 * narrow in on possible velocities for the rock.
 *
 * @param hailstones - An array of hailstones containing velocity and position
 * information.
 * @returns An object containing grouped velocities for each dimension.
 */
function groupVelocities(
  hailstones: Hailstone[]
): Record<"x" | "y" | "z", Record<number, number[]>> {
  let x: Record<number, number[]> = {};
  let y: Record<number, number[]> = {};
  let z: Record<number, number[]> = {};

  for (const {
    velocity: [vx, vy, vz],
    position: [px, py, pz],
  } of hailstones) {
    x[vx] = x[vx] ? [...x[vx]!, px] : [px];
    y[vy] = y[vy] ? [...y[vy]!, py] : [py];
    z[vz] = z[vz] ? [...z[vz]!, pz] : [pz];
  }

  return { x, y, z };
}

/**
 * Finds the velocity of a rock based on the given hailstones by narrowing in on possible
 * velocities for the rock.
 *
 * NOTE: The default value of `rangeSize` is chosen based on observations from our sample
 * data that all hailstones have integer velocities magnitudes that range from -1000 to
 * 1000. We will assume that our rock's velocity in each direction will also be an integer
 * within this range.
 *
 * @param hailstones - An array of all the hailstones.
 * @param rangeSize - The size of the range to consider for possible velocities, inclusive
 * of the provided value. Default is 1000. This will initialize our space of possible
 * velocity magnitudes in each direction to be from `-rangeSize` to `rangeSize`.
 * @returns The velocity of the rock as an array of three numbers representing the
 * velocity in the x, y, and z directions respectively.
 */
function findRockVelocity(hailstones: Hailstone[], rangeSize = 1000): Velocity {
  // NOTE: Ideally, we would do a single pass across all the hailstones to lock in the
  // velocity. However, due to the large magnitudes of the hailstone positions, we seem to
  // deal with rounding errors when we use the full set of hailstones and find no solution
  // that would work for all of them. Fortunately, due to the nature of the problem and
  // assumption of the existence of a single solution, we are usually able to narrow in
  // and isolate the solution with fewer hailstones. We'll try gradually increasing the
  // number of hailstones we consider until we find a unique solution.
  for (const size of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 200]) {
    const groupedVelocities = groupVelocities(hailstones.slice(0, size));
    try {
      return findRockVelocityFromGroups(groupedVelocities, rangeSize);
    } catch (err) {
      console.log(
        `Could not determine solution for group size ${size}:`,
        (err as Error).message + ".",
        "Will try next group size..."
      );
    }
  }

  throw new Error("No possible velocities found");
}

/**
 * Helper function which runs the inner loop of `findRockVelocity` for a given set of
 * grouped velocities from a subset of the hailstones and range size. See
 * `findRockVelocity` for more details.
 *
 * @param groupedVelocities - The grouped velocities.
 * @param rangeSize - The range size.
 * @returns The rock velocity.
 * @throws Error if no possible velocities are found in any direction.
 */
function findRockVelocityFromGroups(
  groupedVelocities: ReturnType<typeof groupVelocities>,
  rangeSize: number
): Velocity {
  let result = { x: 0, y: 0, z: 0 };

  for (const dim of ["x", "y", "z"] as const) {
    // We will start with the full range of possible integer velocity magnitudes up to and
    // including `rangeSize`. We initialize the range first and then filter it down to
    // only valid possibilities.
    // NOTE: Since we know we'll be calling this function multiple times in a row with
    // increasing group sizes, which also means with increasing numbers of constraints for
    // the solution, we could technically reduce redundant work here by caching the
    // results of the filtering process for the smaller group size and using that as a
    // starting point for the larger group size. However, the optimization gains of doing
    // so are marginal at the cost of sacrificing code clarity, so we'll omit this
    // optimization since it's not necessary for the input size we're dealing with.
    const initialVelocities = Array.from(
      { length: rangeSize * 2 + 1 },
      (_, i) => i - rangeSize
    );

    // We will filter this range based on the following principle: For two hailstones
    // moving at the same velocity in a given direction, the distance between them in that
    // direction must be a multiple of the difference between a possible rock velocity and
    // the hailstones' velocity. This is because the relative velocity between the two
    // hailstones is 0, so the distance between them will remain constant. This means that
    // the rock needs to cover the distance between them in order to hit both hailstones.
    // This hinges on the assumption that we can treat time as discrete units, i.e. the rock
    // can only be at integer positions at integer times.
    const possibleVelocities = initialVelocities.filter((rv) => {
      // For each possible velocity, we will check if it satisfies the above principle for
      // any pairs of hailstones moving at the same velocity in this direction.
      for (const [hailstoneVelocity, hailstonePositions] of Object.entries(
        groupedVelocities[dim]
      )) {
        // If we have fewer than 2 hailstones moving at the same velocity in this
        // direction, we can't glean any information about the rock's velocity from them.
        if (hailstonePositions.length < 2) continue;

        let hIndex1 = 0;
        while (hIndex1 < hailstonePositions.length - 1) {
          let hIndex2 = hIndex1 + 1;
          const pos1 = hailstonePositions[hIndex1]!;
          while (hIndex2 < hailstonePositions.length) {
            const pos2 = hailstonePositions[hIndex2]!;

            // Get the distance between the two hailstones at time 0.
            const distance = Math.abs(pos1 - pos2);

            // Get the relative velocity between the rock and these hailstones in this
            // direction.
            const relativeVelocity = Math.abs(
              rv - parseInt(hailstoneVelocity, 10)
            );

            // If the rock's velocity couldn't cover the distance between the two
            // hailstones in an integer number of time units, this cannot be a valid
            // velocity and we should filter it from the list of candidates.
            if (distance % relativeVelocity !== 0) return false;

            hIndex2++;
          }

          hIndex1++;
        }
      }
      return true;
    });

    // We assume that there should only be one possible velocity for the rock in each
    // direction for the final solution. If there are multiple possible velocities, we
    if (possibleVelocities.length > 1) {
      throw new Error(`Multiple possible velocities found in ${dim} direction`);
    } else if (possibleVelocities[0] === undefined) {
      throw new Error(`No possible velocities found in ${dim} direction`);
    }

    result[dim] = possibleVelocities[0];
  }

  return [result.x, result.y, result.z];
}

/**
 * Finds the starting position of a rock given the hailstones and rock velocity.
 * This is done by finding the time at which the rock's position is an integer multiple
 * of the hailstone's position and velocity at time 0. This approach once again assumes
 * that time is discrete and that the rock can only be at integer positions at integer
 * times.
 *
 * @param hailstones - The array of hailstones.
 * @param rockVelocity - The velocity of the rock.
 * @returns The starting position of the rock.
 */
function findRockStartingPosition(
  hailstones: Hailstone[],
  [rVX, rVY, rVZ]: Velocity
): Position {
  // Once again, due to the large magnitudes of the hailstone positions, we seem to deal
  // with rounding problems when we use the full set of hailstones. Thus, we will keep a
  // record of "all of the solutions", knowing they should all be very close together, and
  // then pick the one that we computed most frequently as the real answer.
  const results: Dict<{ collisions: number; position: Position }> = {};

  let hIndex1 = 0;
  while (hIndex1 < hailstones.length - 1) {
    let hIndex2 = hIndex1 + 1;
    const {
      position: [h1X, h1Y, h1Z],
      velocity: [h1VX, h1VY, h1VZ],
    } = hailstones[hIndex1]!;

    while (hIndex2 < hailstones.length) {
      const {
        position: [h2X, h2Y],
        velocity: [h2VX, h2VY],
      } = hailstones[hIndex2]!;

      // Compute the slope and y-intercept of the line between the rock and each of the
      // pairs of hailstones, based on their relative velocities and positions. We will
      // use these to find the point of intersection between the rock's path and the line
      // between the hailstones.
      const m1 = (h1VY - rVY) / (h1VX - rVX);
      const m2 = (h2VY - rVY) / (h2VX - rVX);
      const b1 = h1Y - m1 * h1X;
      const b2 = h2Y - m2 * h2X;

      // Compute the point of intersection between the rock's path and the line between the
      // hailstones. This will be the point where the rock would have collided with the
      // hailstones if it were at that position at time 0.
      const rpx = (b2 - b1) / (m1 - m2);
      const rpy = m1 * rpx + b1;

      const time = Math.round((rpx - h1X) / (h1VX - rVX));
      const rpz = h1Z + (h1VZ - rVZ) * time;

      // We assume that the rock's starting position coordinates are all integers, so we
      // only record solutions where all the coordinates are integers.
      if (
        Number.isInteger(rpx) &&
        Number.isInteger(rpy) &&
        Number.isInteger(rpz)
      ) {
        const result = `${rpx},${rpy},${rpz}`;
        if (!results[result]) {
          results[result] = { collisions: 1, position: [rpx, rpy, rpz] };
        } else {
          results[result]!.collisions++;
        }
      }

      hIndex2++;
    }

    hIndex1++;
  }

  // Now we'll scan our "solutions" and pick the one that we computed most frequently.
  let maxCollisions = 0;
  let maxPosition: Position = [0, 0, 0];
  for (const record of Object.values(results)) {
    if (!record) continue;
    const { collisions, position } = record;
    if (collisions > maxCollisions) {
      maxCollisions = collisions;
      maxPosition = position;
    }
  }

  return maxPosition;
}

// NOTE: Unfortunately, we can't use the example from the prompt to verify our solution because
// there are not enough hailstones to narrow in on a unique velocity vector for the rock.

const inputFile = Bun.file("./2023/24.txt");
const input = await inputFile.text();
const hailstones: Hailstone[] = input.split("\n").map(parseHailstone);
const rockVelocity = findRockVelocity(hailstones);
const rockStartingPosition = findRockStartingPosition(hailstones, rockVelocity);
console.log(
  "The starting position of the rock is:",
  rockStartingPosition,
  "and the sum of its coordinates is:",
  rockStartingPosition.reduce((a, b) => a + b, 0)
);
