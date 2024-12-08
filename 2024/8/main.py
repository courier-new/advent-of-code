from typing import TextIO, Callable
from collections import defaultdict


def parse_input(
    file: TextIO,
) -> tuple[dict[str, list[tuple[int, int]]], tuple[int, int]]:
    """
    Constructs and returns a dictionary mapping of unique frequencies to lists
    of antenna positions, as well as a tuple of the map's total size.
    """
    antennas: dict[str, list[tuple[int, int]]] = defaultdict(list)
    rows = 0
    cols = 0
    for row, line in enumerate(file):
        rows += 1
        for col, freq in enumerate(line.strip()):
            cols += 1 if row == 0 else 0
            if freq != ".":
                antennas[freq].append((row, col))
    return antennas, (rows, cols)


# Part 1:
def find_antinodes_for_pair(
    antenna1: tuple[int, int], antenna2: tuple[int, int], is_in_bounds: Callable
) -> list[tuple[int, int]]:
    """
    For a pair of antennas, finds the two antinodes they create and returns
    them, if they are within the bounds of the map.
    """
    # Find the distance between the two positions.
    r_diff = antenna2[0] - antenna1[0]
    c_diff = antenna2[1] - antenna1[1]
    # Find the first antinode by subtracting the distances from the first
    # position (the position formed by the line "higher" on the map).
    antinode1 = (antenna1[0] - r_diff, antenna1[1] - c_diff)
    # Find the second antinode by adding the distances to the second position
    # (the position formed by the line "lower" on the map).
    antinode2 = (antenna2[0] + r_diff, antenna2[1] + c_diff)

    return [antinode for antinode in [antinode1, antinode2] if is_in_bounds(antinode)]


# Part 2:
def find_all_antinodes_for_pair(
    antenna1: tuple[int, int], antenna2: tuple[int, int], is_in_bounds: Callable
) -> list[tuple[int, int]]:
    """
    For a pair of antennas, finds all antinodes they create and returns them,
    if they are within the bounds of the map. The two antennas themselves are
    also considered antinodes.
    """
    antinodes: set[tuple[int, int]] = set()
    # Find the distance between the two positions.
    r_diff = antenna2[0] - antenna1[0]
    c_diff = antenna2[1] - antenna1[1]
    # Starting with the first antenna, find antinodes by subtracting
    # the distances from the first position, until we would go out of
    # bounds. This finds all antinodes on the line "higher" on the map,
    # including the first antenna.
    antinode = antenna1
    while is_in_bounds(antinode):
        antinodes.add(antinode)
        antinode = (antinode[0] - r_diff, antinode[1] - c_diff)
    # Starting with the second antenna, find antinodes by adding the distances
    # to the second position, until we would go out of bounds. This finds all
    # antinodes on the line "lower" on the map, including the second antenna.
    antinode = antenna2
    while is_in_bounds(antinode):
        antinodes.add(antinode)
        antinode = (antinode[0] + r_diff, antinode[1] + c_diff)

    return list(antinodes)


def find_antinodes(
    antennas: dict[str, list[tuple[int, int]]],
    map_rows: int,
    map_cols: int,
    find_antinodes_for_pair: Callable[
        [tuple[int, int], tuple[int, int], Callable], list[tuple[int, int]]
    ],
) -> set[tuple[int, int]]:
    """
    Find the unique positions of antinodes within the bounds of the map.
    """

    def is_in_bounds(pos: tuple[int, int]) -> bool:
        return 0 <= pos[0] < map_rows and 0 <= pos[1] < map_cols

    antinodes: set[tuple[int, int]] = set()
    for frequency, positions in antennas.items():
        # Form pairs of every combination of positions for the same frequency.
        pairs = [
            (pos1, pos2)
            for i, pos1 in enumerate(positions)
            for pos2 in positions[i + 1 :]
        ]
        # Find the antinodes for each pair of positions and add them to the set.
        for pos1, pos2 in pairs:
            antinodes.update(find_antinodes_for_pair(pos1, pos2, is_in_bounds))

    return antinodes


with open("test.txt", "r") as f:
    antennas, (rows, cols) = parse_input(f)
    antinodes = find_antinodes(antennas, rows, cols, find_antinodes_for_pair)
    assert (
        len(antinodes) == 14
    ), f"Part 1: Expected 14 antinodes, but got {len(antinodes)}."

    # Part 2:
    antinodes = find_antinodes(antennas, rows, cols, find_all_antinodes_for_pair)
    assert (
        len(antinodes) == 34
    ), f"Part 2: Expected 34 antinodes, but got {len(antinodes)}."

print("All tests passed.")

with open("input.txt", "r") as f:
    antennas, (rows, cols) = parse_input(f)
    antinodes = find_antinodes(antennas, rows, cols, find_antinodes_for_pair)
    print(f"Part 1: {len(antinodes)}")

    # Part 2:
    antinodes = find_antinodes(antennas, rows, cols, find_all_antinodes_for_pair)
    print(f"Part 2: {len(antinodes)}")
