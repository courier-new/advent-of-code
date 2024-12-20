from typing import TextIO


def parse_file(file: TextIO) -> list[list[str]]:
    return [list(line.strip()) for line in file]


def is_different_or_out_of_bounds(
    garden: list[list[str]], crop: str, row: int, col: int
) -> bool:
    """
    Utility function which checks if a plot is out of bounds or has a different
    crop than the one we're looking for. Returns True if the plot is out of
    bounds or has a different crop, False otherwise.
    """
    return (
        row < 0
        or row >= len(garden)
        or col < 0
        or col >= len(garden[0])
        or garden[row][col] != crop
    )


def get_areas_and_perimeters(
    garden: list[list[str]],
) -> list[tuple[set[tuple[int, int]], int]]:
    """
    Identifies distinct regions in the garden using flood fill algorithm.
    Returns a list of tuples, where each tuple represents one region and
    contains the set of plots for that region as well as its computed perimeter.
    """
    areas_and_perimeters: list[tuple[set[tuple[int, int]], int]] = []

    # Keep track of which plots we've already visited. A plot can only belong to
    # one garden region, so we can skip it once we've visited it once.
    plots_visited = set()
    # Iterate over each plot in the garden to ensure we identify every region.
    for row_index, row in enumerate(garden):
        for col_index, crop in enumerate(row):
            # If this plot belongs to a region that we've already identified, we
            # can skip it.
            if (row_index, col_index) in plots_visited:
                continue

            # Otherwise, we've identified a new region! We'll use a flood fill
            # algorithm to identify all the plots within it. We initialize an
            # empty set to hold plots in the region and a counter for the
            # region's perimeter.
            plots_in_region = set()
            perimeter = 0
            # We'll use a stack to keep track of which plots we want to check.
            plots_to_check = [(row_index, col_index)]
            # Continue until we've run out of plots to check.
            while plots_to_check:
                row, col = plots_to_check.pop()
                # If we already identified that this plot belongs to our region,
                # we don't need to process it again.
                if (row, col) in plots_in_region:
                    continue

                # If the plot is out of bounds or doesn't belong to the same
                # crop, it contributes to the perimeter for this region. We only
                # checked it because it shared one side with a plot that was
                # part of the region. If it shares sides with other plots in our
                # region, we'll count those in later iterations.
                if is_different_or_out_of_bounds(garden, crop, row, col):
                    perimeter += 1
                    # We don't need to check any further for this plot.
                    continue

                # Otherwise, the plot belongs to our region! We'll add it to the
                # set of plots in the region and mark it as visited.
                plots_in_region.add((row, col))
                plots_visited.add((row, col))

                # We'll next check any plots that neighbor this one, to see if
                # they are also part of the region.
                plots_to_check.append((row - 1, col))
                plots_to_check.append((row + 1, col))
                plots_to_check.append((row, col - 1))
                plots_to_check.append((row, col + 1))

            # Once we've identified all the plots in the region, we'll add the
            # region to our list along with its perimeter.
            areas_and_perimeters.append((plots_in_region, perimeter))

    return areas_and_perimeters


def build_neighbors_corner(
    row: int, col: int
) -> list[tuple[tuple[int, int], tuple[int, int], tuple[int, int]]]:
    """
    Given the position of a plot in the garden, this function returns a list of
    neighboring plot positions that form an L-shape around the given plot. Each
    triple contains three adjacent plots in the sense of "orbiting" around the
    plot clockwise. For example, given plot #5 in the following garden:

        1 2 3
        4 5 6
        7 8 9

    The triples would be:
        - 2, 3, 6 (above -> to the right)
        - 6, 9, 8 (to the right -> below)
        - 8, 7, 4 (below -> to the left)
        - 4, 1, 2 (to the left -> above)
    """
    above = (row - 1, col)
    above_right = (row - 1, col + 1)
    right = (row, col + 1)
    below_right = (row + 1, col + 1)
    below = (row + 1, col)
    below_left = (row + 1, col - 1)
    left = (row, col - 1)
    above_left = (row - 1, col - 1)

    return [
        (above, above_right, right),
        (right, below_right, below),
        (below, below_left, left),
        (left, above_left, above),
    ]


def count_corners_for_region(
    garden: list[list[str]], region: set[tuple[int, int]]
) -> int:
    """
    Recognizing that the number of sides of a region is equal to the number of
    corners on that region, this function counts the number of corners in a
    region. There are two types of corners: internal (concave) and external
    (convex).

    - External (convex) corners are distinguishable by a plot belonging to the
      region that shares at least three adjacent sides with plots not in the
      region. For example:

        B B
        A B

        The plot at (1, 0) marks an external corner for region A because it is
        part of A but shares two adjacent sides with plots not in A. In fact,
        this plot marks four disinct corners, one for each pair of adjacent
        sides.

    - Internal (concave) corners are distinguishable by a plot *not* belonging
      to the region that shares at least two adjacent sides (in the sense of
      "orbiting" around the plot clockwise or counter-clockwise, to form an L
      shape) with plots in the region. For example:

        A B
        A A

        The plot at (0, 1) marks an internal corner for region A because it is
        not part of A but shares two adjacent sides with plots in A.

        In the case of the garden:

        B B B B
        B A B B
        B B A B
        B B B B

        We ensure no double-counting of corners by only counting external
        corners with 3 or more adjacent sides with plots not in the region.
        Otherwise, we would count the same corner multiple times, once as an
        internal corner and once as an external corner.


    We sum the number of external corners with the number of internal corners to
    arrive at the total number of corners for the region.
    """

    corners = 0

    # We need to sum external corners of our region with external corners of the
    # inverse region, except for the corners of the overall garden. The inverse
    # region's corners are interior corners of our garden region.
    # Peak the plots in all four cardinal directions to see if
    for row_index, row in enumerate(garden):
        for col_index, crop in enumerate(row):
            # For plots belonging to the region, we will look for external corners.
            if (row_index, col_index) in region:
                for neighbor1, _, neighbor2 in build_neighbors_corner(
                    row_index, col_index
                ):
                    # If both neighboring plots are out of bounds or have a
                    # different crop, they form an external corner.
                    if all(
                        is_different_or_out_of_bounds(garden, crop, r, c)
                        for r, c in (neighbor1, neighbor2)
                    ):
                        corners += 1

            # Otherwise, for plots *not* belonging to the region, we will look
            # for internal corners and check the full L-shape of neighbors.
            else:
                for trio in build_neighbors_corner(row_index, col_index):
                    # If all of the plots are part of our garden region, they
                    # form an internal corner.
                    if all((r, c) in region for r, c in trio):
                        corners += 1

    return corners


with open("test.txt", "r") as file:
    garden = parse_file(file)
    measurements = get_areas_and_perimeters(garden)
    total = sum(len(area) * perimeter for area, perimeter in measurements)
    assert total == 1930, f"Expected 1930, but got {total}"

    # Part 2
    # Map each measurement to an area, corners tuple, and sum the products.
    measurements = [
        (area, count_corners_for_region(garden, area)) for area, _ in measurements
    ]

    total = sum(len(area) * corners for area, corners in measurements)
    assert total == 1206, f"Expected 1206, but got {total}"

print("All tests passed.")

with open("input.txt", "r") as file:
    garden = parse_file(file)
    measurements = get_areas_and_perimeters(garden)
    total = sum(len(area) * perimeter for area, perimeter in measurements)
    print("Part 1:", total)

    # Part 2
    # Map each measurement to an area, corners tuple, and sum the products.
    measurements = [
        (area, count_corners_for_region(garden, area)) for area, _ in measurements
    ]

    total = sum(len(area) * corners for area, corners in measurements)
    print("Part 2:", total)
