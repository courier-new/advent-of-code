/* --- Part Two ---
Even with your help, the sorting process still isn't fast enough.

One of the Elves comes up with a new plan: rather than sort parts individually through all of these workflows, maybe you can figure out in advance which combinations of ratings will be accepted or rejected.

Each of the four ratings (x, m, a, s) can have an integer value ranging from a minimum of 1 to a maximum of 4000. Of all possible distinct combinations of ratings, your job is to figure out which ones will be accepted.

In the above example, there are 167409079868000 distinct combinations of ratings that will be accepted.

Consider only your list of workflows; the list of part ratings that the Elves wanted you to sort is no longer relevant. How many distinct combinations of ratings will be accepted by the Elves' workflows? */

import { exit } from "process";

// NOTE: Types have been adapted from part 1 to convey what ranges of part rating
// categories would lead to which results.

type RatingCategory = "x" | "m" | "a" | "s";
type RatingRange = [min: number, max: number];
type PartRanges = Record<RatingCategory, RatingRange>;

/**
 * For each rule in a workflow, evaluating how one set of PartRanges interacts with it
 * will lead to one of three outcomes:
 * - the PartRanges entirely passes and follows the result of the rule.
 * - the PartRanges entirely fails and needs to skip to the next rule.
 * - the PartRanges splits into two mutually exclusive ranges: the PartRanges for which
 *   the rule passes, and the PartRanges for which the rule fails.
 *
 * We will call passing ranges `PassingResult`s and failing ranges `FailingResult`s.
 */
type TerminalPassingResult = {
  done: true;
  ranges: PartRanges;
  accept: boolean;
};
type PassingResult =
  | { done: false; ranges: PartRanges; nextWorkflow: string }
  | TerminalPassingResult;

type FailingResult = { ranges: PartRanges };

type RuleResult =
  // The range entirely passes
  | { pass: PassingResult; fail: null }
  // The range entirely fails
  | { pass: null; fail: FailingResult }
  // The range splits into passing and failing parts
  | { pass: PassingResult; fail: FailingResult };

/** A RuleFunction evaluates a rule for a given PartRanges. */
type RuleFunction = (part: PartRanges) => RuleResult;

type Workflows = Record<string, RuleFunction[]>;

const MIN_RATING = 1;
const MAX_RATING = 4000;

function parseWorkflow(line: string): [id: string, rules: RuleFunction[]] {
  // Split out the workflow ID and rules.
  const { id, rulesStr } =
    line.match(/(?<id>[a-z]+){(?<rulesStr>[^{]*)}/)?.groups || {};
  if (!id || !rulesStr) {
    throw new Error(
      `could not distinguish workflow ID or rules from line: ${line}`
    );
  }

  const rules = rulesStr.split(",");
  const ruleFns: RuleFunction[] = rules.map((rule) => {
    // If the rule requires evaluating one of the part's rating categories...
    const gt = rule.includes(">");
    const lt = rule.includes("<");
    if (gt || lt) {
      // The rule is going to yield a split of PartRanges. First, let's understand when
      // the rule would pass/fail and what should happen to PartRanges in either case.

      // Split the rule into each piece.
      //        a         <   3000        :  wbp
      const [property = "", amountStr = "", resultStr] = rule.split(/[<>:]/);
      if (!isRatingCategory(property)) {
        throw new Error(`Could not parse rating property from rule: ${rule}`);
      }
      const amount = parseInt(amountStr, 10);
      if (isNaN(amount)) {
        throw new Error(`Could not parse rating amount from rule: ${rule}`);
      }
      if (!resultStr) {
        throw new Error(`Could not parse result from rule: ${rule}`);
      }
      const result = getResult(resultStr);

      // Build our function to handle the split.
      return (rangesIn: PartRanges): RuleResult => {
        const [inMin, inMax] = rangesIn[property];

        // If we're evaluating greater than...
        if (gt) {
          // If it's impossible to pass the rule, e.g. range is 0-2000 but rule is >2000.
          if (amount >= inMax) {
            // No ranges pass, and we shouldn't follow the result of passing any further.
            // Consequently, our entire input range fails and should be passed on to the
            // next rule in the workflow.
            return {
              pass: null,
              fail: { ranges: rangesIn },
            };
          }
          // Otherwise, if our entire input range would pass the rule, e.g. range is
          // 2000-4000 and rule is >1999.
          if (amount < inMin) {
            // No ranges fail, and we shouldn't follow the result of failing any further.
            // Consequently, our entire input range passes. Make sure we follow this range
            // to a terminal result, in case it's not done.
            return { fail: null, pass: { ...result, ranges: rangesIn } };
          }
          // Otherwise, we need to split into two ranges by cutting the range into chunks:
          // everything up to the gt amount, which fails, and everything the gt amount + 1
          // and beyond, which passes.
          const failRange: RatingRange = [inMin, amount];
          const passRange: RatingRange = [amount + 1, inMax];
          return {
            fail: { ranges: { ...rangesIn, [property]: failRange } },
            pass: { ...result, ranges: { ...rangesIn, [property]: passRange } },
          };
        }

        // Otherwise, we're evaluating less than.
        // If it's impossible to pass the rule, e.g. range is 2000-4000 but rule is <2000.
        if (amount <= inMin) {
          // No ranges pass, and we shouldn't follow the result of passing any further.
          // Consequently, our entire input range fails and should be passed on to the
          // next rule in the workflow.
          return {
            pass: null,
            fail: { ranges: rangesIn },
          };
        }
        // Otherwise, if our entire input range would pass the rule, e.g. range is
        // 1000-2000 and rule is <2001.
        if (amount > inMax) {
          // No ranges fail, and we shouldn't follow the result of failing any further.
          // Consequently, our entire input range passes. Make sure we follow this range
          // to a terminal result, in case it's not done.
          return { fail: null, pass: { ...result, ranges: rangesIn } };
        }
        // Otherwise, we need to split into two ranges by cutting the range into chunks:
        // everything up to the lt amount - 1, which passes, and everything the lt amount
        // and beyond, which fails.
        const failRange: RatingRange = [amount, inMax];
        const passRange: RatingRange = [inMin, amount - 1];
        return {
          fail: { ranges: { ...rangesIn, [property]: failRange } },
          pass: { ...result, ranges: { ...rangesIn, [property]: passRange } },
        };
      };
    }

    // Otherwise, the rule must be a default rule. In that case, the full input range
    // passes and should be followed through to its result.
    const result = getResult(rule);
    return (rangesIn) => ({
      pass: { ...result, ranges: rangesIn },
      fail: null,
    });
  });

  return [id, ruleFns];
}

// Helper function which asserts if a string is really a valid rating category of a part
// or not.
function isRatingCategory(s?: string): s is RatingCategory {
  return s === "x" || s === "m" || s === "a" || s === "s";
}

// Helper function which returns the corresponding partial PassingResult object
// (everything except the passing range) for a given result string input.
function getResult(r: string) {
  if (r === "A")
    return {
      done: true,
      accept: true,
    } as const satisfies Partial<PassingResult>;
  if (r === "R")
    return {
      done: true,
      accept: false,
    } as const satisfies Partial<PassingResult>;
  return {
    done: false,
    nextWorkflow: r,
  } as const satisfies Partial<PassingResult>;
}

// Test workflow parsing and rule evaluation.
const [_, testRules] = parseWorkflow("px{a<2006:qkq,m>2090:A,rfg}");
if (testRules.length !== 3) {
  console.error("❌, expected 3 rules but got", testRules.length);
  exit(1);
}
let { pass, fail } = testRules[0]!({
  x: [MIN_RATING, MAX_RATING],
  m: [MIN_RATING, MAX_RATING],
  a: [MIN_RATING, MAX_RATING],
  s: [MIN_RATING, MAX_RATING],
});
if (!pass || !fail) {
  console.error(
    "❌, expected non-null pass and fail results but got null for one or both"
  );
  exit(1);
}
// Check the passing ranges
for (const property in pass.ranges) {
  const [min, max] = pass.ranges[property as RatingCategory];
  // Passing range for a should be narrowed to 0-2005, all other ranges should stay MIN-MAX
  if (property === "a" && (min !== MIN_RATING || max !== 2005)) {
    console.error(
      "❌, expected",
      [MIN_RATING, 2005],
      "for property",
      property,
      "but got",
      [min, max]
    );
  } else if (property !== "a" && (min !== MIN_RATING || max !== MAX_RATING)) {
    console.error(
      "❌, expected",
      [MIN_RATING, MAX_RATING],
      "for property",
      property,
      "but got",
      [min, max]
    );
  }
}
// Check the passing result
if (pass.done || pass.nextWorkflow !== "qkq") {
  console.error(
    "❌, expected next workflow of qkq but got",
    pass.done ? "done" : pass.nextWorkflow
  );
}
// Check the failing result
for (const property in fail.ranges) {
  const [min, max] = fail.ranges[property as RatingCategory];
  // Failing range for a should be narrowed to 2006-4000, all other ranges should stay MIN-MAX
  if (property === "a" && (min !== 2006 || max !== 4000)) {
    console.error(
      "❌, expected",
      [2006, MAX_RATING],
      "for property",
      property,
      "but got",
      [min, max]
    );
  } else if (property !== "a" && (min !== MIN_RATING || max !== MAX_RATING)) {
    console.error(
      "❌, expected",
      [MIN_RATING, MAX_RATING],
      "for property",
      property,
      "but got",
      [min, max]
    );
  }
}

// Helper function which starts with the full range for all part rating categories and
// slowly breaks it into smaller PartRanges as it evaluates each rule, until it either
// finds that each PartRanges is accepted or rejected. It returns the list of every
// accepted PartRanges.
function findAcceptedRanges(workflows: Workflows): PartRanges[] {
  const acceptedRanges: PartRanges[] = [];

  // Start with the full range for all part categories and the workflow "in".
  const start: PassingResult = {
    done: false,
    nextWorkflow: "in",
    ranges: {
      x: [MIN_RATING, MAX_RATING],
      m: [MIN_RATING, MAX_RATING],
      a: [MIN_RATING, MAX_RATING],
      s: [MIN_RATING, MAX_RATING],
    },
  };

  // We'll keep a queue of non-terminal result PartRanges, i.e. the ones that we need to
  // keep evaluating. Once a PartRanges reaches a terminal result (done: true and
  // accept/reject), it will leave the queue and conditionally be added to the
  // acceptedRanges if it was accepted.
  const undeterminedRanges: Exclude<PassingResult, TerminalPassingResult>[] = [
    start,
  ];

  // While there are still ranges to check...
  while (undeterminedRanges.length) {
    const current = undeterminedRanges.pop()!;
    const workflow = workflows[current.nextWorkflow];
    if (!workflow) {
      throw new Error(`Could not find workflow for ID ${current.nextWorkflow}`);
    }

    let currentRanges = current.ranges;
    // For each rule in the workflow...
    for (const rule of workflow) {
      // See how the rule interacts with our current ranges.
      const { pass, fail } = rule(currentRanges);
      // Check if our passing result is a terminal result or not, and deal with it
      // accordingly: record it to acceptances if it's accepted, discard it if it's
      // rejected, and put it back in the queue if it was non-terminal.
      if (pass?.done) {
        if (pass.accept) {
          acceptedRanges.push(pass.ranges);
        }
      } else if (pass?.nextWorkflow) {
        undeterminedRanges.push(pass);
      }

      // If nothing failed, we can stop evaluating the workflow.
      if (!fail) break;

      // Otherwise, move on to the next rule with the narrowe set of failing ranges.
      currentRanges = fail.ranges;
    }
  }
  return acceptedRanges;
}

// Helper function which computes the total number of combinations that can be formed from
// a PartRanges.
function calculateCombinations(ranges: PartRanges): number {
  // The total number of combinations is equal to:
  //   the number of potential values for x
  //                   x
  //   the number of potential values for m
  //                   x
  //   the number of potential values for a
  //                   x
  //   the number of potential values for s
  let product = 1;
  for (const property in ranges) {
    const [min, max] = ranges[property as RatingCategory];
    product = product * (max - min + 1); // + 1 to be inclusive of the end value of the range.
  }

  return product;
}

// Test cases.
const TEST_WORKFLOWS = `px{a<2006:qkq,m>2090:A,rfg}
pv{a>1716:R,A}
lnx{m>1548:A,A}
rfg{s<537:gd,x>2440:R,A}
qs{s>3448:A,lnx}
qkq{x<1416:A,crn}
crn{x>2662:A,R}
in{s<1351:px,qqz}
qqz{s>2770:qs,m<1801:hdj,R}
gd{a>3333:R,R}
hdj{m>838:A,pv}`;

const testWorkflows: Workflows = {};

for (const workflow of TEST_WORKFLOWS.split("\n")) {
  const [id, rules] = parseWorkflow(workflow);
  testWorkflows[id] = rules;
}

const testAcceptedRanges = findAcceptedRanges(testWorkflows);
const testTotal = testAcceptedRanges.reduce(
  (sum, ranges) => sum + calculateCombinations(ranges),
  0
);
if (testTotal !== 167409079868000) {
  console.error(
    "❌, got wrong total combinations, expected",
    167409079868000,
    "but got",
    testTotal,
    `(${Math.abs(testTotal - 167409079868000)} off)`
  );
} else {
  console.log("✅");
}

// Now try for our actual workflows.
import * as readline from "readline";
import * as fs from "fs";

const rl = readline.createInterface(fs.createReadStream("./2023/19.txt"));

const workflows: Workflows = {};

rl.on("line", (line) => {
  // Workflows should all come first, then a blank line, then inputs.
  if (line.length && !line.startsWith("{")) {
    // It's a workflow. Parse it and add it to the map.
    const [id, rules] = parseWorkflow(line);
    workflows[id] = rules;
  } else {
    // It's an input or blank line. Discard it by doing nothing.
  }
});

rl.on("close", () => {
  const acceptedRanges = findAcceptedRanges(workflows);
  const combinations = acceptedRanges.reduce(
    (sum, ranges) => sum + calculateCombinations(ranges),
    0
  );
  console.log("total combinations:", combinations);
});
