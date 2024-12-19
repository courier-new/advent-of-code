from typing import TextIO
import heapq


def parse_falling_bytes(file: TextIO) -> list[tuple[int, int]]:
    positions = []
    for line in file:
        x, y = line.strip().split(",")
        # Append the tuple as (row, column), which is actually (y, x).
        positions.append((int(y), int(x)))
    return positions


def corrupt_memory_space(
    size: int, nanoseconds: int, falling_bytes: list[tuple[int, int]]
) -> list[list[str]]:
    memory_space = [["."] * size for _ in range(size)]
    for row, column in falling_bytes[:nanoseconds]:
        memory_space[row][column] = "#"
    return memory_space


def dijkstra(memory_space: list[list[str]], start: tuple[int, int]) -> int:
    """
    Implements Dijkstra's algorithm to find the shortest path from the start to
    the end in the memory space. The function returns the length of the shortest
    path. If no path is found, the function raises a ValueError.
    """

    def is_reachable(node: tuple[int, int]) -> bool:
        """
        Helper function to check if a node is within bounds and not a wall.
        """
        return (
            0 <= node[0] < len(memory_space)
            and 0 <= node[1] < len(memory_space[0])
            and memory_space[node[0]][node[1]] != "#"
        )

    min_heap: list[
        tuple[int, tuple[int, int]]
        # (path length, position)
    ] = [(0, start)]

    # Initialize the set of visited positions
    visited: set[tuple[int, int]] = set()

    # Continue until we reach the end position or the heap is empty.
    while len(min_heap) > 0:
        # Pop the position with the smallest score from the heap.
        current_length, current_pos = heapq.heappop(min_heap)
        # If we've visited this position before, skip it.
        if current_pos in visited:
            continue
        # Mark the current position as visited.
        visited.add(current_pos)

        # If we've reached the end, return the path length.
        if current_pos == (len(memory_space) - 1, len(memory_space[0]) - 1):
            return current_length

        # Check the four cardinal directions from the current position.
        neighbors = [
            (current_pos[0] + 1, current_pos[1]),
            (current_pos[0] - 1, current_pos[1]),
            (current_pos[0], current_pos[1] + 1),
            (current_pos[0], current_pos[1] - 1),
        ]

        for neighbor in neighbors:
            # If the neighbor is within bounds and not a wall, it's a path we can take.
            if is_reachable(neighbor):
                # Add the neighbor to the heap with the new path length to
                # continue exploring.
                heapq.heappush(min_heap, (current_length + 1, neighbor))

    raise ValueError("No path found")


def find_first_totally_blocked_byte(
    size: int, falling_bytes: list[tuple[int, int]]
) -> tuple[int, int]:
    """
    Finds the first byte that completely corrupts the memory space, such that no
    path is possible from the top left corner to the bottom right corner. The
    function returns the coordinates of that byte.
    """
    # Working from the last byte position, we can simulate the falling bytes and
    # find the last byte before the memory space is fully corrupted and no path
    # is possible.
    reversed_positions = list(reversed(falling_bytes))
    # We want to return the first byte that completely corrupts the memory
    # space, which will be the byte just before we find a valid path, when
    # working back to front.
    last_coord = reversed_positions[0]
    for i, coord in enumerate(reversed_positions):
        # Try with corrupted memory space up to all bytes up to the ith byte position.
        memory_space = corrupt_memory_space(size, len(falling_bytes) - i, falling_bytes)
        try:
            dijkstra(memory_space, (0, 0))
            return last_coord
        except ValueError:
            last_coord = coord
            continue

    raise ValueError("Paths found for all bytes")


with open("test.txt", "r") as file:
    byte_positions = parse_falling_bytes(file)
    memory_space = corrupt_memory_space(7, 12, byte_positions)
    shortest_path_length = dijkstra(memory_space, (0, 0))
    assert shortest_path_length == 22, f"Expected 22, but got {shortest_path_length}"

    # Part 2
    first_blocking_byte = find_first_totally_blocked_byte(7, byte_positions)
    assert first_blocking_byte == (
        1,
        6,
    ), f"Expected (1, 6), but got {first_blocking_byte}"

print("All tests passed.")

with open("input.txt", "r") as file:
    byte_positions = parse_falling_bytes(file)
    # In 0-indexed 2D space, if (70, 70) is the bottom right corner, then the
    # size is 71x71.
    memory_space = corrupt_memory_space(71, 1024, byte_positions)
    shortest_path_length = dijkstra(memory_space, (0, 0))
    print("Part 1:", shortest_path_length)

    # Part 2
    first_blocking_byte = find_first_totally_blocked_byte(71, byte_positions)
    print("Part 2:", f"{first_blocking_byte[1]},{first_blocking_byte[0]}")
