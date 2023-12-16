/* --- Day 5: If You Give A Seed A Fertilizer ---
You take the boat and find the gardener right where you were told he would be: managing a giant "garden" that looks more to you like a farm.

"A water source? Island Island is the water source!" You point out that Snow Island isn't receiving any water.

"Oh, we had to stop the water because we ran out of sand to filter it with! Can't make snow with dirty water. Don't worry, I'm sure we'll get more sand soon; we only turned off the water a few days... weeks... oh no." His face sinks into a look of horrified realization.

"I've been so busy making sure everyone here has food that I completely forgot to check why we stopped getting more sand! There's a ferry leaving soon that is headed over in that direction - it's much faster than your boat. Could you please go check it out?"

You barely have time to agree to this request when he brings up another. "While you wait for the ferry, maybe you can help us with our food production problem. The latest Island Island Almanac just arrived and we're having trouble making sense of it."

The almanac (your puzzle input) lists all of the seeds that need to be planted. It also lists what type of soil to use with each kind of seed, what type of fertilizer to use with each kind of soil, what type of water to use with each kind of fertilizer, and so on. Every type of seed, soil, fertilizer and so on is identified with a number, but numbers are reused by each category - that is, soil 123 and fertilizer 123 aren't necessarily related to each other.

For example:

seeds: 79 14 55 13

seed-to-soil map:
50 98 2
52 50 48

soil-to-fertilizer map:
0 15 37
37 52 2
39 0 15

fertilizer-to-water map:
49 53 8
0 11 42
42 0 7
57 7 4

water-to-light map:
88 18 7
18 25 70

light-to-temperature map:
45 77 23
81 45 19
68 64 13

temperature-to-humidity map:
0 69 1
1 0 69

humidity-to-location map:
60 56 37
56 93 4
The almanac starts by listing which seeds need to be planted: seeds 79, 14, 55, and 13.

The rest of the almanac contains a list of maps which describe how to convert numbers from a source category into numbers in a destination category. That is, the section that starts with seed-to-soil map: describes how to convert a seed number (the source) to a soil number (the destination). This lets the gardener and his team know which soil to use with which seeds, which water to use with which fertilizer, and so on.

Rather than list every source number and its corresponding destination number one by one, the maps describe entire ranges of numbers that can be converted. Each line within a map contains three numbers: the destination range start, the source range start, and the range length.

Consider again the example seed-to-soil map:

50 98 2
52 50 48
The first line has a destination range start of 50, a source range start of 98, and a range length of 2. This line means that the source range starts at 98 and contains two values: 98 and 99. The destination range is the same length, but it starts at 50, so its two values are 50 and 51. With this information, you know that seed number 98 corresponds to soil number 50 and that seed number 99 corresponds to soil number 51.

The second line means that the source range starts at 50 and contains 48 values: 50, 51, ..., 96, 97. This corresponds to a destination range starting at 52 and also containing 48 values: 52, 53, ..., 98, 99. So, seed number 53 corresponds to soil number 55.

Any source numbers that aren't mapped correspond to the same destination number. So, seed number 10 corresponds to soil number 10.

So, the entire list of seed numbers and their corresponding soil numbers looks like this:

seed  soil
0     0
1     1
...   ...
48    48
49    49
50    52
51    53
...   ...
96    98
97    99
98    50
99    51
With this map, you can look up the soil number required for each initial seed number:

Seed number 79 corresponds to soil number 81.
Seed number 14 corresponds to soil number 14.
Seed number 55 corresponds to soil number 57.
Seed number 13 corresponds to soil number 13.
The gardener and his team want to get started as soon as possible, so they'd like to know the closest location that needs a seed. Using these maps, find the lowest location number that corresponds to any of the initial seeds. To do this, you'll need to convert each seed number through other categories until you can find its corresponding location number. In this example, the corresponding types are:

Seed 79, soil 81, fertilizer 81, water 81, light 74, temperature 78, humidity 78, location 82.
Seed 14, soil 14, fertilizer 53, water 49, light 42, temperature 42, humidity 43, location 43.
Seed 55, soil 57, fertilizer 57, water 53, light 46, temperature 82, humidity 82, location 86.
Seed 13, soil 13, fertilizer 52, water 41, light 34, temperature 34, humidity 35, location 35.
So, the lowest location number in this example is 35.

What is the lowest location number that corresponds to any of the initial seed numbers?

 */

const TEST_ALMANAC = `seeds: 79 14 55 13

seed-to-soil map:
50 98 2
52 50 48

soil-to-fertilizer map:
0 15 37
37 52 2
39 0 15

fertilizer-to-water map:
49 53 8
0 11 42
42 0 7
57 7 4

water-to-light map:
88 18 7
18 25 70

light-to-temperature map:
45 77 23
81 45 19
68 64 13

temperature-to-humidity map:
0 69 1
1 0 69

humidity-to-location map:
60 56 37
56 93 4`;

const TEST_RESULTS: Record<number, number> = {
  // Seed to location
  79: 82,
  14: 43,
  55: 86,
  13: 35,
};

type Converter = {
  from: string;
  to: string;
  convert: (sourceNumber: number) => number;
};

type Almanac = {
  [sourceType: string]: Converter;
};

function parseAlmanac(
  rawAlmanac: string
): [initialSeeds: number[], almanac: Almanac] {
  const almanac: Almanac = {};

  // Start by splitting the almanac per line so that we can start to break it up into each
  // type of mapping.
  const lines = rawAlmanac.split("\n");

  // Our initial seeds should be in a line that starts with "seeds:". It should be the first line.
  const rawSeeds = lines[0];
  if (!rawSeeds?.startsWith("seeds:")) {
    throw new Error(
      "could not determine initial seeds from almanac. does the first line start with 'seeds:'?"
    );
  }
  // Split out each seed number and parse its integer equivalent.
  const initialSeeds = rawSeeds
    .replace(/seeds:\s+/, "")
    .split(/\s/)
    .map((str) => parseInt(str, 10));

  // Now for each subsequent line in the almanac, we need to identify if it's:
  // - An empty line (which represents a break between sections)
  // - A description of a type of mapping (which represents the start of a new section)
  // - A conversion for a specific type of mapping
  //
  // Since we'll work one line at a time, we'll track the type of mapping we're actively
  // considering, so that we can find and record conversion lines as a function in the
  // appropriate section of the Almanac.

  let activeTypes: [string, string] | undefined;
  let lineIndex = 1;
  while (lineIndex < lines.length) {
    const currentLine = lines[lineIndex]!;

    if (typeOfLine(currentLine) === "END_SECTION") {
      // Mark that we're no longer adding conversions for the active source type.
      activeTypes = undefined;
      // Progress to the next line.
      lineIndex = lineIndex + 1;
    } else if (typeOfLine(currentLine) === "NEW_SECTION") {
      // Parse the new mapping type and record the active source type.
      const { source, destination } = currentLine.match(
        /(?<source>\S+)-to-(?<destination>\S+)/
      )?.groups as { source?: string; destination?: string };
      if (!source || !destination) {
        throw new Error(
          `could not parse source or destination for mapping section: ${currentLine}`
        );
      }
      activeTypes = [source, destination];

      // Progress to the next line.
      lineIndex = lineIndex + 1;
    } else {
      // It's a conversion line.
      // Make sure we know what type of conversion we're talking about.
      if (!activeTypes) {
        throw new Error(
          `encountered orphaned conversion on line ${lineIndex}: ${currentLine}`
        );
      }
      const [source, destination] = activeTypes;

      // We know conversion lines come in blocks. Starting with the current line, keep
      // looking forward until we hit a non-conversion line and build an array of all the
      // mappings we found.
      let nextLine: string | undefined = currentLine;
      const mappings: [number, number, number][] = [];
      while (nextLine !== undefined && typeOfLine(nextLine) === "CONVERSION") {
        // Split out and parse integer values for each number on this line.
        const mappingStrings = nextLine.split(/\s+/);
        if (mappingStrings.length !== 3) {
          throw new Error(
            `invalid conversion on line ${lineIndex}: ${nextLine}`
          );
        }
        const mappingNumbers = mappingStrings.map((str) =>
          parseInt(str, 10)
        ) as [number, number, number];
        // Add this conversion to the collection.
        mappings.push(mappingNumbers);
        // Progress to the next next line.
        lineIndex = lineIndex + 1;
        nextLine = lines[lineIndex];
      }

      // Once we've gathered up all the lines with mappings for this type, build a
      // function that expresses the mappings.
      const converterFn = buildConverterFunction(mappings);
      // And record that function in our Almanac
      almanac[source] = {
        from: source,
        to: destination,
        convert: converterFn,
      };
    }
  }

  // Once there are no more lines to consider, we're done!
  return [initialSeeds, almanac];
}

// Helper functions which identifies which type of line it is provided.
function typeOfLine(
  line: string
): "END_SECTION" | "NEW_SECTION" | "CONVERSION" {
  // Empty lines signify a break between sections.
  if (line.length === 0) {
    return "END_SECTION";
  }
  // Lines with a description of a new type of mapping signify the start of a new section
  // and take the form "x-to-y map:"
  if (line.includes("map:")) {
    return "NEW_SECTION";
  }
  return "CONVERSION";
}

// Helper function which takes in a list of individual mappings and returns a function
// which will return the destination number for a given source number based on those
// mappings.
function buildConverterFunction(
  // Each line contains in order: the destination range start, the source range start, and
  // the range length, e.g. 50 98 2.
  lines: [destinationStart: number, sourceStart: number, rangeLength: number][]
): (sourceNumber: number) => number {
  return (sourceNumber: number) => {
    // For each line, check if it provides the mapping for our sourceNumber. It provides a
    // mapping if sourceNumber >= sourceStart and sourceNumber < sourceStart +
    // rangeLength. For example with the line 50 98 2:
    // 98 >= 98   and   98   < 98 + 2
    // 99 >= 98   and   99   < 98 + 2
    // 100 >= 98  but   100 !< 98 + 2, so 100 would not be accounted for by this line.
    let lineIndex = 0;
    while (lineIndex < lines.length) {
      const [destinationStart, sourceStart, rangeLength] = lines[lineIndex]!;
      if (
        sourceNumber >= sourceStart &&
        sourceNumber < sourceStart + rangeLength
      ) {
        // We found our line! Subtract the sourceStart from sourceNumber to find the delta
        // we need to add to destinationStart.
        const delta = sourceNumber - sourceStart;
        // Return the mapped value.
        return destinationStart + delta;
      }
      // Otherwise, keep looking
      lineIndex = lineIndex + 1;
    }

    // Any source numbers that aren't mapped correspond to the same destination number.
    return sourceNumber;
  };
}

// Test case
const [testSeeds, testAlmanac] = parseAlmanac(TEST_ALMANAC);
let lowestTestLocation = Infinity;
for (const seed of testSeeds) {
  // Trace the seed number through to the location number.
  let sourceNumber = seed;
  let sourceType = "seed";
  while (sourceType !== "location") {
    // Identify the conversion for the destination type
    const conversion = testAlmanac[sourceType];
    if (!conversion) {
      throw new Error(
        `could not find conversion for source type: ${sourceType}`
      );
    }
    // Map the sourceNumber to its destination
    const destinationNumber = conversion.convert(sourceNumber);
    // Use the destinationNumber we got as the next sourceNumber, and the conversion.to
    // value as the next sourceType.
    sourceNumber = destinationNumber;
    sourceType = conversion.to;
  }

  // Check that it matches the expected result.
  if (sourceNumber !== TEST_RESULTS[seed]) {
    console.error(
      "❌, found wrong location number for seed number",
      seed,
      ": expected",
      TEST_RESULTS[seed],
      "but got",
      sourceNumber
    );
  } else {
    console.log("✅");
    // Check if we need to update our lowest location number.
    if (sourceNumber < lowestTestLocation) {
      lowestTestLocation = sourceNumber;
    }
  }
}

console.log("lowest test location number:", lowestTestLocation);

// Now let's try with our actual almanac document.
import * as fs from "fs";

// We'll read the whole file in for this since we need to parse sections multiple lines at
// a time to build our converter functions.
fs.readFile("./2023/5.txt", (err, rawFile) => {
  if (err) throw err;

  const [initialSeeds, almanac] = parseAlmanac(rawFile.toString());
  let lowestLocation = Infinity;

  for (const seed of initialSeeds) {
    // Trace the seed number through to the location number.
    let sourceNumber = seed;
    let sourceType = "seed";
    while (sourceType !== "location") {
      // Identify the conversion for the destination type
      const conversion = almanac[sourceType];
      if (!conversion) {
        throw new Error(
          `could not find conversion for source type: ${sourceType}`
        );
      }
      // Map the sourceNumber to its destination
      const destinationNumber = conversion.convert(sourceNumber);
      // Use the destinationNumber we got as the next sourceNumber, and the conversion.to
      // value as the next sourceType.
      sourceNumber = destinationNumber;
      sourceType = conversion.to;
    }

    // Check if we need to update our lowest location number.
    if (sourceNumber < lowestLocation) {
      lowestLocation = sourceNumber;
    }
  }
  console.log("result", lowestLocation);
});
