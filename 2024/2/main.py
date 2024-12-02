from typing import TextIO, Literal
from collections import deque
from pprint import pprint

def parse_file(file: TextIO) -> list[deque[int]]:
    reports: list[deque[int]] = []
    for line in file:
        report = deque()
        for num in line.split():
            report.append(int(num))
        reports.append(report)
    return reports

def is_safe(_report: deque[int]) -> bool:
    report = _report.copy()

    def is_safe_recursive(first: int, rest: deque[int], dir: Literal["asc", "desc"]) -> bool:
        if len(rest) == 0:
            return True

        second = rest.popleft()
        if dir == "asc":
            # Each adjacent number must be greater by at least 1 and at most 3.
            if second < first + 1 or second > first + 3:
                return False
        else:
            # Each adjacent number must be smaller by at least 1 and at most 3.
            if second > first - 1 or second < first - 3:
                return False

        return is_safe_recursive(second, rest, dir)

    first = report.popleft()
    rest_right = report.copy()
    rest_left = report.copy()
    return is_safe_recursive(first, rest_right, "asc") or is_safe_recursive(first, rest_left, "desc")

def get_all_with_one_deleted(report: deque[int]) -> list[deque[int]]:
    reports = []
    for i in range(len(report)):
        # Copy the report and delete the i-th element.
        new_report = list(report)
        del new_report[i]
        reports.append(deque(new_report))
    return reports

def is_safe_with_one_deleted(report: deque[int]) -> bool:
    if is_safe(report):
        return True
    else:
        reports_with_one_deleted = get_all_with_one_deleted(report)
        for report_with_one_deleted in reports_with_one_deleted:
            if is_safe(report_with_one_deleted):
                return True
    return False

with open('test.txt', 'r') as file:
    reports = parse_file(file)

    num_safe = 0
    for report in reports:
        if is_safe(report):
            num_safe += 1
    assert num_safe == 2, f"Expected 2, but got {num_safe}"

    # Part 2
    num_safe = 0
    for report in reports:
        if is_safe_with_one_deleted(report):
            num_safe += 1
    assert num_safe == 4, f"Expected 4, but got {num_safe}"

print('All tests passed!')

with open('input.txt', 'r') as file:
    reports = parse_file(file)

    num_safe = 0
    for report in reports:
        if is_safe(report):
            num_safe += 1

    print("Part 1:", num_safe)

    # Part 2
    num_safe = 0
    for report in reports:
        if is_safe_with_one_deleted(report):
            num_safe += 1

    print("Part 2:", num_safe)