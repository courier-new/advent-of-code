from typing import TextIO, TypedDict
import re


class Robot(TypedDict):
    initial_position: tuple[int, int]
    velocity: tuple[int, int]


ROBOT_REGEX = r"p=(-?\d+),(-?\d+) v=(-?\d+),(-?\d+)"


def parse_robots(file: TextIO) -> list[Robot]:
    robots = []
    for line in file:
        # p=0,4 v=3,-3
        match = re.match(ROBOT_REGEX, line.strip())
        if match:
            col, row, vc, vr = map(int, match.groups())
            robots.append({"initial_position": (row, col), "velocity": (vr, vc)})
        else:
            raise ValueError(f"Invalid robot line: {line}")

    return robots


type Quadrant = list[tuple[int, int]]


def get_quadrants(
    rows: int, cols: int
) -> tuple[Quadrant, Quadrant, Quadrant, Quadrant]:
    """
    Return the four quadrants of the given dimensions. The exact middle tiles of
    the grid are not considered part of any quadrant.
    """
    top_left = [(row, col) for row in range(rows // 2) for col in range(cols // 2)]
    top_right = [
        (row, col) for row in range(rows // 2) for col in range(cols // 2 + 1, cols)
    ]
    bottom_left = [
        (row, col) for row in range(rows // 2 + 1, rows) for col in range(cols // 2)
    ]
    bottom_right = [
        (row, col)
        for row in range(rows // 2 + 1, rows)
        for col in range(cols // 2 + 1, cols)
    ]

    return top_left, top_right, bottom_left, bottom_right


def simulate_patrols(
    dimensions: tuple[int, int], robots: list[Robot], seconds: int
) -> list[list[int]]:
    """
    Determine the number of robots in each tile after the given number of
    seconds has elapsed. Since robots wrap around the grid when they reach the
    edges, we can calculate the final position of each robot by applying the
    velocity vector to the initial position and taking the modulo of the
    new position with the dimensions of the grid.
    """
    rows, cols = dimensions
    tiles = [[0 for _ in range(cols)] for _ in range(rows)]
    for robot in robots:
        row, col = robot["initial_position"]
        vr, vc = robot["velocity"]
        new_row = (row + vr * seconds) % rows
        new_col = (col + vc * seconds) % cols
        tiles[new_row][new_col] += 1

    return tiles


def calculate_safety_factor(tiles: list[list[int]]) -> int:
    """
    Calculate the safety factor of the given tile configuration, based on the
    number of robots in each quadrant.
    """
    rows = len(tiles)
    cols = len(tiles[0])
    tl, tr, bl, br = [
        sum(tiles[row][col] for row, col in quad) for quad in get_quadrants(rows, cols)
    ]
    return tl * tr * bl * br


def find_easter_egg_time(tiles: list[list[int]]) -> int:
    """
    Find the time at which the robots form a Christmas tree pattern. I
    originally expected this pattern to appear dead center and looked for
    symmetry, but that didn't yield any results, and indeed, it turns out that
    the pattern can appear anywhere in the grid. Instead, we look for a line of
    15 or more tiles with robots in a row, which is a good indicator that the
    robots are forming a tree.
    """
    rows = len(tiles)
    cols = len(tiles[0])
    for seconds in range(rows * cols):
        tiles = simulate_patrols((rows, cols), robots, seconds)
        stringified = stringify_tiles(tiles, numbered=False)
        # Check for a line with 15 or more tiles in a row with robots in them.
        if stringified.count("#" * 15) > 0:
            print(stringified)
            return seconds

    raise ValueError("No Easter egg found")


def stringify_tiles(tiles: list[list[int]], numbered=True) -> str:
    """
    Helper function that converts the tiles into a string representation.
    """
    return "\n".join(
        "".join(map(lambda x: "." if x == 0 else "#" if not numbered else str(x), row))
        for row in tiles
    )


TEST_TILES = (
    "......2..1.\n"
    "...........\n"
    "1..........\n"
    ".11........\n"
    ".....1.....\n"
    "...12......\n"
    ".1....1...."
)

with open("test.txt", "r") as file:
    robots = parse_robots(file)
    tiles = simulate_patrols((7, 11), robots, 100)
    stringified = stringify_tiles(tiles)
    assert (
        stringified == TEST_TILES
    ), f"Expected:\n{TEST_TILES}\n but got:\n{stringified}"

    quadrants = get_quadrants(7, 11)
    assert all(
        len(q) == 15 for q in quadrants
    ), "Expected all quadrants to have 15 tiles"

    safety_factor = calculate_safety_factor(tiles)
    assert safety_factor == 12, f"Expected 12, but got {safety_factor}"


print("All tests passed.")

with open("input.txt", "r") as file:
    robots = parse_robots(file)
    tiles = simulate_patrols((103, 101), robots, 100)
    safety_factor = calculate_safety_factor(tiles)
    print("Part 1:", safety_factor)

    # Part 2
    easter_egg_time = find_easter_egg_time(tiles)
    print("Part 2:", easter_egg_time)
