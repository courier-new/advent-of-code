from typing import TextIO
from collections import defaultdict

def parse_file(file: TextIO) -> tuple[list[int], list[int]]:
    first = []
    second = []
    for line in file:
        first_id, second_id = line.split()

        first_id = int(first_id)
        second_id = int(second_id)

        first.append(first_id)
        second.append(second_id)

    return first, second

# Part 1
def compute_total_distance(first_ids: list[int], second_ids: list[int]) -> int:
    sum = 0

    sorted_first_ids = sorted(first_ids)
    sorted_second_ids = sorted(second_ids)

    for first_id, second_id in zip(sorted_first_ids, sorted_second_ids):
        abs_diff = abs(first_id - second_id)
        sum += abs_diff

    return sum

# Part 2
def compute_similarity_score(left_ids: list[int], right_ids: list[int]) -> int:
    appearance_counts = defaultdict(int)
    for id in right_ids:
        appearance_counts[id] += 1

    score = 0
    for id in left_ids:
        score_for_id = appearance_counts[id] * id
        score += score_for_id

    return score

with open('test.txt', 'r') as file:
    first_ids, second_ids = parse_file(file)
    sum = compute_total_distance(first_ids, second_ids)
    assert sum == 11, f"Expected 11, but got {sum}"
    score = compute_similarity_score(first_ids, second_ids)
    assert score == 31, f"Expected 31, but got {score}"

print('All tests passed!')

with open('input.txt', 'r') as file:
    first_ids, second_ids = parse_file(file)
    sum = compute_total_distance(first_ids, second_ids)
    print("Part 1:", sum)
    score = compute_similarity_score(first_ids, second_ids)
    print("Part 2:", score)
