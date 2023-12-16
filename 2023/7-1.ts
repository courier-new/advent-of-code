/* --- Day 7: Camel Cards ---
Your all-expenses-paid trip turns out to be a one-way, five-minute ride in an airship. (At least it's a cool airship!) It drops you off at the edge of a vast desert and descends back to Island Island.

"Did you bring the parts?"

You turn around to see an Elf completely covered in white clothing, wearing goggles, and riding a large camel.

"Did you bring the parts?" she asks again, louder this time. You aren't sure what parts she's looking for; you're here to figure out why the sand stopped.

"The parts! For the sand, yes! Come with me; I will show you." She beckons you onto the camel.

After riding a bit across the sands of Desert Island, you can see what look like very large rocks covering half of the horizon. The Elf explains that the rocks are all along the part of Desert Island that is directly above Island Island, making it hard to even get there. Normally, they use big machines to move the rocks and filter the sand, but the machines have broken down because Desert Island recently stopped receiving the parts they need to fix the machines.

You've already assumed it'll be your job to figure out why the parts stopped when she asks if you can help. You agree automatically.

Because the journey will take a few days, she offers to teach you the game of Camel Cards. Camel Cards is sort of similar to poker except it's designed to be easier to play while riding a camel.

In Camel Cards, you get a list of hands, and your goal is to order them based on the strength of each hand. A hand consists of five cards labeled one of A, K, Q, J, T, 9, 8, 7, 6, 5, 4, 3, or 2. The relative strength of each card follows this order, where A is the highest and 2 is the lowest.

Every hand is exactly one type. From strongest to weakest, they are:

Five of a kind, where all five cards have the same label: AAAAA
Four of a kind, where four cards have the same label and one card has a different label: AA8AA
Full house, where three cards have the same label, and the remaining two cards share a different label: 23332
Three of a kind, where three cards have the same label, and the remaining two cards are each different from any other card in the hand: TTT98
Two pair, where two cards share one label, two other cards share a second label, and the remaining card has a third label: 23432
One pair, where two cards share one label, and the other three cards have a different label from the pair and each other: A23A4
High card, where all cards' labels are distinct: 23456
Hands are primarily ordered based on type; for example, every full house is stronger than any three of a kind.

If two hands have the same type, a second ordering rule takes effect. Start by comparing the first card in each hand. If these cards are different, the hand with the stronger first card is considered stronger. If the first card in each hand have the same label, however, then move on to considering the second card in each hand. If they differ, the hand with the higher second card wins; otherwise, continue with the third card in each hand, then the fourth, then the fifth.

So, 33332 and 2AAAA are both four of a kind hands, but 33332 is stronger because its first card is stronger. Similarly, 77888 and 77788 are both a full house, but 77888 is stronger because its third card is stronger (and both hands have the same first and second card).

To play Camel Cards, you are given a list of hands and their corresponding bid (your puzzle input). For example:

32T3K 765
T55J5 684
KK677 28
KTJJT 220
QQQJA 483
This example shows five hands; each hand is followed by its bid amount. Each hand wins an amount equal to its bid multiplied by its rank, where the weakest hand gets rank 1, the second-weakest hand gets rank 2, and so on up to the strongest hand. Because there are five hands in this example, the strongest hand will have rank 5 and its bid will be multiplied by 5.

So, the first step is to put the hands in order of strength:

32T3K is the only one pair and the other hands are all a stronger type, so it gets rank 1.
KK677 and KTJJT are both two pair. Their first cards both have the same label, but the second card of KK677 is stronger (K vs T), so KTJJT gets rank 2 and KK677 gets rank 3.
T55J5 and QQQJA are both three of a kind. QQQJA has a stronger first card, so it gets rank 5 and T55J5 gets rank 4.
Now, you can determine the total winnings of this set of hands by adding up the result of multiplying each hand's bid with its rank (765 * 1 + 220 * 2 + 28 * 3 + 684 * 4 + 483 * 5). So the total winnings in this example are 6440.

Find the rank of every hand in your set. What are the total winnings? */

const TEST_HANDS: { [rank: number]: string } = {
  1: "32T3K 765",
  2: "KTJJT 220",
  3: "KK677 28",
  4: "T55J5 684",
  5: "QQQJA 483",
};

function orderHands(hands: string[]): string[] {
  // If the list length is 0 or 1, it's already sorted
  if (hands.length <= 1) {
    return hands;
  }
  // Otherwise, split the list into two sublists and sort those.
  const midway = Math.floor(hands.length / 2);
  const hands1 = orderHands(hands.slice(0, midway));
  const hands2 = orderHands(hands.slice(midway));
  // Then merge the resultant lists.
  let merged: string[] = [];
  // While there are still elements in both lists...
  while (hands1.length && hands2.length) {
    const compare = compareHands(hands1[0]!, hands2[0]!);
    // Take the weaker hand and add it to the merged list.
    if (compare === -1) {
      merged.push(hands1.shift()!);
    } else {
      merged.push(hands2.shift()!);
    }
  }
  // Now, whichever list still has elements in it can just be tacked onto the end. It's
  // already sorted.
  merged = merged.concat(hands1.length ? hands1 : hands2);

  return merged;
}

// Every possible label of card, ordered from weakest to strongest
const CARD_LABELS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
  "A",
];

// Every possible type of hand, ordered from weakest to strongest
const HAND_TYPES = [
  "HIGH_CARD",
  "ONE_PAIR",
  "TWO_PAIR",
  "THREE_OF_A_KIND",
  "FULL_HOUSE",
  "FOUR_OF_A_KIND",
  "FIVE_OF_A_KIND",
];

// Helper function which compares the strengths of two hands and returns -1 if the second
// hand is stronger or 1 if the first hand is stronger.
function compareHands(hand1: string, hand2: string): -1 | 1 {
  const hand1Type = determineHandType(hand1);
  const hand2Type = determineHandType(hand2);
  // If the hands are actually the same type...
  if (hand1Type === hand2Type) {
    // Starting at the beginning, compare each card in order until the first difference.
    let index = 0;
    while (hand1[index] === hand2[index]) {
      index = index + 1;
    }
    const card1 = hand1[index]!;
    const card2 = hand2[index]!;
    // The stronger card means the stronger hand.
    return CARD_LABELS.indexOf(card1) < CARD_LABELS.indexOf(card2) ? -1 : 1;
  }
  return HAND_TYPES.indexOf(hand1Type) < HAND_TYPES.indexOf(hand2Type) ? -1 : 1;
}

type GroupSize = 1 | 2 | 3 | 4 | 5;

function determineHandType(handAndBet: string): (typeof HAND_TYPES)[number] {
  // Start by stripping the bet and sorting the cards in the hand. This will make it easier to count them.
  const cards = handAndBet
    .replace(/\s+\d+/, "")
    .split("")
    .sort();

  // We'll now count the number of groups of cards that share the same label, e.g. the
  // number of 3-of-a-kinds, pairs, singles...
  const numberOfGroups: Record<GroupSize, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let index = 0;
  let lastCard: string | undefined;
  let currentGroupSize: 0 | GroupSize = 0;
  while (index < cards.length) {
    // If the current card is the same label as the last card...
    if (lastCard && lastCard === cards[index]) {
      // Increase the current group size.
      currentGroupSize = (currentGroupSize + 1) as GroupSize;
    } else {
      // Conclude the last group and record that we found a group of that size
      if (currentGroupSize > 0) {
        numberOfGroups[currentGroupSize as GroupSize] =
          numberOfGroups[currentGroupSize as GroupSize] + 1;
      }
      // Reset the group size and last card type for the new group that's starting.
      currentGroupSize = 1;
      lastCard = cards[index];
    }
    index = index + 1;
  }
  // Now also record the final group size
  if (currentGroupSize > 0) {
    numberOfGroups[currentGroupSize as GroupSize] =
      numberOfGroups[currentGroupSize as GroupSize] + 1;
  }

  // Now from the counted groups, return the corresponding hand type.
  if (numberOfGroups[5] === 1) {
    return "FIVE_OF_A_KIND";
  } else if (numberOfGroups[4] === 1) {
    return "FOUR_OF_A_KIND";
  } else if (numberOfGroups[3] === 1 && numberOfGroups[2] === 1) {
    return "FULL_HOUSE";
  } else if (numberOfGroups[3] === 1) {
    return "THREE_OF_A_KIND";
  } else if (numberOfGroups[2] === 2) {
    return "TWO_PAIR";
  } else if (numberOfGroups[2] === 1) {
    return "ONE_PAIR";
  }
  return "HIGH_CARD";
}

// Test cases
const orderedTestHands = orderHands(
  Object.values(TEST_HANDS).sort(() => (Math.random() > 0.5 ? 1 : -1))
);
let index = 0;
let testSum = 0;
while (index < orderedTestHands.length) {
  const hand = orderedTestHands[index];
  if (TEST_HANDS[index + 1] !== hand) {
    console.error(
      "❌, expected",
      TEST_HANDS[index + 1],
      "in rank",
      index + 1,
      "but got",
      hand
    );
  } else {
    console.log("✅");
    // For each hand, we want to sum the product of the hand's bid with its rank (index +
    // 1). First we need to parse the bid.
    const bid = parseInt(hand?.split(/\s+/)[1] || "", 10);
    if (Number.isNaN(bid)) {
      throw new Error(`could not determine bid for hand: ${hand}`);
    }
    testSum = testSum + bid * (index + 1);
  }
  index = index + 1;
}
if (testSum !== 6440) {
  console.error("❌, got wrong sum: expected", 6440, "but got", testSum);
}

// Now try on our real document with every hand in our set.
import * as fs from "fs";

fs.readFile("./2023/7.txt", (err, rawFile) => {
  if (err) throw err;
  const unorderedHands = rawFile.toString().split(/\n/);
  const hands = orderHands(unorderedHands);
  let index = 0;
  let sum = 0;
  while (index < hands.length) {
    const hand = hands[index];
    // For each hand, we want to sum the product of the hand's bid with its rank (index +
    // 1). First we need to parse the bid.
    const bid = parseInt(hand?.split(/\s+/)[1] || "", 10);
    if (Number.isNaN(bid)) {
      throw new Error(
        `could not determine bid for hand: ${hand} at index ${index}`
      );
    }
    sum = sum + bid * (index + 1);
    index = index + 1;
  }
  console.log("sum", sum);
});
