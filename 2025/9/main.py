type Tile = tuple[int, int]


def rectangle_area(coord1: Tile, coord2: Tile) -> int:
    """
    Calculates the area of a rectangle given two coordinates.
    """
    x1, y1 = coord1
    x2, y2 = coord2
    # Width is the difference between the x coordinates plus 1 to include the
    # edges of the tiles.
    width = max(x1, x2) - min(x1, x2) + 1
    height = max(y1, y2) - min(y1, y2) + 1
    return width * height


def rectangle_contains_line(
    rectangle: tuple[Tile, Tile, int],
    line: tuple[Tile, Tile],
) -> bool:
    """
    Checks if a rectangle contains a line. If the line only touches the edges of
    the rectangle, it is not considered contained by it.

    For example, take the line between (7,1) and (7,3), and the rectangle
    between (2,5) and (11,1), which was the largest rectangle for the example
    input for part 1. This line is contained by the rectangle, since it's a
    vertical line at x=7, the rectangle's x range is 2-11, and the line's y
    range of 1-3 is completely contained within the rectangle's y range of 1-5.
    """
    lx1, ly1 = line[0]  # 7,1
    lx2, ly2 = line[1]  # 7,3
    rx1, ry1 = rectangle[0]  # 2,5
    rx2, ry2 = rectangle[1]  # 11,1

    # Vertical line
    if lx1 == lx2:
        # Check if the x position of the line falls strictly inside of the x range
        # of the rectangle (not just along either edge).
        contains_x = lx1 > min(rx1, rx2) and lx1 < max(rx1, rx2)
        min_y, max_y = min(ly1, ly2), max(ly1, ly2)
        if min_y == max_y:
            raise ValueError("Vertical line is a point, not a line")
        # Check if the y positions of the line are contained within the y range
        # of the rectangle.
        min_y_rect, max_y_rect = min(ry1, ry2), max(ry1, ry2)
        overlaps_y = max_y > min_y_rect and min_y < max_y_rect
        return contains_x and overlaps_y

    # Horizontal line
    # Check if the y position of the line falls strictly inside of the y range
    # of the rectangle (not just along either edge).
    contains_y = ly1 > min(ry1, ry2) and ly1 < max(ry1, ry2)
    min_x, max_x = min(lx1, lx2), max(lx1, lx2)
    if min_x == max_x:
        raise ValueError("Horizontal line is a point, not a line")
    # Check if the x positions of the line are contained within the x range of
    # the rectangle.
    min_x_rect, max_x_rect = min(rx1, rx2), max(rx1, rx2)
    overlaps_x = max_x > min_x_rect and min_x < max_x_rect
    return contains_y and overlaps_x


with open("input.txt", "r") as f:
    red_tile_coordinates: list[Tile] = []
    for line in f:
        x, y = line.strip().split(",")
        red_tile_coordinates.append((int(x), int(y)))

    # Calculate the size of all the possible rectangles that can be formed by
    # pairs of red tiles as opposite corners, then sort them from largest to
    # smallest.
    all_areas: list[tuple[Tile, Tile, int]] = sorted(
        [
            (tile_1, tile_2, rectangle_area(tile_1, tile_2))
            for tile_1 in red_tile_coordinates
            for tile_2 in red_tile_coordinates
        ],
        key=lambda x: x[2],
        reverse=True,
    )

    # The largest rectangle is the first one in the list. Its size is the third
    # element of the tuple.
    print("Part 1:", all_areas[0][2])

    # Pairs of adjacent red tiles form lines of green tiles surrounding the
    # interior area of green tiles. We start with the final pair that wraps the
    # list (the final tile and the first one), since all the others are easy to
    # add through a list comprehension.
    lines: list[tuple[Tile, Tile]] = [
        (red_tile_coordinates[-1], red_tile_coordinates[0])
    ]
    for tile_1_index in range(len(red_tile_coordinates) - 1):
        tile_1 = red_tile_coordinates[tile_1_index]
        tile_2 = red_tile_coordinates[tile_1_index + 1]
        lines.append((tile_1, tile_2))

    # Starting with the largest rectangle, check if it contains any of the
    # lines. This disqualifies it from being the largest green tile rectangle.
    # The first qualifying rectangle is the largest one that does not contain
    # any of the lines.
    for rectangle in all_areas:
        if not any(rectangle_contains_line(rectangle, line) for line in lines):
            print("Part 2:", rectangle[2])
            break
