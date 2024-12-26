from typing import TextIO, cast
from collections import defaultdict


def build_network(file: TextIO) -> dict[str, set[str]]:
    network = defaultdict(set)
    for line in file:
        c1, c2 = line.strip().split("-")
        if c1 == c2:
            raise ValueError("Found a self-loop")
        network[c1].add(c2)
        network[c2].add(c1)
    return network


def find_groups_of_three(network: dict[str, set[str]]) -> set[tuple[str, str, str]]:
    """
    Find all groups of 3 computers that are connected to each other. This is
    done by checking if a computer is connected to at least 2 other computers,
    and then checking if those 2 computers are connected to each other. Returns
    a set of tuples where each tuple is a unique, sorted list of the names of
    the computers in the group.
    """
    groups: set[tuple[str, str, str]] = set()
    for c1 in network:
        # If it isn't connected to at least 2 other computers, it can't be part
        # of a group of 3.
        if len(network[c1]) < 2:
            continue
        for c2 in network[c1]:
            for c3 in network[c2]:
                if c3 in network[c1]:
                    if any(c.startswith("t") for c in {c1, c2, c3}):
                        sorted_group: tuple[str, str, str] = cast(
                            tuple[str, str, str], tuple(sorted([c1, c2, c3]))
                        )
                        groups.add(sorted_group)
    return groups


def find_largest_group(network: dict[str, set[str]]) -> tuple[str, ...]:
    """
    Find the largest group of computers that are connected to each other and
    returns a tuple of the names of the computers in the group.
    """

    all_groups: set[tuple[str, ...]] = set()

    # Starting with each node forming a group of size 1, look for the largest
    # group that we can form with connections of that node.
    for node in network:
        groups = find_groups(node, set([node]), set())
        all_groups.update(groups)

    return max(all_groups, key=len)


def find_groups(
    node: str, current_group: set[str], groups: set[tuple[str, ...]]
) -> set[tuple[str, ...]]:
    """
    Recursively find all groups that can be formed with the connections of a
    given node and an existing group. Another connection can only be added to
    the group if the group is a subset of the connections of the one to add, as
    this means the connection is also connected to every computer in the group.
    """
    # For each connection of the node...
    for connection in network[node]:
        # We can only add the connection if the group is a subset of its
        # connections.
        if current_group.issubset(network[connection]):
            # Copy the group and add the new connection to it.
            new_group = set(current_group)
            new_group.add(connection)
            new_group_tuple = tuple(sorted(new_group))
            # If this is a new group...
            if new_group_tuple not in groups:
                # ...add it to the set of groups and continue checking if we can
                # expand it even further.
                groups.add(new_group_tuple)
                find_groups(connection, new_group, groups)

    return groups


def build_password(group: tuple[str, ...]) -> str:
    return ",".join(sorted(group))


with open("test.txt", "r") as file:
    network = build_network(file)
    groups_of_three = find_groups_of_three(network)
    assert (
        len(groups_of_three) == 7
    ), f"Expected 7 groups, but got {len(groups_of_three)}"

    largest_group = find_largest_group(network)
    assert (
        len(largest_group) == 4
    ), f"Expected 4 computers in the largest group, but got {len(largest_group)}"

    password = build_password(largest_group)
    assert password == "co,de,ka,ta", f"Expected 'co,de,ka,ta', but got '{password}'"

print("All tests passed.")

with open("input.txt", "r") as file:
    network = build_network(file)
    groups_of_three = find_groups_of_three(network)
    print("Part 1:", len(groups_of_three))

    # Part 2
    largest_group = find_largest_group(network)
    password = build_password(largest_group)
    print("Part 2:", password)
