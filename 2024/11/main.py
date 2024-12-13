from typing import TypedDict, TextIO
from functools import cache


def parse_file(file: TextIO) -> list[int]:
    return [int(value) for value in file.readline().strip().split()]


@cache
def apply_rules(stone: int) -> list[int]:
    # If the stone is engraved with the number `0`, it is replaced by a
    # stone engraved with the number `1`.
    if stone == 0:
        return [1]
    # If the stone is engraved with a number that has an *even* number of
    # digits, it is replaced by *two stones*. The left half of the digits
    # are engraved on the new left stone, and the right half of the digits
    # are engraved on the new right stone.
    elif len(str(stone)) % 2 == 0:
        stone_str = str(stone)
        half = len(stone_str) // 2
        return [int(stone_str[:half]), int(stone_str[half:])]
    # If none of the other rules apply, the stone is replaced by a new
    # stone; the old stone's number *multiplied by 2024* is engraved on the
    # new stone.
    else:
        return [stone * 2024]


@cache
def blink_and_count(stone: int, blinks: int) -> int:
    """
    Recursively apply the rules to the stone and count the number of total
    stones in the line after the given number of blinks. Since each stone is
    affected by rules independently of the others, we can compute the result of
    the blinks for each stone separately and then sum them up in the end.
    """
    if blinks == 0:
        return 1

    new_stones = apply_rules(stone)
    return sum(blink_and_count(stone, blinks - 1) for stone in new_stones)


def blink(stones: list[int], blinks: int) -> int:
    """
    Sums the number of stones in the line after each stone undergoes the given
    number of blinks.
    """
    return sum(blink_and_count(stone, blinks) for stone in stones)


class TestCase(TypedDict):
    input: list[int]
    stones_after_blinks: dict[int, int]


test_cases: list[TestCase] = [
    {"input": [0, 1, 10, 99, 999], "stones_after_blinks": {1: 7}},
    {
        "input": [125, 17],
        "stones_after_blinks": {1: 3, 2: 4, 3: 5, 4: 9, 5: 13, 6: 22, 25: 55312},
    },
]

for test_index, test_case in enumerate(test_cases):
    input = test_case["input"]
    stones_after_blinks = test_case["stones_after_blinks"]
    for blinks, expected_count in stones_after_blinks.items():
        result_count = blink(input, blinks)
        assert (
            result_count == expected_count
        ), f"Test case {test_index} failed for {blinks} blinks: expected {expected_count}, but got {result_count}"

print("All tests passed.")

with open("input.txt", "r") as file:
    stones = parse_file(file)
    count = blink(stones, 25)
    print("Part 1:", count)

    count = blink(stones, 75)
    print("Part 2:", count)
