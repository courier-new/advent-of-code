from main import apply_rotation


def test_apply_rotation():
    assert apply_rotation(("R", 8), 11) == (19, 0)
    assert apply_rotation(("L", 19), 19) == (0, 1)
    assert apply_rotation(("L", 1), 0) == (99, 0)
    assert apply_rotation(("L", 2), 1) == (99, 1)
    assert apply_rotation(("R", 1), 99) == (0, 1)
    assert apply_rotation(("L", 10), 50) == (40, 0)
    assert apply_rotation(("R", 10), 50) == (60, 0)
    assert apply_rotation(("L", 10), 1) == (91, 1)
    assert apply_rotation(("R", 10), 91) == (1, 1)
    assert apply_rotation(("R", 1000), 50) == (50, 10)
    assert apply_rotation(("L", 1000), 5) == (5, 10)
    assert apply_rotation(("L", 1000), 95) == (95, 10)
    assert apply_rotation(("R", 1000), 5) == (5, 10)
    assert apply_rotation(("R", 1000), 95) == (95, 10)
