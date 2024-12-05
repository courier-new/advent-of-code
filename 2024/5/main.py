from typing import TextIO, TypedDict, NotRequired

# Read out the ordering rules and the updates from the file.
type OrderingRule = tuple[int, int]
type Update = list[int]


def parse_file(file: TextIO) -> tuple[list[OrderingRule], list[Update]]:
    ordering_rules = []
    updates = []
    for line in file:
        # if the line is blank, skip it
        if not line.strip():
            continue
        elif "|" in line:
            # Parse the ordering rule.
            ordering_rules.append(tuple(map(int, line.strip().split("|"))))
        else:
            # Parse the update.
            updates.append(list(map(int, line.strip().split(","))))
    return ordering_rules, updates


# From the ordering rules, we can map out which pages are allowed to come before
# each page. This function will return a dictionary that maps each page to the
# complete set of pages that are allowed to come before it.
# NOTE: The assumption is that the ordering rules are complete, consistent, and
# free of cycles.
def build_before_lookup(rules: list[OrderingRule]) -> dict[int, set[int]]:
    # Create a mapping from each page to the pages that come before it.
    pages_before: dict[int, set[int]] = {page: set() for rule in rules for page in rule}
    for before, after in rules:
        pages_before[after].add(before)

    return pages_before


# NOTE: There is an assumption in here that any page that appears in an update
# will have at least one ordering rule that describes it. We conclude from part
# 2 that this is a fair assumption, as there wouldn't really be a point to
# including a page that has no ordering rules, since there would be multiple
# valid orderings for that update, making it impossible to "fix".
def validate_update(update: Update, rules: dict[int, set[int]]) -> bool:
    # Keep track of the pages that have come before the current page.
    pages_before = set()
    for page in update:
        # Ensure that any pages we've seen before are a valid subset of the
        # pages that are allowed to come before the current page.
        if not pages_before.issubset(rules[page]):
            return False
        pages_before.add(page)

    return True


# For Part 2
def fix_update(update: Update, rules: dict[int, set[int]]) -> Update:
    fixed_update = []
    for page in update:
        # Ensure that any pages we've seen before are a valid subset of the
        # pages that are allowed to come before the current page.
        if not set(fixed_update).issubset(rules[page]):
            # Find the index of the earliest page added to the fixed update that
            # is not allowed to come before the current page.
            invalid_page = next(
                i for i, p in enumerate(fixed_update) if p not in rules[page]
            )
            # Shift the current page back before the invalid page.
            fixed_update = (
                fixed_update[:invalid_page] + [page] + fixed_update[invalid_page:]
            )
        else:
            fixed_update.append(page)

    return fixed_update


def get_middle_page(update: Update) -> int:
    return update[len(update) // 2]


class TestCase(TypedDict):
    update: Update
    expected: bool
    fixed: NotRequired[Update]


test_updates: list[TestCase] = [
    {"update": [75, 47, 61, 53, 29], "expected": True},
    {"update": [97, 61, 53, 29, 13], "expected": True},
    {"update": [75, 29, 13], "expected": True},
    {"update": [75, 97, 47, 61, 53], "expected": False, "fixed": [97, 75, 47, 61, 53]},
    {"update": [61, 13, 29], "expected": False, "fixed": [61, 29, 13]},
    {"update": [97, 13, 75, 29, 47], "expected": False, "fixed": [97, 75, 47, 29, 13]},
]


def run_test(rules: list[OrderingRule], test_case: TestCase) -> None:
    update, expected, fixed = (
        test_case["update"],
        test_case["expected"],
        test_case.get("fixed"),
    )

    is_valid = validate_update(update, order)

    assert (
        is_valid == expected
    ), f"Failed on {update}: expected {expected}, but got {is_valid}"

    if is_valid:
        return

    assert (
        fix_update(update, order) == fixed
    ), f"Failed to fix {update}: expected {fixed}, but got {fix_update(update, order)}"


with open("test.txt", "r") as file:
    ordering_rules, updates = parse_file(file)
    order = build_before_lookup(ordering_rules)

    for test_case in test_updates:
        run_test(ordering_rules, test_case)

    middle_pages = [
        get_middle_page(update) for update in updates if validate_update(update, order)
    ]
    result = sum(middle_pages)
    assert result == 143, f"Expected 143, but got {result}"

    fixed_middle_pages = [
        get_middle_page(fix_update(update, order))
        for update in updates
        if not validate_update(update, order)
    ]
    result = sum(fixed_middle_pages)
    assert result == 123, f"Expected 123, but got {result}"

print("All tests passed!")

with open("input.txt", "r") as file:
    ordering_rules, updates = parse_file(file)
    order = build_before_lookup(ordering_rules)

    middle_pages = [
        get_middle_page(update) for update in updates if validate_update(update, order)
    ]
    print("Part 1:", sum(middle_pages))

    # Part 2
    fixed_middle_pages = [
        get_middle_page(fix_update(update, order))
        for update in updates
        if not validate_update(update, order)
    ]
    print("Part 2:", sum(fixed_middle_pages))
