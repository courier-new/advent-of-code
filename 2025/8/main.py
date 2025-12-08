import heapq
import math

# A junction box is represented as a point in 3D space, with X, Y, and Z
# coordinates.
type JunctionBox = tuple[int, int, int]

# A Distance represents a distance between two junction boxes, where the first
# member of the tuple is the distance, and the second and third members of the
# tuple are the two junction boxes. The distance is stored as the first member
# so that it can be used as the key for a min heap.
type Distance = tuple[float, JunctionBox, JunctionBox]

# A Circuit is a set of junction boxes that have been connected to each other.
type Circuit = set[JunctionBox]


def straight_line_distance(box1: JunctionBox, box2: JunctionBox) -> float:
    """
    Calculates the straight-line (Euclidean) distance between two junction boxes
    in 3D space.
    """
    return math.sqrt(
        (box1[0] - box2[0]) ** 2 + (box1[1] - box2[1]) ** 2 + (box1[2] - box2[2]) ** 2
    )


def build_minheap(junction_boxes: list[JunctionBox]) -> list[Distance]:
    """
    Builds a min heap of the distances between all pairs of junction boxes, so
    that we can easily get the next closest pair of junction boxes.
    """
    minheap: list[Distance] = []
    for box1_index in range(len(junction_boxes)):
        box1, rest_of_boxes = (
            junction_boxes[box1_index],
            junction_boxes[box1_index + 1 :],
        )
        for box2 in rest_of_boxes:
            distance = straight_line_distance(box1, box2)
            heapq.heappush(minheap, (distance, box1, box2))
    return minheap


def connect_circuits(
    junction_boxes: list[JunctionBox], num_connections: int
) -> list[Circuit]:
    """
    Connect the given number of closest pairs of junction boxes together,
    forming circuits. Returns the unordered list of circuit clusters.
    """
    distances_minheap = build_minheap(junction_boxes)
    circuits: list[Circuit] = []
    # Help us track which boxes we've added to circuits so far.
    boxes_encountered: set[JunctionBox] = set()

    while num_connections > 0:
        num_connections -= 1
        # Get the next closest pair of boxes.
        _distance, box1, box2 = heapq.heappop(distances_minheap)
        boxes_encountered, circuits = connect_pair(
            boxes_encountered, circuits, box1, box2
        )

    return list(circuits)


def connect_until_one_circuit(
    junction_boxes: list[JunctionBox],
) -> tuple[JunctionBox, JunctionBox]:
    """
    Connect the junction boxes together until they are all in one circuit.
    Returns the pair of junction boxes that form the final connection.
    """
    distances_minheap = build_minheap(junction_boxes)
    circuits: list[Circuit] = []
    # Help us track which boxes we've added to circuits so far.
    boxes_encountered: set[JunctionBox] = set()

    while len(boxes_encountered) < len(junction_boxes) or len(circuits) > 1:
        _distance, box1, box2 = heapq.heappop(distances_minheap)
        boxes_encountered, circuits = connect_pair(
            boxes_encountered, circuits, box1, box2
        )

        if len(boxes_encountered) == len(junction_boxes) and len(circuits) == 1:
            return box1, box2

    raise ValueError("Could not connect all junction boxes into one circuit")


def connect_pair(
    boxes_encountered: set[JunctionBox],
    circuits: list[Circuit],
    box1: JunctionBox,
    box2: JunctionBox,
) -> tuple[set[JunctionBox], list[Circuit]]:
    """
    Connects a pair of junction boxes together, forming a circuit if they are
    not already in a circuit, and handling merges. Returns the set of boxes
    encountered so far and the new list of circuits after the connection takes
    place.
    """

    # Check if both boxes are already in a circuit.
    if box1 in boxes_encountered and box2 in boxes_encountered:
        # Get the circuits that each box is in.
        box1_circuit = next(circuit for circuit in circuits if box1 in circuit)
        box2_circuit = next(circuit for circuit in circuits if box2 in circuit)
        # If the boxes are already in the same circuit, nothing happens.
        if box1_circuit == box2_circuit:
            return boxes_encountered, circuits
        # Otherwise, the boxes are in different circuits, so we need to merge them.
        box1_circuit.update(box2_circuit)
        circuits.remove(box2_circuit)
        return boxes_encountered, circuits

    # Check if the first box is already in a circuit.
    if box1 in boxes_encountered:
        # Add the second box to the circuit that the first box is in.
        box1_circuit = next(circuit for circuit in circuits if box1 in circuit)
        box1_circuit.add(box2)

    # Check if the second box is already in a circuit.
    elif box2 in boxes_encountered:
        # Add the first box to the circuit that the second box is in.
        box2_circuit = next(circuit for circuit in circuits if box2 in circuit)
        box2_circuit.add(box1)

    else:
        # Neither box is in a circuit, so create a new circuit from the two of
        # them to add to the list.
        new_circuit = set([box1, box2])
        circuits.append(new_circuit)

    # Ensure both boxes are tracked as encountered.
    boxes_encountered.add(box1)
    boxes_encountered.add(box2)

    return boxes_encountered, circuits


with open("input.txt", "r") as f:
    junction_boxes: list[JunctionBox] = []
    for line in f:
        x, y, z = line.strip().split(",")
        junction_boxes.append((int(x), int(y), int(z)))

    circuits = connect_circuits(junction_boxes, 1000)

    # Pick the three largest circuits.
    cluster1, cluster2, cluster3 = sorted(circuits, key=len, reverse=True)[:3]
    print("Part 1:", len(cluster1) * len(cluster2) * len(cluster3))

    box1, box2 = connect_until_one_circuit(junction_boxes)
    print("Part 2:", box1[0] * box2[0])
