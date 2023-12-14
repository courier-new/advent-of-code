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

const TEST_INSTRUCTIONS_1 = "RL";
const TEST_MAP_1 = `AAA = (BBB, CCC)
BBB = (DDD, EEE)
CCC = (ZZZ, GGG)
DDD = (DDD, DDD)
EEE = (EEE, EEE)
GGG = (GGG, GGG)
ZZZ = (ZZZ, ZZZ)`;

const TEST_INSTRUCTIONS_2 = "LLR";
const TEST_MAP_2 = `AAA = (BBB, BBB)
BBB = (AAA, ZZZ)
ZZZ = (ZZZ, ZZZ)`;

const TEST_MAP_CASES: {
  instructions: string;
  map: string;
  numberOfSteps: number;
}[] = [
  {
    instructions: TEST_INSTRUCTIONS_1,
    map: TEST_MAP_1,
    numberOfSteps: 2,
  },
  {
    instructions: TEST_INSTRUCTIONS_2,
    map: TEST_MAP_2,
    numberOfSteps: 6,
  },
];

function countSteps(instructions: string, mapString: string): number {
  const map = parseMap(mapString);

  // Step count also tracks which instruction index we're on. Once step count exceeds the
  // length of the instructions, we just take stepCount % instructions.length for the new
  // index.
  let stepCount = 0;
  let currentNode = "AAA";
  while (currentNode !== "ZZZ") {
    const nextDirection = instructions[stepCount % instructions.length];
    // Look up the node based on the current key.
    const node = map[currentNode];
    if (!node) {
      throw new Error(`could not find map entry for node with key: ${node}`);
    }
    if (
      currentNode === "AAA" &&
      stepCount !== 0 &&
      stepCount % instructions.length === 0
    ) {
      throw new Error(`we're in a loop :(`);
    }
    // Choose as our next node the left or right based on the next direction.
    if (nextDirection === "L") {
      currentNode = node[0];
    } else {
      currentNode = node[1];
    }

    stepCount = stepCount + 1;
  }

  return stepCount;
}

function parseMap(
  mapString: string
): Record<string, [left: string, right: string]> {
  const map: Record<string, [left: string, right: string]> = {};

  const lines = mapString.split(/\n/);
  for (const line of lines) {
    const [node, leftRight] = line.replace(/\s+/g, "").split("=");
    if (!leftRight || !node) {
      throw new Error(
        `could not determine node or left/right nodes from line ${line}`
      );
    }
    const [left, right] = leftRight.replace(/[\(\)]/g, "").split(",");
    if (!left || !right) {
      throw new Error(`could not determine left/right nodes from line ${line}`);
    }

    if (map[node] !== undefined) {
      throw new Error(`found duplicate node: ${node}`);
    }
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

fs.readFile("./advent-of-code-2023/8.txt", (err, rawFile) => {
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
  console.log("result", steps, instructions.length);
});
