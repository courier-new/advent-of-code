from typing import TextIO
from collections import defaultdict


def parse_course(file: TextIO) -> list[list[str]]:
    return [list(line.strip()) for line in file]


def find_start_and_end(
    course: list[list[str]],
) -> tuple[tuple[int, int], tuple[int, int]]:
    """
    Identifies the start and end positions in the course, and returns their
    positions as a tuple of (row, column) coordinates. Raises a ValueError if
    either the start or end positions are not found.
    """
    start: tuple[int, int] | None = None
    end: tuple[int, int] | None = None

    for row_index, row in enumerate(course):
        for col_index, cell in enumerate(row):
            if cell == "S":
                start = (row_index, col_index)
            elif cell == "E":
                end = (row_index, col_index)

    if start is None or end is None:
        raise ValueError("Course must contain a start and end point")

    return start, end


def find_path(course: list[list[str]]) -> list[tuple[int, int]]:
    """
    Identifies the path from the start to the end in the course, and returns the
    positions visited along the path in order as a list of (row, column)
    coordinates. Raises a ValueError if no path is found.
    """

    def is_reachable(position: tuple[int, int]) -> bool:
        """
        Helper function to check if a position is within bounds and not a wall.
        """
        return (
            0 <= position[0] < len(course)
            and 0 <= position[1] < len(course[0])
            and course[position[0]][position[1]] != "#"
        )

    # Find the start and end positions in the course.
    start, end = find_start_and_end(course)

    path = []
    current_pos = start

    # Continue until we reach the end position.
    while True:
        # If we've visited this position before, we've gone in a circle; that's
        # no good! Raise an error.
        if current_pos in path:
            raise ValueError("No path found")

        path.append(current_pos)

        # If we've reached the end, return the path.
        if current_pos == end:
            return path

        # Check the four cardinal directions from the current position.
        neighbors = [
            (current_pos[0] + 1, current_pos[1]),
            (current_pos[0] - 1, current_pos[1]),
            (current_pos[0], current_pos[1] + 1),
            (current_pos[0], current_pos[1] - 1),
        ]

        next_pos: tuple[int, int] | None = None
        for neighbor in neighbors:
            # If the neighbor is within bounds and not a wall, and it's not
            # already in our path, it's the path we want to take.
            if is_reachable(neighbor) and neighbor not in path:
                # Since there's only one viable path, once we find a reachable
                # neighbor, we can break out of the loop.
                next_pos = neighbor
                break

        if next_pos is None:
            raise ValueError("No path found")

        # Update the current position and continue.
        current_pos = next_pos


def count_cheats(
    path: list[tuple[int, int]], min_threshold: int, cheat_size: int = 2
) -> tuple[dict[int, int], int]:
    """
    Counts the number of cheats found in the path that save at least
    min_threshold steps. A cheat is defined as a sequence of up to cheat_size
    cells that, when skipped, save steps. Returns a dictionary mapping the
    number of steps saved by each cheat to the number of times a cheat was found
    that saved that many steps, as well as the total number of cheats found.
    """

    # Dictionary from the number of steps saved by the cheat to the number of
    # times a distinct cheat was found that saved that many steps.
    cheats_dict: dict[int, int] = defaultdict(int)
    cheats_found = 0

    # Check every position in the path for potential cheats.
    for position_index, position in enumerate(path):
        # Check every following position at least min_threshold steps ahead,
        # plus one more to account for the current position.
        for next_position_index, next_position in enumerate(
            path[position_index + min_threshold + 1 :]
        ):
            # If the two positions are within cheat_size cells of each other in
            # terms of Manhattan distance, we have a potential cheat.
            cheat_distance = abs(position[0] - next_position[0]) + abs(
                position[1] - next_position[1]
            )
            if cheat_distance <= cheat_size:
                # Adding back the number of steps it takes to complete the cheat
                # will give us our actual number of steps saved.
                steps_saved = next_position_index + min_threshold - (cheat_distance - 1)
                # If the number of steps saved is at least min_threshold, this
                # is a valid cheat.
                if steps_saved >= min_threshold:
                    cheats_dict[steps_saved] += 1
                    cheats_found += 1

    return cheats_dict, cheats_found


with open("test.txt", "r") as file:
    course = parse_course(file)
    path = find_path(course)
    # The time taken to complete the course is the number of steps, i.e. the
    # length of the path minus 1.
    assert (
        len(path) - 1 == 84
    ), f"Expected initial path length of 84, but got {len(path) - 1}"

    cheats_dict, cheats_count = count_cheats(path, 2)
    assert cheats_count == 44, f"Expected 44 total cheats, but got {cheats_count}"
    assert cheats_dict == {
        2: 14,
        4: 14,
        6: 2,
        8: 4,
        10: 2,
        12: 3,
        20: 1,
        36: 1,
        38: 1,
        40: 1,
        64: 1,
    }, f"Expected cheats_dict to be {cheats_dict}, but got {cheats_dict}"

    # Part 2
    cheats_dict, cheats_count = count_cheats(path, 50, 20)
    assert cheats_count == 285, f"Expected 285 total cheats, but got {cheats_count}"
    assert cheats_dict == {
        50: 32,
        52: 31,
        54: 29,
        56: 39,
        58: 25,
        60: 23,
        62: 20,
        64: 19,
        66: 12,
        68: 14,
        70: 12,
        72: 22,
        74: 4,
        76: 3,
    }, f"Expected cheats_dict to be {cheats_dict}, but got {cheats_dict}"

print("All tests passed.")

with open("input.txt", "r") as file:
    course = parse_course(file)
    path = find_path(course)
    _, cheats_count = count_cheats(path, 100)
    print("Part 1:", cheats_count)

    # Part 2
    _, cheats_count = count_cheats(path, 100, 20)
    print("Part 2:", cheats_count)
