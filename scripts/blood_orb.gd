extends Node2D

@export var xp_value: int = 8
@export var heal_amount: float = 2.0

var target_player: Node2D = null
var magnet_range: float = 135.0
var pickup_range: float = 20.0
var speed: float = 340.0

@onready var sprite = $Sprite2D

func _ready() -> void:
	var mat = CanvasItemMaterial.new()
	mat.light_mode = CanvasItemMaterial.LIGHT_MODE_UNSHADED
	sprite.material = mat
	sprite.texture = load("res://assets/gothic/vfx_blood_orb.png")
	var tween = create_tween()
	var jump_offset = Vector2(randf_range(-18, 18), randf_range(-18, 18))
	tween.tween_property(self, "position", position + jump_offset, 0.2).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)

func _physics_process(delta: float) -> void:
	sprite.position.y = sin(Time.get_ticks_msec() / 160.0 + position.x) * 2.0
	if not target_player:
		var players = get_tree().get_nodes_in_group("player")
		if players.size() > 0:
			var p = players[0]
			if global_position.distance_to(p.global_position) < magnet_range:
				target_player = p
		return

	var dist = global_position.distance_to(target_player.global_position)
	global_position = global_position.move_toward(target_player.global_position, speed * delta)
	speed += 220.0 * delta

	if dist < pickup_range:
		if target_player.has_method("gain_xp_and_blood"):
			target_player.gain_xp_and_blood(xp_value, heal_amount)
		queue_free()
