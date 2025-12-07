from typing import Literal, cast, Callable
import math

type Operation = Literal["+", "*"]
type Problem = tuple[Operation, list[int]]


def parse_numbers_by_row(
    rows: list[str], range_start: int, range_end: int
) -> list[int]:
    return [int(row[range_start:range_end].strip()) for row in rows]


def parse_numbers_by_column(
    rows: list[str], range_start: int, range_end: int
) -> list[int]:
    numbers: list[int] = []
    # The final columns is the blank space separating numbers for each problem,
    # so we don't need to parse a number from it.
    for col in range(range_start, range_end):
        # Collect the characters for the number in this column.
        number_list = [row[col] for row in rows]
        number_string = "".join(number_list).strip()
        if number_string:
            # Convert the characters to an integer.
            numbers.append(int(number_string))
    return numbers


def parse_problems(
    rows: list[str], parse_numbers: Callable[[list[str], int, int], list[int]]
) -> list[Problem]:
    max_row_length = max(len(row) for row in rows)
    # Add spaces to the end of each row to make sure they are all the same
    # length.
    padded_rows = [row.ljust(max_row_length) for row in rows]

    # Our operations are defined in the final row. By looking at the column
    # range between operations, we can determine the numbers involved in each
    # problem.
    number_rows, operations_row = padded_rows[:-1], padded_rows[-1]
    problems: list[Problem] = []
    range_start = 0
    # The first character in the operations row is always the initial operation.
    current_operation: Operation = cast(Operation, operations_row[0])
    for col in range(1, len(operations_row)):
        if operations_row[col] == " ":
            continue

        range_end = col
        numbers = parse_numbers(number_rows, range_start, range_end)
        problems.append((current_operation, numbers))

        current_operation = cast(Operation, operations_row[col])
        range_start = range_end

    return problems


def evaluate_problem(problem: Problem) -> int:
    operation, numbers = problem
    match operation:
        case "+":
            return sum(numbers)
        case "*":
            return math.prod(numbers)


with open("input.txt", "r") as f:
    rows = f.readlines()
    problems = parse_problems(rows, parse_numbers_by_row)
    solutions = [evaluate_problem(problem) for problem in problems]
    print("Part 1:", sum(solutions))

    problems = parse_problems(rows, parse_numbers_by_column)
    for problem in problems:
        evaluation = evaluate_problem(problem)
    solutions = [evaluate_problem(problem) for problem in problems]
    print("Part 2:", sum(solutions))
