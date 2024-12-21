from typing import TypedDict, TextIO, Literal, TypeVar, cast
from functools import cache


def parse_door_codes(file: TextIO) -> list[str]:
    return [line.strip() for line in file]


type Activate = Literal["A"]
type Up = Literal["^"]
UP: Up = "^"
type Down = Literal["v"]
DOWN: Down = "v"
type Left = Literal["<"]
LEFT: Left = "<"
type Right = Literal[">"]
RIGHT: Right = ">"

type NumpadButton = Literal[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, Activate]
type DirectpadButton = Literal[Up, Down, Left, Right, Activate]
B = TypeVar("B", NumpadButton, DirectpadButton)

# Define the numpad layout as a 2D grid with each button's coordinates, plus the
# gap:
# +---+---+---+
# | 7 | 8 | 9 |
# +---+---+---+
# | 4 | 5 | 6 |
# +---+---+---+
# | 1 | 2 | 3 |
# +---+---+---+
#     | 0 | A |
#     +---+---+
NUMPAD_LAYOUT: dict[NumpadButton | Literal["GAP"], tuple[int, int]] = {
    7: (0, 0),
    8: (0, 1),
    9: (0, 2),
    4: (1, 0),
    5: (1, 1),
    6: (1, 2),
    1: (2, 0),
    2: (2, 1),
    3: (2, 2),
    "GAP": (3, 0),
    0: (3, 1),
    "A": (3, 2),
}

# Define the directional keypad layout as a 2D grid with each button's
# coordinates, plus the gap:
#     +---+---+
#     | ^ | A |
# +---+---+---+
# | < | v | > |
# +---+---+---+
DIRECTPAD_LAYOUT: dict[DirectpadButton | Literal["GAP"], tuple[int, int]] = {
    "GAP": (0, 0),
    UP: (0, 1),
    "A": (0, 2),
    LEFT: (1, 0),
    DOWN: (1, 1),
    RIGHT: (1, 2),
}

DIRECTIONAL_DELTAS: dict[str, tuple[int, int]] = {
    LEFT: (0, -1),
    DOWN: (1, 0),
    UP: (-1, 0),
    RIGHT: (0, 1),
}


def shortest_sequences_between_buttons(
    button1: B, button2: B, layout: dict[B | Literal["GAP"], tuple[int, int]]
) -> list[str]:
    """
    Given two buttons and a specific keypad layout, return all of the shortest
    sequences of moves required to move from button1 to button2 that minimize
    directional changes. Minimizing directional changes is important because
    for a given robot to change direction, the robot controlling it must first
    move to the button for that new direction, which means increasing the total
    length of the final human controller's sequence.
    """
    r1, c1 = layout[button1]
    r2, c2 = layout[button2]
    dr, dc = r2 - r1, c2 - c1

    # If the buttons are the same, there is no sequence to perform other than to
    # activate the button.
    if dr == dc == 0:
        return [""]

    row_moves = "v" * dr if dr >= 0 else "^" * (-dr)
    col_moves = ">" * dc if dc >= 0 else "<" * (-dc)

    # If button2 is in a straight line from button1, the shortest sequence is
    # just the straight line between them. Return that sequence.
    if dr == 0:
        return [col_moves]
    if dc == 0:
        return [row_moves]

    # For all other pairs of buttons, the shortest sequence that minimizes
    # directional changes is to do all of the vertical movement first, then all
    # of the horizontal movement, or all of the horizontal movement first, then
    # all of the vertical movement. One of these may not be viable if it goes
    # through the gap, so we'll check that first.

    # If the gap is in the same row as the first button, move vertically first.
    if layout["GAP"] == (r1, c2):
        return [row_moves + col_moves]
    # If the gap is in the same column as the first button, move horizontally
    # first.
    if layout["GAP"] == (r2, c1):
        return [col_moves + row_moves]

    # Otherwise, we'll want the robot controlling this one to orchestrate both
    # sequences and evaluate which one is shorter for it.
    return [row_moves + col_moves, col_moves + row_moves]


@cache
def find_shortest_expanded_sequence(
    input: str, num_keypads: int, use_numpad=False
) -> int:
    """
    Given an input code, the number of "levels" of robot controlling another
    robot with a keypad, and whether or not to use the numerical keypad layout,
    returns the length of the shortest "expanded" sequence of moves required for
    a human controller to orchestrate the movement of the final robot to input
    the code.

    Initially, I implemented this function to return the sequence itself, but
    for Part 2 the sequence is too long for that to really be feasible. Instead,
    it now just sums the total length.
    """
    # Recursive base case: when we've reached the final level of keypad for the
    # human controller, there's no further expanding of the sequence that needs
    # to happen. The length of the final sequence is just the length of the
    # input code.
    if num_keypads == 0:
        return len(input)

    sequence_length = 0

    # Iterate over pairs of buttons in the initial input sequence, which we can
    # find the proper expanded sequence for independently of one another. To
    # include the sequence required to move to the first button, which is
    # actually just moving from the activation button to the first button, we
    # prepend an "A" to the code for the first zipped tuple.
    for button1, button2 in zip("A" + input, input):
        # Ensure both buttons are valid keypad buttons on the layout we're
        # using for this "level" of robot controller.
        if use_numpad:
            layout = NUMPAD_LAYOUT
            button1 = int(button1) if button1.isdigit() else button1
            button2 = int(button2) if button2.isdigit() else button2
            # Ensure the buttons are valid buttons for the layout.
            if button1 not in layout or button2 not in layout:
                raise ValueError(f"Invalid button in code: {button1} or {button2}")
            button1 = cast(NumpadButton, button1)
            button2 = cast(NumpadButton, button2)

            # Find the shortest sequences of moves required to move from button1
            # to button2 on the keypad layout.
            sequences = shortest_sequences_between_buttons(
                button1,
                button2,
                layout,
            )

        else:
            layout = DIRECTPAD_LAYOUT
            # Ensure the buttons are valid buttons for the layout.
            if button1 not in layout or button2 not in layout:
                raise ValueError(f"Invalid button in code: {button1} or {button2}")
            button1 = cast(DirectpadButton, button1)
            button2 = cast(DirectpadButton, button2)

            # Find the shortest sequences of moves required to move from button1
            # to button2 on the keypad layout.
            sequences = shortest_sequences_between_buttons(
                button1,
                button2,
                layout,
            )

        # Further expand the sequence by recursively finding the shortest
        # sequence length that the previous robot will need to perform
        # orchestrate each button press in this "level" of robot's sequence. In
        # case we had multiple options at this level, we'll take the minimum of
        # all of them.
        expanded_length = min(
            find_shortest_expanded_sequence(seq + "A", num_keypads - 1)
            for seq in sequences
        )

        sequence_length += expanded_length

    return sequence_length


def calculate_complexity(input_str: str, sequence_length: int) -> int:
    return int(input_str.replace("A", "")) * sequence_length


class TestCase(TypedDict):
    input: str
    expected_sequence_length: int
    expected_complexity: int


TEST_CASES: list[TestCase] = [
    {
        "input": "029A",
        "expected_sequence_length": 68,
        "expected_complexity": 29 * 68,
    },
    {
        "input": "980A",
        "expected_sequence_length": 60,
        "expected_complexity": 980 * 60,
    },
    {
        "input": "179A",
        "expected_sequence_length": 68,
        "expected_complexity": 179 * 68,
    },
    {
        "input": "456A",
        "expected_sequence_length": 64,
        "expected_complexity": 456 * 64,
    },
    {
        "input": "379A",
        "expected_sequence_length": 64,
        "expected_complexity": 379 * 64,
    },
    {
        "input": "382A",
        "expected_sequence_length": 68,
        "expected_complexity": 25976,
    },
]

for test_case in TEST_CASES:
    input_str = test_case["input"]

    sequence_length = find_shortest_expanded_sequence(
        input_str, num_keypads=3, use_numpad=True
    )

    expected_length = test_case["expected_sequence_length"]
    assert (
        sequence_length == expected_length
    ), f"Input: {input_str}: Expected sequence length of {expected_length}, but got {sequence_length}"

    complexity = calculate_complexity(input_str, sequence_length)
    expected_complexity = test_case["expected_complexity"]
    assert (
        complexity == expected_complexity
    ), f"Input: {input_str}: Expected complexity of {expected_complexity}, but got {complexity}"

print("All tests passed.")

with open("input.txt", "r") as file:
    codes = parse_door_codes(file)
    total_complexity = sum(
        calculate_complexity(
            code, find_shortest_expanded_sequence(code, num_keypads=3, use_numpad=True)
        )
        for code in codes
    )
    print("Part 1:", total_complexity)

    # Part 2: The robots are now operating 25 directional keypads.
    total_complexity = sum(
        calculate_complexity(
            code, find_shortest_expanded_sequence(code, num_keypads=26, use_numpad=True)
        )
        for code in codes
    )
    print("Part 2:", total_complexity)
