from typing import TextIO, Literal
from collections import deque


def parse_file(file: TextIO) -> list[list[int]]:
    return [[int(num) for num in line.split()] for line in file]


def is_safe(_report: list[int]) -> bool:
    """
    Return True if the report is safe, False otherwise.
    """
    report = deque(_report)

    def is_safe_recursive(
        first: int, rest: deque[int], dir: Literal["asc", "desc"]
    ) -> bool:
        if len(rest) == 0:
            return True

        second = rest.popleft()
        # If the direction is ascending, the second number must be greater than
        # the first by at least 1 and at most 3.
        if dir == "asc" and (second < first + 1 or second > first + 3):
            return False
        # If the direction is descending, the second number must be less than
        # the first by at least 1 and at most 3.
        elif dir == "desc" and (second > first - 1 or second < first - 3):
            return False

        return is_safe_recursive(second, rest, dir)

    first = report.popleft()
    return is_safe_recursive(first, report.copy(), "asc") or is_safe_recursive(
        first, report.copy(), "desc"
    )


def get_all_with_one_deleted(report: list[int]) -> list[list[int]]:
    """
    Return a list of reports where each report is the input with the i-th
    element deleted.
    """
    return [report[:i] + report[i + 1 :] for i in range(len(report))]


def is_safe_with_one_deleted(report: list[int]) -> bool:
    if is_safe(report):
        return True
    else:
        reports_with_one_deleted = get_all_with_one_deleted(report)
        for report_with_one_deleted in reports_with_one_deleted:
            if is_safe(report_with_one_deleted):
                return True
    return False


with open("test.txt", "r") as file:
    reports = parse_file(file)

    num_safe = sum(is_safe(report) for report in reports)
    assert num_safe == 2, f"Expected 2, but got {num_safe}"

    # Part 2
    num_safe = sum(is_safe_with_one_deleted(report) for report in reports)
    assert num_safe == 4, f"Expected 4, but got {num_safe}"

print("All tests passed!")

with open("input.txt", "r") as file:
    reports = parse_file(file)

    num_safe = sum(is_safe(report) for report in reports)
    print("Part 1:", num_safe)

    # Part 2
    num_safe = sum(is_safe_with_one_deleted(report) for report in reports)
    print("Part 2:", num_safe)
