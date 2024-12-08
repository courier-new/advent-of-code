from typing import TypedDict, TextIO, Callable


type Equation = tuple[int, list[int]]


def parse_input(file: TextIO) -> list[Equation]:
    equations: list[Equation] = []
    for line in file:
        test_value, rest = line.split(":")
        equation_values = list(map(int, rest.split()))
        equations.append((int(test_value), equation_values))
    return equations


OPERATIONS: dict[str, Callable] = {
    "+": lambda a, b: a + b,
    "*": lambda a, b: a * b,
    "||": lambda a, b: int(str(a) + str(b)),
}

PART_1_OPS: list[Callable] = [OPERATIONS["+"], OPERATIONS["*"]]
PART_2_OPS: list[Callable] = list(OPERATIONS.values())


def all_totals(values: list[int], ops: list[Callable]) -> list[int]:
    """
    Find all possible totals for a list of values, using the provided
    operations, returning the list of totals. This function will evaluate
    equations from left to right.
    """
    if len(values) == 1:
        return values

    # Find the totals for the first two values.
    first, second, *rest = values
    pair_totals: list[int] = [op(first, second) for op in ops]

    # Treating this result as the new first value, recursively find the totals
    # for the rest and flatten the results.
    return [
        total
        for pair_total in pair_totals
        for total in all_totals([pair_total] + rest, ops)
    ]


def is_valid(test_value: int, equation_values: list[int], ops: list[Callable]) -> bool:
    """
    Determine if the test value can be obtained from the equation values using
    the provided operations.
    """
    totals = all_totals(equation_values, ops)
    return test_value in totals


def split_is_valid(
    equations: list[Equation], ops: list[Callable]
) -> tuple[list[Equation], list[Equation]]:
    """
    Utility function to split a list of equations into two lists, one containing
    the valid equations and the other containing the invalid equations.
    """
    valid_equations = []
    invalid_equations = []
    for test_value, equation_values in equations:
        if is_valid(test_value, equation_values, ops):
            valid_equations.append((test_value, equation_values))
        else:
            invalid_equations.append((test_value, equation_values))
    return valid_equations, invalid_equations


class TestCase(TypedDict):
    test_value: int
    equation_values: list[int]
    expected: bool
    expected_part2: bool


TEST_CASES: list[TestCase] = [
    {
        "test_value": 190,
        "equation_values": [10, 19],
        "expected": True,
        "expected_part2": True,
    },
    {
        "test_value": 3267,
        "equation_values": [81, 40, 27],
        "expected": True,
        "expected_part2": True,
    },
    {
        "test_value": 83,
        "equation_values": [17, 5],
        "expected": False,
        "expected_part2": False,
    },
    {
        "test_value": 156,
        "equation_values": [15, 6],
        "expected": False,
        "expected_part2": True,
    },
    {
        "test_value": 7290,
        "equation_values": [6, 8, 6, 15],
        "expected": False,
        "expected_part2": True,
    },
    {
        "test_value": 161011,
        "equation_values": [16, 10, 13],
        "expected": False,
        "expected_part2": False,
    },
    {
        "test_value": 192,
        "equation_values": [17, 8, 14],
        "expected": False,
        "expected_part2": True,
    },
    {
        "test_value": 21037,
        "equation_values": [9, 7, 18, 13],
        "expected": False,
        "expected_part2": False,
    },
    {
        "test_value": 292,
        "equation_values": [11, 6, 16, 20],
        "expected": True,
        "expected_part2": True,
    },
]

for test_case in TEST_CASES:
    test_value, equation_values, expected, expected_part2 = (
        test_case["test_value"],
        test_case["equation_values"],
        test_case["expected"],
        test_case["expected_part2"],
    )

    result = is_valid(test_value, equation_values, PART_1_OPS)
    assert (
        result == expected
    ), f"Expected {expected} but got {result}: {test_value=}, {equation_values=}, part 1"

    result = is_valid(test_value, equation_values, PART_2_OPS)
    assert (
        result == expected_part2
    ), f"Expected {expected_part2} but got {result}: {test_value=}, {equation_values=}, part 2"

with open("test.txt", "r") as file:
    equations = parse_input(file)
    valid, invalid = split_is_valid(equations, PART_1_OPS)
    sum_valid = sum(test_value for test_value, _ in valid)
    assert sum_valid == 3749, f"Part 1: Expected 3749 but got {sum_valid}"

    # We only need to re-check those equations that were invalid in part 1.
    valid_part2, _ = split_is_valid(invalid, PART_2_OPS)
    sum_valid_part2 = sum(test_value for test_value, _ in valid_part2)
    total_sum = sum_valid + sum_valid_part2
    assert total_sum == 11387, f"Part 2: Expected 11387 but got {total_sum}"


print("All tests passed.")

with open("input.txt", "r") as file:
    equations = parse_input(file)
    valid, invalid = split_is_valid(equations, PART_1_OPS)
    sum_valid = sum(test_value for test_value, _ in valid)
    print("Part 1:", sum_valid)

    # We only need to re-check those equations that were invalid in part 1.
    valid_part2, _ = split_is_valid(invalid, PART_2_OPS)
    sum_valid_part2 = sum(test_value for test_value, _ in valid_part2)
    sum_total = sum_valid + sum_valid_part2
    print("Part 2:", sum_total)
