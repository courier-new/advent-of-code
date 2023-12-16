/* --- Day 4: Scratchcards ---
The gondola takes you up. Strangely, though, the ground doesn't seem to be coming with you; you're not climbing a mountain. As the circle of Snow Island recedes below you, an entire new landmass suddenly appears above you! The gondola carries you to the surface of the new island and lurches into the station.

As you exit the gondola, the first thing you notice is that the air here is much warmer than it was on Snow Island. It's also quite humid. Is this where the water source is?

The next thing you notice is an Elf sitting on the floor across the station in what seems to be a pile of colorful square cards.

"Oh! Hello!" The Elf excitedly runs over to you. "How may I be of service?" You ask about water sources.

"I'm not sure; I just operate the gondola lift. That does sound like something we'd have, though - this is Island Island, after all! I bet the gardener would know. He's on a different island, though - er, the small kind surrounded by water, not the floating kind. We really need to come up with a better naming scheme. Tell you what: if you can help me with something quick, I'll let you borrow my boat and you can go visit the gardener. I got all these scratchcards as a gift, but I can't figure out what I've won."

The Elf leads you over to the pile of colorful cards. There, you discover dozens of scratchcards, all with their opaque covering already scratched off. Picking one up, it looks like each card has two lists of numbers separated by a vertical bar (|): a list of winning numbers and then a list of numbers you have. You organize the information into a table (your puzzle input).

As far as the Elf has been able to figure out, you have to figure out which of the numbers you have appear in the list of winning numbers. The first match makes the card worth one point and each match after the first doubles the point value of that card.

For example:

Card 1: 41 48 83 86 17 | 83 86  6 31 17  9 48 53
Card 2: 13 32 20 16 61 | 61 30 68 82 17 32 24 19
Card 3:  1 21 53 59 44 | 69 82 63 72 16 21 14  1
Card 4: 41 92 73 84 69 | 59 84 76 51 58  5 54 83
Card 5: 87 83 26 28 32 | 88 30 70 12 93 22 82 36
Card 6: 31 18 13 56 72 | 74 77 10 23 35 67 36 11
In the above example, card 1 has five winning numbers (41, 48, 83, 86, and 17) and eight numbers you have (83, 86, 6, 31, 17, 9, 48, and 53). Of the numbers you have, four of them (48, 83, 17, and 86) are winning numbers! That means card 1 is worth 8 points (1 for the first match, then doubled three times for each of the three matches after the first).

Card 2 has two winning numbers (32 and 61), so it is worth 2 points.
Card 3 has two winning numbers (1 and 21), so it is worth 2 points.
Card 4 has one winning number (84), so it is worth 1 point.
Card 5 has no winning numbers, so it is worth no points.
Card 6 has no winning numbers, so it is worth no points.
So, in this example, the Elf's pile of scratchcards is worth 13 points.

Take a seat in the large pile of colorful cards. How many points are they worth in total? */

const cardIdentifierRegex = new RegExp("Card\\s+(\\d+):");

function countPoints(card: string): number {
  let points = 0;

  // Remove the initial card number identifier from the line and split the line into its
  // list of winning numbers and its list of scratched-off numbers.
  const [winningNumbersString, cardNumbersString] = card
    .replace(cardIdentifierRegex, "")
    .split("|");

  if (!winningNumbersString?.length || !cardNumbersString?.length) {
    throw new Error(
      `could not parse winning numbers or card numbers from card: ${card}`
    );
  }

  // Further split the list of winning numbers into an array based on separators of one or
  // more whitespace characters, and then parse integers from each number string.
  const winningNumbers = winningNumbersString
    .trim()
    .split(/\s+/)
    .map((num) => parseInt(num, 10));
  // And do the same for the scratched-off card numbers.
  const cardNumbers = cardNumbersString
    .trim()
    .split(/\s+/)
    .map((num) => parseInt(num));

  // NOTE: My solution makes the assumption that if the same winning number is matched
  // more than once, each of those instances scores points. My solution also assumes every
  // winning number is unique. Neither of these points was clear from the problem
  // description.

  // Create a set out of the winning numbers.
  const winningNumbersSet = new Set(winningNumbers);
  // Iterate over the list of card numbers and for each, check if it's in the set of
  // winning numbers.
  for (const cardNumber of cardNumbers) {
    if (winningNumbersSet.has(cardNumber)) {
      // Either double our points or set it to 1 if it's still zero.
      points = points * 2 || 1;
      // If winning number matches should only count the first time they match, we'd use
      // this opportunity to remove the winning number from the set so it won't match any
      // future occurrences of the number.
      // winningNumbersSet.remove(cardNumber)
    }
  }

  return points;
}

const TEST_SCRATCH_CARDS: { card: string; points: number }[] = [
  { card: "Card 1: 41 48 83 86 17 | 83 86  6 31 17  9 48 53", points: 8 },
  { card: "Card 2: 13 32 20 16 61 | 61 30 68 82 17 32 24 19", points: 2 },
  { card: "Card 3:  1 21 53 59 44 | 69 82 63 72 16 21 14  1", points: 2 },
  { card: "Card 4: 41 92 73 84 69 | 59 84 76 51 58  5 54 83", points: 1 },
  { card: "Card 5: 87 83 26 28 32 | 88 30 70 12 93 22 82 36", points: 0 },
  { card: "Card 6: 31 18 13 56 72 | 74 77 10 23 35 67 36 11", points: 0 },
  {
    card: "Card   8: 85 17 70 99 44 11 42 39 83 57 | 71 94 85  1 44 66 83 42 70 73 39 33 88 56 11 31 87  7 99  8 49 43 57 91 17",
    points: 512,
  },
];

for (const { card, points } of TEST_SCRATCH_CARDS) {
  const result = countPoints(card);
  if (result !== points) {
    console.error("❌, expected", points, "but got", result);
  } else {
    console.log("✅");
  }
}

import * as fs from "fs";
import * as readline from "readline";

const rl = readline.createInterface({
  input: fs.createReadStream("./2023/4.txt"),
});

let sum = 0;
rl.on("line", (line: string) => {
  const points = countPoints(line);
  sum = sum + points;
});

rl.on("close", () => {
  console.log("sum:", sum);
});

/* --- Part Two ---
Just as you're about to report your findings to the Elf, one of you realizes that the rules have actually been printed on the back of every card this whole time.

There's no such thing as "points". Instead, scratchcards only cause you to win more scratchcards equal to the number of winning numbers you have.

Specifically, you win copies of the scratchcards below the winning card equal to the number of matches. So, if card 10 were to have 5 matching numbers, you would win one copy each of cards 11, 12, 13, 14, and 15.

Copies of scratchcards are scored like normal scratchcards and have the same card number as the card they copied. So, if you win a copy of card 10 and it has 5 matching numbers, it would then win a copy of the same cards that the original card 10 won: cards 11, 12, 13, 14, and 15. This process repeats until none of the copies cause you to win any more cards. (Cards will never make you copy a card past the end of the table.)

This time, the above example goes differently:

Card 1: 41 48 83 86 17 | 83 86  6 31 17  9 48 53
Card 2: 13 32 20 16 61 | 61 30 68 82 17 32 24 19
Card 3:  1 21 53 59 44 | 69 82 63 72 16 21 14  1
Card 4: 41 92 73 84 69 | 59 84 76 51 58  5 54 83
Card 5: 87 83 26 28 32 | 88 30 70 12 93 22 82 36
Card 6: 31 18 13 56 72 | 74 77 10 23 35 67 36 11
Card 1 has four matching numbers, so you win one copy each of the next four cards: cards 2, 3, 4, and 5.
Your original card 2 has two matching numbers, so you win one copy each of cards 3 and 4.
Your copy of card 2 also wins one copy each of cards 3 and 4.
Your four instances of card 3 (one original and three copies) have two matching numbers, so you win four copies each of cards 4 and 5.
Your eight instances of card 4 (one original and seven copies) have one matching number, so you win eight copies of card 5.
Your fourteen instances of card 5 (one original and thirteen copies) have no matching numbers and win no more cards.
Your one instance of card 6 (one original) has no matching numbers and wins no more cards.
Once all of the originals and copies have been processed, you end up with 1 instance of card 1, 2 instances of card 2, 4 instances of card 3, 8 instances of card 4, 14 instances of card 5, and 1 instance of card 6. In total, this example pile of scratchcards causes you to ultimately have 30 scratchcards!

Process all of the original and copied scratchcards until no more scratchcards are won. Including the original set of scratchcards, how many total scratchcards do you end up with? */

// Dictionary mapping of card IDs to number (original + copies) of that card. It starts
// totally empty but as we copy a card with a given ID for the first time, we will extra
// +1 its value to represent the original.
const cardCounts: Record<number, number> = {};

function recordCopies(card: string): void {
  // Parse the ID of this card. The capture group should be the first element of the matches array.
  const idStr = card.match(cardIdentifierRegex)?.[1];
  if (!idStr) {
    throw new Error(`no card identifier present in card: ${card}`);
  }
  const id = parseInt(idStr, 10);

  // Make sure this card's original is recorded, if it hasn't been copied by anyone yet.
  cardCounts[id] = cardCounts[id] || 1;

  // Split the line into its list of winning numbers and scratched-off numbers.
  const [winningNumbersString, cardNumbersString] = card
    .replace(cardIdentifierRegex, "")
    .split("|");

  if (!winningNumbersString?.length || !cardNumbersString?.length) {
    throw new Error(
      `could not parse winning numbers or card numbers from card: ${card}`
    );
  }

  // Further split the list of winning numbers into an array based on separators of one or
  // more whitespace characters, and then parse integers from each number string.
  const winningNumbers = winningNumbersString
    .trim()
    .split(/\s+/)
    .map((num) => parseInt(num, 10));
  // And do the same for the scratched-off card numbers.
  const cardNumbers = cardNumbersString
    .trim()
    .split(/\s+/)
    .map((num) => parseInt(num));

  // NOTE: My solution makes the assumption that if the same winning number is matched
  // more than once, each of those instances scores points. My solution also assumes every
  // winning number is unique. Neither of these points was clear from the problem
  // description.

  // Create a set out of the winning numbers.
  const winningNumbersSet = new Set(winningNumbers);
  // Iterate over the list of card numbers and for each, check if it's in the set of
  // winning numbers.
  let matches = 0;
  for (const cardNumber of cardNumbers) {
    if (winningNumbersSet.has(cardNumber)) {
      // Record the match
      matches = matches + 1;
      // If winning number matches should only count the first time they match, we'd use
      // this opportunity to remove the winning number from the set so it won't match any
      // future occurrences of the number.
      // winningNumbersSet.remove(cardNumber)
    }
  }

  // Now, we will add copies for the next cards. We will add N copies where N is the total
  // number of original + copies of this card. We will add those copies for the next M
  // cards where M is the number of matches we found on this card.
  let matchIncrementer = 0;
  while (matchIncrementer < matches) {
    matchIncrementer = matchIncrementer + 1;
    let nextCardID = id + matchIncrementer;
    const totalCountOfCurrentCard = cardCounts[id]!;
    // Add N copies for the next card. If we hadn't copied it at all yet, make sure we
    // start at 1 to account for the original card.
    cardCounts[nextCardID] =
      (cardCounts[nextCardID] || 1) + totalCountOfCurrentCard;
  }
}

const rl2 = readline.createInterface({
  input: fs.createReadStream("./2023/4.txt"),
});

rl2.on("line", (line: string) => {
  recordCopies(line);
});

rl2.on("close", () => {
  console.log(
    "total cards:",
    Object.values(cardCounts).reduce((sum, count) => sum + count)
  );
});
