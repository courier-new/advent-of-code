/* --- Day 20: Pulse Propagation ---
With your help, the Elves manage to find the right parts and fix all of the machines. Now,
they just need to send the command to boot up the machines and get the sand flowing again.

The machines are far apart and wired together with long cables. The cables don't connect
to the machines directly, but rather to communication modules attached to the machines
that perform various initialization tasks and also act as communication relays.

Modules communicate using pulses. Each pulse is either a high pulse or a low pulse. When a
module sends a pulse, it sends that type of pulse to each module in its list of
destination modules.

There are several different types of modules:

Flip-flop modules (prefix %) are either on or off; they are initially off. If a flip-flop
module receives a high pulse, it is ignored and nothing happens. However, if a flip-flop
module receives a low pulse, it flips between on and off. If it was off, it turns on and
sends a high pulse. If it was on, it turns off and sends a low pulse.

Conjunction modules (prefix &) remember the type of the most recent pulse received from
each of their connected input modules; they initially default to remembering a low pulse
for each input. When a pulse is received, the conjunction module first updates its memory
for that input. Then, if it remembers high pulses for all inputs, it sends a low pulse;
otherwise, it sends a high pulse.

There is a single broadcast module (named broadcaster). When it receives a pulse, it sends
the same pulse to all of its destination modules.

Here at Desert Machine Headquarters, there is a module with a single button on it called,
aptly, the button module. When you push the button, a single low pulse is sent directly to
the broadcaster module.

After pushing the button, you must wait until all pulses have been delivered and fully
handled before pushing it again. Never push the button if modules are still processing
pulses.

Pulses are always processed in the order they are sent. So, if a pulse is sent to modules
a, b, and c, and then module a processes its pulse and sends more pulses, the pulses sent
to modules b and c would have to be handled first.

The module configuration (your puzzle input) lists each module. The name of the module is
preceded by a symbol identifying its type, if any. The name is then followed by an arrow
and a list of its destination modules. For example:

broadcaster -> a, b, c
%a -> b
%b -> c
%c -> inv
&inv -> a

In this module configuration, the broadcaster has three destination modules named a, b,
and c. Each of these modules is a flip-flop module (as indicated by the % prefix). a
outputs to b which outputs to c which outputs to another module named inv. inv is a
conjunction module (as indicated by the & prefix) which, because it has only one input,
acts like an inverter (it sends the opposite of the pulse type it receives); it outputs to
a.

By pushing the button once, the following pulses are sent:

button -low-> broadcaster
broadcaster -low-> a
broadcaster -low-> b
broadcaster -low-> c
a -high-> b
b -high-> c
c -high-> inv
inv -low-> a
a -low-> b
b -low-> c
c -low-> inv
inv -high-> a

After this sequence, the flip-flop modules all end up off, so pushing the button again
repeats the same sequence.

Here's a more interesting example:

broadcaster -> a
%a -> inv, con
&inv -> b
%b -> con
&con -> output

This module configuration includes the broadcaster, two flip-flops (named a and b), a
single-input conjunction module (inv), a multi-input conjunction module (con), and an
untyped module named output (for testing purposes). The multi-input conjunction module con
watches the two flip-flop modules and, if they're both on, sends a low pulse to the output
module.

Here's what happens if you push the button once:

button -low-> broadcaster
broadcaster -low-> a
a -high-> inv
a -high-> con
inv -low-> b
con -high-> output
b -high-> con
con -low-> output

Both flip-flops turn on and a low pulse is sent to output! However, now that both
flip-flops are on and con remembers a high pulse from each of its two inputs, pushing the
button a second time does something different:

button -low-> broadcaster
broadcaster -low-> a
a -low-> inv
a -low-> con
inv -high-> b
con -high-> output

Flip-flop a turns off! Now, con remembers a low pulse from module a, and so it sends only
a high pulse to output.

Push the button a third time:

button -low-> broadcaster
broadcaster -low-> a
a -high-> inv
a -high-> con
inv -low-> b
con -low-> output
b -low-> con
con -high-> output

This time, flip-flop a turns on, then flip-flop b turns off. However, before b can turn
off, the pulse sent to con is handled first, so it briefly remembers all high pulses for
its inputs and sends a low pulse to output. After that, flip-flop b turns off, which
causes con to update its state and send a high pulse to output.

Finally, with a on and b off, push the button a fourth time:

button -low-> broadcaster
broadcaster -low-> a
a -low-> inv
a -low-> con
inv -high-> b
con -high-> output

This completes the cycle: a turns off, causing con to remember only low pulses and
restoring all modules to their original states.

To get the cables warmed up, the Elves have pushed the button 1000 times. How many pulses
got sent as a result (including the pulses sent by the button itself)?

In the first example, the same thing happens every time the button is pushed: 8 low pulses
and 4 high pulses are sent. So, after pushing the button 1000 times, 8000 low pulses and
4000 high pulses are sent. Multiplying these together gives 32000000.

In the second example, after pushing the button 1000 times, 4250 low pulses and 2750 high
pulses are sent. Multiplying these together gives 11687500.

Consult your module configuration; determine the number of low pulses and high pulses that
would be sent after pushing the button 1000 times, waiting for all pulses to be fully
handled after each push of the button. What do you get if you multiply the total number of
low pulses sent by the total number of high pulses sent? */

type ModuleID = string;

type PulseType = "high" | "low";
type Pulse = {
  type: PulseType;
  sourceID: ModuleID;
  destinationID: ModuleID;
};

type ModuleType = "broadcaster" | "flip-flop" | "conjunction" | "test";

type TestModule = { type: "test" };
type BroadcasterModule = { type: "broadcaster"; destinationIDs: ModuleID[] };
type FlipFlopModule = {
  type: "flip-flop";
  destinationIDs: ModuleID[];
  // Flip-flop modules also have an internal on/off state.
  on: boolean;
};
type ConjunctionModule = {
  type: "conjunction";
  destinationIDs: ModuleID[];
  // Conjunction modules remember the most recent pulses from each of their connected
  // input modules.
  inputs: Record<ModuleID, PulseType>;
};

type Module = { id: ModuleID } & (
  | TestModule
  | BroadcasterModule
  | FlipFlopModule
  | ConjunctionModule
);

type ModuleLookup = Record<ModuleID, Module>;

// Function which takes a module and a pulse sent to that module and determines
// what to do in response. It returns the updated module after reacting to the pulse and
// the list of any resultant pulses that it emits.
function handlePulse(
  module: Module,
  pulse: Pulse
): [updatedModule: Module, pulsesEmitted: Pulse[]] {
  let pulsesEmitted: Pulse[] = [];
  switch (module.type) {
    case "test":
      // Test modules don't do anything, only receive a pulse and stop its transmission.
      return [module, []];

    case "broadcaster":
      // When a broadcaster module receives a pulse, it sends the same pulse to all of its
      // destination modules.
      pulsesEmitted = module.destinationIDs.map(
        (destinationID): Pulse => ({
          type: pulse.type,
          sourceID: module.id,
          destinationID,
        })
      );
      return [module, pulsesEmitted];

    case "flip-flop":
      // If a flip-flop module receives a high pulse, it is ignored and nothing happens.
      if (pulse.type === "high") {
        return [module, []];
      }
      // However, if a flip-flop module receives a low pulse, it flips between on and off.
      const isOn = !module.on;
      pulsesEmitted = module.destinationIDs.map(
        (destinationID): Pulse => ({
          // If it is now on, it sends a high pulse. If it is now off, it sends a low pulse.
          type: isOn ? "high" : "low",
          sourceID: module.id,
          destinationID,
        })
      );
      return [{ ...module, on: isOn }, pulsesEmitted];

    case "conjunction":
      // When a pulse is received, the conjunction module first updates its memory for
      // that input.
      const con = {
        ...module,
        inputs: { ...module.inputs, [pulse.sourceID]: pulse.type },
      };
      pulsesEmitted = con.destinationIDs.map((destinationID): Pulse => {
        // Then, if it remembers high pulses for all inputs, it sends a low pulse;
        // otherwise, it sends a high pulse.
        const pulseType = !Object.values(con.inputs).includes("low")
          ? "low"
          : "high";
        return {
          type: pulseType,
          sourceID: con.id,
          destinationID,
        };
      });
      return [con, pulsesEmitted];
  }
}

function parseConfiguration(config: string): ModuleLookup {
  const lookup: ModuleLookup = {};

  // We start by identifying the IDs of all the conjunction modules so that as we're
  // parsing each module definition later on, we can recognize when a new module serves as
  // an input to a conjunction module and record it as such.
  const conjunctionIDMatches = config.matchAll(/&(?<id>[a-z]+)\s/g);
  // Build a set of all the conjunction IDs.
  const conjunctionIDs = new Set<ModuleID>();
  let next = conjunctionIDMatches.next();
  while (!next.done) {
    const id = next.value.groups!.id!;
    conjunctionIDs.add(id);
    // Also initialize this module in the lookup so that it's easy to record inputs for
    // it later.
    lookup[id] = { id, type: "conjunction", inputs: {}, destinationIDs: [] };
    next = conjunctionIDMatches.next();
  }

  for (const line of config.split("\n")) {
    // Split each line into the character prefix that identifies the type (if any), the module ID,
    // and the destination module IDs.
    const {
      prefix,
      id,
      destinations: destinationsStr,
    } = line.match(/(?<prefix>[%&])?(?<id>[a-z]+)\s+->\s+(?<destinations>.+)$/)
      ?.groups || {};

    if (!id || !destinationsStr) {
      throw new Error(
        `could not identify module ID or destinations in line ${line}`
      );
    }

    // Identify the module type by its prefix, or ID in the case of the broadcaster.
    const type: ModuleType =
      prefix === "%"
        ? "flip-flop"
        : prefix === "&"
        ? "conjunction"
        : id === "broadcaster"
        ? "broadcaster"
        : "test";

    // Transform the string list of destinations into an array where each element is the
    // destination module ID, trimmed of whitespace.
    const destinationIDs = destinationsStr.split(/,\s*/);

    // Check if this module serves as an input to any conjunction modules.
    for (const destinationID of destinationIDs) {
      if (conjunctionIDs.has(destinationID)) {
        // Lookup that module...
        const destinationModule = lookup[destinationID];
        if (!destinationModule || destinationModule.type !== "conjunction") {
          throw new Error(
            `could not find conjunction module to update in lookup with ID ${destinationID}`
          );
        }
        // ...and record this as an input with an initial pulse type of low.
        destinationModule.inputs[id] = "low";
      }
    }

    // Finally, record or update this module in the lookup table.
    switch (type) {
      case "broadcaster":
        lookup[id] = { id, type, destinationIDs };
        break;
      case "conjunction":
        // There should already be a module recorded here, we just need to update its destinations.
        const module = lookup[id];
        if (!module || module.type !== "conjunction") {
          throw new Error(
            `could not find conjunction module to update in lookup with ID ${id}`
          );
        }
        module.destinationIDs = destinationIDs;
        break;
      case "flip-flop":
        // Flip-flop modules initially start off.
        lookup[id] = { id, type, destinationIDs, on: false };
        break;
      case "test":
        lookup[id] = { id, type };
    }
  }

  return lookup;
}

// Helper function which folhighe sequence of pulses sent as a result of pushing the
// button once. It returns the number of each type of pulse sent as well as the updated
// state of all the modules in the lookup at the conclusion of the sequence.
function pushButton(
  lookup: ModuleLookup
): [pulseCounts: Record<PulseType, number>, newLookup: ModuleLookup] {
  // We'll need a queue to keep track of the pulses we need to handle in the order that
  // they are received. It will start with our initial low pulse from the button module to
  // the broadcaster module.
  const pulseQueue: Pulse[] = [
    { sourceID: "", destinationID: "broadcaster", type: "low" },
  ];
  const pulseCounts: Record<PulseType, number> = {
    low: 0,
    high: 0,
  };

  // While our queue isn't empty...
  while (pulseQueue.length) {
    // Take the first pulse off the front of the queue.
    const pulse = pulseQueue.shift()!;

    // Increment the pulse count for the type of pulse it is.
    if (pulse.type === "low") {
      pulseCounts.low = pulseCounts.low + 1;
    } else {
      pulseCounts.high = pulseCounts.high + 1;
    }

    // Identify the destination module of the pulse.
    const module = lookup[pulse.destinationID];
    // If there wasn't a module on record, this most likely isn't an error; it's actually
    // probably just a test module that doesn't do anything.
    if (module) {
      // Handle the pulse.
      const [updatedModule, pulsesEmitted] = handlePulse(module, pulse);
      // Overwrite our module in the lookup with any updated properties.
      lookup[module.id] = updatedModule;
      // Add the newly emitted pulses to the back of the queue, if there are any.
      if (pulsesEmitted.length) {
        pulseQueue.push(...pulsesEmitted);
      }
    }
  }

  return [pulseCounts, lookup];
}

// Function which takes in the module lookup table and calculates how many button presses
// it takes until a complete cycle occurs. A complete cycle is indicated by all of the
// modules returning to their initial state. Returns the length of the cycle and the total
// number of pulse counts of each type over the course of that cycle.
function measureCycle(
  lookup: ModuleLookup
): [length: number, pulseCounts: Record<PulseType, number>] {
  // Remember the state we started out with.
  const initialState = encodeState(lookup);

  // Start by pushing the button once.
  let length = 1;
  let [pulseCounts, updatedLookup] = pushButton(lookup);

  // Keep our totals for pulse counts across all the button press sequences, initialized
  // to the number of pulse counts it took for the first button press.
  const totalPulseCounts: Record<PulseType, number> = { ...pulseCounts };

  // While our state differs from its original form, keep pushing the button.
  // NOTE: For part 1, we'll actually bail out at 1000 because we're only interested in
  // the pulse counts after 1000 pushes. Looking for a cycle earlier than that is just an
  // optimization.
  while (encodeState(updatedLookup) !== initialState && length < 1000) {
    [pulseCounts, updatedLookup] = pushButton(updatedLookup);
    // Update our cycle length and total pulse counts
    length = length + 1;
    totalPulseCounts.high = totalPulseCounts.high + pulseCounts.high;
    totalPulseCounts.low = totalPulseCounts.low + pulseCounts.low;
  }

  return [length, totalPulseCounts];
}

// Helper function used to help detect when we've completed a full cycle after pushing the
// button. Encodes to a string the subset of properties from the lookup that track module
// state, and returns that encoded string.
function encodeState(lookup: ModuleLookup): string {
  const stateParts: string[] = [];
  for (const id in lookup) {
    const module = lookup[id]!;
    if (module.type === "flip-flop") {
      stateParts.push(`${id}:${module.on}`);
    }
    if (module.type === "conjunction") {
      stateParts.push(
        `con(${id}):` +
          // Encode the last-remembered pulses from all of the input modules as a string.
          Object.entries(module.inputs)
            .map(([inputID, pulseType]) => `${inputID}:${pulseType}`)
            .join(",")
      );
    }
  }
  return stateParts.join(";");
}

// Test cases
const TEST_CONFIGURATIONS: {
  config: string;
  cycleLength: number;
  totalPulses: Record<PulseType, number>;
}[] = [
  {
    config: `broadcaster -> a, b, c
%a -> b
%b -> c
%c -> inv
&inv -> a`,
    cycleLength: 1,
    totalPulses: { high: 4, low: 8 },
  },
  {
    config: `broadcaster -> a
%a -> inv, con
&inv -> b
%b -> con
&con -> output`,
    cycleLength: 4,
    totalPulses: { high: 11, low: 17 },
  },
];

for (const { config, cycleLength, totalPulses } of TEST_CONFIGURATIONS) {
  const lookup = parseConfiguration(config);
  // Push the button once to start out with.
  let [_, newLookup] = pushButton(lookup);
  let cycleIndex = 1;
  while (cycleIndex < cycleLength) {
    // Keep pushing the button until we hit our cycle round.
    [_, newLookup] = pushButton(lookup);
    cycleIndex = cycleIndex + 1;
  }
  if (JSON.stringify(newLookup) !== JSON.stringify(lookup)) {
    console.error(
      "❌, expected matching states at cycle point but got mismatch"
    );
  }
  // Also make sure we'd get this result from our measure method.
  const [length, pulses] = measureCycle(lookup);
  if (length !== cycleLength) {
    console.error(
      "❌, expected cycle length of",
      cycleLength,
      "but got",
      length
    );
  }
  if (pulses.high !== totalPulses.high || pulses.low !== totalPulses.low) {
    console.error("❌, expected", totalPulses, "but got", pulses);
  } else {
    console.log("✅");
  }
}

// Now try for our actual configuration file.
import * as fs from "fs";

fs.readFile("./2023/20.txt", (err, rawFile) => {
  if (err) throw err;
  const lookup = parseConfiguration(rawFile.toString());
  // Compute the number of button pushes it takes to cycle, and how many pulses are
  // emitted in total for each cycle.
  const [length, pulses] = measureCycle(lookup);
  // Does this length multiply evenly into 1000? We sure hope it does lol.
  if (1000 % length === 0) {
    // Then, we can find the number of each pulse type in 1000 button presses by
    // multiplying the number in a cycle by the number of cycles it would take to do 1000.
    const lows = (pulses.low * 1000) / length;
    const highs = (pulses.high * 1000) / length;
    // Our result is the product of these two.
    console.log("part 1 result:", lows * highs);
  }
});