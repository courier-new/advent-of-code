from functools import cache
import pulp

type LightState = str
type Button = tuple[int, ...]
type JoltageConfiguration = tuple[int, ...]
type MachineConfiguration = tuple[LightState, list[Button], JoltageConfiguration]


@cache
def press_button_for_lights(light_state: LightState, button: Button) -> LightState:
    new_light_state = [char for char in light_state]
    for light_index in button:
        # Toggle the light state at that button index.
        new_light_state[light_index] = (
            "." if new_light_state[light_index] == "#" else "#"
        )
    return "".join(new_light_state)


def find_minimum_presses_for_lights(
    machine_configuration: MachineConfiguration,
) -> int | float:
    target_light_state, buttons, _ = machine_configuration
    # Initially, all indicator lights are off.
    initial_light_state = "." * len(target_light_state)

    # Cache values once we've computed them.
    min_presses_cache: dict[LightState, int | float] = {}

    def find_minimum_presses_helper(
        light_state: LightState, encountered_states: set[LightState] = set()
    ) -> int | float:
        # Detect a cycle: if we've seen this state before, we're in an infinite
        # loop and this sequence of button presses will never converge on the
        # target state.
        if light_state in encountered_states:
            return float("inf")

        if light_state in min_presses_cache:
            return min_presses_cache[light_state]

        if light_state == target_light_state:
            return 0

        encountered_states.add(light_state)

        min_presses = float("inf")
        for button in buttons:
            new_light_state = press_button_for_lights(light_state, button)
            presses = find_minimum_presses_helper(new_light_state, encountered_states)
            # Add one to the number of presses to account for the current button press.
            min_presses = min(min_presses, presses + 1)

        # Backtrack: remove the current state from the set of encountered states
        # once we've explored all possible button presses from it.
        encountered_states.remove(light_state)

        # Cache the result before returning it.
        min_presses_cache[light_state] = min_presses

        return min_presses

    return find_minimum_presses_helper(initial_light_state)


def find_minimum_presses_for_joltage(
    machine_configuration: MachineConfiguration,
) -> int | float:
    """
    Given a machine configuration, finds the minimum number of button presses
    required to configure the joltage level counters to match the specified
    joltage requirements.

    The key insight here is that button order doesn't matter, only number of
    button presses. So instead of needing to explore all combinations of button
    presses in various sequences, we can solve a system of equations for a few
    integer value unknowns instead.

    The problem maps very cleanly to a linear system of equations, so as long as
    we know that there _is_ a solution to each machine's configuration.

    PuLP is a library for linear programming that I decided to try out instead
    of using numpy (which I used in years past, like in 2024's Day 13). We can
    model the problem with a variable to solve for (a vector representing the
    number of times to press each button), constraints (that the sum of the
    presses of buttons affecting a given counter must equal the target joltage
    for that counter), and an objective function (to minimize the total number
    of button presses).
    """

    _, buttons, target_joltage = machine_configuration

    # Create problem: minimize the total number of button presses.
    prob = pulp.LpProblem("JoltageMinimization", pulp.LpMinimize)

    # Create variables: presses[0], presses[1], presses[2], ... where presses[i] = number of times to
    # press button i
    presses = [
        pulp.LpVariable(f"presses_{button_index}", lowBound=0, cat="Integer")
        for button_index in range(len(buttons))
    ]

    # Create the expression that we want to try to minimize: the total number of
    # button presses (= presses[0] + presses[1] + presses[2] + ...).
    prob += pulp.lpSum(presses)

    # Constraints: for each joltage level j, add a constraint that the sum of presses of buttons affecting j must equal target_joltage[j]
    for joltage_index, target_value in enumerate(target_joltage):
        # Identify all the buttons that affect the given joltage level.
        affecting_buttons = [
            presses[button_idx]
            for button_idx, button in enumerate(buttons)
            if joltage_index in button
        ]
        # This expression represents how many times the buttons that affect the given joltage level are pressed.
        sum_of_affecting_buttons = pulp.lpSum(affecting_buttons)
        # Add a constraint that this sum must equal the target joltage for the
        # given joltage level to be a valid solution.
        prob += sum_of_affecting_buttons == target_value

    # Solve with "branch and cut" solver, suppressing output logs.
    prob.solve(pulp.PULP_CBC_CMD(msg=False))

    if prob.status == pulp.LpStatusOptimal:
        objective_value = pulp.value(prob.objective)
        if isinstance(objective_value, float):
            return int(objective_value)

    return float("inf")


with open("input.txt", "r") as file:
    machine_configurations: list[MachineConfiguration] = []
    for line in file:
        components = line.strip().split(" ")

        light_state = components[0].strip("[").strip("]")

        joltage_requirements_str = components[-1].strip("{").strip("}")
        joltage_requirements = tuple(
            int(joltage) for joltage in joltage_requirements_str.split(",")
        )

        buttons_strs = components[1:-1]
        buttons = [
            tuple(int(button) for button in button_str.strip("(").strip(")").split(","))
            for button_str in buttons_strs
        ]
        # Sort buttons by the number of counters they affect, in descending
        # order. This is a heuristic to try to prioritize buttons that affect
        # more joltage counters first.
        buttons = sorted(buttons, key=lambda button: len(button), reverse=True)

        machine_configurations.append((light_state, buttons, joltage_requirements))

    print(
        "Part 1:",
        sum(
            find_minimum_presses_for_lights(machine_configuration)
            for machine_configuration in machine_configurations
        ),
    )

    print(
        "Part 2:",
        sum(
            find_minimum_presses_for_joltage(machine_configuration)
            for machine_configuration in machine_configurations
        ),
    )
