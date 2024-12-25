from typing import TextIO, Literal

type Key = tuple[int, int, int, int, int]
type Lock = tuple[int, int, int, int, int]


def parse_locks_and_keys(file: TextIO) -> tuple[list[Lock], list[Key]]:
    """
    Parse the lists of locks and keys from the input file.
    """

    locks: list[Lock] = []
    keys: list[Key] = []
    curr_schematic: Lock | Key = (0, 0, 0, 0, 0)
    curr_type: Literal["lock", "key"] | None = None
    for line in file:
        # If we encounter a blank line, we've finished parsing a lock or key.
        # NOTE: We assume a blank line at the end of the input file, to add the
        # final lock or key.
        if not line.strip():
            if curr_type == "key":
                keys.append(curr_schematic)
            else:
                locks.append(curr_schematic)
            curr_type = None
            continue

        # If the line is entirely composed of "#", it starts a new lock.
        if "." not in line.strip() and curr_type is None:
            curr_type = "lock"
            curr_schematic = (0, 0, 0, 0, 0)
            continue

        # If the line is entirely composed of ".", it starts a new key.
        if "#" not in line.strip() and curr_type is None:
            curr_type = "key"
            # We initialize the column counts to -1 since each key also has a
            # final row of all "#" which doesn't count towards the height.
            curr_schematic = (-1, -1, -1, -1, -1)
            continue

        # Otherwise, if we're parsing another line for a lock or key...
        if curr_type == "lock" or curr_type == "key":
            col_chars = list(line.strip())
            # Increment the count for the height of each column based on the
            # presence of a "#".
            curr_schematic = (
                curr_schematic[0] + (col_chars[0] == "#"),
                curr_schematic[1] + (col_chars[1] == "#"),
                curr_schematic[2] + (col_chars[2] == "#"),
                curr_schematic[3] + (col_chars[3] == "#"),
                curr_schematic[4] + (col_chars[4] == "#"),
            )

    return locks, keys


def try_pairs(locks: list[Lock], keys: list[Key]) -> int:
    """
    Try all possible pairs of locks and keys to see how many unique pairs are
    possible matches.
    """
    count = 0
    for lock in locks:
        for key in keys:
            if try_pair(lock, key):
                count += 1
    return count


def try_pair(lock: Lock, key: Key) -> bool:
    # There is no overlap in a column if the sum of the lock and key columns are
    # all <= 5.
    return all(lock[i] + key[i] <= 5 for i in range(5))


with open("test.txt", "r") as f:
    locks, keys = parse_locks_and_keys(f)
    print(locks)
    print(keys)
    possible_pairs = try_pairs(locks, keys)
    assert possible_pairs == 3, f"Expected 3 but got {possible_pairs}"

print("All tests passed!")

with open("input.txt", "r") as f:
    locks, keys = parse_locks_and_keys(f)
    print(len(locks))
    print(len(keys))
    possible_pairs = try_pairs(locks, keys)
    print("Part 1:", possible_pairs)
