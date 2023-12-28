/* --- Day 17: Clumsy Crucible ---
The lava starts flowing rapidly once the Lava Production Facility is operational. As you leave, the reindeer offers you a parachute, allowing you to quickly reach Gear Island.

As you descend, your bird's-eye view of Gear Island reveals why you had trouble finding anyone on your way up: half of Gear Island is empty, but the half below you is a giant factory city!

You land near the gradually-filling pool of lava at the base of your new lavafall. Lavaducts will eventually carry the lava throughout the city, but to make use of it immediately, Elves are loading it into large crucibles on wheels.

The crucibles are top-heavy and pushed by hand. Unfortunately, the crucibles become very difficult to steer at high speeds, and so it can be hard to go in a straight line for very long.

To get Desert Island the machine parts it needs as soon as possible, you'll need to find the best way to get the crucible from the lava pool to the machine parts factory. To do this, you need to minimize heat loss while choosing a route that doesn't require the crucible to go in a straight line for too long.

Fortunately, the Elves here have a map (your puzzle input) that uses traffic patterns, ambient temperature, and hundreds of other parameters to calculate exactly how much heat loss can be expected for a crucible entering any particular city block.

For example:

2413432311323
3215453535623
3255245654254
3446585845452
4546657867536
1438598798454
4457876987766
3637877979653
4654967986887
4564679986453
1224686865563
2546548887735
4322674655533
Each city block is marked by a single digit that represents the amount of heat loss if the crucible enters that block. The starting point, the lava pool, is the top-left city block; the destination, the machine parts factory, is the bottom-right city block. (Because you already start in the top-left block, you don't incur that block's heat loss unless you leave that block and then return to it.)

Because it is difficult to keep the top-heavy crucible going in a straight line for very long, it can move at most three blocks in a single direction before it must turn 90 degrees left or right. The crucible also can't reverse direction; after entering each city block, it may only turn left, continue straight, or turn right.

One way to minimize heat loss is this path:

2>>34^>>>1323
32v>>>35v5623
32552456v>>54
3446585845v52
4546657867v>6
14385987984v4
44578769877v6
36378779796v>
465496798688v
456467998645v
12246868655<v
25465488877v5
43226746555v>
This path never moves more than three consecutive blocks in the same direction and incurs a heat loss of only 102.

Directing the crucible from the lava pool to the machine parts factory, but not moving more than three consecutive blocks in the same direction, what is the least heat loss it can incur? */

const HEAT_LOSS_TEST_CASES: { layout: string; minimumHeatLoss: number }[] = [
  { layout: `9`, minimumHeatLoss: 0 },
  {
    layout: `24
32`,
    minimumHeatLoss: 5,
  },
  {
    layout: `245
325
123`,
    minimumHeatLoss: 9,
  },
  {
    layout: `23331
99999`,
    minimumHeatLoss: 27,
  },
  {
    layout: `241343231
321545353
325524565`,
    minimumHeatLoss: 37,
  },
  {
    layout: `241343231132
321545353562
325524565425
344658584545
454665786753
143859879845
445787698776
363787797965`,
    minimumHeatLoss: 71,
  },
  {
    layout: `2413432311323
3215453535623
3255245654254
3446585845452
4546657867536
1438598798454
4457876987766
3637877979653`,
    minimumHeatLoss: 73,
  },
  {
    layout: `2413432311323
3215453535623
3255245654254
3446585845452
4546657867536
1438598798454
4457876987766
3637877979653
4654967986887
4564679986453
1224686865563
2546548887735
4322674655533`,
    minimumHeatLoss: 102,
  },
];

/**
 * Our first goal is to build a graph that tells us which city blocks are legally
 * connected to each other and represents every possible path through the city. This way
 * we can easily traverse valid paths and be sure we've accounted for them all. For
 * example, in a 6x6 city layout:
 *
 * ######
 * ######
 * ######
 * ######
 * ######
 * ######
 *
 * If we are considering starting at the block 1,1 (the ">"), only the nodes marked as "_"
 * are valid moves:
 *
 * #_####
 * _>___#
 * #_####
 * #_####
 * #_####
 * ######
 *
 * More generally, only cell blocks up to 3 away in any direction are legal. Technically
 * we should not be allowed to turn around and move backwards, but given we are looking to
 * minimize heat loss, we can actually allow these moves without changing the outcome;
 * moving backwards should *never* be more efficient than just continuing forward, so it
 * will be easy to throw those paths out.
 *
 * For each possible move, the heat loss associated with moving there is the sum of all
 * the blocks we passed through between our starting block and our next one. So if every
 * city block was just a 2, we might represent the cost associated with all our options
 * like so:
 *
 * #2####
 * 2>246#
 * #2####
 * #4####
 * #6####
 * ######
 *
 * valid moves from 1,1: [
 *   { block: 0,1, cost: 2, distance: 1 } // north
 *   { block: 1,0, cost: 2, distance: 1 } // west
 *   { block: 1,2, cost: 2, distance: 1 } // east
 *   { block: 1,3, cost: 4, distance: 2 } // east
 *   { block: 1,4, cost: 6, distance: 3 } // east
 *   { block: 2,1, cost: 2, distance: 1 } // south
 *   { block: 3,1, cost: 4, distance: 2 } // south
 *   { block: 4,1, cost: 6, distance: 3 } // south
 * ]
 *
 * To ensure that we follow every path exactly once, we'll say that if we choose to move
 * one direction *at all*, we'll switch directions for our next move. That way we cover
 * moving straight once, twice, and three times once each. So for any given block, we
 * would actually not consider paths that continued moving in the same direction, only
 * orthogonally. In our example, if we were originally moving east, we'd only consider
 * moving north or south:
 *
 * // going east
 * valid moves from 1,1: [
 *   { block: 0,1, cost: 2, distance: 1 } // north
 *   { block: 2,1, cost: 2, distance: 1 } // south
 *   { block: 3,1, cost: 4, distance: 2 } // south
 *   { block: 4,1, cost: 6, distance: 3 } // south
 * ]
 *
 * And likewise, if we were instead moving south, we'd only consider moving east or west:
 *
 * // going south
 * valid moves from 1,1: [
 *   { block: 1,0, cost: 2, distance: 1 } // west
 *   { block: 1,2, cost: 2, distance: 1 } // east
 *   { block: 1,3, cost: 4, distance: 2 } // east
 *   { block: 1,4, cost: 6, distance: 3 } // east
 * ]
 *
 * In this way, we can rebuild the city layout as a graph where each block is a node and
 * each node has a list of other nodes that would be legal moves away in either the n/s
 * directions or the e/w directions, and the costs to move there.
 */

type BlockKey = `(${number},${number})`;

function buildKey(row: number, column: number): BlockKey {
  return `(${row},${column})`;
}

type MoveTarget = { block: BlockKey; cost: number; distance: number };
type CityGraph = Record<
  BlockKey,
  { ewMoves: MoveTarget[]; nsMoves: MoveTarget[] }
>;

// straightMax and straightMin indicate the maximum and minimum number of moves our crucible can make in a
// given direction. For part 1, the max is 3 and the min is 1.
function buildGraph(
  layout: string[],
  straightMax = 3,
  straightMin = 1
): CityGraph {
  const graph: CityGraph = {};

  // Split each row of the layout into blocks and parse a number from each block.
  const rows = layout.map((row) =>
    row.split("").map((str) => parseInt(str, 10))
  );

  // For each row...
  let rowIndex = 0;
  while (rowIndex < rows.length) {
    const row = rows[rowIndex]!;
    let columnIndex = 0;
    // For each block...
    while (columnIndex < row.length) {
      // Initialize an entry for this block.
      const blockKey = buildKey(rowIndex, columnIndex);
      graph[blockKey] = {
        ewMoves: [],
        nsMoves: [],
      };

      // Starting with the first block over that we can move to...
      let eastIndex = straightMin;
      // ...find valid moves to the east without exceeding the limits of the city layout
      // or the straight limit.
      while (columnIndex + eastIndex < row.length && eastIndex <= straightMax) {
        // The cost to move here is the cost of moving to every block between the starting
        // one and this one.
        let eastCost = 0;
        let blockIndex = 1;
        while (blockIndex <= eastIndex) {
          eastCost = eastCost + row[columnIndex + blockIndex]!;
          blockIndex = blockIndex + 1;
        }
        // Record this block and the cost as a valid move from our starting block.
        graph[blockKey]?.ewMoves.push({
          block: buildKey(rowIndex, columnIndex + eastIndex),
          cost: eastCost,
          distance: eastIndex,
        });
        eastIndex = eastIndex + 1;
      }

      let westIndex = straightMin;
      // Find valid moves to the west without exceeding the limits of the city layout or
      // the straight limit.
      while (columnIndex - westIndex >= 0 && westIndex <= straightMax) {
        // The cost to move here is the cost of moving to every block between the starting
        // one and this one.
        let westCost = 0;
        let blockIndex = 1;
        while (blockIndex <= westIndex) {
          westCost = westCost + row[columnIndex - blockIndex]!;
          blockIndex = blockIndex + 1;
        }
        // Record this block and the cost as a valid move from our starting block.
        graph[blockKey]?.ewMoves.push({
          block: buildKey(rowIndex, columnIndex - westIndex),
          cost: westCost,
          distance: westIndex,
        });
        westIndex = westIndex + 1;
      }

      let northIndex = straightMin;
      // Find valid moves to the north without exceeding the limits of the city layout or
      // the straight limit.
      while (rowIndex - northIndex >= 0 && northIndex <= straightMax) {
        // The cost to move here is the cost of moving to every block between the starting
        // one and this one.
        let northCost = 0;
        let blockIndex = 1;
        while (blockIndex <= northIndex) {
          northCost = northCost + rows[rowIndex - blockIndex]![columnIndex]!;
          blockIndex = blockIndex + 1;
        }
        // Record this block and the cost as a valid move from our starting block.
        graph[blockKey]?.nsMoves.push({
          block: buildKey(rowIndex - northIndex, columnIndex),
          cost: northCost,
          distance: northIndex,
        });
        northIndex = northIndex + 1;
      }

      let southIndex = straightMin;
      // Find valid moves to the south without exceeding the limits of the city layout or
      // the straight limit.
      while (rowIndex + southIndex < rows.length && southIndex <= straightMax) {
        // The cost to move here is the cost of moving to every block between the starting
        // one and this one.
        let southCost = 0;
        let blockIndex = 1;
        while (blockIndex <= southIndex) {
          southCost = southCost + rows[rowIndex + blockIndex]![columnIndex]!;
          blockIndex = blockIndex + 1;
        }
        // Record this block and the cost as a valid move from our starting block.
        graph[blockKey]?.nsMoves.push({
          block: buildKey(rowIndex + southIndex, columnIndex),
          cost: southCost,
          distance: southIndex,
        });
        southIndex = southIndex + 1;
      }

      columnIndex = columnIndex + 1;
    }

    rowIndex = rowIndex + 1;
  }

  return graph;
}

/**
 * Once we've built this graph, we can actually traverse paths in it. To traverse a path,
 * we abide by the following rules:
 * - If we have just moved east or west, we will next move north or south.
 * - We will stop following a path beyond a given node if the cost it took to reach that
 *   node is worse than an alternative path we've already followed that visited it.
 */

type Direction = "e/w" | "n/s";
type Move = [
  startingBlock: BlockKey,
  moveTarget: MoveTarget,
  direction: Direction
];
type Path = { cost: number; path: string };

const STARTING_BLOCK_KEY: BlockKey = `(0,0)`;

function findMinimumHeatLoss(graph: CityGraph, key: BlockKey): Path {
  // As we consider a node multiple times along different paths, we want to record the
  // cheapest path we found to reach that node, both heading east/west and heading
  // north/south, so that we know if a path is still worth pursuing. We'll record them in
  // a separate object, indexed by the same block keys.
  const cheapestPaths: Record<BlockKey, Partial<Record<Direction, Path>>> = {};

  // Since recursion will exceed our call stack size, we'll instead keep a queue of pairs
  // of nodes that represent valid moves to check, plus the direction of the movement.
  // Since we are starting from the top left corner, our queue will be initialized with
  // all of the possible valid moves from that node.
  const startingBlock = graph[STARTING_BLOCK_KEY];
  if (!startingBlock) {
    throw new Error("could not find starting block in graph");
  }
  const moves: Move[] = startingBlock.ewMoves
    .map((target): Move => [STARTING_BLOCK_KEY, target, "e/w"])
    .concat(
      startingBlock.nsMoves.map(
        (target): Move => [STARTING_BLOCK_KEY, target, "n/s"]
      )
    );

  // We'll also record that the shorted path to our starting block is, well, 0!
  cheapestPaths[STARTING_BLOCK_KEY] = {
    ["e/w"]: { cost: 0, path: "(0,0)" },
    ["n/s"]: { cost: 0, path: "(0,0)" },
  };

  // Now we'll conduct BFS using the queue; we're unlikely to find the cheapest full path
  // on the first try, so we'll look at lots of nearby nodes first and ensure we're
  // working with the cheapest shorter paths first before proceeding further through the
  // city.
  while (moves.length) {
    const [startingBlock, moveTarget, direction] = moves.shift()!;
    const { block: targetBlock, cost: moveCost, distance } = moveTarget;
    // Check the cheapest path we have recorded for the starting block. We should consider
    // the starting cost moving in the orthogonal direction to the direction we're
    // currently moving.
    const startingCheapest =
      cheapestPaths[startingBlock]?.[direction === "e/w" ? "n/s" : "e/w"];
    if (!startingCheapest) {
      throw new Error(
        `tried to evaluate move from a starting block with no prior paths recorded: ${startingBlock}`
      );
    }
    const { cost: startingCost, path: startingPath } = startingCheapest;
    // Also check the cheapest path cost we have recorded for the target block moving in
    // the current direction, if any.
    const targetCheapest = cheapestPaths[targetBlock];
    const targetCost =
      (direction === "e/w"
        ? targetCheapest?.["e/w"]?.cost
        : targetCheapest?.["n/s"]?.cost) || Infinity;

    // If the total cost after we perform this move is better than the current cheapest
    // path to reach the target...
    if (startingCost + moveCost < targetCost) {
      // Update it!
      const newPath =
        startingPath + new Array(distance).fill(">").join("") + targetBlock;
      cheapestPaths[targetBlock] = {
        ...(cheapestPaths[targetBlock] || {}),
        [direction]: { cost: startingCost + moveCost, path: newPath },
      };
      // And now consider all valid moves from the target block in an orthogonal
      // direction.
      const nextDirection = direction === "e/w" ? "n/s" : "e/w";
      const nextMoveTargets =
        nextDirection === "e/w"
          ? graph[targetBlock]!.ewMoves
          : graph[targetBlock]!.nsMoves;
      for (const target of nextMoveTargets) {
        moves.push([targetBlock, target, nextDirection]);
      }
    }
    // Otherwise, we've already found a more efficient path to reach this block and don't
    // need to proceed with it anymore.
  }

  const finishCheapest = cheapestPaths[key];
  if (!finishCheapest?.["e/w"] || !finishCheapest?.["n/s"]) {
    throw new Error(`could not find cheapest path options at finish: ${key}`);
  }

  return finishCheapest["e/w"].cost < finishCheapest["n/s"].cost
    ? finishCheapest["e/w"]
    : finishCheapest["n/s"];
}

// Test cases
for (const { layout, minimumHeatLoss } of HEAT_LOSS_TEST_CASES) {
  const rows = layout.split("\n");
  const graph = buildGraph(rows);
  const result = findMinimumHeatLoss(
    graph,
    `(${rows.length - 1},${rows[0]!.length - 1})`
  );
  if (result.cost !== minimumHeatLoss) {
    console.error("❌, expected", minimumHeatLoss, "but got", result);
  } else {
    console.log("✅");
  }
}

// Now try for our actual city layout.
import * as fs from "fs";

fs.readFile("./2023/17.txt", (err, rawFile) => {
  if (err) throw err;

  const rows = rawFile.toString().split("\n");
  const graph = buildGraph(rows);
  const result = findMinimumHeatLoss(
    graph,
    `(${rows.length - 1},${rows[0]!.length - 1})`
  );
  console.log("minimum heat loss", result);
});

/* --- Part Two ---
The crucibles of lava simply aren't large enough to provide an adequate supply of lava to the machine parts factory. Instead, the Elves are going to upgrade to ultra crucibles.

Ultra crucibles are even more difficult to steer than normal crucibles. Not only do they have trouble going in a straight line, but they also have trouble turning!

Once an ultra crucible starts moving in a direction, it needs to move a minimum of four blocks in that direction before it can turn (or even before it can stop at the end). However, it will eventually start to get wobbly: an ultra crucible can move a maximum of ten consecutive blocks without turning.

In the above example, an ultra crucible could follow this path to minimize heat loss:

2>>>>>>>>1323
32154535v5623
32552456v4254
34465858v5452
45466578v>>>>
143859879845v
445787698776v
363787797965v
465496798688v
456467998645v
122468686556v
254654888773v
432267465553v
In the above example, an ultra crucible would incur the minimum possible heat loss of 94.

Here's another example:

111111111111
999999999991
999999999991
999999999991
999999999991
Sadly, an ultra crucible would need to take an unfortunate path like this one:

1>>>>>>>1111
9999999v9991
9999999v9991
9999999v9991
9999999v>>>>
This route causes the ultra crucible to incur the minimum possible heat loss of 71.

Directing the ultra crucible from the lava pool to the machine parts factory, what is the least heat loss it can incur? */

const HEAT_LOSS_TEST_CASES_2: { layout: string; minimumHeatLoss: number }[] = [
  {
    layout: `2413432311323
3215453535623
3255245654254
3446585845452
4546657867536
1438598798454
4457876987766
3637877979653
4654967986887
4564679986453
1224686865563
2546548887735
4322674655533`,
    minimumHeatLoss: 94,
  },
  {
    layout: `111111111111
999999999991
999999999991
999999999991
999999999991`,
    minimumHeatLoss: 71,
  },
];

// Test cases
for (const { layout, minimumHeatLoss } of HEAT_LOSS_TEST_CASES_2) {
  const rows = layout.split("\n");
  const graph = buildGraph(rows, 10, 4);
  const result = findMinimumHeatLoss(
    graph,
    `(${rows.length - 1},${rows[0]!.length - 1})`
  );
  if (result.cost !== minimumHeatLoss) {
    console.error("❌, expected", minimumHeatLoss, "but got", result);
  } else {
    console.log("✅");
  }
}

fs.readFile("./2023/17.txt", (err, rawFile) => {
  if (err) throw err;

  const rows = rawFile.toString().split("\n");
  const graph = buildGraph(rows, 10, 4);
  const result = findMinimumHeatLoss(
    graph,
    `(${rows.length - 1},${rows[0]!.length - 1})`
  );
  console.log("minimum heat loss part 2", result);
});
