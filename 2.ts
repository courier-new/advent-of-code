/* --- Day 2: Cube Conundrum ---
You're launched high into the atmosphere! The apex of your trajectory just barely reaches the surface of a large island floating in the sky. You gently land in a fluffy pile of leaves. It's quite cold, but you don't see much snow. An Elf runs over to greet you.

The Elf explains that you've arrived at Snow Island and apologizes for the lack of snow. He'll be happy to explain the situation, but it's a bit of a walk, so you have some time. They don't get many visitors up here; would you like to play a game in the meantime?

As you walk, the Elf shows you a small bag and some cubes which are either red, green, or blue. Each time you play this game, he will hide a secret number of cubes of each color in the bag, and your goal is to figure out information about the number of cubes.

To get information, once a bag has been loaded with cubes, the Elf will reach into the bag, grab a handful of random cubes, show them to you, and then put them back in the bag. He'll do this a few times per game.

You play several games and record the information from each game (your puzzle input). Each game is listed with its ID number (like the 11 in Game 11: ...) followed by a semicolon-separated list of subsets of cubes that were revealed from the bag (like 3 red, 5 green, 4 blue).

For example, the record of a few games might look like this:

Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green
Game 2: 1 blue, 2 green; 3 green, 4 blue, 1 red; 1 green, 1 blue
Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red
Game 4: 1 green, 3 red, 6 blue; 3 green, 6 red; 3 green, 15 blue, 14 red
Game 5: 6 red, 1 blue, 3 green; 2 blue, 1 red, 2 green
In game 1, three sets of cubes are revealed from the bag (and then put back again). The first set is 3 blue cubes and 4 red cubes; the second set is 1 red cube, 2 green cubes, and 6 blue cubes; the third set is only 2 green cubes.

The Elf would first like to know which games would have been possible if the bag contained only 12 red cubes, 13 green cubes, and 14 blue cubes?

In the example above, games 1, 2, and 5 would have been possible if the bag had been loaded with that configuration. However, game 3 would have been impossible because at one point the Elf showed you 20 red cubes at once; similarly, game 4 would also have been impossible because the Elf showed you 15 blue cubes at once. If you add up the IDs of the games that would have been possible, you get 8.

Determine which games would have been possible if the bag had been loaded with only 12 red cubes, 13 green cubes, and 14 blue cubes. What is the sum of the IDs of those games?
 */

const cubeGameIdentifierRegex = new RegExp("Game (\\d+):");

type InputGameConfiguration = {
  red: number;
  green: number;
  blue: number;
};

function isCubeGamePossible(
  game: string,
  config: InputGameConfiguration
): boolean {
  const reveals = game
    // Remove the initial game identifier text; we won't need that to check validity.
    .replace(cubeGameIdentifierRegex, "")
    // Split the list of "reveals" into each set of cube quantities + colors. Reveals are
    // separated by semi-colons.
    .split(";");

  // Now for each reveal, check if it would be possible given our input configuration.
  for (const reveal of reveals) {
    // Check if the reveal drew any reds.
    const redsDraw = reveal.match(new RegExp("(\\d+) red"));
    // If we found one, the capture group should be the element at index 1.
    const reds = parseInt(redsDraw?.[1] ?? "0");
    // If the amount drew exceeds the amount in the config, this isn't a possible game.
    if (reds > config.red) {
      return false;
    }

    // Check if the reveal drew any blues.
    const bluesDraw = reveal.match(new RegExp("(\\d+) blue"));
    // If we found one, the capture group should be the element at index 1.
    const blues = parseInt(bluesDraw?.[1] ?? "0", 10);
    // If the amount drew exceeds the amount in the config, this isn't a possible game.
    if (blues > config.blue) {
      return false;
    }

    // Check if the reveal drew any greens.
    const greensDraw = reveal.match(new RegExp("(\\d+) green"));
    // If we found one, the capture group should be the element at index 1.
    const greens = parseInt(greensDraw?.[1] ?? "0", 10);
    // If the amount drew exceeds the amount in the config, this isn't a possible game.
    if (greens > config.green) {
      return false;
    }
  }
  return true;
}

const INPUT_CONFIGURATION: InputGameConfiguration = {
  red: 12,
  green: 13,
  blue: 14,
};

const CUBE_GAME_TEST_CASES: {
  game: string;
  config: InputGameConfiguration;
  isPossible: boolean;
}[] = [
  {
    game: "Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green",
    config: INPUT_CONFIGURATION,
    isPossible: true,
  },
  {
    game: "Game 2: 1 blue, 2 green; 3 green, 4 blue, 1 red; 1 green, 1 blue",
    config: INPUT_CONFIGURATION,
    isPossible: true,
  },
  {
    game: "Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red",
    config: INPUT_CONFIGURATION,
    isPossible: false,
  },
  {
    game: "Game 4: 1 green, 3 red, 6 blue; 3 green, 6 red; 3 green, 15 blue, 14 red",
    config: INPUT_CONFIGURATION,
    isPossible: false,
  },
  {
    game: "Game 5: 6 red, 1 blue, 3 green; 2 blue, 1 red, 2 green",
    config: INPUT_CONFIGURATION,
    isPossible: true,
  },
];

// Test cases.
let sum = 0;
for (const { game, config, isPossible } of CUBE_GAME_TEST_CASES) {
  const result = isCubeGamePossible(game, config);
  if (result !== isPossible) {
    console.error("❌, expected", isPossible, "but got", result);
  } else {
    console.log("✅");
  }

  if (isPossible) {
    const gameIdentifierMatch = game.match(cubeGameIdentifierRegex);
    if (!gameIdentifierMatch) {
      throw new Error(`no game identifier present in line: ${game}`);
    }
    // The actual number (the capture group) should be in the first index.
    const gameID = parseInt(gameIdentifierMatch[1]!, 10);
    sum = sum + gameID;
  }
}

// Now let's try with our actual input document.
import * as readline from "readline";
import * as fs from "fs";

// Now read from our actual calibration document again.
const rl = readline.createInterface({
  input: fs.createReadStream("./advent-of-code-2023/2.txt"),
});

// Keep track of the sum of all the game IDs.
let sum2 = 0;
rl.on("line", (line: string) => {
  const isPossible = isCubeGamePossible(line, INPUT_CONFIGURATION);
  if (isPossible) {
    const gameIdentifierMatch = line.match(cubeGameIdentifierRegex);
    if (!gameIdentifierMatch) {
      throw new Error(`no game identifier present in line: ${line}`);
    }
    // The actual number (the capture group) should be in the first index.
    const gameID = parseInt(gameIdentifierMatch[1]!, 10);
    sum2 = sum2 + gameID;
  }
});

rl.on("close", () => {
  console.log("Part 1 sum:", sum2);
});

/* --- Part Two ---
The Elf says they've stopped producing snow because they aren't getting any water! He isn't sure why the water stopped; however, he can show you how to get to the water source to check it out for yourself. It's just up ahead!

As you continue your walk, the Elf poses a second question: in each game you played, what is the fewest number of cubes of each color that could have been in the bag to make the game possible?

Again consider the example games from earlier:

Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green
Game 2: 1 blue, 2 green; 3 green, 4 blue, 1 red; 1 green, 1 blue
Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red
Game 4: 1 green, 3 red, 6 blue; 3 green, 6 red; 3 green, 15 blue, 14 red
Game 5: 6 red, 1 blue, 3 green; 2 blue, 1 red, 2 green
In game 1, the game could have been played with as few as 4 red, 2 green, and 6 blue cubes. If any color had even one fewer cube, the game would have been impossible.
Game 2 could have been played with a minimum of 1 red, 3 green, and 4 blue cubes.
Game 3 must have been played with at least 20 red, 13 green, and 6 blue cubes.
Game 4 required at least 14 red, 3 green, and 15 blue cubes.
Game 5 needed no fewer than 6 red, 3 green, and 2 blue cubes in the bag.
The power of a set of cubes is equal to the numbers of red, green, and blue cubes multiplied together. The power of the minimum set of cubes in game 1 is 48. In games 2-5 it was 12, 1560, 630, and 36, respectively. Adding up these five powers produces the sum 2286.

For each game, find the minimum set of cubes that must have been present. What is the sum of the power of these sets? */

function powerOfMinimumGameConfig(
  game: string
): [config: InputGameConfiguration, power: number] {
  const reveals = game
    // Remove the initial game identifier text; we won't need that to check validity.
    .replace(cubeGameIdentifierRegex, "")
    // Split the list of "reveals" into each set of cube quantities + colors. Reveals are
    // separated by semi-colons.
    .split(";");

  const minimumConfig: InputGameConfiguration = { red: 0, blue: 0, green: 0 };

  // Now for each reveal, check how many of each color would be required and, if our
  // current minimum config has fewer than that amount, update the minimum config.
  for (const reveal of reveals) {
    // Check if the reveal drew any reds.
    const redsDraw = reveal.match(new RegExp("(\\d+) red"));
    // If we found one, the capture group should be the element at index 1.
    const reds = parseInt(redsDraw?.[1] ?? "0");
    // If the amount drew exceeds the amount currently in the minimum config, update it.
    if (reds > minimumConfig.red) {
      minimumConfig.red = reds;
    }

    // Check if the reveal drew any blues.
    const bluesDraw = reveal.match(new RegExp("(\\d+) blue"));
    // If we found one, the capture group should be the element at index 1.
    const blues = parseInt(bluesDraw?.[1] ?? "0", 10);
    // If the amount drew exceeds the amount currently in the minimum config, update it.
    if (blues > minimumConfig.blue) {
      minimumConfig.blue = blues;
    }

    // Check if the reveal drew any greens.
    const greensDraw = reveal.match(new RegExp("(\\d+) green"));
    // If we found one, the capture group should be the element at index 1.
    const greens = parseInt(greensDraw?.[1] ?? "0", 10);
    // If the amount drew exceeds the amount currently in the minimum config, update it.
    if (greens > minimumConfig.green) {
      minimumConfig.green = greens;
    }
  }

  // Now return a tuple of the config and the power of the config amounts.
  return [
    minimumConfig,
    minimumConfig.red * minimumConfig.green * minimumConfig.blue,
  ];
}

const CUBE_GAME_TEST_CASES_2: {
  game: string;
  minimumConfig: InputGameConfiguration;
  power: number;
}[] = [
  {
    game: "Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green",
    minimumConfig: {
      red: 4,
      green: 2,
      blue: 6,
    },
    power: 48,
  },
  {
    game: "Game 2: 1 blue, 2 green; 3 green, 4 blue, 1 red; 1 green, 1 blue",
    minimumConfig: {
      red: 1,
      green: 3,
      blue: 4,
    },
    power: 12,
  },
  {
    game: "Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red",
    minimumConfig: {
      red: 20,
      green: 13,
      blue: 6,
    },
    power: 1560,
  },
  {
    game: "Game 4: 1 green, 3 red, 6 blue; 3 green, 6 red; 3 green, 15 blue, 14 red",
    minimumConfig: {
      red: 14,
      green: 3,
      blue: 15,
    },
    power: 630,
  },
  {
    game: "Game 5: 6 red, 1 blue, 3 green; 2 blue, 1 red, 2 green",
    minimumConfig: {
      red: 6,
      green: 3,
      blue: 2,
    },
    power: 36,
  },
  {
    game: "Game 6: 6 red, 1 blue; 6 blue, 1 red",
    minimumConfig: {
      red: 6,
      green: 0,
      blue: 6,
    },
    power: 0,
  },
];

// Test cases for part 2.
for (const { game, minimumConfig, power } of CUBE_GAME_TEST_CASES_2) {
  const [resultConfig, resultPower] = powerOfMinimumGameConfig(game);
  if (resultPower !== power) {
    console.error("❌, expected", power, "but got", resultPower);
    console.error("expected config", minimumConfig);
    console.error("got config", resultConfig);
  } else {
    console.log("✅");
  }
}

// Now read from our actual input document again.
const rl2 = readline.createInterface({
  input: fs.createReadStream("./advent-of-code-2023/2.txt"),
});

// Keep track of the sum of all the game config powers.
let sum3 = 0;
rl2.on("line", (line: string) => {
  const [_, power] = powerOfMinimumGameConfig(line);
  sum3 = sum3 + power;
});

rl2.on("close", () => {
  console.log("Part 2 sum:", sum3);
});
