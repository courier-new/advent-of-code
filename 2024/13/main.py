from typing import TextIO, TypedDict
import re
from functools import cache
import numpy as np


class MachineConfig(TypedDict):
    button_a: tuple[int, int]
    button_b: tuple[int, int]
    prize: tuple[int, int]


BUTTON_REGEX = re.compile(r"Button [AB]: X\+(\d+), Y\+(\d+)")
PRIZE_REGEX = re.compile(r"Prize: X=(\d+), Y=(\d+)")


def parse_file(file: TextIO) -> list[MachineConfig]:
    machines = []
    # Continue until the end of the file.
    while True:
        line = file.readline()
        if not line:
            break
        a_match = BUTTON_REGEX.match(line)
        b_match = BUTTON_REGEX.match(file.readline())
        prize_match = PRIZE_REGEX.match(file.readline())

        if not a_match or not b_match or not prize_match:
            raise ValueError("Invalid input file")

        button_a = tuple(map(int, a_match.groups()))
        button_b = tuple(map(int, b_match.groups()))
        prize_x, prize_y = map(int, prize_match.groups())
        # Each machine configuration is followed by an empty line.
        file.readline()

        machines.append(
            {"button_a": button_a, "button_b": button_b, "prize": (prize_x, prize_y)}
        )

    return machines


def find_cheapest_way_to_win(machine: MachineConfig) -> tuple[int, int, int] | None:
    """
    Given a machine configuration, determines the cheapest way to win the prize,
    or returns None if it is impossible to win. The function will recursively
    check possible combinations of button presses to reach the prize, returning
    a tuple of (a button presses, b button presses, total cost) with the minimal
    cost, if a solution is found.
    NOTE: This implementation assumes there is a single, unique solution. It
    wouldn't be possible to solve the challenge if there were multiple solutions.
    """
    min_so_far = float("inf")

    @cache
    def find_way(
        x: int, y: int, presses: tuple[int, int], cost: int
    ) -> tuple[int, int, int] | None:
        """
        Recursive helper function that finds the cheapest way to reach the prize
        by testing both branches (pressing button A and button B) and returning
        the cheaper option of the two.
        """
        nonlocal min_so_far
        if cost >= min_so_far:
            return None

        a_presses, b_presses = presses

        # If we've reached the prize, return the cost.
        if (x, y) == machine["prize"]:
            min_so_far = min(min_so_far, cost)
            return a_presses, b_presses, cost

        prize_x, prize_y = machine["prize"]

        # If we've exceeded the prize's coordinates, return None.
        if x > prize_x or y > prize_y:
            return None

        a_dx, a_dy = machine["button_a"]
        b_dx, b_dy = machine["button_b"]

        # Try pressing button A and button B, and pick the cheapest option.
        # Pressing button A costs 3, and pressing button B costs 1.
        a_cost = find_way(x + a_dx, y + a_dy, (a_presses + 1, b_presses), cost + 3)
        b_cost = find_way(x + b_dx, y + b_dy, (a_presses, b_presses + 1), cost + 1)

        # If it's not possible to reach the prize by pressing either button,
        # return None.
        if a_cost is None and b_cost is None:
            return None

        # If it's possible to reach the prize by pressing one button, but not
        # the other, return the cost of the button that reaches the prize.
        if a_cost is None:
            return b_cost
        if b_cost is None:
            return a_cost

        # Otherwise, return the cheapest option of the two.
        return min(a_cost, b_cost, key=lambda result: result[2])

    return find_way(0, 0, (0, 0), 0)


# Part 2
def solve_linear_system(machine: MachineConfig) -> tuple[int, int, int] | None:
    """
    Given a machine configuration, solves the system of equations to find the
    cheapest way to win the prize, or returns None if it is impossible to win.
    It turns out that for every machine, there is a unique solution to the
    system of equations, which can be solved using linear algebra. So this is
    not so much a minimization problem as it is a "find the single solution"
    one.
    """
    a_dx, a_dy = machine["button_a"]
    b_dx, b_dy = machine["button_b"]
    prize = np.array(machine["prize"]) + 10000000000000
    buttons = np.array([[a_dx, b_dx], [a_dy, b_dy]])

    try:
        # Solve the system of equations
        solution = np.linalg.solve(buttons, prize)
    except np.linalg.LinAlgError:
        return None

    # Floating point numbers are hard to work with at this scale, so we round
    # them to the nearest integer and check if we were "close enough" that this
    # is a valid solution. We also check that the solution is non-negative,
    # though it turns out that this is always the case for the given inputs.
    if (
        all(np.isclose(solution - np.round(solution), 0, atol=0.001))
        and (solution >= 0).all()
    ):
        a_presses, b_presses = solution

        cost = a_presses * 3 + b_presses * 1
        # We should be able to cast our cost to an integer, but due to floating
        # point precision errors, we might end up with a number like 199.9
        # instead of 200. So we round it to the nearest integer instead.
        return a_presses, b_presses, round(cost)


with open("./test.txt", "r") as file:
    machines = parse_file(file)
    assert len(machines) == 4, f"Expected 4 machines, but got {len(machines)}"

    # Test the first machine.
    machine = machines[0]
    result = find_cheapest_way_to_win(machine)
    assert result is not None, "Expected a solution to first machine, but got None"
    a_presses, b_presses, cost = result
    assert a_presses == 80, f"Expected 80 A presses, but got {a_presses}"
    assert b_presses == 40, f"Expected 40 B presses, but got {b_presses}"
    assert cost == 280, f"Expected cost of 280, but got {cost}"

    # Test the second and fourth machines.
    for machine in [machines[1], machines[3]]:
        result = find_cheapest_way_to_win(machine)
        assert result is None, "Expected no solution, but got one"

    # Test the third machine.
    machine = machines[2]
    result = find_cheapest_way_to_win(machine)
    assert result is not None, "Expected a solution to third machine, but got None"
    a_presses, b_presses, cost = result
    assert a_presses == 38, f"Expected 38 A presses, but got {a_presses}"
    assert b_presses == 86, f"Expected 86 B presses, but got {b_presses}"
    assert cost == 200, f"Expected cost of 200, but got {cost}"

    # Part 2
    print(machines)

    # Test the first and third machines.
    for machine in [machines[0], machines[2]]:
        result = solve_linear_system(machine)
        assert result is None, "Expected no solution, but got one"

    # Test the second and fourth machines.
    for machine in [machines[1], machines[3]]:
        result = solve_linear_system(machine)
        assert result is not None, "Expected a solution, but got None"
        print("Cost:", result[2])

print("All tests passed.")

with open("./input.txt", "r") as file:
    machines = parse_file(file)
    total_cost = 0
    for machine in machines:
        result = find_cheapest_way_to_win(machine)
        if result is None:
            continue
        _, _, cost = result
        total_cost += cost

    print("Part 1:", total_cost)

    # Part 2
    total_cost = 0
    for machine in machines:
        result = solve_linear_system(machine)
        if result is None:
            continue
        _, _, cost = result
        total_cost += cost

    print("Part 2:", total_cost)
