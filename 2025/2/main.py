def count_invalid_in_range(
    id_range: tuple[str, str], number_of_splits: int = 2
) -> set[int]:
    start, end = id_range
    # If both start and end are of the same length and are not cleanly divisible
    # by the number of groups to split the digits into, there cannot be any
    # invalid IDs (we can't form any number in the range that is made up of a
    # sequence repeated exactly number_of_splits times).
    if (
        len(start) == len(end)
        and len(start) % number_of_splits != 0
        and len(end) % number_of_splits != 0
    ):
        return set()

    # If either the start or the end of the range is not cleanly divisible by
    # the number of groups to split the digits into, we can shrink the range to
    # check to the nearest start/end with a number of digits that is cleanly
    # divisible by the number of groups to split the digits into.
    if len(start) % number_of_splits != 0:
        # We need to *increase* the bottom of the range.
        # e.g. 8 in 2 groups -> 10 ("1" + "0")
        # e.g. 22 in 3 groups -> 100 ("1" + "0" + "0")
        # e.g. 999 in 2 groups -> 1000 ("10" + "00")
        # e.g. 456 in 5 groups -> 10000 ("1" + "0" + "0" + "0" + "0")
        digit_groups = len(start) // number_of_splits + 1
        digits_needed = digit_groups * number_of_splits
        start = str(10 ** (digits_needed - 1))
        # If the shrunk start is greater than the end, there is no longer a
        # valid range to check for this number of splits.
        if int(start) > int(end):
            return set()
    if len(end) % number_of_splits != 0:
        # We need to *decrease* the top of the range.
        # e.g. 100 in 2 groups -> 99 ("9" + "9")
        # e.g. 1000 in 3 groups -> 999 ("9" + "9" + "9")
        # e.g. 28282 in 2 groups -> 9999 ("99" + "99")
        # e.g. 123456 in 5 groups -> 99999 ("9" + "9" + "9" + "9" + "9")
        digit_groups = len(end) // number_of_splits
        digits_needed = digit_groups * number_of_splits
        end = str(10 ** (digits_needed) - 1)
        # If the shrunk end is less than the start, there is no longer a valid
        # range to check for this number of splits.
        if int(end) < int(start):
            return set()

    # Now we can check for invalid IDs by taking the first group of digits from
    # the splits.
    first_group_start = int(start[: len(start) // number_of_splits])
    first_group_end = int(end[: len(end) // number_of_splits])

    # For every number in the first group of digits, check if an invalid ID
    # formed from the number repeated in sequence exactly number_of_splits times
    # would also fall within the shrunk range. Collect the invalid IDs in a set
    # as we go.
    invalid_ids: set[int] = set()
    for i in range(first_group_start, first_group_end + 1):
        possible_invalid_id = int(f"{i}" * number_of_splits)
        if possible_invalid_id in range(int(start), int(end) + 1):
            invalid_ids.add(possible_invalid_id)

    return invalid_ids


if __name__ == "__main__":
    with open("input.txt", "r") as f:
        line = f.readline().strip()
        ranges: list[tuple[str, str]] = [
            (start, end) for start, end in [r.split("-") for r in line.split(",")]
        ]
        invalid_ids: set[int] = set().union(
            *[count_invalid_in_range(r) for r in ranges]
        )
        print("Part 1:", sum(invalid_ids))

        invalid_ids_part2: set[int] = set()
        for r in ranges:
            # The maximum number of splits would be breaking the number into as
            # many groups as it has digits, e.g. 123456 -> max 6 splits. We use
            # the end number to determine this, since it will be the larger of
            # the two.
            max_number_of_splits = len(r[1])
            for number_of_splits in range(2, max_number_of_splits + 1):
                invalid_ids_part2.update(count_invalid_in_range(r, number_of_splits))
        print("Part 2:", sum(invalid_ids_part2))
