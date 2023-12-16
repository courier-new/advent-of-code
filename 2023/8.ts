/* --- Day 8: Haunted Wasteland ---
You're still riding a camel across Desert Island when you spot a sandstorm quickly approaching. When you turn to warn the Elf, she disappears before your eyes! To be fair, she had just finished warning you about ghosts a few minutes ago.

One of the camel's pouches is labeled "maps" - sure enough, it's full of documents (your puzzle input) about how to navigate the desert. At least, you're pretty sure that's what they are; one of the documents contains a list of left/right instructions, and the rest of the documents seem to describe some kind of network of labeled nodes.

It seems like you're meant to use the left/right instructions to navigate the network. Perhaps if you have the camel follow the same instructions, you can escape the haunted wasteland!

After examining the maps for a bit, two nodes stick out: AAA and ZZZ. You feel like AAA is where you are now, and you have to follow the left/right instructions until you reach ZZZ.

This format defines each node of the network individually. For example:

RL

AAA = (BBB, CCC)
BBB = (DDD, EEE)
CCC = (ZZZ, GGG)
DDD = (DDD, DDD)
EEE = (EEE, EEE)
GGG = (GGG, GGG)
ZZZ = (ZZZ, ZZZ)
Starting with AAA, you need to look up the next element based on the next left/right instruction in your input. In this example, start with AAA and go right (R) by choosing the right element of AAA, CCC. Then, L means to choose the left element of CCC, ZZZ. By following the left/right instructions, you reach ZZZ in 2 steps.

Of course, you might not find ZZZ right away. If you run out of left/right instructions, repeat the whole sequence of instructions as necessary: RL really means RLRLRLRLRLRLRLRL... and so on. For example, here is a situation that takes 6 steps to reach ZZZ:

LLR

AAA = (BBB, BBB)
BBB = (AAA, ZZZ)
ZZZ = (ZZZ, ZZZ)
Starting at AAA, follow the left/right instructions. How many steps are required to reach ZZZ? */

const TEST_MAP_CASES: {
  instructions: string;
  map: string;
  numberOfSteps: number;
}[] = [
  {
    instructions: "RL",
    map: `AAA = (BBB, CCC)
BBB = (DDD, EEE)
CCC = (ZZZ, GGG)
DDD = (DDD, DDD)
EEE = (EEE, EEE)
GGG = (GGG, GGG)
ZZZ = (ZZZ, ZZZ)`,
    numberOfSteps: 2,
  },
  {
    instructions: "LLR",
    map: `AAA = (BBB, BBB)
BBB = (AAA, ZZZ)
ZZZ = (ZZZ, ZZZ)`,
    numberOfSteps: 6,
  },
];

function countSteps(instructions: string, mapString: string): number {
  const map = parseMap(mapString);

  // stepCount also tracks which instruction index we're on. Once step count exceeds the
  // length of the instructions, we just take stepCount % instructions.length for the new
  // instruction index.
  let stepCount = 0;
  let currentKey = "AAA";
  while (currentKey !== "ZZZ") {
    const nextDirection = instructions[stepCount % instructions.length];
    // Look up the node based on the current key.
    const node = map[currentKey];
    // If we can't find any node, there's a problem!
    if (!node) {
      throw new Error(`could not find map entry for node with key: ${node}`);
    }
    // We double-check that we haven't ended up back at our starting node at the same time
    // as we're cycling on instructions. If this is the case, it's a full loop and we'd
    // never find a solution.
    if (
      currentKey === "AAA" &&
      stepCount !== 0 &&
      stepCount % instructions.length === 0
    ) {
      throw new Error(`we're in a loop :(`);
    }
    // Set our next node to the left or right key based on the next direction.
    if (nextDirection === "L") {
      currentKey = node[0];
    } else {
      currentKey = node[1];
    }

    // Increment the steps we took (and move on to the next instruction).
    stepCount = stepCount + 1;
  }

  return stepCount;
}

// Helper function which takes the raw map as a string and parses a map Record from it
// where each entry in the Record indexes the left and right nodes that correspond to a
// given node key in the input.
function parseMap(
  mapString: string
): Record<string, [left: string, right: string]> {
  const map: Record<string, [left: string, right: string]> = {};

  // Split the map up by new lines.
  const lines = mapString.split(/\n/);
  for (const line of lines) {
    // Pull out the parent node key and its left/right pair.
    const [node, leftRight] = line.replace(/\s+/g, "").split("=");
    if (!leftRight || !node) {
      throw new Error(
        `could not determine node key or left/right nodes from line ${line}`
      );
    }
    // Further separate left and right keys.
    const [left, right] = leftRight.replace(/[\(\)]/g, "").split(",");
    if (!left || !right) {
      throw new Error(
        `could not determine left/right node keys from line ${line}`
      );
    }

    // Double-check that we haven't already entered a node for this key into our map. Each
    // line should represent a unique node, so if this node already exists in the map,
    // there's a problem.
    if (map[node] !== undefined) {
      throw new Error(`found duplicate node: ${node}`);
    }
    // Record the node.
    map[node] = [left, right];
  }

  return map;
}

// Test cases
for (const { instructions, map, numberOfSteps } of TEST_MAP_CASES) {
  const resultSteps = countSteps(instructions, map);
  if (resultSteps !== numberOfSteps) {
    console.error("❌, expected", numberOfSteps, "but got", resultSteps);
  } else {
    console.log("✅");
  }
}

// Now try with the real map and instructions!
import * as fs from "fs";

fs.readFile("./2023/8.txt", (err, rawFile) => {
  if (err) throw err;
  // We assume input is of the form:
  // - Instructions
  // - Empty line
  // - Map lines
  const [instructions, map] = rawFile.toString().split(/\n\n/);
  if (!instructions || !map) {
    throw new Error("could not parse instructions or map from input");
  }
  const steps = countSteps(instructions, map);
  console.log("result", steps);
});

/* --- Part Two ---
The sandstorm is upon you and you aren't any closer to escaping the wasteland. You had the camel follow the instructions, but you've barely left your starting position. It's going to take significantly more steps to escape!

What if the map isn't for people - what if the map is for ghosts? Are ghosts even bound by the laws of spacetime? Only one way to find out.

After examining the maps a bit longer, your attention is drawn to a curious fact: the number of nodes with names ending in A is equal to the number ending in Z! If you were a ghost, you'd probably just start at every node that ends with A and follow all of the paths at the same time until they all simultaneously end up at nodes that end with Z.

For example:

LR

11A = (11B, XXX)
11B = (XXX, 11Z)
11Z = (11B, XXX)
22A = (22B, XXX)
22B = (22C, 22C)
22C = (22Z, 22Z)
22Z = (22B, 22B)
XXX = (XXX, XXX)
Here, there are two starting nodes, 11A and 22A (because they both end with A). As you follow each left/right instruction, use that instruction to simultaneously navigate away from both nodes you're currently on. Repeat this process until all of the nodes you're currently on end with Z. (If only some of the nodes you're on end with Z, they act like any other node and you continue as normal.) In this example, you would proceed as follows:

Step 0: You are at 11A and 22A.
Step 1: You choose all of the left paths, leading you to 11B and 22B.
Step 2: You choose all of the right paths, leading you to 11Z and 22C.
Step 3: You choose all of the left paths, leading you to 11B and 22Z.
Step 4: You choose all of the right paths, leading you to 11Z and 22B.
Step 5: You choose all of the left paths, leading you to 11B and 22C.
Step 6: You choose all of the right paths, leading you to 11Z and 22Z.
So, in this example, you end up entirely on nodes that end in Z after 6 steps.

Simultaneously start on every node that ends with A. How many steps does it take before you're only on nodes that end with Z? */

const TEST_INSTRUCTION_PT2 = "LR";
const TEST_MAP_PT2 = `11A = (11B, XXX)
11B = (XXX, 11Z)
11Z = (11B, XXX)
22A = (22B, XXX)
22B = (22C, 22C)
22C = (22Z, 22Z)
22Z = (22B, 22B)
XXX = (XXX, XXX)`;

// Brute force approach: Follow each node simultaneously and check at every step if all of
// them hit the ending condition. This method takes an ungodly amount of time.
// function countSteps2(instructions: string, mapString: string): number {
//   const [map, startingNodeKeys] = parseMap2(mapString);

//   // stepCount also tracks which instruction index we're on. Once step count exceeds the
//   // length of the instructions, we just take stepCount % instructions.length for the new
//   // instruction index.
//   let stepCount = 0;
//   let currentKeys = startingNodeKeys;

//   while (hasReachedEnds(currentKeys) !== true) {
//     const nextDirection = instructions[stepCount % instructions.length];
//     let keyIndex = 0;
//     while (keyIndex < currentKeys.length) {
//       // Look up the node based on the current key.
//       const currentKey = currentKeys[keyIndex]!;
//       const node = map[currentKey];
//       // If we can't find any node, there's a problem!
//       if (!node) {
//         throw new Error(
//           `could not find map entry for node with key: ${currentKey}`
//         );
//       }
//       // Replace the key at keyIndex in the currentKeys array with the key of the node in the appropriate direction.
//       if (nextDirection === "L") {
//         currentKeys[keyIndex] = node[0];
//       } else {
//         currentKeys[keyIndex] = node[1];
//       }

//       // Repeat for the next key in the set.
//       keyIndex = keyIndex + 1;
//     }
//     // Increment the steps we took (and move on to the next instruction).
//     stepCount = stepCount + 1;
//     if (stepCount % 500000000 === 0) {
//       console.log(stepCount);
//     }
//   }

//   return stepCount;
// }

// LCM approach. While none of this is explicitly specified by the prompt, this approach
// only works assuming the following, which was observationally true from the example
// inputs as well as from a cursory inspection of our input data:
// - Each starting node only leads to one (unique) ending node
// - Each starting node will only lead to an ending node in a number of steps that is an
//   exact multiple of the length of the instructions. For example, if the instructions
//   were 4 long, 4, 8, 12, 16, etc.
// - If one continues past an ending node, it will take the same number of steps to reach
//   the ending node the second time. Another way of saying this is that it will form a
//   complete cycle by "replacing" the initial node. For example, the following is valid:
//       A -> B -> C -> D -> Z -> B
//   And the following are invalid:
//       A -> B -> C -> D -> Z -> D
//       A -> B -> C -> D -> Z -> A
//   The first is invalid because it has an interior cycle, and thus it would take fewer
//   steps to reach Z the second time. The second is invalid because it cycles back to the
//   initial node, and thus it would take 1 more step to reach Z the second time.
function countSteps2(instructions: string, mapString: string): number {
  const [map, startingNodeKeys] = parseMap2(mapString);

  // For each node, individually trace it to the ending node and record the number of
  // steps it took to get there.
  const stepsForNodes: number[] = [];
  for (const key of startingNodeKeys) {
    // stepCount also tracks which instruction index we're on. Once step count exceeds the
    // length of the instructions, we just take stepCount % instructions.length for the
    // new instruction index.
    let stepCount = 0;
    let currentKey = key;
    // Until we encounter the starting key again, or we find every ending node...
    while (currentKey.slice(-1) !== "Z") {
      const nextDirection = instructions[stepCount % instructions.length];
      // Look up the node based on the current key.
      const node = map[currentKey];
      // If we can't find any node, there's a problem!
      if (!node) {
        throw new Error(`could not find map entry for node with key: ${node}`);
      }

      // Set our next node to the left or right key based on the next direction.
      if (nextDirection === "L") {
        currentKey = node[0];
      } else {
        currentKey = node[1];
      }
      // Increment the steps we took (and move on to the next instruction).
      stepCount = stepCount + 1;
    }
    // When the loop concludes, we've found our end node; record the step count and move
    // on to the next starting node.
    stepsForNodes.push(stepCount);
  }

  // Now we compute the LCM from the set of step counts.
  return computeLCM(stepsForNodes);
}

function computeGCD(steps1: number, steps2: number): number {
  // (Stolen from Copilot because math is hard) This is based on the principle that the
  // GCD of two numbers also divides their difference. So, in each step, it replaces the
  // larger number with the difference of the two numbers, which reduces the size of the
  // numbers until reaching the GCD.
  while (steps2 !== 0) {
    let t = steps2;
    steps2 = steps1 % steps2;
    steps1 = t;
  }
  return steps1;
}

function computeLCM(stepCounts: number[]): number {
  let first = stepCounts.pop()!;
  let next = stepCounts.pop();
  while (next !== undefined) {
    // Pop two off and LCM them.
    const lcm = (first * next) / computeGCD(first, next);
    // LCM again with the next element.
    first = lcm;
    next = stepCounts.pop();
  }
  // Once we've depleted the array, whatever's left is the final LCM.
  return first;
}

// Helper function which takes the raw map as a string and parses a map Record from it
// where each entry in the Record indexes the left and right nodes that correspond to a
// given node key in the input. It also returns the set of initial node keys that end in
// an "A".
function parseMap2(
  mapString: string
): [
  map: Record<string, [left: string, right: string]>,
  startingNodeKeys: string[]
] {
  const map: Record<string, [left: string, right: string]> = {};
  const startingNodeKeys: string[] = [];

  // Split the map up by new lines.
  const lines = mapString.split(/\n/);
  for (const line of lines) {
    // Pull out the parent node key and its left/right pair.
    const [node, leftRight] = line.replace(/\s+/g, "").split("=");
    if (!leftRight || !node) {
      throw new Error(
        `could not determine node key or left/right nodes from line ${line}`
      );
    }
    // Further separate left and right keys.
    const [left, right] = leftRight.replace(/[\(\)]/g, "").split(",");
    if (!left || !right) {
      throw new Error(
        `could not determine left/right node keys from line ${line}`
      );
    }

    // Double-check that we haven't already entered a node for this key into our map. Each
    // line should represent a unique node, so if this node already exists in the map,
    // there's a problem.
    if (map[node] !== undefined) {
      throw new Error(`found duplicate node: ${node}`);
    }
    // Record the node.
    map[node] = [left, right];
    // If the node key ends in an "A", also add it to our list of starting nodes.
    const lastChar = node.slice(-1);
    if (lastChar === "A") {
      startingNodeKeys.push(node);
    }
  }

  return [map, startingNodeKeys];
}

// Test case
const testSteps2 = countSteps2(TEST_INSTRUCTION_PT2, TEST_MAP_PT2);
if (testSteps2 !== 6) {
  console.error("❌, expected 6 but got", testSteps2);
} else {
  console.log("✅");
}

// Now try with the real map and instructions!
fs.readFile("./2023/8.txt", (err, rawFile) => {
  if (err) throw err;
  const [instructions, map] = rawFile.toString().split(/\n\n/);
  if (!instructions || !map) {
    throw new Error("could not parse instructions or map from input");
  }
  const steps = countSteps2(instructions, map);
  console.log("result 2", steps);
});
