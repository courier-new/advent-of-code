import functools


def split_beams(row: str, beam_positions: set[int]) -> tuple[int, set[int]]:
    row_length = len(row)
    splits = 0
    new_beam_positions: set[int] = set()
    for col in beam_positions:
        # If this beam would encounter a splitter in the current row, split it
        # into two beams.
        if row[col] == "^":
            splits += 1
            if col - 1 >= 0:
                new_beam_positions.add(col - 1)
            if col + 1 < row_length:
                new_beam_positions.add(col + 1)
        else:
            # Otherwise, the beam continues in the same direction.
            new_beam_positions.add(col)
    return splits, new_beam_positions


@functools.cache
def count_timelines_for_beam(col: int, rows: tuple[str, ...]) -> int:
    if len(rows) == 1:
        return 1

    next_row, rest_rows = rows[0], rows[1:]
    row_length = len(next_row)
    if next_row[col] == "^":
        # If this beam would encounter a splitter in the current row, count the
        # timelines for each of the two new beams.
        left_timelines = 0
        right_timelines = 0
        if col - 1 >= 0:
            left_timelines = count_timelines_for_beam(col - 1, rest_rows)
        if col + 1 < row_length:
            right_timelines = count_timelines_for_beam(col + 1, rest_rows)
        return left_timelines + right_timelines
    else:
        # Otherwise, the beam continues in the same direction; we continue
        # counting timelines for the next row.
        return count_timelines_for_beam(col, rest_rows)


with open("input.txt", "r") as f:
    rows = [line.strip() for line in f.readlines()]
    beam_positions: set[int] = set()
    # Find the starting position of the beam in the first row.
    beam_start_col = rows[0].index("S")
    beam_positions.add(beam_start_col)
    total_splits = 0
    for row in rows[1:]:
        splits, beam_positions = split_beams(row, beam_positions)
        total_splits += splits
    print("Part 1:", total_splits)

    timelines = count_timelines_for_beam(beam_start_col, tuple(rows))
    print("Part 2:", timelines)
