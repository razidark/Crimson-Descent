extends Camera2D

var trauma: float = 0.0
var trauma_power: float = 2.0
var decay: float = 0.8
var max_offset: Vector2 = Vector2(10, 10)
var max_roll: float = 0.06

func _ready() -> void:
	add_to_group("camera")

func add_trauma(amount: float) -> void:
	trauma = min(trauma + amount, 1.0)

func _process(delta: float) -> void:
	if trauma > 0.0:
		trauma = max(trauma - decay * delta, 0.0)
		shake()
	else:
		offset = Vector2.ZERO
		rotation = 0.0

func shake() -> void:
	var amt = pow(trauma, trauma_power)
	rotation = max_roll * amt * randf_range(-1.0, 1.0)
	offset.x = max_offset.x * amt * randf_range(-1.0, 1.0)
	offset.y = max_offset.y * amt * randf_range(-1.0, 1.0)
