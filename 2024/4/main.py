from typing import TextIO


# Create a 2D grid of all the characters that appear in the word search.
def parse_file(file: TextIO) -> list[list[str]]:
    return [list(line.strip()) for line in file]


def spells_sam(cells: list[tuple[int, int]]) -> bool:
    return "".join(grid[row][col] for row, col in cells) == "SAM"


def spells_mas(cells: list[tuple[int, int]]) -> bool:
    return "".join(grid[row][col] for row, col in cells) == "MAS"


def is_out_of_bounds(grid: list[list[str]], row: int, col: int) -> bool:
    return row < 0 or row >= len(grid) or col < 0 or col >= len(grid[0])


def find_appearances_for_cell(grid: list[list[str]], row: int, col: int) -> int:
    # If the cell is not an "X", it can't be the start of an "XMAS" match.
    if grid[row][col] != "X":
        return 0

    to_check: list[list[tuple[int, int]]] = [
        # Check to the left
        [(row, col - i) for i in range(1, 4)],
        # Check to the right
        [(row, col + i) for i in range(1, 4)],
        # Check up
        [(row - i, col) for i in range(1, 4)],
        # Check down
        [(row + i, col) for i in range(1, 4)],
        # Check diagonal up-left
        [(row - i, col - i) for i in range(1, 4)],
        # Check diagonal up-right
        [(row - i, col + i) for i in range(1, 4)],
        # Check diagonal down-left
        [(row + i, col - i) for i in range(1, 4)],
        # Check diagonal down-right
        [(row + i, col + i) for i in range(1, 4)],
    ]

    appearances = 0
    for cells in to_check:
        # If any of the cells are out of bounds, skip this direction.
        if any(is_out_of_bounds(grid, row, col) for row, col in cells):
            continue

        # If the cells spell out "M", "A", S", we have a match.
        if spells_mas(cells):
            appearances += 1

    return appearances


def is_center_of_x_mas(grid: list[list[str]], row: int, col: int) -> bool:
    # If the cell is not an "A", it can't be the center of an x-mas.
    if grid[row][col] != "A":
        return False

    to_check: list[list[tuple[int, int]]] = [
        # Check left diagonal of the x
        [(row - 1, col - 1), (row, col), (row + 1, col + 1)],
        # Check right diagonal of the x
        [(row - 1, col + 1), (row, col), (row + 1, col - 1)],
    ]

    # If either of the diagonals would go out of bounds, this cell can't be the
    # center of an x-mas.
    if any(
        any(is_out_of_bounds(grid, row, col) for row, col in diagonal)
        for diagonal in to_check
    ):
        return False

    # Check that both diagonals spell out "M", "A", "S" or "S", "A", "M".
    return all(spells_sam(cells) or spells_mas(cells) for cells in to_check)


with open("test.txt", "r") as file:
    grid = parse_file(file)
    appearances = sum(
        find_appearances_for_cell(grid, row, col)
        for row in range(len(grid))
        for col in range(len(grid[0]))
    )
    assert appearances == 18, f"Expected 18, but got {appearances}"

    # Part 2
    x_mases = sum(
        is_center_of_x_mas(grid, row, col)
        for row in range(len(grid))
        for col in range(len(grid[0]))
    )
    assert x_mases == 9, f"Expected 9, but got {x_mases}"

print("All tests passed!")

with open("input.txt", "r") as file:
    grid = parse_file(file)
    appearances = sum(
        find_appearances_for_cell(grid, row, col)
        for row in range(len(grid))
        for col in range(len(grid[0]))
    )
    print("Part 1:", appearances)

    # Part 2
    x_mases = sum(
        is_center_of_x_mas(grid, row, col)
        for row in range(len(grid))
        for col in range(len(grid[0]))
    )
    print("Part 2:", x_mases)
