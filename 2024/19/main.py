from typing import TextIO, TypedDict
from functools import cache


class TowelConfig(TypedDict):
    patterns: frozenset[str]
    design_requests: list[str]


def parse_towel_config(file: TextIO) -> TowelConfig:
    # The first line holds the patterns available for the towel.
    patterns = frozenset(pattern.strip() for pattern in file.readline().split(","))
    # Skip one blank line.
    file.readline()
    # The rest of the lines hold the design requests.
    design_requests = [request.strip() for request in file]

    return {"patterns": patterns, "design_requests": design_requests}


@cache
def can_form_pattern_from_towels(patterns: frozenset[str], design: str) -> bool:
    """
    Check if the given design can be formed by arranging towels of different
    patterns next to each other. The function recursively checks if the design
    starts with any of the patterns and if the remaining part of the design can
    also be formed by arranging towels.
    """
    if design == "" or design in config["patterns"]:
        return True

    return any(
        design.startswith(pattern)
        and can_form_pattern_from_towels(patterns, design[len(pattern) :])
        for pattern in config["patterns"]
    )


# Part 2
@cache
def count_possible_designs(patterns: frozenset[str], design: str) -> int:
    """
    Check how many different arrangements of towels can form the given design.
    The function recursively counts the number of possible designs by checking
    for each pattern that can start the design, how many possible arrangements
    can form the remaining design.
    """
    if design == "":
        return 1

    return sum(
        count_possible_designs(patterns, design[len(pattern) :])
        for pattern in config["patterns"]
        if design.startswith(pattern)
    )


class TestCase(TypedDict):
    design: str
    expected_possible: bool
    expected_count: int


TEST_CASES: list[TestCase] = [
    {
        "design": "brwrr",
        "expected_possible": True,
        "expected_count": 2,
    },
    {
        "design": "bggr",
        "expected_possible": True,
        "expected_count": 1,
    },
    {
        "design": "gbbr",
        "expected_possible": True,
        "expected_count": 4,
    },
    {
        "design": "rrbgbr",
        "expected_possible": True,
        "expected_count": 6,
    },
    {
        "design": "ubwu",
        "expected_possible": False,
        "expected_count": 0,
    },
    {
        "design": "bwurrg",
        "expected_possible": True,
        "expected_count": 1,
    },
    {
        "design": "brgr",
        "expected_possible": True,
        "expected_count": 2,
    },
    {
        "design": "bbrgwb",
        "expected_possible": False,
        "expected_count": 0,
    },
]

with open("test.txt", "r") as file:
    config = parse_towel_config(file)
    assert (
        len(config["patterns"]) == 8
    ), f"Expected 8 patterns, but got {len(config['patterns'])}"
    assert (
        len(config["design_requests"]) == 8
    ), f"Expected 8 design requests, but got {len(config['design_requests'])}"

    for case in TEST_CASES:
        possible = can_form_pattern_from_towels(config["patterns"], case["design"])
        assert (
            possible == case["expected_possible"]
        ), f"Expected {case['expected_possible']} for {case['design']}, but got {possible}"

        # Part 2
        count = count_possible_designs(config["patterns"], case["design"])
        assert (
            count == case["expected_count"]
        ), f"Expected {case['expected_count']} possible designs for {case['design']}, but got {count}"

print("All tests passed.")

with open("input.txt", "r") as file:
    config = parse_towel_config(file)
    possible_designs = sum(
        can_form_pattern_from_towels(config["patterns"], design)
        for design in config["design_requests"]
    )
    print("Part 1:", possible_designs)

    # Part 2
    total_designs = sum(
        count_possible_designs(config["patterns"], design)
        for design in config["design_requests"]
    )
    print("Part 2:", total_designs)
