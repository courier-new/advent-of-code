from typing import TextIO
from collections import defaultdict


def parse_initial_secrets(file: TextIO) -> list[int]:
    return [int(line.strip()) for line in file]


def evolve(secret: int) -> int:
    """
    Evolves a buyer's secret number into the next secret number in the sequence
    via the following steps:

    - Mix the secret with 64 times itself and then prune it.
    - Mix the secret with the secret divided by 32 and then prune it.
    - Mix the secret with 2048 times itself and then prune it.

    To mix two numbers, we calculate the XOR of them. To prune a number, we take
    the number modulo 16777216. The result of the evolution is the next secret
    number in the sequence.
    """
    secret = mix_and_prune(secret, secret * 64)
    secret = mix_and_prune(secret, secret // 32)
    secret = mix_and_prune(secret, secret * 2048)
    return secret


def mix_and_prune(a: int, b: int) -> int:
    """
    Mixes two numbers together by calculating their XOR and then prunes the
    result by taking the modulo 16777216.
    """
    return (a ^ b) % 16777216


def make_sequence(secret: int, steps: int) -> list[int]:
    """
    Generates a sequence of secret numbers for a buyer given their initial
    secret number and the number of steps to evolve it.
    """
    sequence = [secret]
    sequence.extend
    for _ in range(steps):
        secret = evolve(secret)
        sequence.append(secret)
    return sequence


def find_best_sale(sequences: list[list[int]]) -> tuple[tuple[int, int, int, int], int]:
    """
    Finds the sequence of 4 consecutive price changes that would result in the
    highest total banana sales across all monkeys, given a list of sequences of
    secret numbers for each monkey. Returns the sequence of price changes and
    the resulting total sales.
    """
    offer_prices = [[secret % 10 for secret in sequence] for sequence in sequences]
    # For each offer price in a sequence, calculate the change between it and
    # the previous offer price. The first offer price in the sequence doesn't
    # have a previous offer price to compare to, so we omit it from the list.
    price_changes = [
        [current - previous for previous, current in zip(prices, prices[1:])]
        for prices in offer_prices
    ]

    # Keep track of the total sales that can be made for each sequence of 4
    # price changes across all monkeys.
    sales: dict[tuple[int, int, int, int], int] = defaultdict(int)

    # For a given buyer, calculate the sales that can be made based on the
    # offer prices and price changes at each step in the sequence.
    for offer_prices, changes in zip(offer_prices, price_changes):
        # Keep track of the sequences of 4 price changes that we've already
        # seen; once a hiding spot is sold, the monkey will move on.
        sequences_encountered: set[tuple[int, int, int, int]] = set()
        # For every 4 consecutive price changes...
        for i in range(len(changes) - 3):
            # Identify the 4-tuple that would instruct the monkey to make a sale
            # on the 4th step.
            sequence = (changes[i], changes[i + 1], changes[i + 2], changes[i + 3])
            # If this sequence occurs earlier, the monkey would have already
            # made a sale and wouldn't make another one, so we skip it.
            if sequence in sequences_encountered:
                continue
            # Otherwise, mark this sequence.
            sequences_encountered.add(sequence)
            # Check the price at the end of it. The price is offset by 4 steps
            # due to the changes being calculated from the second price onwards.
            price = offer_prices[i + 4]
            # Increment the total sales for this unique sequence.
            sales[sequence] += price

    # Find the sequence of price changes that would result in the most sales.
    best_sequence = (0, 0, 0, 0)
    max = 0
    for sequence, sale in sales.items():
        if sale > max:
            max = sale
            best_sequence = sequence
    return best_sequence, max


with open("test.txt", "r") as f:
    initial_secrets = parse_initial_secrets(f)
    secret_sequences = [make_sequence(secret, steps=2000) for secret in initial_secrets]
    total = sum(sequence[-1] for sequence in secret_sequences)
    assert total == 37327623, f"Expected 37327623, but got {total}"


# Part 2
with open("test2.txt", "r") as f:
    test_sequences = [make_sequence(123, steps=10)]
    test_sequence, test_sales = find_best_sale(test_sequences)
    assert test_sales == 6, f"Expected 6, but got {test_sales}"
    assert test_sequence == (
        -1,
        -1,
        0,
        2,
    ), f"Expected (-1,-1,0,2), but got {test_sequence}"

    initial_secrets = parse_initial_secrets(f)
    secret_sequences = [make_sequence(secret, steps=2000) for secret in initial_secrets]
    sell_sequence, total_sales = find_best_sale(secret_sequences)
    assert total_sales == 23, f"Expected 23, but got {total_sales}"
    assert sell_sequence == (
        -2,
        1,
        -1,
        3,
    ), f"Expected (-2,1,-1,3), but got {sell_sequence}"

print("All tests passed.")

with open("input.txt", "r") as f:
    initial_secrets = parse_initial_secrets(f)
    secrets_for_buyers = [
        make_sequence(secret, steps=2000) for secret in initial_secrets
    ]
    total = sum(secrets[-1] for secrets in secrets_for_buyers)
    print("Part 1:", total)

    # Part 2
    sell_sequence, total_sales = find_best_sale(secrets_for_buyers)
    print("Part 2:", total_sales)
