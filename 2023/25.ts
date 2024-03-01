/* --- Day 25: Snowverload ---
Still somehow without snow, you go to the last place you haven't checked: the center of
Snow Island, directly below the waterfall.

Here, someone has clearly been trying to fix the problem. Scattered everywhere are
hundreds of weather machines, almanacs, communication modules, hoof prints, machine parts,
mirrors, lenses, and so on.

Somehow, everything has been wired together into a massive snow-producing apparatus, but
nothing seems to be running. You check a tiny screen on one of the communication modules:
Error 2023. It doesn't say what Error 2023 means, but it does have the phone number for a
support line printed on it.

"Hi, you've reached Weather Machines And So On, Inc. How can I help you?" You explain the
situation.

"Error 2023, you say? Why, that's a power overload error, of course! It means you have too
many components plugged in. Try unplugging some components and--" You explain that there
are hundreds of components here and you're in a bit of a hurry.

"Well, let's see how bad it is; do you see a big red reset button somewhere? It should be
on its own module. If you push it, it probably won't fix anything, but it'll report how
overloaded things are." After a minute or two, you find the reset button; it's so big that
it takes two hands just to get enough leverage to push it. Its screen then displays:

SYSTEM OVERLOAD!

Connected components would require
power equal to at least 100 stars!

"Wait, how many components did you say are plugged in? With that much equipment, you could
produce snow for an entire--" You disconnect the call.

You have nowhere near that many stars - you need to find a way to disconnect at least half
of the equipment here, but it's already Christmas! You only have time to disconnect three
wires.

Fortunately, someone left a wiring diagram (your puzzle input) that shows how the
components are connected. For example:

jqt: rhn xhk nvd
rsh: frs pzl lsr
xhk: hfx
cmg: qnr nvd lhk bvb
rhn: xhk bvb hfx
bvb: xhk hfx
pzl: lsr hfx nvd
qnr: nvd
ntq: jqt hfx bvb xhk
nvd: lhk
lsr: lhk
rzs: qnr cmg lsr rsh
frs: qnr lhk lsr

Each line shows the name of a component, a colon, and then a list of other components to
which that component is connected. Connections aren't directional; abc: xyz and xyz: abc
both represent the same configuration. Each connection between two components is
represented only once, so some components might only ever appear on the left or right side
of a colon.

In this example, if you disconnect the wire between hfx/pzl, the wire between bvb/cmg, and
the wire between nvd/jqt, you will divide the components into two separate, disconnected
groups:

9 components: cmg, frs, lhk, lsr, nvd, pzl, qnr, rsh, and rzs.
6 components: bvb, hfx, jqt, ntq, rhn, and xhk.

Multiplying the sizes of these groups together produces 54.

Find the three wires you need to disconnect in order to divide the components into two
separate groups. What do you get if you multiply the sizes of these two groups together?
*/

type Node = {
  key: string;
  connections: string[];
};

function parseWiringDiagram(diagram: string): Record<string, Node> {
  let nodes: Record<string, Node> = {};

  for (const line of diagram.split("\n")) {
    const [key, connections] = line.split(": ");
    if (!key || !connections)
      throw new Error(`Invalid wiring diagram entry: ${line}`);
    for (const connection of connections.split(/\s+/)) {
      nodes = addConnection(nodes, key, connection);
    }
  }

  return nodes;
}

/**
 * Small utility function that adds a connection between two nodes in a graph. If the
 * nodes do not exist in the connections record, they will be initialized. If the nodes
 * already exist, the connection will be added to their existing connections.
 *
 * @param connections - The record of nodes and their connections.
 * @param node1Key - The key of the first node.
 * @param node2Key - The key of the second node.
 * @returns The updated connections record.
 */
function addConnection(
  connections: Record<string, Node>,
  node1Key: string,
  node2Key: string
): Record<string, Node> {
  // Initialize or update node1's connections to include node2
  if (!connections[node1Key]) {
    connections[node1Key] = { key: node1Key, connections: [node2Key] };
  } else {
    connections[node1Key]!.connections.push(node2Key);
  }

  // Initialize or update node2's connections to include node1
  if (!connections[node2Key]) {
    connections[node2Key] = { key: node2Key, connections: [node1Key] };
  } else {
    connections[node2Key]!.connections.push(node1Key);
  }

  return connections;
}

/**
 * Small utility function that removes a connection between two nodes in a graph.
 *
 * @param connections - The record of nodes and their connections.
 * @param node1Key - The key of the first node.
 * @param node2Key - The key of the second node.
 * @returns The updated record of nodes and their connections.
 */
function removeConnection(
  connections: Record<string, Node>,
  node1Key: string,
  node2Key: string
): Record<string, Node> {
  // Remove node2 from node1's connections
  if (connections[node1Key]) {
    connections[node1Key]!.connections = connections[
      node1Key
    ]!.connections.filter((key) => key !== node2Key);
  }

  // Remove node1 from node2's connections
  if (connections[node2Key]) {
    connections[node2Key]!.connections = connections[
      node2Key
    ]!.connections.filter((key) => key !== node1Key);
  }

  return connections;
}

type EdgeKey = `${string}/${string}`;

function buildEdgeKey(key1: string, key2: string): EdgeKey {
  return key1 < key2 ? `${key1}/${key2}` : `${key2}/${key1}`;
}

type EdgeWeights = Record<EdgeKey, number>;

function findDisconnectedGroups(
  diagram: string,
  randomSampleChance = 0.005
): [string[], string[]] {
  const nodeConnections = parseWiringDiagram(diagram);
  console.log("Total nodes:", Object.keys(nodeConnections).length);

  // We will start by identifying the shortest path between two nodes for every pair of
  // nodes in the wiring diagram. For each edge that is used for that path, we'll keep a
  // tally of how many pairs of nodes use that edge. Statistically, the edges that were
  // used by the most shortest paths are the "most important" edges in the graph, and thus
  // severing them is likely to disconnect the graph into its two separate groups.
  // However, tracing paths for every single pair of nodes in our graph is a bit
  // computationally expensive given we're looking at over 1500 nodes. So instead, we'll
  // only trace the paths of 0.5% of the pairs of nodes, chosen at random, and repeat the
  // process several times. This should approximate the results of tracing all paths, but with
  // a fraction of the computational cost.

  // Compute the edge weights by tracing the shortest path between pairs of nodes.
  const edgeWeights = computeEdgeWeights(nodeConnections, randomSampleChance);

  // Now that we have a record of which edges are most important, we can sort them by
  // weight and try severing the top 3 edges and rebuilding the graph to see if it
  // separates into two groups.
  const sortedEdges = Object.entries(edgeWeights).sort(
    ([, weight1], [, weight2]) => weight2 - weight1
  );

  // Due to the random sampling, the top 3 edges may not be the solution, so we'll try with
  // combinations of the top 6.
  const topSixEdges = sortedEdges.map(([edgeKey, _]) => edgeKey).slice(0, 5);
  const combinations = buildCombinations(topSixEdges);

  for (const [edge1, edge2, edge3] of combinations) {
    const [key1, key2] = edge1!.split("/");
    if (!key1 || !key2) throw new Error(`Invalid edge key: ${edge1}`);
    const [key3, key4] = edge2!.split("/");
    if (!key3 || !key4) throw new Error(`Invalid edge key: ${edge2}`);
    const [key5, key6] = edge3!.split("/");
    if (!key5 || !key6) throw new Error(`Invalid edge key: ${edge3}`);

    // Deep copy the nodeConnections record and remove the three edges.
    let newConnections = JSON.parse(JSON.stringify(nodeConnections));
    newConnections = removeConnection(newConnections, key1, key2);
    newConnections = removeConnection(newConnections, key3, key4);
    newConnections = removeConnection(newConnections, key5, key6);

    // Now we'll try building groups from the remaining connections and see if we find
    // two distinct groups.
    const groups = buildGroups(newConnections);
    if (groups.length === 2) {
      console.log("Found two groups for edges:", edge1, edge2, edge3);
      return groups as [string[], string[]];
    }
  }

  throw new Error("No solution found");
}

/**
 * Computes the weights of the edges between pairs of nodes in a graph. The weight of an
 * edge represents the number of times it was used in the shortest path between two nodes.
 *
 * @param nodeConnections - A record containing the connections between nodes.
 * @param randomSampleChance - The chance of randomly sub-sampling pairs of nodes.
 * @returns An object representing the edge weights between pairs of nodes.
 */
function computeEdgeWeights(
  nodeConnections: Record<string, Node>,
  randomSampleChance: number
): EdgeWeights {
  const nodeKeys = Object.keys(nodeConnections);
  let edgeWeights: EdgeWeights = {};

  // Iterate over pairs of nodes
  let [key1, ...rest] = nodeKeys;
  while (key1 !== undefined) {
    let [key2, ...rest2] = rest;
    while (key2 !== undefined) {
      // Randomly sub-sample 10% of the pairs of nodes.
      if (Math.random() <= randomSampleChance) {
        // Trace the shortest path between key1 and key2 and update the edgeWeights record.
        edgeWeights = shortestPath(nodeConnections, edgeWeights, key1, key2);
      }
      [key2, ...rest2] = rest2;
    }
    [key1, ...rest] = rest;
  }

  return edgeWeights;
}

/**
 * Traces the shortest path between two nodes in a graph, using Dijkstra's algorithm. For
 * each edge that is used in the shortest path, the `edgeWeights` record for that edge is
 * incremented. The updated `edgeWeights` record is returned.
 *
 * @param connections - The record of nodes and their connections.
 * @param edgeWeights - The record of times each edge has been used in a shortest path.
 * @param startKey - The key of the starting node.
 * @param endKey - The key of the ending node.
 * @returns The updated edgeWeights record and the path of nodes traversed.
 */
function shortestPath(
  connections: Record<string, Node>,
  edgeWeights: EdgeWeights,
  startKey: string,
  endKey: string
): EdgeWeights {
  const unvisited = new Set(
    Object.keys(connections).filter((key) => key !== startKey)
  );
  // Record to keep track of the shortest distance to each node from the start node.
  const distances: Record<string, number> = {};
  // Record to keep track of the previous node determined to be part of the shortest path
  // to each node.
  const previousNodes: Record<string, string | undefined> = {};

  // Initialize distances to all nodes as Infinity, except the start node.
  for (const key of unvisited) {
    distances[key] = Infinity;
  }
  distances[startKey] = 0;

  let currentKey = startKey;
  while (unvisited.size > 0) {
    const current = connections[currentKey];
    if (!current) throw new Error(`Node not found: ${currentKey}`);
    // For all the neighbors of the current node...
    for (const neighbor of current.connections) {
      // ...that are still unvisited...
      if (unvisited.has(neighbor)) {
        // ...calculate a tentative distance to this neighbor through the current node
        // as the distance to the current node + 1
        const distance = distances[currentKey]! + 1;
        // If this distance beats the best recorded distance to this neighbor, update it.
        if (distance < distances[neighbor]!) {
          distances[neighbor] = distance;
          previousNodes[neighbor] = currentKey;
        }
      }
    }

    // Mark the current node as visited.
    unvisited.delete(currentKey);

    // For the next iteration, we find the unvisited node that is currenty "closest" in
    // distance to the start.
    let shortestDistance = Infinity;
    let shortestNode: string | undefined;
    for (const node of unvisited) {
      if (distances[node]! < shortestDistance) {
        shortestDistance = distances[node]!;
        shortestNode = node;
      }
    }

    if (shortestNode === undefined) break;
    currentKey = shortestNode;

    // If we've reached the end node, we can stop.
    if (currentKey === endKey) break;
  }

  // Re-walk the path to determine which edges were used, and increment their weights.
  let nodeKey: string | undefined = endKey;
  while (nodeKey !== undefined && nodeKey !== startKey) {
    const previousNodeKey: string | undefined = previousNodes[nodeKey];
    if (previousNodeKey === undefined) throw new Error("No path found");

    const edgeKey = buildEdgeKey(nodeKey, previousNodeKey);
    edgeWeights[edgeKey] = (edgeWeights[edgeKey] ?? 0) + 1;

    nodeKey = previousNodeKey;
  }

  return edgeWeights;
}

/**
 * Builds all possible combinations of three elements from the given options array.
 *
 * @param options - An array of strings representing the available options.
 * @returns An array of arrays, where each inner array represents a combination of three elements.
 */
function buildCombinations(options: string[]): string[][] {
  let combinations: string[][] = [];

  for (let i = 0; i < options.length - 2; i++) {
    for (let j = i + 1; j < options.length - 1; j++) {
      for (let k = j + 1; k < options.length; k++) {
        combinations.push([options[i]!, options[j]!, options[k]!]);
      }
    }
  }

  return combinations;
}

function buildGroups(connections: Record<string, Node>): string[][] {
  const unvisited = new Set(Object.keys(connections));
  let groups: string[][] = [];

  let currentKey = Object.keys(connections)[0]!;
  while (unvisited.size > 0) {
    // We'll build a group by traversing the graph from the current key and adding all
    // connected nodes to the group. Once there are no more new connected nodes to add,
    // we'll have found a complete group.
    const group: string[] = [];
    const stack: string[] = [currentKey];
    while (stack.length > 0) {
      const key = stack.pop()!;
      if (unvisited.has(key)) {
        group.push(key);
        unvisited.delete(key);
        const neighbors = connections[key]?.connections || [];
        stack.push(...neighbors);
      }
    }

    groups.push(group);
    currentKey = Array.from(unvisited)[0]!;
  }

  return groups;
}

(function runTests() {
  const TEST_WIRING_DIAGRAM = `jqt: rhn xhk nvd
rsh: frs pzl lsr
xhk: hfx
cmg: qnr nvd lhk bvb
rhn: xhk bvb hfx
bvb: xhk hfx
pzl: lsr hfx nvd
qnr: nvd
ntq: jqt hfx bvb xhk
nvd: lhk
lsr: lhk
rzs: qnr cmg lsr rsh
frs: qnr lhk lsr`;

  const [g1, g2] = findDisconnectedGroups(TEST_WIRING_DIAGRAM, 1);
  const actual = g1.length * g2.length;
  console.assert(actual === 54, `Expected ${54} but got ${actual}`);
})();

const inputFile = Bun.file("./2023/25.txt");
const input = await inputFile.text();
const [group1, group2] = findDisconnectedGroups(input);
console.log(
  "Group sizes:",
  group1.length,
  group2.length,
  "Product:",
  group1.length * group2.length
);
