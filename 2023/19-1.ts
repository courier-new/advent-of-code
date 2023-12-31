/* --- Day 19: Aplenty ---
The Elves of Gear Island are thankful for your help and send you on your way. They even have a hang glider that someone stole from Desert Island; since you're already going that direction, it would help them a lot if you would use it to get down there and return it to them.

As you reach the bottom of the relentless avalanche of machine parts, you discover that they're already forming a formidable heap. Don't worry, though - a group of Elves is already here organizing the parts, and they have a system.

To start, each part is rated in each of four categories:

x: Extremely cool looking
m: Musical (it makes a noise when you hit it)
a: Aerodynamic
s: Shiny

Then, each part is sent through a series of workflows that will ultimately accept or reject the part. Each workflow has a name and contains a list of rules; each rule specifies a condition and where to send the part if the condition is true. The first rule that matches the part being considered is applied immediately, and the part moves on to the destination described by the rule. (The last rule in each workflow has no condition and always applies if reached.)

Consider the workflow ex{x>10:one,m<20:two,a>30:R,A}. This workflow is named ex and contains four rules. If workflow ex were considering a specific part, it would perform the following steps in order:

Rule "x>10:one": If the part's x is more than 10, send the part to the workflow named one.
Rule "m<20:two": Otherwise, if the part's m is less than 20, send the part to the workflow named two.
Rule "a>30:R": Otherwise, if the part's a is more than 30, the part is immediately rejected (R).
Rule "A": Otherwise, because no other rules matched the part, the part is immediately accepted (A).

If a part is sent to another workflow, it immediately switches to the start of that workflow instead and never returns. If a part is accepted (sent to A) or rejected (sent to R), the part immediately stops any further processing.

The system works, but it's not keeping up with the torrent of weird metal shapes. The Elves ask if you can help sort a few parts and give you the list of workflows and some part ratings (your puzzle input). For example:

px{a<2006:qkq,m>2090:A,rfg}
pv{a>1716:R,A}
lnx{m>1548:A,A}
rfg{s<537:gd,x>2440:R,A}
qs{s>3448:A,lnx}
qkq{x<1416:A,crn}
crn{x>2662:A,R}
in{s<1351:px,qqz}
qqz{s>2770:qs,m<1801:hdj,R}
gd{a>3333:R,R}
hdj{m>838:A,pv}

{x=787,m=2655,a=1222,s=2876}
{x=1679,m=44,a=2067,s=496}
{x=2036,m=264,a=79,s=2244}
{x=2461,m=1339,a=466,s=291}
{x=2127,m=1623,a=2188,s=1013}

The workflows are listed first, followed by a blank line, then the ratings of the parts the Elves would like you to sort. All parts begin in the workflow named in. In this example, the five listed parts go through the following workflows:

{x=787,m=2655,a=1222,s=2876}: in -> qqz -> qs -> lnx -> A
{x=1679,m=44,a=2067,s=496}: in -> px -> rfg -> gd -> R
{x=2036,m=264,a=79,s=2244}: in -> qqz -> hdj -> pv -> A
{x=2461,m=1339,a=466,s=291}: in -> px -> qkq -> crn -> R
{x=2127,m=1623,a=2188,s=1013}: in -> px -> rfg -> A

Ultimately, three parts are accepted. Adding up the x, m, a, and s rating for each of the accepted parts gives 7540 for the part with x=787, 4623 for the part with x=2036, and 6951 for the part with x=2127. Adding all of the ratings for all of the accepted parts gives the sum total of 19114.

Sort through all of the parts you've been given; what do you get if you add together all of the rating numbers for all of the parts that ultimately get accepted? */

type RatingCategory = "x" | "m" | "a" | "s";
type Part = Record<RatingCategory, number>;

/**
 * The result of following a workflow and finding the rule that applies is either:
 * - the part is sent to another workflow (return done: false)
 * - the part is accepted or rejected (return done: true).
 */
type WorkflowResult =
  | { done: false; nextWorkflow: string }
  | { done: true; accept: boolean };

/**
 * The result of evaluating a rule will be one of the following:
 * - the rule fails (return pass: false)
 * - the rule passes and we have the result of the workflow that this rule came from
 *   (return pass: true and WorkflowResult)
 */
type RuleResult = { pass: false } | { pass: true; result: WorkflowResult };

/**
 * A RuleFunction evaluates a rule for a given Part. For example, for a<2006:wbp
 * ruleFn({a: 2005, ...}) // { pass: true, result: ... }
 * ruleFn({a: 2006, ...}) // { pass: false }
 * ruleFn({a: 2007, ...}) // { pass: false }
 */
type RuleFunction = (part: Part) => RuleResult;

/**
 * A WorkflowFunction applies as many workflow rules to a Part as are necessary to
 * determine the workflow outcome for that part. If the workflow outcome sends the Part to
 * a new workflow, it returns done: false and the ID of the next workflow. Otherwise, it
 * returns done: true and the conclusion on whether or not the part is accepted.
 */
type WorkflowFunction = (part: Part) => WorkflowResult;

type Workflows = Record<string, WorkflowFunction>;

function parseWorkflow(line: string): [id: string, fn: WorkflowFunction] {
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

      // Build our function to evaluate the part.
      return (part: Part) => {
        // If we're evaluating greater than and it passes
        if (gt && part[property] > amount) {
          return { pass: true, result };
        } // Otherwise, if we're evaluating less than and it passes
        if (lt && part[property] < amount) {
          return { pass: true, result };
        }
        // Otherwise, the rule did not pass.
        return { pass: false };
      };
    }

    // Otherwise, the rule must be a default, so it should always apply.
    const result = getResult(rule);
    return () => ({ pass: true, result });
  });

  // Now, build our workflow from the rules.
  const workflowFn: WorkflowFunction = (part: Part) => {
    // Make a copy of the ruleFns so we can mutate it for this particular evaluation.
    const ruleFns_ = [...ruleFns];
    let ruleResult: RuleResult = { pass: false };
    // Until we find a rule that our part passes, keep evaluating each next rule in order.
    while (!ruleResult.pass) {
      const nextRule = ruleFns_.shift();
      if (!nextRule) {
        throw new Error(
          `Found no more rules to apply to part ${JSON.stringify(
            part
          )} but part still did not pass. Workflow id: ${id}`
        );
      }
      ruleResult = nextRule(part);
    }
    // We found our result!
    return ruleResult.result;
  };

  return [id, workflowFn];
}

// Helper function which asserts if a string is really a valid rating category of a part
// or not.
function isRatingCategory(s?: string): s is RatingCategory {
  return s === "x" || s === "m" || s === "a" || s === "s";
}

// Helper function which returns the corresponding WorkflowResult object for a given
// result string input.
function getResult(r: string): WorkflowResult {
  if (r === "A") return { done: true, accept: true };
  if (r === "R") return { done: true, accept: false };
  return { done: false, nextWorkflow: r };
}

// Test workflow parsing and rule evaluation.
const [_, wfTestFn] = parseWorkflow("px{a<2006:qkq,m>2090:A,rfg}");
const wfTest1 = wfTestFn({ a: 2005, x: 0, m: 0, s: 0 });
const wfTest2 = wfTestFn({ a: 2006, x: 0, m: 2091, s: 0 });
const wfTest3 = wfTestFn({ a: 2006, x: 0, m: 2090, s: 0 });
if (wfTest1.done || wfTest1.nextWorkflow !== "qkq") {
  console.error("❌, expected not done and qkq but got", wfTest1);
} else if (!wfTest2.done || !wfTest2.accept) {
  console.error("❌, expected done and accepted but got", wfTest2);
} else if (wfTest3.done || wfTest3.nextWorkflow !== "rfg") {
  console.error("❌, expected not done and rfg but got", wfTest3);
} else {
  console.log("✅");
}

// Helper function which parses a Part object from a raw input line.
function parsePart(line: string): Part {
  // Split out each category rating for the part.
  const { x, m, a, s } =
    line.match(/{x=(?<x>\d+),m=(?<m>\d+),a=(?<a>\d+),s=(?<s>\d+)}/)?.groups ||
    {};
  if (!x || !m || !a || !s) {
    throw new Error(`Could not parse all category ratings for part ${line}`);
  }
  return {
    x: parseInt(x, 10),
    m: parseInt(m, 10),
    a: parseInt(a, 10),
    s: parseInt(s, 10),
  };
}

// Helper function which passes a part through each workflow as necessary until the part
// is either accepted or rejected, and then returns the result.
function evaluatePart(part: Part, workflows: Workflows): boolean {
  // Evaluate our first workflow.
  let result: WorkflowResult = workflows["in"]!(part);
  // Until we find a workflow that gives a final result for our part, keep evaluating each
  // next workflow we are sent to.
  while (!result.done) {
    const nextWorkflow = workflows[result.nextWorkflow];
    if (!nextWorkflow) {
      throw new Error(`Could not find workflow for ID ${result.nextWorkflow}`);
    }
    result = nextWorkflow(part);
  }
  return result.accept;
}

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
  const [id, fn] = parseWorkflow(workflow);
  testWorkflows[id] = fn;
}

// 7540 for the part with x=787, 4623 for the part with x=2036, and 6951 for the part with x=2127. Adding all of the ratings for all of the accepted parts gives the sum total of 19114.
const TEST_PARTS: { part: string; accepted: boolean; sum: number }[] = [
  { part: "{x=787,m=2655,a=1222,s=2876}", accepted: true, sum: 7540 },
  { part: "{x=1679,m=44,a=2067,s=496}", accepted: false, sum: 0 },
  { part: "{x=2036,m=264,a=79,s=2244}", accepted: true, sum: 4623 },
  { part: "{x=2461,m=1339,a=466,s=291}", accepted: false, sum: 0 },
  { part: "{x=2127,m=1623,a=2188,s=1013}", accepted: true, sum: 6951 },
];

for (const { part: partStr, accepted, sum } of TEST_PARTS) {
  const part = parsePart(partStr);
  // Evaluate the part.
  const acceptedResult = evaluatePart(part, testWorkflows);
  if (accepted !== acceptedResult) {
    console.error(
      `❌, expected ${accepted ? "accepted" : "not accepted"} but got ${
        acceptedResult ? "accepted" : "not accepted"
      } for part`,
      part
    );
  }
  // If it was accepted, find its sum.
  const sumResult = accepted ? part.x + part.m + part.a + part.s : 0;
  if (sum !== sumResult) {
    console.error(
      "❌, expected sum",
      sum,
      "but got",
      sumResult,
      "for part",
      part
    );
  }
}

// Now try for our actual parts and workflows.
import * as readline from "readline";
import * as fs from "fs";

const rl = readline.createInterface(fs.createReadStream("./2023/19.txt"));

const workflows: Workflows = {};
let sum = 0;

rl.on("line", (line) => {
  // Workflows should all come first, then a blank line, then inputs.
  if (line.length) {
    if (!line.startsWith("{")) {
      // It's a workflow. Parse it and add it to the map.
      const [id, fn] = parseWorkflow(line);
      workflows[id] = fn;
    } else {
      // It's an input. Parse it, see if the part would be accepted, and add it to the sum if so.
      const part = parsePart(line);
      const accepted = evaluatePart(part, workflows);
      if (accepted) {
        sum = sum + part.x + part.m + part.a + part.s;
      }
    }
  }
});

rl.on("close", () => {
  console.log("part 1 sum:", sum);
});
