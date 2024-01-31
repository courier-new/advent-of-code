/* --- Day 23: A Long Walk ---
The Elves resume water filtering operations! Clean water starts flowing over the edge of
Island Island.

They offer to help you go over the edge of Island Island, too! Just hold on tight to one
end of this impossibly long rope and they'll lower you down a safe distance from the
massive waterfall you just created.

As you finally reach Snow Island, you see that the water isn't really reaching the ground:
it's being absorbed by the air itself. It looks like you'll finally have a little downtime
while the moisture builds up to snow-producing levels. Snow Island is pretty scenic, even
without any snow; why not take a walk?

There's a map of nearby hiking trails (your puzzle input) that indicates paths (.), forest
(#), and steep slopes (^, >, v, and <).

For example:

#.#####################
#.......#########...###
#######.#########.#.###
###.....#.>.>.###.#.###
###v#####.#v#.###.#.###
###.>...#.#.#.....#...#
###v###.#.#.#########.#
###...#.#.#.......#...#
#####.#.#.#######.#.###
#.....#.#.#.......#...#
#.#####.#.#.#########v#
#.#...#...#...###...>.#
#.#.#v#######v###.###v#
#...#.>.#...>.>.#.###.#
#####v#.#.###v#.#.###.#
#.....#...#...#.#.#...#
#.#########.###.#.#.###
#...###...#...#...#.###
###.###.#.###v#####v###
#...#...#.#.>.>.#.>.###
#.###.###.#.###.#.#v###
#.....###...###...#...#
#####################.#

You're currently on the single path tile in the top row; your goal is to reach the single
path tile in the bottom row. Because of all the mist from the waterfall, the slopes are
probably quite icy; if you step onto a slope tile, your next step must be downhill (in the
direction the arrow is pointing). To make sure you have the most scenic hike possible,
never step onto the same tile twice. What is the longest hike you can take?

In the example above, the longest hike you can take is marked with O, and your starting
position is marked S:

#S#####################
#OOOOOOO#########...###
#######O#########.#.###
###OOOOO#OOO>.###.#.###
###O#####O#O#.###.#.###
###OOOOO#O#O#.....#...#
###v###O#O#O#########.#
###...#O#O#OOOOOOO#...#
#####.#O#O#######O#.###
#.....#O#O#OOOOOOO#...#
#.#####O#O#O#########v#
#.#...#OOO#OOO###OOOOO#
#.#.#v#######O###O###O#
#...#.>.#...>OOO#O###O#
#####v#.#.###v#O#O###O#
#.....#...#...#O#O#OOO#
#.#########.###O#O#O###
#...###...#...#OOO#O###
###.###.#.###v#####O###
#...#...#.#.>.>.#.>O###
#.###.###.#.###.#.#O###
#.....###...###...#OOO#
#####################O#

This hike contains 94 steps. (The other possible hikes you could have taken were 90, 86,
82, 82, and 74 steps long.)

Find the longest hike you can take through the hiking trails listed on your map. How many
steps long is the longest hike? */

const TEST_HIKES: { map: string; longestPath: number }[] = [
  {
    map: `##.###
##.>.#
####.#`,
    longestPath: 4,
  },
  {
    map: `#.#####################
#.......#########...###
#######.#########.#.###
###.....#.>.>.###.#.###
###v#####.#v#.###.#.###
###.>...#.#.#.....#...#
###v###.#.#.#########.#
###...#.#.#.......#...#
#####.#.#.#######.#.###
#.....#.#.#.......#...#
#.#####.#.#.#########v#
#.#...#...#...###...>.#
#.#.#v#######v###.###v#
#...#.>.#...>.>.#.###.#
#####v#.#.###v#.#.###.#
#.....#...#...#.#.#...#
#.#########.###.#.#.###
#...###...#...#...#.###
###.###.#.###v#####v###
#...#...#.#.>.>.#.>.###
#.###.###.#.###.#.#v###
#.....###...###...#...#
#####################.#`,
    longestPath: 94,
  },
];

// One thing we notice both about the example input and our personal input is that the
// path is pretty much always 1 wide, more like a sparse maze than like a bunch of
// spaghetti semi-overlapping paths. There are very few branching points. This means that
// when we construct a graph representation of nodes in the hiking map, we can actually
// contract paths between two nodes if there's no other way to go between them. So instead
// of 7 nodes in a row all 1 apart, we could just have 2 nodes with an edge length of 7
// between them, for example. Once we've built this graph, we can just perform DFS to find
// the longest path through it.

type Position = [row: number, column: number];

function findLongestHike(map: string): number {
  // We'll start by splitting the map into rows.
  const grid = map.split("\n");

  // We want to find all the vertices in the grid first so that we can contract paths
  // between them and build a graph with those edges.
  let vertices = findVertices(grid);
  // We also need to add our start and end points to this list. They should be the only
  // path characters in the first and last rows of the grid.
  const start: Position = [0, grid[0]!.indexOf(".")!];
  const end: Position = [grid.length - 1, grid[grid.length - 1]!.indexOf(".")!];
  vertices = [start, ...vertices, end];

  // Now we can build the graph of contracted edges between vertices.
  const graph = buildGraph(grid, vertices);

  // Now we can perform DFS to find the longest path through the graph from the start to
  // the end.
  return dfs(graph, start, end);
}

const SLOPES: Record<string, [dr: number, dc: number]> = {
  "^": [-1, 0],
  ">": [0, 1],
  v: [1, 0],
  "<": [0, -1],
};

// Helper function which scans each tile in the grid and returns a list of all of the
// tiles which are vertices in the graph. A vertex is defined as a tile which has more
// than two paths branching from it.
function findVertices(grid: string[]): Position[] {
  const vertices: Position[] = [];

  let rowIndex = 0;
  while (rowIndex < grid.length) {
    const row = grid[rowIndex]!;

    let colIndex = 0;
    while (colIndex < row.length) {
      const char = row[colIndex]!;
      if (char !== "#") {
        // Count the number of paths that branch from this location. We want to check in all
        // four cardinal directions up to 1 away for non-forest (#) tiles. If we find more
        // than two, then this is a vertex. If we find only 2, it's only possible to move
        // forwards or backwards, so we don't need to represent that node as a vertex.
        const numNeighbors: number = Object.values(SLOPES).filter(
          ([dr, dc]) => {
            const r = rowIndex + dr;
            const c = colIndex + dc;
            // If the row or column is in bounds and not a forest, then it's a valid neighbor.
            return (
              0 <= r &&
              r < grid.length &&
              0 <= c &&
              c < row.length &&
              grid[r]![c] !== "#"
            );
          }
        ).length;

        if (numNeighbors > 2) {
          vertices.push([rowIndex, colIndex]);
        }
      }
      colIndex = colIndex + 1;
    }

    rowIndex = rowIndex + 1;
  }

  return vertices;
}

// Since we can't use a tuple as a JS object key, we'll stringify it and index the graph
// that way.
type PositionString = string;

type Edge = {
  distance: number;
  to: PositionString;
};

// Helper function which builds a graph from the grid and vertices. The graph is an
// adjacency list mapping each vertex to all adjacent vertices, along with the distance
// between them.
function buildGraph(
  grid: string[],
  vertices: Position[]
): Record<PositionString, Edge[]> {
  const graph: Record<PositionString, Edge[]> = {};

  // We'll perform DFS outwards from each vertex to find every other vertex that is
  // directly connected to it. Once we reach a vertex, we stop and record the distance
  // between the two vertices as its edge length.

  for (const vertex of vertices) {
    // Add the vertex to the graph.
    graph[JSON.stringify(vertex)] = [];

    // We'll use a stack to perform DFS. Each element in the stack is a tuple of the
    // current position and the distance from the previous vertex.
    const stack: [Position, distance: number][] = [[vertex, 0]];
    // We'll also keep track of which positions we've already visited so that we don't
    // double-count them.
    const visited: Set<PositionString> = new Set();

    while (stack.length > 0) {
      const [position, distance] = stack.pop()!;
      const [row, col] = position;

      // If we've already visited this position, we can skip it.
      if (visited.has(JSON.stringify(position))) {
        continue;
      }

      // Otherwise, mark it as visited.
      visited.add(JSON.stringify(position));

      // If it's a slope, we can only move in the direction of the slope. Otherwise, we
      // can move in any direction.
      const char = grid[row]![col]!;
      const directions: [dr: number, dc: number][] =
        char in SLOPES ? [SLOPES[char]!] : Object.values(SLOPES);

      // Check each valid direction for a path.
      for (const [dr, dc] of directions) {
        const nextRow = row + dr;
        const nextCol = col + dc;

        // If the next position is in bounds and not forest, then we can continue
        // exploring from it.
        if (
          0 <= nextRow &&
          nextRow < grid.length &&
          0 <= nextCol &&
          nextCol < grid[nextRow]!.length &&
          grid[nextRow]![nextCol] !== "#"
        ) {
          // If the next position is a different vertex than the one we started from,
          // we've found the end of an edge. We can record the distance between the two
          // vertices and move on to other edges.
          if (
            !(nextRow === vertex[0] && nextCol === vertex[1]) &&
            vertices.some(([r, c]) => r === nextRow && c === nextCol)
          ) {
            graph[JSON.stringify(vertex)]!.push({
              distance: distance + 1,
              to: JSON.stringify([nextRow, nextCol]),
            });
          } else {
            // Otherwise, we can continue exploring from the next position.
            stack.push([[nextRow, nextCol], distance + 1]);
          }
        }
      }
    }
  }
  return graph;
}

// Helper function which performs DFS from the start vertex to the end vertex in the
// graph, returning the maximum distance between them.
function dfs(
  graph: Record<PositionString, Edge[]>,
  start: Position,
  end: Position
) {
  // We'll use a stack to perform DFS. Each element in the stack is a tuple of the
  // current vertex, a string representation of the path taken so far (to prevent cycling), and the distance from the start vertex we've traveled so far.
  const stack: [Position, pathTaken: string, distance: number][] = [
    [start, JSON.stringify(start), 0],
  ];

  // We'll keep track of the maximum distance we've seen so far.
  let maxDistance = -Infinity;

  while (stack.length > 0) {
    const [position, path, distance] = stack.pop()!;

    // Add this new position to the path taken.
    const newPath = path + "->" + JSON.stringify(position);

    const [row, col] = position;
    // If we've reached the end, we can check the distance we ended up with and see if it
    // beats the current max.
    if (row === end[0] && col === end[1]) {
      maxDistance = Math.max(maxDistance, distance);
    }

    // Otherwise, we can continue exploring from this position. Add all of the adjacent
    // vertices to the stack that we haven't already visited.
    for (const { to, distance: edgeDistance } of graph[
      JSON.stringify(position)
    ]!) {
      if (!newPath.includes(to)) {
        stack.push([JSON.parse(to), newPath, distance + edgeDistance]);
      }
    }
  }

  return maxDistance;
}

// Test cases
for (const { map, longestPath } of TEST_HIKES) {
  const result = findLongestHike(map);
  if (result !== longestPath) {
    console.error("❌, expected", longestPath, "but got", result);
  } else {
    console.log("✅");
  }
}

// Now try for the real hiking map input.
const inputFile = Bun.file("./2023/23.txt");
const input = await inputFile.text();
const result = findLongestHike(input);
console.log("Part 1:", result);
