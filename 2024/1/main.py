from typing import TextIO
from collections import defaultdict

def parse_file(file: TextIO) -> tuple[list[int], list[int]]:
    first = []
    second = []

    for line in file:
        first_id, second_id = map(int, line.split())
        first.append(first_id)
        second.append(second_id)

    return first, second

# Part 1
def compute_total_distance(first: list[int], second: list[int]) -> int:
    sorted_first = sorted(first)
    sorted_second = sorted(second)

    return sum(abs(first - second) for first, second in zip(sorted_first, sorted_second))

# Part 2
def compute_similarity_score(left: list[int], right: list[int]) -> int:
    appearance_counts = defaultdict(int)
    for id in right:
        appearance_counts[id] += 1

    return sum(appearance_counts[id] * id for id in left)

with open('test.txt', 'r') as file:
    first, second = parse_file(file)
    distance = compute_total_distance(first, second)
    assert distance == 11, f"Expected 11, but got {distance}"
    score = compute_similarity_score(first, second)
    assert score == 31, f"Expected 31, but got {score}"

print('All tests passed!')

with open('input.txt', 'r') as file:
    first, second = parse_file(file)
    distance = compute_total_distance(first, second)
    print("Part 1:", distance)
    score = compute_similarity_score(first, second)
    print("Part 2:", score)
