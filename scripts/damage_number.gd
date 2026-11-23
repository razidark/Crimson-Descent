extends Node2D

@onready var label = $Label

func setup(amount: int, is_crit: bool = false, is_bleed: bool = false) -> void:
	if not is_node_ready():
		await ready

	label.text = str(amount)
	if is_crit:
		label.text = "%d CRIT!" % amount
		label.modulate = Color(1.0, 0.85, 0.2, 1)
		scale = Vector2(1.3, 1.3)
	elif is_bleed:
		label.text = "%d" % amount
		label.modulate = Color(0.9, 0.15, 0.2, 1)
	else:
		label.modulate = Color(1, 1, 1, 1)

	# Bouncing floating tween
	var tween = create_tween().set_parallel(true)
	var random_x = randf_range(-18, 18)
	tween.tween_property(self, "position:y", position.y - 36.0, 0.55).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "position:x", position.x + random_x, 0.55)
	tween.tween_property(self, "modulate:a", 0.0, 0.55).set_delay(0.2)
	tween.chain().tween_callback(queue_free)
