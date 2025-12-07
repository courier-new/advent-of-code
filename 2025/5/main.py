def is_id_fresh(id: int, ranges: list[tuple[int, int]]) -> bool:
    for start, end in ranges:
        if start <= id <= end:
            return True
    return False


def build_discrete_ranges(ranges: list[tuple[int, int]]) -> list[tuple[int, int]]:
    # Sort based on the start of the range.
    sorted_ranges = sorted(ranges, key=lambda x: x[0])
    # Initialize the list of discrete ranges with the first range.
    discrete_ranges: list[tuple[int, int]] = [sorted_ranges[0]]
    for start, end in sorted_ranges:
        # Check if the range overlaps with the previous range in the list.
        last_start, last_end = discrete_ranges[-1]
        if start <= last_end + 1:
            # The range overlaps with the previous range. Merge them, taking the
            # higher end of the two ranges to include both.
            discrete_ranges[-1] = (last_start, max(last_end, end))
        else:
            # The range does not overlap with the previous range. Add it to the list.
            discrete_ranges.append((start, end))
    return discrete_ranges


def count_size_of_range(range: tuple[int, int]) -> int:
    start, end = range
    # Range is inclusive.
    return end - start + 1


with open("input.txt", "r") as f:
    ranges: list[tuple[int, int]] = []
    line = f.readline().strip()
    while line:
        ranges.append(tuple[int, int](map(int, line.split("-"))))
        line = f.readline().strip()

    available_ids: list[int] = []
    line = f.readline().strip()
    while line:
        available_ids.append(int(line))
        line = f.readline().strip()

    fresh_ids = [id for id in available_ids if is_id_fresh(id, ranges)]
    print("Part 1:", len(fresh_ids))

    discrete_ranges = build_discrete_ranges(ranges)

    for range in discrete_ranges:
        print(range, count_size_of_range(range))

    print("Part 2:", sum(count_size_of_range(range) for range in discrete_ranges))
