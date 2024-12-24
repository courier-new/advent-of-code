from typing import TextIO, Literal, cast
import copy
from collections import deque

type Direction = Literal["<", "^", ">", "v"]

DIRECTIONAL_DELTAS: dict[Direction, tuple[int, int]] = {
    "<": (0, -1),
    "v": (1, 0),
    "^": (-1, 0),
    ">": (0, 1),
}


def parse_warehouse(
    file: TextIO,
) -> tuple[list[list[str]], tuple[int, int], list[Direction]]:
    # The first block of lines contains the initial warehouse layout. Continue
    # building the warehouse grid until our first blank line.
    warehouse: list[list[str]] = []
    robot_position = (-1, -1)
    line = file.readline().strip()
    while line:
        warehouse.append(list(line))
        # If the line contains the robot's starting position, save it.
        if "@" in line:
            robot_position = (len(warehouse) - 1, line.index("@"))
        line = file.readline().strip()

    if robot_position == (-1, -1):
        raise ValueError("Robot not found in initial warehouse layout")

    # The second block of lines contains the robot's movement instructions.
    instructions: list[Direction] = []
    line = file.readline().strip()
    while line:
        # Ensure every character in the line is a valid direction.
        if not all(char in "<>^v" for char in line):
            raise ValueError("Invalid direction in movement instructions")
        instructions.extend(cast(list[Direction], list(line)))
        line = file.readline().strip()

    return (warehouse, robot_position, instructions)


# For Part 2
def widen_layout(layout: list[list[str]]) -> tuple[list[list[str]], tuple[int, int]]:
    """
    Given a warehouse layout, this function will double the size of the layout
    according to the following rules:
    - If the tile is `#`, the new map contains `##` instead.
    - If the tile is `O`, the new map contains `[]` instead.
    - If the tile is `.`, the new map contains `..` instead.
    - If the tile is `@`, the new map contains `@.` instead
    """
    new_layout = []
    robot_position = (-1, -1)
    for row in layout:
        new_row = []
        for tile in row:
            if tile == "#":
                new_row.extend("##")
            elif tile == "O":
                new_row.extend("[]")
            elif tile == ".":
                new_row.extend("..")
            elif tile == "@":
                new_row.extend("@.")
                robot_position = (len(new_layout), len(new_row) - 2)
        new_layout.append(new_row)

    return new_layout, robot_position


def simulate(
    layout: list[list[str]],
    initial_position: tuple[int, int],
    instructions: list[Direction],
    box_size: Literal[1, 2] = 1,
) -> list[list[str]]:
    def find_closest_wall_or_empty(
        position: tuple[int, int], direction: Direction
    ) -> tuple[tuple[int, int], Literal["#", "."]]:
        """
        Small helper function which looks for the closest wall or empty space
        directly ahead of the robot in the given direction, starting from the
        robot's current position. Since the warehouse is an enclosed space,
        there will always be a wall in front of the robot, up to the very edge
        of the map. Returns the location of the wall or empty space, and the
        type of object found there.
        """
        row, column = position
        dr, dc = DIRECTIONAL_DELTAS[direction]

        row += dr
        column += dc
        next_tile = layout[row][column]
        while next_tile != "#" and next_tile != ".":
            row += dr
            column += dc
            next_tile = layout[row][column]

        return ((row, column), next_tile)

    def try_push_single(
        position: tuple[int, int], direction: Direction
    ) -> tuple[int, int]:
        dr, dc = DIRECTIONAL_DELTAS[direction]
        row, column = position
        # If the robot tries to move into a box, it, and any boxes directly in
        # front of the first box, will move as a group, if possible. First,
        # we'll check if there is any space to move into in the direction the
        # robot is moving by looking for the closest non-box object in that
        # direction.
        (closest_position, closest_object) = find_closest_wall_or_empty(
            position, direction
        )
        # If the closest object is a wall, the robot can't move any boxes.
        if closest_object == "#":
            return position

        # If the closest object is an empty space, we can move the robot and
        # any boxes in front of it.
        last_row, last_column = closest_position[0], closest_position[1]
        while (last_row, last_column) != position:
            overwrite_row, overwrite_column = last_row - dr, last_column - dc
            layout[last_row][last_column] = layout[overwrite_row][overwrite_column]
            last_row, last_column = overwrite_row, overwrite_column
        # Finally, replace where the robot began with an empty space.
        layout[row][column] = "."

        return (row + dr, column + dc)

    def try_push(
        position: tuple[int, int], direction: Direction, box_size: Literal[1, 2]
    ) -> tuple[int, int]:
        """
        Given the position and the direction that the robot is moving in, this
        function attempts to push the box directly in front of the robot by
        looking at what is in turn in front of it. If that is more boxes, and
        they can also be pushed, the function will update the layout to move all
        of the boxes and return the new robot's position. If the box cannot be
        pushed, the function returns the robot's current position.
        """
        # (Part 1)
        if box_size == 1:
            return try_push_single(position, direction)

        # If we're pushing to the left or to the right, it's the same as pushing
        # a single-sized box.
        if direction in ["<", ">"]:
            return try_push_single(position, direction)

        robot_row, robot_column = position

        # The first box is the one directly in front of the robot.
        dr, dc = DIRECTIONAL_DELTAS[direction]
        box_row, box_column = robot_row + dr, robot_column + dc

        # Initialize the list of tiles to check and tiles we've determined form
        # a cluster of boxes and should be moved together. We'll keep checking
        # in the direction the robot is moving until we've found all boxes that
        # belong to the cluster and have determined that there is empty space in
        # front of all of them. We use a queue and BFS to do this to ensure we
        # identify boxes in the cluster in an order that we can easily reverse
        # and use to update the layout without overwriting a tile before we've
        # moved what was there.
        tiles_to_check = deque([(box_row, box_column)])
        # We use a dictionary to keep track of which tiles are part of the
        # cluster, so that we can treat it like a set but maintain the order in
        # which we added tiles.
        cluster_to_push: dict[tuple[int, int], bool] = {}

        while len(tiles_to_check) > 0:
            curr_row, curr_col = tiles_to_check.popleft()
            curr_tile = layout[curr_row][curr_col]

            # If we're looking at a box, it's going to be moved with the whole
            # cluster. Add it to the list of tiles to be pushed.
            if curr_tile == "[" or curr_tile == "]":
                # Ensure we only check each side of a box once.
                if (curr_row, curr_col) in cluster_to_push:
                    continue

                cluster_to_push[(curr_row, curr_col)] = True

                # Ensure we check the other side of the box.
                if curr_tile == "[":
                    tiles_to_check.append((curr_row, curr_col + 1))
                elif curr_tile == "]":
                    tiles_to_check.append((curr_row, curr_col - 1))

                # Also check the tile directly in front of this side of the box,
                # to determine if it's clear, or part of the cluster.
                tiles_to_check.append((curr_row + dr, curr_col + dc))

            # If we're looking at a wall, we can't move *any* of the cluster. We
            # can return early, as we're done.
            elif curr_tile == "#":
                return position

            # If we're looking at an empty space, the cluster can still be
            # moved, and we don't need to check any other tiles beyond that one.
            elif curr_tile == ".":
                continue

        # If we've reached this point, we know that the cluster of boxes can be
        # moved. We'll update the layout to reflect this. For every tile that
        # could be moved, we'll shift it in the direction the robot is moving.
        for row, column in reversed(cluster_to_push.keys()):
            layout[row + dr][column + dc] = layout[row][column]
            layout[row][column] = "."

        # Finally, move the robot.
        layout[robot_row][robot_column] = "."
        robot_row += dr
        robot_column += dc
        layout[robot_row][robot_column] = "@"
        # Return the new position of the robot.
        return (robot_row, robot_column)

    def move(
        position: tuple[int, int], direction: Direction, box_size: Literal[1, 2] = 1
    ) -> tuple[int, int]:
        """
        Simulates the robot moving one step in its instructional sequence with
        the given state of the warehouse layout, its current position, and the
        direction it should move in. Returns the new position of the robot.
        """
        row, column = position
        dr, dc = DIRECTIONAL_DELTAS[direction]

        # If the robot tries to move into a wall, it stays in place.
        if layout[row + dr][column + dc] == "#":
            return position

        # If the robot would move into an empty space, it moves there.
        if layout[row + dr][column + dc] == ".":
            layout[row][column] = "."
            layout[row + dr][column + dc] = "@"
            return (row + dr, column + dc)

        # If the robot tries to move into a box, we need to determine if this
        # box can be pushed and, if so, if any other boxes will also be moved.
        return try_push(position, direction, box_size)

    # Initialize the warehouse layout and robot position.
    current_position = initial_position
    for instruction in instructions:
        current_position = move(current_position, instruction, box_size)

    return layout


def stringify(layout: list[list[str]]) -> str:
    return "\n".join("".join(row) for row in layout)


def sum_coordinates(layout: list[list[str]]) -> int:
    sum = 0
    for row_index, row in enumerate(layout):
        for column_index, tile in enumerate(row):
            if tile == "O" or tile == "[":
                sum += 100 * row_index + column_index

    return sum


with open("test.txt", "r") as file:
    layout, initial_position, instructions = parse_warehouse(file)
    layout = simulate(layout, initial_position, instructions)
    assert (
        sum_coordinates(layout) == 2028
    ), f"Expected 2028, but got {sum_coordinates(layout)}"

with open("test2.txt", "r") as file:
    initial_layout, initial_position, instructions = parse_warehouse(file)
    layout_1 = copy.deepcopy(initial_layout)
    layout_1 = simulate(layout_1, initial_position, instructions)
    assert (
        sum_coordinates(layout_1) == 10092
    ), f"Expected 10092, but got {sum_coordinates(layout_1)}"

    # Part 2
    widened_layout, initial_position = widen_layout(initial_layout)
    layout_2 = simulate(widened_layout, initial_position, instructions, box_size=2)
    assert (
        sum_coordinates(layout_2) == 9021
    ), f"Expected 9021, but got {sum_coordinates(layout_2)}"

print("All tests passed!")

with open("input.txt", "r") as file:
    initial_layout, initial_position, instructions = parse_warehouse(file)
    layout = copy.deepcopy(initial_layout)
    layout = simulate(layout, initial_position, instructions)
    print("Part 1:", sum_coordinates(layout))

    # Part 2
    widened_layout, initial_position = widen_layout(initial_layout)
    layout = simulate(widened_layout, initial_position, instructions, box_size=2)
    print("Part 2:", sum_coordinates(layout))
