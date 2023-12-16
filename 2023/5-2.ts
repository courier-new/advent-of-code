/* --- Part Two ---
Everyone will starve if you only plant such a small number of seeds. Re-reading the almanac, it looks like the seeds: line actually describes ranges of seed numbers.

The values on the initial seeds: line come in pairs. Within each pair, the first value is the start of the range and the second value is the length of the range. So, in the first line of the example above:

seeds: 79 14 55 13
This line describes two ranges of seed numbers to be planted in the garden. The first range starts with seed number 79 and contains 14 values: 79, 80, ..., 91, 92. The second range starts with seed number 55 and contains 13 values: 55, 56, ..., 66, 67.

Now, rather than considering four seed numbers, you need to consider a total of 27 seed numbers.

In the above example, the lowest location number can be obtained from seed number 82, which corresponds to soil 84, fertilizer 84, water 84, light 77, temperature 45, humidity 46, and location 46. So, the lowest location number is 46.

Consider all of the initial seed numbers listed in the ranges on the first line of the almanac. What is the lowest location number that corresponds to any of the initial seed numbers? */

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

type ConversionRange = {
  start: number;
  length: number;
};

type Converter = {
  from: string;
  to: string;
  ranges: { sourceStart: number; destinationStart: number; length: number }[];
};

type Almanac = {
  [destinationType: string]: Converter;
};

function parseAlmanac(rawAlmanac: string): Almanac {
  const almanac: Almanac = {};

  // Start by splitting the almanac per line so that we can start to break it up into each
  // type of mapping.
  const lines = rawAlmanac.split("\n");

  // We know the first line corresponds to the seeds and can be dropped.
  lines.shift();
  // For each subsequent line in the almanac, we need to identify if it's:
  // - An empty line (which represents a break between sections)
  // - A description of a type of mapping (which represents the start of a new section)
  // - A conversion for a specific type of mapping
  //
  // Since we'll work one line at a time, we'll track the type of mapping we're actively
  // considering, so that we can find and record conversion lines as a function in the
  // appropriate section of the Almanac.

  let activeTypes: [string, string] | undefined;
  let lineIndex = 0;
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
      const ranges: {
        sourceStart: number;
        destinationStart: number;
        length: number;
      }[] = [];
      while (nextLine !== undefined && typeOfLine(nextLine) === "CONVERSION") {
        // Split out and parse integer values for each number on this line.
        const rangeStrings = nextLine.split(/\s+/);
        if (rangeStrings.length !== 3) {
          throw new Error(
            `invalid conversion on line ${lineIndex}: ${nextLine}`
          );
        }
        const [destinationStart, sourceStart, length] = rangeStrings.map(
          (str) => parseInt(str, 10)
        ) as [number, number, number];
        // Add this conversion to the collection.
        ranges.push({ sourceStart, destinationStart, length });
        // Progress to the next next line.
        lineIndex = lineIndex + 1;
        nextLine = lines[lineIndex];
      }

      // And record the mapping ranges to the Almanac.
      almanac[destination] = {
        from: source,
        to: destination,
        ranges,
      };
    }
  }

  // Once there are no more lines to consider, we're done!
  return almanac;
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

// Helper function which makes initial seed ranges slightly easier to work with.
function parseSeedRanges(rawAlmanac: string): ConversionRange[] {
  // Start by splitting the almanac per line so that we can find the first one.
  const lines = rawAlmanac.split("\n");

  // Our initial seeds should be in a line that starts with "seeds:".
  const rawSeeds = lines[0];
  if (!rawSeeds?.startsWith("seeds:")) {
    throw new Error(
      "could not determine initial seeds from almanac. does the first line start with 'seeds:'?"
    );
  }
  // For each pair of seed number + range, split the pair, parse integers from the
  // numbers, map them to our final range objects, and then sort the resultant list based
  // on range starts.
  return (
    rawSeeds
      .match(/\d+\s+\d+/g)
      ?.map((pairString) => {
        const [start, length] = pairString
          .split(/\s+/)
          .map((str) => parseInt(str, 10));
        if (start === undefined || length === undefined) {
          throw new Error(
            `could not parse initial seed range from pair: ${pairString}`
          );
        }
        return { start, length };
      })
      .sort(({ start: startA }, { start: startB }) => startA - startB) || []
  );
}

// Helper function which traces a location number back to its corresponding seed number
// via the conversions of a provided almanac.
function traceLocationToSeed(location: number, almanac: Almanac): number {
  let destinationType = "location";
  let destinationNumber = location;
  while (destinationType !== "seed") {
    // Get the conversion to this destination type.
    const { from, ranges } = almanac[destinationType]!;

    // Look for a range that contains our destination number.
    let rangeIndex = 0;
    while (rangeIndex < ranges.length) {
      const range = ranges[rangeIndex]!;
      if (
        range.destinationStart <= destinationNumber &&
        range.destinationStart + range.length >= destinationNumber
      ) {
        destinationNumber =
          range.sourceStart + (destinationNumber - range.destinationStart);
        break;
      }
      rangeIndex = rangeIndex + 1;
    }
    // If it's not explicitly defined, the source number === the destination number, so we
    // don't have to change anything and can just proceed to the next conversion.
    destinationType = from;
  }
  return destinationNumber;
}

// Helper function which determines whether or not a given seed number falls in any range
// from a given list of initial seeds ranges.
function isInitialSeed(
  seedNumber: number,
  initialSeeds: ConversionRange[]
): boolean {
  let rangeIndex = 0;
  // For each range of initial seed numbers.
  while (rangeIndex < initialSeeds.length) {
    const nextRange = initialSeeds[rangeIndex]!;
    // Check if the range would contain the seed number.
    if (
      seedNumber >= nextRange.start &&
      seedNumber <= nextRange.start + nextRange.length
    ) {
      // If it does, we found our range; return true.
      return true;
    }
    rangeIndex = rangeIndex + 1;
  }
  // If we made it to the end and haven't returned yet, there was no range containing this
  // seed number, so return false.
  return false;
}

function findLowestLocation(
  rawAlmanac: string
): [seedNumber: number, locationNumber: number] {
  // Parse out our Almanac and initial seed ranges.
  const almanac = parseAlmanac(rawAlmanac);
  const initialSeeds = parseSeedRanges(rawAlmanac);

  if (!almanac.location) {
    throw new Error("could not find mappings for location");
  }

  // Our ideal case is that there's a seed for location number 0. We'll start there, trying to trace location number 0 back to a seed number, and go up one location number at a time.
  let locationNumber = 0;
  while (locationNumber < Number.MAX_SAFE_INTEGER) {
    const seedNumber = traceLocationToSeed(locationNumber, almanac);
    // If this see number is present in our initial seeds, we're done!
    if (isInitialSeed(seedNumber, initialSeeds)) {
      return [seedNumber, locationNumber];
    }
    locationNumber = locationNumber + 1;
  }
  return [-1, Number.MAX_SAFE_INTEGER];
}

console.log(findLowestLocation(TEST_ALMANAC));

import * as fs from "fs";

fs.readFile("./2023/5.txt", (err, rawFile) => {
  if (err) throw err;
  console.log(findLowestLocation(rawFile.toString()));
});
