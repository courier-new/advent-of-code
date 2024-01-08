/* --- Part Two ---
The Elf seems confused by your answer until he realizes his mistake: he was reading from a
list of his favorite numbers that are both perfect squares and perfect cubes, not his step
counter.

The actual number of steps he needs to get today is exactly 26501365.

He also points out that the garden plots and rocks are set up so that the map repeats
infinitely in every direction.

So, if you were to look one additional map-width or map-height out from the edge of the
example map above, you would find that it keeps repeating:

.................................
.....###.#......###.#......###.#.
.###.##..#..###.##..#..###.##..#.
..#.#...#....#.#...#....#.#...#..
....#.#........#.#........#.#....
.##...####..##...####..##...####.
.##..#...#..##..#...#..##..#...#.
.......##.........##.........##..
.##.#.####..##.#.####..##.#.####.
.##..##.##..##..##.##..##..##.##.
.................................
.................................
.....###.#......###.#......###.#.
.###.##..#..###.##..#..###.##..#.
..#.#...#....#.#...#....#.#...#..
....#.#........#.#........#.#....
.##...####..##..S####..##...####.
.##..#...#..##..#...#..##..#...#.
.......##.........##.........##..
.##.#.####..##.#.####..##.#.####.
.##..##.##..##..##.##..##..##.##.
.................................
.................................
.....###.#......###.#......###.#.
.###.##..#..###.##..#..###.##..#.
..#.#...#....#.#...#....#.#...#..
....#.#........#.#........#.#....
.##...####..##...####..##...####.
.##..#...#..##..#...#..##..#...#.
.......##.........##.........##..
.##.#.####..##.#.####..##.#.####.
.##..##.##..##..##.##..##..##.##.
.................................

This is just a tiny three-map-by-three-map slice of the inexplicably-infinite farm layout;
garden plots and rocks repeat as far as you can see. The Elf still starts on the one
middle tile marked S, though - every other repeated S is replaced with a normal garden
plot (.).

Here are the number of reachable garden plots in this new infinite version of the example
map for different numbers of steps:

- In exactly 6 steps, he can still reach 16 garden plots.
- In exactly 10 steps, he can reach any of 50 garden plots.
- In exactly 50 steps, he can reach 1594 garden plots.
- In exactly 100 steps, he can reach 6536 garden plots.
- In exactly 500 steps, he can reach 167004 garden plots.
- In exactly 1000 steps, he can reach 668697 garden plots.
- In exactly 5000 steps, he can reach 16733044 garden plots.

However, the step count the Elf needs is much larger! Starting from the garden plot marked
S on your infinite map, how many garden plots could the Elf reach in exactly 26501365
steps? */

// To make this problem a little more approachable, we observe a couple assumptions from
// our input:
// - The starting row only consists of garden plots
// - The starting column only consists of garden plots
// - The edges of the map only consist of garden plots
// - The starting point is always in the dead center
// - The map is a square with an odd number of rows/columns
//
// We will thus not be able to use our example for testing. :(
//
// However, the fact that the starting row and column are totally walkable means that we
// know we can reach the next map over in any direction from our starting point in only
// ceil(mapSize / 2) steps. For example if our map was only 3x3:
//  _ _ _
// |# . .|# . .
// |. S .|. . .
// |. . #|. . #
//  ‾ ‾ ‾
// We could reach the first column of the bordering map to the right of our starting map
// by moving 2 steps to the right. If in this example we had a step count of 4 to
// complete, we know we could thus make it to the right map with 2 steps left to go
// anywhere else.
//
// In this case, we could reach (0,1), (1,0), (1,2), or (2,1) of the right map. Notice
// that these are all the positions we would normally have been able to reach in a single
// non-infinite map with an *odd* number of steps. If we expanded our map one more to the
// right and looked at a step count of 6:
//  _ _ _
// |# . .|# . .|# . .
// |. S .|. . .|. . .
// |. . #|. . #|. . #
//  ‾ ‾ ‾
// We'd see that in the next map over, we could reach our starting point (1,1) and
// positions consistent with the first map square again. This is because we have an odd
// map size but an even number of steps. So positions reachable in every
// other map tile will flip-flop between the "even" set and the "odd" set.

import * as fs from "fs";
import { Position, spotsReachable } from "./21-1";
import { assert } from "console";

fs.readFile("./2023/21.txt", (err, rawFile) => {
  if (err) throw err;

  // We'll start by asserting our assumptions are true.
  const map = rawFile.toString().split("\n");
  // Ensure the map is a square with an odd number of rows/columns.
  const mapSize = map.length;
  if (mapSize !== map[0]!.length) {
    throw new Error(
      "required that map is a square, but found different number of columns and rows"
    );
  }
  if (mapSize % 2 !== 1) {
    throw new Error(
      "required that map has an odd number of rows/columns but found even"
    );
  }
  // Ensure our starting position is in the dead center
  let startingPos: Position = {
    row: Math.floor(mapSize / 2),
    column: Math.floor(mapSize / 2),
  };
  if (map[startingPos.row]?.[startingPos.column] !== "S") {
    throw new Error(
      `required starting position to be in the center but did not find it at ${JSON.stringify(
        startingPos
      )}`
    );
  }
  // Ensure that the starting row and column only consist of garden plots
  if (map[startingPos.row]!.includes("#")) {
    throw new Error(
      "required starting row to only consist of garden plots but found rocks"
    );
  }
  if (map.map((row) => row[startingPos.column]!).includes("#")) {
    throw new Error(
      "required starting column to only consist of garden plots but found rocks"
    );
  }
  // Ensure that our edges only consist of garden plots
  if (
    map[0]!.includes("#") ||
    map[mapSize - 1]!.includes("#") ||
    map.map((row) => `${row[0]}${row[mapSize - 1]}`).includes("#")
  ) {
    throw new Error(
      "required edges of the map to only consist of garden plots but found rocks"
    );
  }

  // Now we'll look at how far away we can possibly go. Given our mapSize, we can reach
  // the edge of our starting map in floor(`mapSize` / 2) steps, meaning we can traverse an
  // additional (stepCount - floor(`mapSize` / 2)) / `mapSize` full maps beyond that.
  // This actually works out to a nice number:
  // (26501365 - 65) / 131 = 202300
  const traverseableMaps = (26501365 - Math.floor(mapSize / 2)) / mapSize;

  // Considering again the infinitely repeating garden, we can actually decompose this into
  // a couple distinct sub-problems based on our assumptions. Say we could actually only
  // traverse up to 2 additional maps' distance in any direction from our starting tile.
  // There are some tiles in the garden we could fully traverse, then, and some that we
  // could only partially traverse. Let's start with the ones we could fully cover. If we
  // can only walk up to 2 maps away, we can only fully traverse the tiles that
  // immediately border our starting tile:
  //
  //     ■
  //   ■ ■ ■
  //     ■
  //
  // But we could also *partially* traverse all the tiles that border these ones, in a
  // sort of diamond formation:
  //
  //   ◪ ⬓ ⬕
  // ◪ ◪ ■ ⬕ ⬕
  // ◨ ■ ■ ■ ◧
  // ⬔ ⬔ ■ ◩ ◩
  //   ⬔ ⬒ ◩
  // .....
  //
  // I've used e.g. "◨" here to represent a garden map tile with the majority of
  // reachable plots on the right side, but we know the reachable region actually looks
  // more like a pentagon since it can reach the leftmost side but only at the point right
  // in the center.
  //
  // Of the "⬕"-type partialy-reachable tiles, there's actually two variants:
  // - The ones that only border other partially-reachable tiles like "◨". These will have
  //   floor(`mapSize / 2`) number of steps left for traversing if we entered from the
  //   corner. This is because we reached the "◨" it borders with `mapSize` steps left; if
  //   we follow the edge that we enter from, we'll use half + 1 of those steps up
  //   reaching the corner.
  // - The ones that border fully-reachable "■" tiles. These will have (2 * `mapSize`) -
  //   floor(`mapSize` / 2) = floor(3 * `mapSize` / 2) number of steps left for
  //   traversing. This is because we reach the bordering "■" with 2 * `mapSize` steps
  //   left; if we follow the edge that we enter from, we'll use floor(`mapSize` / 2) + 1
  //   steps to reach the corner, thus leaving us with the difference.
  //
  // We're only able to conclude this because of the fully walkable edges of each tile:
  // it's thus *always* possible to reach one of these "⬕"s with the full `mapSize` or
  // `mapSize / 2` number of steps left, and it's always possible to enter from the
  // corner. So the only thing further distinguishing them at the end of the day is
  // orientation. Let's keep using "⬕" to indicate tiles with the larger `3 * mapSize / 2`
  // steps left, and "◣" to indicate tiles with `mapSize / 2` steps left.
  //
  //   ◢ ⬓ ◣
  // ◢ ◪ ■ ⬕ ◣
  // ◨ ■ ■ ■ ◧
  // ◥ ⬔ ■ ◩ ◤
  //   ◥ ⬒ ◤
  //
  // Lastly, if we want to represent each distinct region with a different icons, we know
  // that there are actually two types of fully-reachable tile, too: those which we enter
  // with an even number of steps remaining, and those which we enter with an odd number
  // of steps. We'll use squares filled with diagonal lines in opposite directions to
  // distinguish these:
  //
  //   ◢ ⬓ ◣
  // ◢ ◪ ▨ ⬕ ◣
  // ◨ ▨ ▧ ▨ ◧
  // ◥ ⬔ ▨ ◩ ◤
  //   ◥ ⬒ ◤
  //
  // Now we've broken the problem down into 14 distinct subproblems:
  // - NW partially-reachable garden tiles with floor(`mapSize`) / 2 steps: ◢
  // - NE partially-reachable garden tiles with floor(`mapSize`) / 2 steps: ◣
  // - SW partially-reachable garden tiles with floor(`mapSize`) / 2 steps: ◥
  // - SE partially-reachable garden tiles with floor(`mapSize`) / 2 steps: ◤
  // - NW partially-reachable garden tiles with floor(3 * `mapSize` / 2) steps: ◪
  // - NE partially-reachable garden tiles with floor(3 * `mapSize` / 2) steps: ⬕
  // - SW partially-reachable garden tiles with floor(3 * `mapSize` / 2) steps: ⬔
  // - SE partially-reachable garden tiles with floor(3 * `mapSize` / 2) steps: ◩
  // - N partially-reachable garden "peak" tiles with `mapSize` steps: ⬓
  // - S partially-reachable garden "peak" tiles with `mapSize` steps: ⬒
  // - W partially-reachable garden "peak" tiles with `mapSize` steps: ◨
  // - E partially-reachable garden "peak" tiles with `mapSize` steps: ◧
  // - Fully-reachable garden tiles with an even number of steps: ▧
  // - Fully-reachable garden tiles with an odd number of steps: ▨
  //
  // This may feel like a lot, but this property actually doesn't change no matter how
  // much we scale the diamond up. Here's the same diamond formation from being able to
  // move up to 4 map sizes away, notice how we don't have to add any unique icons:
  //
  //       ◢ ⬓ ◣
  //     ◢ ◪ ▨ ⬕ ◣
  //   ◢ ◪ ▨ ▧ ▨ ⬕ ◣
  // ◢ ◪ ▨ ▧ ▨ ▧ ▨ ⬕ ◣
  // ◨ ▨ ▧ ▨ ▧ ▨ ▧ ▨ ◧
  // ◥ ⬔ ▨ ▧ ▨ ▧ ▨ ◩ ◤
  //   ◥ ⬔ ▨ ▧ ▨ ◩ ◤
  //     ◥ ⬔ ▨ ◩ ◤
  //       ◥ ⬒ ◤
  //
  // Thus, it's only a matter of calculating the number of plots reachable for each "type"
  // of tile, multiplying that by the number of times that type of tile will appear, and
  // summing together all the results.

  // Let's start with the easiest ones: the fully-reachable map tiles. We can use our
  // normal `spotsReachable` function to figure this out, since we're only looking at a
  // single map tile. It doesn't actually matter how many steps we give it, or where we
  // start, as long as it's enough steps to traverse the whole map and it's an odd or even
  // number of steps.
  const evenTilePlots = spotsReachable(map, startingPos, 2 * mapSize);
  // And for our odd tiles, 2 * `mapSize` + 1.
  const oddTilePlots = spotsReachable(map, startingPos, 2 * mapSize + 1);

  console.log(evenTilePlots, oddTilePlots);

  // Looking back at the "core" of our diamond, we can infer a pattern for how many even
  // and odd tiles will be reachable overall in `stepsCount`. For example, when we can
  // move up to 2 full maps away:
  //
  //   □
  // □ ■ □
  //   □
  //
  // We have 1 instance of our starting tile type, and 4 instances of the opposite tile.
  // When we can move up to 4 full maps away:
  //
  //       □
  //     □ ■ □
  //   □ ■ □ ■ □
  // □ ■ □ ■ □ ■ □
  //   □ ■ □ ■ □
  //     □ ■ □
  //       □
  //
  // We see we have 9 instances of our starting tile type.
  //
  //       ■
  //     ■ □ ■
  //   ■ □ ■ □ ■
  // ■ □ ■ □ ■ □ ■
  //   ■ □ ■ □ ■
  //     ■ □ ■
  //       ■
  //
  // And 16 instances of the opposite tile.
  //
  // Thus the pattern forms that for N traversable maps, we will have (N - 1)^2 instances
  // of our starting tile and N^2 instances of the opposite tile.
  //
  // Since our number of steps is odd, we know that our starting tile will be able to
  // reach the odd tile plots.
  const numOddTiles = (traverseableMaps - 1) ** 2;
  const numEvenTiles = traverseableMaps ** 2;

  // Now we can start to compute the total number of plots reachable, starting with these
  // plots fully-reachable on even and odd tiles.
  let totalPlotsReachable =
    numOddTiles * oddTilePlots + numEvenTiles * evenTilePlots;

  // Next, let's handle the "peak" spots. For a given peak, we arrive with `mapSize` steps
  // left from the middle of one side. So we can reach fully across the map only at one
  // point. We can also mostly cover the half of the map closest to the edge that we
  // started from, because we know we could go `mapSize` / 2 steps to the center, then
  // `mapSize` / 2 steps either left or right to fully cover two quadrants. Our rough
  // shape of reachable area will look like house.
  //
  // For the north peak, we'll enter from the bottom edge, aka the last row, and the
  // middle column. For each of these peak tile calculations, since we're starting from
  // inside the map, the number of steps we can travel is actually `mapSize` - 1 now.
  const northPeakPlots = spotsReachable(
    map,
    { row: mapSize - 1, column: startingPos.column },
    mapSize - 1
  );
  // For the south peak, we'll enter from the top edge, aka the first row, and the middle
  // column.
  const southPeakPlots = spotsReachable(
    map,
    { row: 0, column: startingPos.column },
    mapSize - 1
  );
  // For the west peak, we'll enter from the right edge, aka the last column, and the middle row.
  const westPeakPlots = spotsReachable(
    map,
    { row: startingPos.row, column: mapSize - 1 },
    mapSize - 1
  );
  // For the east peak, we'll enter from the left edge, aka the first column, and the middle row.
  const eastPeakPlots = spotsReachable(
    map,
    { row: startingPos.row, column: 0 },
    mapSize - 1
  );

  console.log(northPeakPlots, southPeakPlots, westPeakPlots, eastPeakPlots);

  // We can add these results onto our total; they each only occur once.
  totalPlotsReachable =
    totalPlotsReachable +
    northPeakPlots +
    southPeakPlots +
    westPeakPlots +
    eastPeakPlots;

  // Next, let's look at the partially reachable corner garden tiles. We'll enter these at
  // the corners. Once again, we actually have 1 less step for each situation because
  // we're starting inside a map area.
  //
  // For the NW corners, we'll enter from the bottom right, aka the last row and last
  // column.
  const nwSmallCornerPlots = spotsReachable(
    map,
    { row: mapSize - 1, column: mapSize - 1 },
    Math.floor(mapSize / 2) - 1
  );
  const nwBigCornerPlots = spotsReachable(
    map,
    { row: mapSize - 1, column: mapSize - 1 },
    Math.floor((3 * mapSize) / 2) - 1
  );

  // For the NE corners, we'll enter from the bottom left, aka the last row and first
  // column.
  const neSmallCornerPlots = spotsReachable(
    map,
    { row: mapSize - 1, column: 0 },
    Math.floor(mapSize / 2) - 1
  );
  const neBigCornerPlots = spotsReachable(
    map,
    { row: mapSize - 1, column: 0 },
    Math.floor((3 * mapSize) / 2) - 1
  );

  // For the SW corners, we'll enter from the top right, aka the first row and last
  // column.
  const swSmallCornerPlots = spotsReachable(
    map,
    { row: 0, column: mapSize - 1 },
    Math.floor(mapSize / 2) - 1
  );
  const swBigCornerPlots = spotsReachable(
    map,
    { row: 0, column: mapSize - 1 },
    Math.floor((3 * mapSize) / 2) - 1
  );

  // For the SE corners, we'll enter from the top left, aka the first row and first
  // column.
  const seSmallCornerPlots = spotsReachable(
    map,
    { row: 0, column: 0 },
    Math.floor(mapSize / 2) - 1
  );
  const seBigCornerPlots = spotsReachable(
    map,
    { row: 0, column: 0 },
    Math.floor((3 * mapSize) / 2) - 1
  );

  console.log(
    nwSmallCornerPlots,
    nwBigCornerPlots,
    neSmallCornerPlots,
    neBigCornerPlots,
    swSmallCornerPlots,
    swBigCornerPlots,
    seSmallCornerPlots,
    seBigCornerPlots
  );

  // We can once again infer the number of times each of this type of tile appears given
  // `traversableMaps`. When we can go up to 2 full maps away, for example:
  //
  //   ◢ ⬓ ◣
  // ◢ ◪ ■ ⬕ ◣
  // ◨ ■ ■ ■ ◧
  // ◥ ⬔ ■ ◩ ◤
  //   ◥ ⬒ ◤
  //
  // Each of the more-reachable (3/2) corner tiles only appears once each, whereas the
  // less-reachable (1/2) corner tiles appear twice each. It seems likely we have a N-1
  // and N scenario, then, but we'll check with moving up to 4 full maps away, too.
  //
  //       ◢ ⬓ ◣
  //     ◢ ◪ ■ ⬕ ◣
  //   ◢ ◪ ■ ■ ■ ⬕ ◣
  // ◢ ◪ ■ ■ ■ ■ ■ ⬕ ◣
  // ◨ ■ ■ ■ ■ ■ ■ ■ ◧
  // ◥ ⬔ ■ ■ ■ ■ ■ ◩ ◤
  //   ◥ ⬔ ■ ■ ■ ◩ ◤
  //     ◥ ⬔ ■ ◩ ◤
  //       ◥ ⬒ ◤
  //
  // Here, each of the more-reachable (3/2) corner tiles appears 3 times, and each of the
  // less-reachable tiles appears 4 times. This further cements the inference.
  const numLessReachableTiles = traverseableMaps;
  const numMoreReachableTiles = traverseableMaps - 1;

  // Once again, compute the total number of corner tile plots reachable using these
  // numbers and add them all to the total.
  totalPlotsReachable =
    totalPlotsReachable +
    // Each of the smaller corners appears `numLessReachableTiles` times.
    numLessReachableTiles *
      (nwSmallCornerPlots +
        neSmallCornerPlots +
        swSmallCornerPlots +
        seSmallCornerPlots) +
    // Each of the larger corners appears `numLessReachableTiles` times.
    numMoreReachableTiles *
      (nwBigCornerPlots +
        neBigCornerPlots +
        swBigCornerPlots +
        seBigCornerPlots);

  // With that, we *should* have our final total!
  console.log("part 2 total:", totalPlotsReachable);
});

// too big:   617361074411422
// actual:    617361073602319
