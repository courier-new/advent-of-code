def greedy_battery_selection(bank: str, batteries_to_turn_on: int) -> int:
    result_string: str = ""
    remaining_bank: str = bank
    # We look for the largest joltage rating (digit) available in the remaining
    # bank, stopping short to leave enough batteries (digits) for us to turn on
    # exactly batteries_to_turn_on batteries.
    for additional_batteries_needed in range(batteries_to_turn_on - 1, -1, -1):
        # The batteries we can consider for our next selection are all of those
        # between where we last stopped and up to the last
        # additional_batteries_needed digits.
        to_consider = remaining_bank[
            : len(remaining_bank) - additional_batteries_needed
        ]
        # Choose the largest joltage rating (digit) available.
        max_joltage = max(to_consider)
        # Add it to our result string and shrink the remaining bank to batteries
        # after the chosen one.
        result_string += max_joltage
        remaining_bank = remaining_bank[remaining_bank.index(max_joltage) + 1 :]

    return int(result_string)


if __name__ == "__main__":
    with open("input.txt", "r") as f:
        lines = [line.strip() for line in f.readlines()]
        total_output_joltage = sum(greedy_battery_selection(bank, 2) for bank in lines)
        print("Part 1:", total_output_joltage)

        total_output_joltage = sum(greedy_battery_selection(bank, 12) for bank in lines)
        print("Part 2:", total_output_joltage)
