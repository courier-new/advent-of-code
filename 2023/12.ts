/* --- Day 12: Hot Springs ---
You finally reach the hot springs! You can see steam rising from secluded areas attached to the primary, ornate building.

As you turn to enter, the researcher stops you. "Wait - I thought you were looking for the hot springs, weren't you?" You indicate that this definitely looks like hot springs to you.

"Oh, sorry, common mistake! This is actually the onsen! The hot springs are next door."

You look in the direction the researcher is pointing and suddenly notice the massive metal helixes towering overhead. "This way!"

It only takes you a few more steps to reach the main gate of the massive fenced-off area containing the springs. You go through the gate and into a small administrative building.

"Hello! What brings you to the hot springs today? Sorry they're not very hot right now; we're having a lava shortage at the moment." You ask about the missing machine parts for Desert Island.

"Oh, all of Gear Island is currently offline! Nothing is being manufactured at the moment, not until we get more lava to heat our forges. And our springs. The springs aren't very springy unless they're hot!"

"Say, could you go up and see why the lava stopped flowing? The springs are too cold for normal operation, but we should be able to find one springy enough to launch you up there!"

There's just one problem - many of the springs have fallen into disrepair, so they're not actually sure which springs would even be safe to use! Worse yet, their condition records of which springs are damaged (your puzzle input) are also damaged! You'll need to help them repair the damaged records.

In the giant field just outside, the springs are arranged into rows. For each row, the condition records show every spring and whether it is operational (.) or damaged (#). This is the part of the condition records that is itself damaged; for some springs, it is simply unknown (?) whether the spring is operational or damaged.

However, the engineer that produced the condition records also duplicated some of this information in a different format! After the list of springs for a given row, the size of each contiguous group of damaged springs is listed in the order those groups appear in the row. This list always accounts for every damaged spring, and each number is the entire size of its contiguous group (that is, groups are always separated by at least one operational spring: #### would always be 4, never 2,2).

So, condition records with no unknown spring conditions might look like this:

#.#.### 1,1,3
.#...#....###. 1,1,3
.#.###.#.###### 1,3,1,6
####.#...#... 4,1,1
#....######..#####. 1,6,5
.###.##....# 3,2,1
However, the condition records are partially damaged; some of the springs' conditions are actually unknown (?). For example:

???.### 1,1,3
.??..??...?##. 1,1,3
?#?#?#?#?#?#?#? 1,3,1,6
????.#...#... 4,1,1
????.######..#####. 1,6,5
?###???????? 3,2,1
Equipped with this information, it is your job to figure out how many different arrangements of operational and broken springs fit the given criteria in each row.

In the first line (???.### 1,1,3), there is exactly one way separate groups of one, one, and three broken springs (in that order) can appear in that row: the first three unknown springs must be broken, then operational, then broken (#.#), making the whole row #.#.###.

The second line is more interesting: .??..??...?##. 1,1,3 could be a total of four different arrangements. The last ? must always be broken (to satisfy the final contiguous group of three broken springs), and each ?? must hide exactly one of the two broken springs. (Neither ?? could be both broken springs or they would form a single contiguous group of two; if that were true, the numbers afterward would have been 2,3 instead.) Since each ?? can either be #. or .#, there are four possible arrangements of springs.

The last line is actually consistent with ten different arrangements! Because the first number is 3, the first and second ? must both be . (if either were #, the first number would have to be 4 or higher). However, the remaining run of unknown spring conditions have many different ways they could hold groups of two and one broken springs:

?###???????? 3,2,1
.###.##.#...
.###.##..#..
.###.##...#.
.###.##....#
.###..##.#..
.###..##..#.
.###..##...#
.###...##.#.
.###...##..#
.###....##.#
In this example, the number of possible arrangements for each row is:

???.### 1,1,3 - 1 arrangement
.??..??...?##. 1,1,3 - 4 arrangements
?#?#?#?#?#?#?#? 1,3,1,6 - 1 arrangement
????.#...#... 4,1,1 - 1 arrangement
????.######..#####. 1,6,5 - 4 arrangements
?###???????? 3,2,1 - 10 arrangements
Adding all of the possible arrangement counts together produces a total of 21 arrangements.

For each row, count all of the different arrangements of operational and broken springs that meet the given criteria. What is the sum of those counts? */

const TEST_CONDITION_RECORDS: { row: string; arrangements: number }[] = [
  { row: "???.### 1,1,3", arrangements: 1 },
  { row: ".??..??...?##. 1,1,3", arrangements: 4 },
  { row: "?#?#?#?#?#?#?#? 1,3,1,6", arrangements: 1 },
  { row: "????.#...#... 4,1,1", arrangements: 1 },
  { row: "????.######..#####. 1,6,5", arrangements: 4 },
  { row: "?###???????? 3,2,1", arrangements: 10 },
];

function countArrangements(rawRow: string): number {
  // Start by parsing the row to separate the damaged condition records from the list of
  // damaged group sizes.
  const [row, rawGroupSizes] = rawRow.split(/\s+/);
  if (!row || !rawGroupSizes) {
    throw new Error(
      `could not determine row or group sizes from row: ${rawRow}`
    );
  }
  // Further parse the list of damaged group sizes into an array of numbers.
  const groupSizes = rawGroupSizes.split(",").map((size) => parseInt(size, 10));

  return countArrangementsR(row, groupSizes);
}

function countArrangementsR(substring: string, gs: number[]): number {
  // Make a copy of gs so we can shift elements without affecting recursive calls farther up the stack.
  const groupSizes = [...gs];
  // If there are no groups we're trying to fit into the string, the only possible
  // arrangement is that they are all working springs ("."s).
  if (!groupSizes.length) {
    // If the string still contains any damaged hot springs ("#"s), this isn't a valid
    // arrangement.
    return substring.indexOf("#") !== -1 ? 0 : 1;
  }

  // Otherwise, take the next group size from the front of the array.
  const groupSize = groupSizes.shift()!;
  // We'll look for how many arrangements we can find that support a group of this size.
  let arrangements = 0;
  // Starting from the first character, we'll scan every index (hot spring) of the
  // substring until we can't fit our remaining groups of hot springs anymore.
  let springIndex = 0;
  // To know if we can still fit all of the remaining groups, we can sum the total length
  // of characters they'll need by summing all of the individual group sizes and then
  // adding 1 * (number of groups - 1) for the buffers of working hot springs that must
  // come between each group.
  const requiredLength =
    groupSize + groupSizes.reduce((sum, size) => sum + size + 1, 0);
  // We can only fit the groups if springIndex + requiredLength hasn't exceeded the length
  // of the substring.
  let canFitGroups = springIndex + requiredLength <= substring.length;
  // We also can't go past any known damaged hot springs ("#"s) in the string, or else
  // they'd be orphaned. Since it's possible there might not be any "#"s in the string,
  // we'll artificially put one at the very end of the string so that this boundary is at
  // substring.length rather than -1 in that case.
  const firstDamagedHotSpring = (substring + "#").indexOf("#");
  while (canFitGroups && springIndex <= firstDamagedHotSpring) {
    // Take a slice of groupSize
    const slice = substring.slice(springIndex, springIndex + groupSize);
    // The string is only a valid arrangement if it doesn't contain any functional hot
    // springs (".").
    if (slice.indexOf(".") === -1) {
      // If there's at least one group left, there also needs to be room for at least one
      // working spring before the next group.
      if (groupSizes.length) {
        // console.log("adding buffer");
        if (substring[springIndex + groupSize] !== "#") {
          // Great! We've confirmed this is a valid place to put the next group. We'll
          // look for how many total arrangements can go after this group in the string
          // and add this to the total count.
          arrangements =
            arrangements +
            countArrangementsR(
              substring.slice(springIndex + groupSize + 1),
              groupSizes
            );
        }
      } else {
        // Otherwise, if there are no groups left to fit into the string, the only
        // possible arrangement is that the rest of the string consists of working springs
        // ("."s). If the rest of the string still contains any damaged hot springs
        // ("#"s), then, this isn't a valid arrangement.
        arrangements =
          substring.slice(springIndex + groupSize).indexOf("#") !== -1
            ? arrangements
            : arrangements + 1;
      }
    }

    // If this was a valid place to put the group, we would have handled it appropriately
    // at this point. Keep looking forward.
    springIndex = springIndex + 1;
    canFitGroups = springIndex + requiredLength <= substring.length;
  }

  return arrangements;
}

// Test cases
console.log(countArrangementsR("#", []) === 0 ? "✅" : "❌");
console.log(countArrangementsR("?", []) === 1 ? "✅" : "❌");
console.log(countArrangementsR(".", []) === 1 ? "✅" : "❌");
console.log(countArrangementsR(".", [1]) === 0 ? "✅" : "❌");
console.log(countArrangementsR("#", [1]) === 1 ? "✅" : "❌");
console.log(countArrangementsR("?", [1]) === 1 ? "✅" : "❌");
console.log(countArrangementsR(".", []) === 1 ? "✅" : "❌");
console.log(countArrangementsR("#", []) === 0 ? "✅" : "❌");
console.log(countArrangementsR("?", []) === 1 ? "✅" : "❌");
console.log(countArrangementsR("??", [1]) === 2 ? "✅" : "❌");
console.log(countArrangementsR("#?", [1]) === 1 ? "✅" : "❌");
console.log(countArrangementsR("?#", [1]) === 1 ? "✅" : "❌");
console.log(countArrangementsR("..", [1]) === 0 ? "✅" : "❌");
console.log(countArrangementsR("##", [1]) === 0 ? "✅" : "❌");
console.log(countArrangementsR("#.#", [1]) === 0 ? "✅" : "❌");
console.log(countArrangementsR("#.#", [1, 1]) === 1 ? "✅" : "❌");
console.log(countArrangementsR("???", [1, 1]) === 1 ? "✅" : "❌");
for (const { row, arrangements } of TEST_CONDITION_RECORDS) {
  const result = countArrangements(row);
  if (result !== arrangements) {
    console.error("❌, expected", arrangements, "but got", result);
  } else {
    console.log("✅");
  }
}

// Now try for our actual condition record
import * as readline from "readline";
import * as fs from "fs";

const rl = readline.createInterface(fs.createReadStream("./2023/12.txt"));

let sum = 0;
rl.on("line", (line) => {
  sum = sum + countArrangements(line);
});

rl.on("close", () => {
  console.log(sum);
});
