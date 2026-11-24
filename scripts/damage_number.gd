extends Node2D

@onready var label = $Label

func _ready() -> void:
	var mat = CanvasItemMaterial.new()
	mat.light_mode = CanvasItemMaterial.LIGHT_MODE_UNSHADED
	material = mat

func setup(amount: int, is_crit: bool = false, is_bleed: bool = false, custom_text: String = "", custom_color: Color = Color.WHITE) -> void:
	if not is_node_ready():
		await ready

	if custom_text != "":
		label.text = custom_text
		label.modulate = custom_color
		scale = Vector2(1.05, 1.05)
	elif is_crit:
		label.text = "%d!" % amount
		label.modulate = Color(1.0, 0.85, 0.2, 1)
		scale = Vector2(1.35, 1.35)
	elif is_bleed:
		label.text = "%d" % amount
		label.modulate = Color(0.95, 0.2, 0.3, 1)
		scale = Vector2(0.9, 0.9)
	else:
		label.text = str(amount)
		label.modulate = custom_color

	var tween = create_tween().set_parallel(true)
	var random_x = randf_range(-16, 16)
	tween.tween_property(self, "position:y", position.y - 38.0, 0.65).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "position:x", position.x + random_x, 0.65)
	tween.tween_property(self, "modulate:a", 0.0, 0.45).set_delay(0.25)
	tween.chain().tween_callback(queue_free)
