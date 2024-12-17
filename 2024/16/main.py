from typing import TextIO
import heapq
import math


def parse_file(file: TextIO) -> list[list[str]]:
    return [list(line.strip()) for line in file]


def find_start_and_end(
    maze: list[list[str]],
) -> tuple[tuple[int, int], tuple[int, int]]:
    start = end = None
    for row_index, row in enumerate(maze):
        for col_index, cell in enumerate(row):
            if cell == "S":
                start = (row_index, col_index)
            elif cell == "E":
                end = (row_index, col_index)
    if start is None or end is None:
        raise ValueError("Maze must contain a start and end point")
    return start, end


NORTH = (-1, 0)
SOUTH = (1, 0)
EAST = (0, 1)
WEST = (0, -1)


def turn_right(direction: tuple[int, int]) -> tuple[int, int]:
    if direction == NORTH:
        return EAST
    elif direction == EAST:
        return SOUTH
    elif direction == SOUTH:
        return WEST
    return NORTH


def turn_left(direction: tuple[int, int]) -> tuple[int, int]:
    if direction == NORTH:
        return WEST
    elif direction == WEST:
        return SOUTH
    elif direction == SOUTH:
        return EAST
    return NORTH


def dijkstra(
    maze: list[list[str]],
    start: tuple[int, int],
    end: tuple[int, int],
    max_cost: float = math.inf,
) -> tuple[int, set[tuple[int, int]]]:
    """
    Implements Dijkstra's algorithm to find the shortest path from the start to
    the end in the weighted graph represented by the maze. The function returns
    the score of the shortest path and the set of nodes visited in the path (for
    Part 2).
    """

    def is_reachable(node: tuple[int, int]) -> bool:
        """
        Helper function to check if a node is within bounds and not a wall.
        """
        return (
            0 <= node[0] < len(maze)
            and 0 <= node[1] < len(maze[0])
            and maze[node[0]][node[1]] != "#"
        )

    min_heap: list[
        tuple[int, tuple[int, int], tuple[int, int], set[tuple[int, int]]]
        # (score, node, direction, nodes in path [for Part 2])
    ] = [(0, start, EAST, set([start]))]

    # Initialize the set of visited nodes and directions.
    visited: set[tuple[tuple[int, int], tuple[int, int]]] = set()
    # Continue until we reach the end node or the heap is empty.
    while len(min_heap) > 0:
        # Pop the node with the smallest score from the heap.
        current_score, current_node, direction, path = heapq.heappop(min_heap)
        # If we've visited this node in this direction before, skip it.
        if (current_node, direction) in visited:
            continue
        # Mark the current node/direction pair as visited.
        visited.add((current_node, direction))

        # If we've reached the end node, return the score and the path.
        if current_node == end:
            return int(current_score), path

        # Check the path straight ahead.
        new_node = (current_node[0] + direction[0], current_node[1] + direction[1])
        # If the new node is within bounds and not a wall...
        if is_reachable(new_node):
            # Calculate the new score from going straight.
            new_score = current_score + 1
            # If the new score would exceed our max, skip this path (for Part 2).
            if new_score > max_cost:
                continue
            # Otherwise, add the new node to the heap.
            heapq.heappush(
                min_heap, (new_score, new_node, direction, path.copy() | {new_node})
            )

        # Also try to turn 90 degrees left and right, take a step forward, and
        # check if we can go in that direction.
        for new_direction in (turn_left(direction), turn_right(direction)):
            new_node = (
                current_node[0] + new_direction[0],
                current_node[1] + new_direction[1],
            )
            # If the new node is within bounds and not a wall...
            if is_reachable(new_node):
                # Calculate the new score from turning and going straight.
                new_score = current_score + 1001
                # If the new score would exceed our max, skip this path (for
                # Part 2).
                if new_score > max_cost:
                    continue
                # Otherwise, add the new node to the heap.
                heapq.heappush(
                    min_heap,
                    (new_score, new_node, new_direction, path.copy() | {new_node}),
                )

    raise ValueError("No path found")


def find_best_path_tiles(maze: list[list[str]]) -> set[tuple[int, int]]:
    """
    Determines which tiles are part of at least one of the best paths through
    the maze, and returns the set of them. We accomplish this by running
    Dijkstra's once first to find an initial best path, then for each position
    along the path, replace it with a wall and run Dijkstra's again to see if we
    can find another path with the same score. By doing this, we can exhaust all
    possible paths that have the same score as the initial best path by forcing
    the path to go around the blocked tile.
    NOTE: This implementation is slow since it runs Dijkstra's so many times,
    but it's good enough for the input size.
    """
    start, end = find_start_and_end(maze)
    min_score, path = dijkstra(maze, start, end)
    spots = set(path)
    # For each position along the path, replace it with a wall and run
    # Dijkstra's again.
    for position in path:
        if position == start or position == end:
            continue

        new_maze = [row.copy() for row in maze]
        new_maze[position[0]][position[1]] = "#"
        # Try to find a path with the same score. We'll break out early if we
        # exceed `min_score` to save time.
        try:
            _, new_path = dijkstra(new_maze, start, end, min_score)
            spots.update(new_path)
        # If we don't find a path, we'll get a ValueError, which we can ignore.
        except ValueError:
            pass

    return spots


with open("test.txt", "r") as f:
    maze = parse_file(f)
    start, end = find_start_and_end(maze)
    assert start == (15, 1), f"Expected (15, 1), but got {start}"
    assert end == (1, 15), f"Expected (1, 15), but got {end}"

    min_score, _ = dijkstra(maze, start, end)
    assert min_score == 11048, f"Expected 11048, but got {min_score}"

    # Part 2
    spots = find_best_path_tiles(maze)
    assert len(spots) == 64, f"Expected 64, but got {len(spots)}"

print("All tests passed.")

with open("input.txt", "r") as f:
    maze = parse_file(f)
    start, end = find_start_and_end(maze)
    min_score, _ = dijkstra(maze, start, end)
    print("Part 1:", min_score)

    # Part 2
    spots = find_best_path_tiles(maze)
    print("Part 2:", len(spots))
