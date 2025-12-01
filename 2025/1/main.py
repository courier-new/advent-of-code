from typing import Literal, cast


type Direction = Literal["L", "R"]
type Rotation = tuple[Direction, int]


def parse_rotation(line: str) -> Rotation:
    direction = line[0]
    if direction not in ["L", "R"]:
        raise ValueError(f"Invalid direction: {direction}")
    direction = cast(Direction, direction)
    distance = int(line[1:])
    return direction, distance


MAX_POSITION = 99


def apply_rotation(
    rotation: Rotation, current_position: int, max_position: int = MAX_POSITION
) -> tuple[int, int]:
    """
    Returns the new position and the number of times the dial points at 0 during the rotation.
    """
    direction, distance = rotation
    pass_count = 0
    modulo = max_position + 1

    if distance == 0:
        return current_position, 0

    # Part 1
    if direction == "L":
        new_position = (current_position - distance) % modulo
    else:
        new_position = (current_position + distance) % modulo

    # Part 2
    # Determine distance to the next 0
    dist_to_zero = 0
    if current_position == 0:
        # If we're at 0, we need a full rotation to get to 0 again
        dist_to_zero = modulo
    elif direction == "L":
        # If we're rotating left, we would need to rotate current_position times
        # to get back to 0
        dist_to_zero = current_position
    else:
        # If we're rotating right, the distance to 0 is however many more
        # rotations we need to rotate "forward" to get from our current position
        # back to 0
        dist_to_zero = modulo - current_position

    # If we would rotate enough times to pass 0 at least once...
    if distance >= dist_to_zero:
        # Count the first time we pass 0, and any full rotations after that
        pass_count = 1 + (distance - dist_to_zero) // modulo

    return new_position, pass_count


if __name__ == "__main__":
    with open("input.txt", "r") as f:
        rotations = [parse_rotation(line) for line in f]
        current_position = 50
        counts_at_zero = 0
        counts_passed_zero = 0
        for rotation in rotations:
            current_position, pass_count = apply_rotation(rotation, current_position)
            if current_position == 0:
                counts_at_zero += 1
            counts_passed_zero += pass_count
        print("Part 1:", counts_at_zero)
        print("Part 2:", counts_passed_zero)
