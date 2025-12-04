from typing import Literal, TextIO, cast

type GridItem = Literal[".", "@"]
type Grid = list[list[GridItem]]


def parse_grid(file: TextIO) -> Grid:
    return [list(cast(list[GridItem], line.strip())) for line in file]


# We want to check the eight adjacent cells to a given cell to see if there are
# paper rolls in any of them.
CELL_DELTAS: list[tuple[int, int]] = [
    (-1, -1),
    (-1, 0),
    (-1, 1),
    (0, -1),
    (0, 1),
    (1, -1),
    (1, 0),
    (1, 1),
]

MAX_NEIGHBOR_ROLLS = 4


def is_roll_accessible(grid: Grid, row: int, col: int) -> bool:
    # We count the number of paper rolls in the eight adjacent cells.
    neighor_rolls = 0
    for delta_row, delta_col in CELL_DELTAS:
        neighbor_row = row + delta_row
        neighbor_col = col + delta_col
        # If the neighbor is within bounds and is a paper roll, count it.
        if (
            0 <= neighbor_row < len(grid)
            and 0 <= neighbor_col < len(grid[0])
            and grid[neighbor_row][neighbor_col] == "@"
        ):
            neighor_rolls += 1

    return neighor_rolls < MAX_NEIGHBOR_ROLLS


def remove_accessible_rolls(grid: Grid) -> int:
    """
    Removes all accessible rolls from the grid (mutating the grid by replacing
    "@" with "."), and returns the number of rolls removed.
    """
    rolls_removed = 0
    for row in range(len(grid)):
        for col in range(len(grid[0])):
            if grid[row][col] == "@" and is_roll_accessible(grid, row, col):
                grid[row][col] = "."
                rolls_removed += 1
    return rolls_removed


if __name__ == "__main__":
    with open("input.txt", "r") as f:
        grid = parse_grid(f)
        accessible_rolls = 0
        for row in range(len(grid)):
            for col in range(len(grid[0])):
                if grid[row][col] == "@" and is_roll_accessible(grid, row, col):
                    accessible_rolls += 1
        print("Part 1:", accessible_rolls)

        total_rolls_removed = 0
        while True:
            rolls_removed = remove_accessible_rolls(grid)
            total_rolls_removed += rolls_removed
            # Stop once there are no more accessible rolls to remove.
            if rolls_removed == 0:
                break
        print("Part 2:", total_rolls_removed)
