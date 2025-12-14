from functools import cache


def find_paths(
    graph: dict[str, list[str]], start: str, end: str, required_nodes: set[str] = set()
) -> int:
    @cache
    def find_paths_helper(
        start: str, end: str, nodes_still_needed: tuple[str, ...]
    ) -> int:
        if start == end:
            # If we saw all the required nodes, we found a valid path and can
            # count this one.
            if len(nodes_still_needed) == 0:
                return 1
            # Otherwise, this path doesn't work.
            else:
                return 0

        if start not in graph:
            raise ValueError(f"start {start} not in graph")

        if start in nodes_still_needed:
            nodes_still_needed = tuple(
                node for node in nodes_still_needed if node != start
            )

        return sum(
            find_paths_helper(target, end, nodes_still_needed)
            for target in graph[start]
        )

    return find_paths_helper(start, end, tuple(required_nodes))


with open("input.txt", "r") as file:
    graph = {}
    for line in file:
        source, targets = line.strip().split(": ")
        targets = targets.split(" ")
        graph[source] = targets

    print("Part 1:", find_paths(graph, "you", "out"))

    print("Part 2:", find_paths(graph, "svr", "out", {"dac", "fft"}))
