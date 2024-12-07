from typing import TextIO
from concurrent.futures import ProcessPoolExecutor, as_completed, Future
import copy

type Map = list[list[str]]


def parse_map(file: TextIO) -> Map:
    return [list(line.strip()) for line in file]


def find_guard(map: Map) -> tuple[int, int]:
    return next((row, line.index("^")) for row, line in enumerate(map) if "^" in line)


def is_in_bounds(map: Map, row: int, col: int) -> bool:
    return 0 <= row < len(map) and 0 <= col < len(map[0])


class Direction:
    # For debug printing
    display: str
    forward: tuple[int, int]
    _right: "Direction | None"

    def __init__(self, display: str, Forward: tuple[int, int]) -> None:
        self.display = display
        self.forward = Forward
        self._right = None

    def __str__(self) -> str:
        return self.display

    def set_right(self, right: "Direction") -> None:
        self._right = right

    @property
    def right(self) -> "Direction":
        if self._right is None:
            raise ValueError("Right direction not set!")
        return self._right


Up = Direction("ʌ", (-1, 0))
Right = Direction(">", (0, 1))
Down = Direction("v", (1, 0))
Left = Direction("<", (0, -1))

Up.set_right(Right)
Right.set_right(Down)
Down.set_right(Left)
Left.set_right(Up)


# NOTE: For debugging purposes
# type DirectionMap = list[list[set[Direction]]]
# def stringify_map(map: Map, directions_map: DirectionMap) -> str:
#     """
#     Utility which converts the map and directions_map into a string for
#     printing purposes.
#     """
#     to_print = ""
#     for row_index, row in enumerate(map):
#         line = ""
#         for cell, directions in zip(row, directions_map[row_index]):
#             if cell == "#":
#                 line += cell
#             elif len(directions) == 0:
#                 line += "."
#             elif len(directions) == 1:
#                 # Get the first element of the set, without removing it.
#                 line += next(iter(directions)).display
#             else:
#                 line += "+"
#         to_print += line + "\n"
#     return to_print


type PathWithDirection = set[tuple[tuple[int, int], Direction]]


def count_unique(path: PathWithDirection) -> int:
    return len(set(pos for pos, _ in path))


def walk_path(
    map: Map,
    initial_position: tuple[int, int],
    # Part 2: If provided, will artificially introduce an obstacle at the given
    # row and column.
    obstacle_position: tuple[int, int] | None = None,
) -> PathWithDirection | None:
    """
    Walk the full path of the guard, starting at the given row and column.
    Returns a set representation of every square visited by the guard, or None
    if the guard would end up in a cycle (Part 2).
    """
    # Track the squares visited by the guard, along with the direction the guard
    # was walking in when she visited that square (Part 2).
    visited_with_direction: set[tuple[tuple[int, int], Direction]] = set()

    curr_position = initial_position
    direction: Direction = Up
    while True:
        # Part 2: If we have already walked this same path, we have encountered
        # a cycle.
        if (curr_position, direction) in visited_with_direction:
            return None

        # Record the current position and direction the guard is walking in.
        visited_with_direction.add((curr_position, direction))

        curr_row, curr_col = curr_position
        dr, dc = direction.forward
        new_row, new_col = curr_row + dr, curr_col + dc
        # If the guard would walk off the map, we're done.
        if not is_in_bounds(map, new_row, new_col):
            return visited_with_direction

        # If the guard would hit an obstacle, real or simulated (for Part 2),
        # turn right 90 degrees.
        if map[new_row][new_col] == "#" or (new_row, new_col) == obstacle_position:
            direction = direction.right
            continue

        # Otherwise, walk forward and update the current position and direction.
        curr_position = (new_row, new_col)


def walk_path_and_return_obstacle(
    map: Map,
    initial_position: tuple[int, int],
    obstacle_position: tuple[int, int],
):
    """
    Small wrapper around walk_path which returns the obstacle position if the
    guard would get stuck in a cycle due to it.
    """
    path = walk_path(map, initial_position, obstacle_position)
    return obstacle_position if path is None else None


def find_obstacle_points(
    map: Map, initial_position: tuple[int, int], path: PathWithDirection
) -> set[tuple[int, int]]:
    """
    Find the number of points where the guard would hit an obstacle if she
    continued walking in the same direction.
    """
    # Use a ProcessPoolExecutor to parallelize the computation, since each check
    # is independent of the others.
    with ProcessPoolExecutor() as executor:
        futures: list[Future] = []
        for (row, col), direction in path:
            dr, dc = direction.forward
            obstacle_row, obstacle_col = row + dr, col + dc
            if not is_in_bounds(map, obstacle_row, obstacle_col):
                continue
            futures.append(
                executor.submit(
                    walk_path_and_return_obstacle,
                    copy.deepcopy(map),
                    initial_position,
                    (obstacle_row, obstacle_col),
                )
            )

    return set([f.result() for f in as_completed(futures) if f.result() is not None])


if __name__ == "__main__":
    with open("test.txt", "r") as file:
        map = parse_map(file)

        guard_position = find_guard(map)
        assert guard_position == (
            6,
            4,
        ), f"Expected guard at (6, 4), but got {guard_position}"

        path = walk_path(map, guard_position)
        assert path is not None, "Expected a path, but got None"
        assert (
            count_unique(path) == 41
        ), f"Expected 41 squares visited, but got {count_unique(path)}"

        # Part 2:
        obstacles = find_obstacle_points(map, guard_position, path)
        assert obstacles == set([(6, 3), (7, 6), (7, 7), (8, 1), (8, 3), (9, 7)])

    print("All tests passed!")

    with open("input.txt", "r") as file:
        map = parse_map(file)
        guard_position = find_guard(map)
        path = walk_path(map, guard_position)
        assert path is not None, "Expected a path, but got None"
        print("Part 1:", count_unique(path))

        # Part 2:
        obstacles = find_obstacle_points(map, guard_position, path)
        print("Part 2:", len(obstacles))
