/* --- Part Two ---
To make things a little more interesting, the Elf introduces one additional rule. Now, J cards are jokers - wildcards that can act like whatever card would make the hand the strongest type possible.

To balance this, J cards are now the weakest individual cards, weaker even than 2. The other cards stay in the same order: A, K, Q, T, 9, 8, 7, 6, 5, 4, 3, 2, J.

J cards can pretend to be whatever card is best for the purpose of determining hand type; for example, QJJQ2 is now considered four of a kind. However, for the purpose of breaking ties between two hands of the same type, J is always treated as J, not the card it's pretending to be: JKKK2 is weaker than QQQQ2 because J is weaker than Q.

Now, the above example goes very differently:

32T3K 765
T55J5 684
KK677 28
KTJJT 220
QQQJA 483
32T3K is still the only one pair; it doesn't contain any jokers, so its strength doesn't increase.
KK677 is now the only two pair, making it the second-weakest hand.
T55J5, KTJJT, and QQQJA are now all four of a kind! T55J5 gets rank 3, QQQJA gets rank 4, and KTJJT gets rank 5.
With the new joker rule, the total winnings in this example are 5905.

Using the new joker rule, find the rank of every hand in your set. What are the new total winnings? */

const TEST_HANDS: { [rank: number]: string } = {
  1: "32T3K 765",
  2: "KK677 28",
  3: "T55J5 684",
  4: "QQQJA 483",
  5: "KTJJT 220",
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
  let merged = [];
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
  "J",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
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
  // number of 3-of-a-kinds, pairs..., as well as the number of jokers encountered.
  const numberOfGroups: Record<GroupSize, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  let numberOfJokers = 0;

  let index = 0;
  let lastCard: string | undefined;
  let currentGroupSize: 0 | GroupSize = 0;
  while (index < cards.length) {
    // If the current card is a joker, just count it and move on.
    if (cards[index] === "J") {
      numberOfJokers = numberOfJokers + 1;
    }
    // If the current card is the same label as the last card...
    else if (lastCard && lastCard === cards[index]) {
      // Increase the current group size.
      currentGroupSize = (currentGroupSize + 1) as GroupSize;
    } else {
      // Otherwise, conclude the last group and record that we found a group of that size
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

  // Now apply the jokers.
  if (numberOfJokers === 5) {
    // Convert them to a group of 5.
    numberOfGroups[5] = 1;
  } else if (numberOfJokers === 4) {
    // Combine them with the 1.
    numberOfGroups[1] = 0;
    numberOfGroups[5] = 1;
  } else if (numberOfJokers === 3) {
    // If the other two cards formed a pair, merge them to form a group of 5.
    if (numberOfGroups[2] === 1) {
      numberOfGroups[2] = 0;
      numberOfGroups[5] = 1;
    } else {
      // Otherwise, take one single and merge it to form a group of 4.
      numberOfGroups[1] = 1;
      numberOfGroups[4] = 1;
    }
  } else if (numberOfJokers === 2) {
    // If the other cards formed a group of 3, merge them to form a group of 5.
    if (numberOfGroups[3] === 1) {
      numberOfGroups[3] = 0;
      numberOfGroups[5] = 1;
    } // Otherwise if there was another pair, merge them to form a group of 4.
    else if (numberOfGroups[2] === 1) {
      numberOfGroups[2] = 0;
      numberOfGroups[4] = 1;
    } // Otherwise, take one single and merge it to form a group of 3.
    else {
      numberOfGroups[1] = numberOfGroups[1] - 1;
      numberOfGroups[3] = 1;
    }
  } else if (numberOfJokers === 1) {
    // If the other cards form a group of 4, merge them to form a group of 5.
    if (numberOfGroups[4] === 1) {
      numberOfGroups[4] = 0;
      numberOfGroups[5] = 1;
    } // Otherwise if the other cards formed a group of 3, merge them to form a group of 4.
    else if (numberOfGroups[3] === 1) {
      numberOfGroups[3] = 0;
      numberOfGroups[4] = 1;
    } // Otherwise if there was at least one pair, take one and use it to form a group of 3.
    else if (numberOfGroups[2] >= 1) {
      numberOfGroups[2] = numberOfGroups[2] - 1;
      numberOfGroups[3] = 1;
    } // Otherwise, take one single and merge it to form a group of 2.
    else {
      numberOfGroups[1] = numberOfGroups[1] - 1;
      numberOfGroups[2] = 1;
    }
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
if (testSum !== 5905) {
  console.error("❌, got wrong sum: expected", 5905, "but got", testSum);
}

// Now try on our real document with every hand in our set.
import * as fs from "fs";

fs.readFile("./advent-of-code-2023/7.txt", (err, rawFile) => {
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
