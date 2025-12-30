import re
from typing import Literal


type PresentChunk = Literal[0, 1]
type PresentRow = tuple[PresentChunk, PresentChunk, PresentChunk]
type Present = tuple[PresentRow, PresentRow, PresentRow]
type PresentAndSize = tuple[int, Present]
type Presents = tuple[
    PresentAndSize,
    PresentAndSize,
    PresentAndSize,
    PresentAndSize,
    PresentAndSize,
    PresentAndSize,
]

type Region = tuple[int, int]

# The number of each present type that needs to fit into the region.
type RegionContents = tuple[int, int, int, int, int, int]


def parse_present_chunk(char: str) -> PresentChunk:
    return 1 if char == "#" else 0


def parse_present_row(line: str) -> PresentRow:
    return (
        parse_present_chunk(line[0]),
        parse_present_chunk(line[1]),
        parse_present_chunk(line[2]),
    )


# Each present is 3x3, and is given to us as three lines of text
def parse_present(lines: list[str]) -> tuple[int, Present]:
    """
    Parses a present from a list of three lines of text.
    Returns the size of the present and the present itself.
    """
    row_1 = parse_present_row(lines[0])
    row_2 = parse_present_row(lines[1])
    row_3 = parse_present_row(lines[2])

    present_size = row_1.count(1) + row_2.count(1) + row_3.count(1)

    return present_size, (row_1, row_2, row_3)


def parse_region(line: str) -> tuple[int, int, RegionContents]:
    """
    Parses a region from a line of text.
    Returns the width, length, and present contents of the region.
    """
    size, contents = line.split(":")

    match = re.match(r"(\d+)x(\d+)", size)
    if not match:
        raise ValueError(f"Invalid size: {size}")
    width, length = match.groups()

    region_contents = tuple[int, int, int, int, int, int](
        int(x) for x in contents.strip().split(" ")
    )
    if len(region_contents) != 6:
        raise ValueError(f"Invalid region contents: {contents}")

    return int(width), int(length), region_contents


def check_region(
    region: tuple[int, int, RegionContents], presents: Presents
) -> bool | Literal["Maybe"]:
    width, length, contents = region

    # Check #1: Is the region too small to fit every chunk of present? If so, we
    # know it's not possible and don't need to check any further.
    present_sizes = [present_size for present_size, _ in presents]
    total_chunks_needed = sum(contents[i] * present_sizes[i] for i in range(6))
    if total_chunks_needed > width * length:
        return False

    # Check #2: Can we fit each present if we only split the region into 3x3
    # squares? If so, we know it's possible and don't need to check any further.
    max_presents_taking_3x3_squares = (width // 3) * (length // 3)
    if sum(contents) <= max_presents_taking_3x3_squares:
        return True

    # NOTE: It turns out that all of the regions from the input can use one of
    # the earlier heuristics, so we get our solution for free without having to
    # do nay more work!!
    return "Maybe"


with open("input.txt", "r") as f:
    _presents: list[tuple[int, Present]] = []
    regions: list[tuple[int, int, RegionContents]] = []

    for line in f:
        if re.match(r"^\d+:", line.strip()):
            next_three_lines = [f.readline().strip() for _ in range(3)]
            present = parse_present(next_three_lines)
            _presents.append(present)

        elif re.match(r"^\d+x\d+:", line.strip()):
            region = parse_region(line.strip())
            regions.append(region)

    if len(_presents) != 6:
        raise ValueError(f"Expected 6 presents, but got {len(_presents)}")

    presents: Presents = (
        _presents[0],
        _presents[1],
        _presents[2],
        _presents[3],
        _presents[4],
        _presents[5],
    )

    successful_regions = 0
    for region in regions:
        result = check_region(region, presents)
        if result:
            successful_regions += 1

    print("Part 1:", successful_regions)
