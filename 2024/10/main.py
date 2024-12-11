from typing import TextIO


def parse_file(file: TextIO) -> list[list[int]]:
    return [[int(value) for value in line.strip()] for line in file]


def find_hiking_trails_from_tile(
    map: list[list[int]], tile: tuple[int, int], looking_for: int
) -> list[tuple[int, int]]:
    """
    Find all the hiking trails starting from the given tile. The tile must have
    the elevation we're looking for. The function will recursively check the
    surrounding tiles to find the hiking trails, returning the list of
    destination tiles for each trail found.
    """
    row, col = tile
    # If the tile is out of bounds or is not the one we're looking for, there
    # are 0 hiking trails from this tile.
    if (
        row < 0
        or row >= len(map)
        or col < 0
        or col >= len(map[0])
        or map[row][col] != looking_for
    ):
        return []

    # If the tile is at the final elevation, 9, we reached a single hiking
    # trail's destination.
    if map[row][col] == 9:
        return [(row, col)]

    # Otherwise, we need to further explore the surrounding tiles. We will check
    # in each of the four cardinal directions and concatenate the results.
    next_elevation = looking_for + 1
    return (
        find_hiking_trails_from_tile(map, (row - 1, col), next_elevation)
        + find_hiking_trails_from_tile(map, (row + 1, col), next_elevation)
        + find_hiking_trails_from_tile(map, (row, col - 1), next_elevation)
        + find_hiking_trails_from_tile(map, (row, col + 1), next_elevation)
    )


def count_hiking_trails(map: list[list[int]]) -> tuple[int, int]:
    total_unique = 0
    total_ratings = 0
    for row_index, row in enumerate(map):
        for tile_index, tile in enumerate(row):
            if tile == 0:
                trail_destinations = find_hiking_trails_from_tile(
                    map, (row_index, tile_index), 0
                )
                # For Part 1, we're actually only concerned with the number of
                # unique destinations we can reach from a given trailhead.
                unique_count = len(set(trail_destinations))
                total_unique += unique_count
                # Part 2 asks for total distinct *paths*, so we count them all.
                total_ratings += len(trail_destinations)

    return (total_unique, total_ratings)


with open("test.txt", "r") as file:
    map = parse_file(file)
    (count_1, count_2) = count_hiking_trails(map)
    assert count_1 == 36, f"Expected 36, but got {count_1}"
    assert count_2 == 81, f"Expected 81, but got {count_2}"

print("All tests passed.")

with open("input.txt", "r") as file:
    map = parse_file(file)
    (count_1, count_2) = count_hiking_trails(map)
    print("Part 1:", count_1)
    print("Part 2:", count_2)
