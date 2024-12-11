from typing import TypedDict


# Part 1
def compact_files_partial(_dense_disk_map: str) -> list[int]:
    """
    Compacts a dense disk map by moving blocks of files from the back of the
    disk to empty space at the front, until there is no more space left. Returns
    a list of the ID of the file that each block belongs to.
    """
    # Convert the dense disk map to a list of characters so that we can modify
    # it as we go.
    dense_disk_map = list(_dense_disk_map)
    # Initialize a list to store the ID of the file that each block belongs to
    # after compacting.
    blocks: list[int] = []
    # We will maintain two pointers: one at the front of the disk map, which we
    # use to write blocks to the blocks list and determine the next space to
    # fill, and one at the back of the disk map, which we use to find file
    # blocks to move to the front.
    dense_front_pointer = 0
    # Our back pointer will be the last file block. Since digits alternate and
    # files are indicated at the even indices, we assign our back pointer to the
    # last index if the length of the disk map is odd (the last index would be
    # even, then), and to the second-to-last index if the length of the disk map
    # is even.
    dense_back_pointer = (
        len(dense_disk_map) - 1
        if len(dense_disk_map) % 2 == 1
        else len(dense_disk_map) - 2
    )

    # We will loop until the front pointer would overtake the back pointer.
    while dense_front_pointer <= dense_back_pointer:
        # When front pointer is even, the digit at that index represents a
        # *file*. Write the number of blocks indicated to the compact list.
        if dense_front_pointer % 2 == 0:
            # The ID of the file is the pointer divided by 2, since files are
            # indicated at every other digit.
            id = dense_front_pointer // 2
            file_size = int(dense_disk_map[dense_front_pointer])
            blocks.extend([id] * file_size)
            dense_front_pointer += 1

        # When front pointer is odd, the digit at that index represents *free
        # space*. Using our back pointer, write file blocks to the compact list
        # until we run out of space.
        else:
            free_space = int(dense_disk_map[dense_front_pointer])
            last_file_size = int(dense_disk_map[dense_back_pointer])
            id = dense_back_pointer // 2
            # If we don't have enough space, or we have exactly enough space to
            # move the last file back, move as much of the file as we can.
            if free_space <= last_file_size:
                # Record how many blocks we still need to move back for the last
                # file.
                num_left = last_file_size - free_space
                dense_disk_map[dense_back_pointer] = str(num_left)
                # Write all the blocks that we have space for.
                blocks.extend([id] * free_space)
                # We've used up all the space, so we can move the front pointer
                # up to the next digit.
                dense_front_pointer += 1

            # If we have more than enough space, we can move the entire file and
            # then try to move more.
            else:
                # Record how much space we still have.
                space_left = free_space - last_file_size
                dense_disk_map[dense_front_pointer] = str(space_left)
                # Write all the blocks of the last file.
                blocks.extend([id] * last_file_size)
                # Move the back pointer up to the next file.
                dense_back_pointer -= 2

    return blocks


# Part 2
def compact_files_full(_dense_disk_map: str) -> list[int]:
    """
    Compacts a dense disk map by moving blocks of files from the back of the
    disk to empty space at the front, moving entire files at a time, until no
    more files can be moved. Returns a list of the ID of the file that each
    block belongs to. Free space at the end of the compacting process is filled
    with 0s, for the purposes of the checksum.
    """
    # Convert the dense disk map to a list of characters so that we can modify
    # it as we go.
    dense_disk_map = list(_dense_disk_map)
    # Initialize a list to store the ID of the file that each block belongs to
    # after compacting.
    blocks: list[int] = []
    dense_front_pointer = 0

    while dense_front_pointer < len(dense_disk_map):
        # When front pointer is even, the digit at that index represents a
        # *file*. If the file hasn't already been moved, write the number of
        # blocks indicated to the compact list.
        if dense_front_pointer % 2 == 0:
            # The ID of the file is the pointer divided by 2, since files are
            # indicated at every other digit.
            id = dense_front_pointer // 2
            file_size = int(dense_disk_map[dense_front_pointer])
            # A negative file_size means we have already moved the file
            # indicated by this digit, so we have free space here. Since we
            # attempt to move each file exactly once in order of decreasing file
            # ID number, and we only move files back, we would never try to move
            # a different file back to this space. So we just need to fill in 0s
            # for the space it occupied (since we use ths space to compute the
            # checksum later).
            if file_size < 0:
                blocks.extend([0] * -file_size)
            else:
                blocks.extend([id] * file_size)
            dense_front_pointer += 1

        # When front pointer is odd, the digit at that index represents *free
        # space*. For every file, starting from the back, we check if we have
        # enough space to move all of the file to this free space.
        else:
            # We will start with the last file. Since digits alternate and
            # files are indicated at the even indices, we assign our back
            # pointer to the last index if the length of the disk map is odd
            # (the last index would be even, then), and to the second-to-last
            # index if the length of the disk map is even.
            dense_back_pointer = (
                len(dense_disk_map) - 1
                if len(dense_disk_map) % 2 == 1
                else len(dense_disk_map) - 2
            )

            free_space = int(dense_disk_map[dense_front_pointer])

            while dense_back_pointer > dense_front_pointer and free_space > 0:
                space_required = int(dense_disk_map[dense_back_pointer])
                # Negative space indicates we already moved the file and can
                # skip over it. If we have enough space to move all of the file
                # blocks back...
                if space_required > 0 and free_space >= space_required:
                    # Write all the blocks tof that file. The ID of the file is
                    # the pointer divided by 2, since files are indicated at
                    # every other digit.
                    id = dense_back_pointer // 2
                    blocks.extend([id] * space_required)

                    # Update with the remaining free space.
                    free_space -= space_required
                    # Replace space required for original file with negative
                    # space, to remind ourselves to add space later when we
                    # reach this file moving in the forward direction.
                    dense_disk_map[dense_back_pointer] = str(-space_required)

                    # Move the back pointer up to the next file to check if we
                    # can move that file as well.
                    dense_back_pointer -= 2
                else:
                    dense_back_pointer -= 2

            # If we still have space left, write the remaining space to the
            # blocks as 0s, since we use this space to compute the checksum.
            if free_space > 0:
                blocks.extend([0] * free_space)

            # Move the front pointer up to the next digit.
            dense_front_pointer += 1

    return blocks


def calculate_checksum(blocks: list[int]) -> int:
    return sum(i * id for i, id in enumerate(blocks))


class TestCase(TypedDict):
    input: str
    expected_partial_checksum: str
    partial_checksum: int
    expected_full_checksum: str
    full_checksum: int


TEST_CASES: list[TestCase] = [
    {
        "input": "12345",
        "expected_partial_checksum": "022111222",
        "partial_checksum": 60,
        "expected_full_checksum": "000111000022222",
        "full_checksum": 132,
    },
    {
        "input": "2333133121414131402",
        "expected_partial_checksum": "0099811188827773336446555566",
        "partial_checksum": 1928,
        "expected_full_checksum": "009921117770440333000055550666600000888800",
        "full_checksum": 2858,
    },
]

for test_index, test_case in enumerate(TEST_CASES):
    input = test_case["input"]
    expected_partial = test_case["expected_partial_checksum"]
    expected_partial_checksum = test_case["partial_checksum"]
    expected_full = test_case["expected_full_checksum"]

    partial = compact_files_partial(input)

    assert (
        partial == [int(i) for i in expected_partial]
    ), f"Test case {test_index} failed: got {"".join(map(str, partial))} but expected {expected_partial}"

    checksum = calculate_checksum(partial)
    assert (
        checksum == expected_partial_checksum
    ), f"Test case {test_index} failed: got {checksum} but expected {expected_partial_checksum}"

    full = compact_files_full(input)

    assert (
        full == [int(i) for i in expected_full]
    ), f"Test case {test_index} failed: got {"".join(map(str, full))} but expected {expected_full}"

    checksum = calculate_checksum(full)
    assert (
        checksum == test_case["full_checksum"]
    ), f"Test case {test_index} failed: got {checksum} but expected {test_case['full_checksum']}"

print("All tests passed.")

with open("input.txt", "r") as f:
    dense_disk_map = f.read().strip()
    blocks = compact_files_partial(dense_disk_map)
    checksum = calculate_checksum(blocks)
    print("Part 1:", checksum)

    # Part 2
    blocks = compact_files_full(dense_disk_map)
    checksum = calculate_checksum(blocks)
    print("Part 2:", checksum)
