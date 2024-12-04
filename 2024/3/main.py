from typing import TextIO
import re


def read_file(file: TextIO) -> str:
    # Replace all newlines with a space.
    return file.read().strip().lower().replace("\n", " ")


def find_mul_instructions(program: str) -> list[tuple[int, int]]:
    # Regex to match "mul(#,#)" where each number is a named capture group
    mul_regex = re.compile(r"mul\((?P<first>\d+),(?P<second>\d+)\)")
    matches = mul_regex.findall(program)
    return [(int(first), int(second)) for first, second in matches]


def find_enabled_instructions(program: str) -> list[str]:
    enabled_instructions: list[str] = []
    # The beginning of the program is enabled, so we take any instructions up
    # until the first "don't()".
    enabled_instructions.append(program[: program.find("don't()")])
    rest = program[program.find("don't()") :]
    # Any other enabled instructions are those that are after a "do()" and
    # before another "don't()", or the end of the program.
    do_regex = re.compile(r"do\(\)(?P<instruction>.+?)(?:don't\(\)|$)")
    enabled_instructions.extend(do_regex.findall(rest))
    return enabled_instructions


def sum_instructions(instructions: list[tuple[int, int]]) -> int:
    return sum(first * second for first, second in instructions)


with open("test.txt", "r") as file:
    program = read_file(file)
    instructions = find_mul_instructions(program)
    print("instructions:", instructions)
    total = sum_instructions(instructions)
    assert total == 161, f"Expected 161, but got {total}"
    # Part 2
    enabled_instructions = find_enabled_instructions(program)
    total = sum_instructions(
        [
            instr
            for sublist in enabled_instructions
            for instr in find_mul_instructions(sublist)
        ]
    )
    assert total == 48, f"Expected 48, but got {total}"

print("All tests passed!")

with open("input.txt", "r") as file:
    program = read_file(file)
    instructions = find_mul_instructions(program)
    total = sum_instructions(instructions)
    print("Part 1:", total)

    # Part 2
    enabled_instructions = find_enabled_instructions(program)
    total = sum_instructions(
        [
            instr
            for sublist in enabled_instructions
            for instr in find_mul_instructions(sublist)
        ]
    )
    print("Part 2:", total)
