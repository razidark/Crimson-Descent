extends Area2D

@export var xp_value: int = 15
var target_player: Node2D = null
var magnet_speed: float = 0.0

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	# Pulse animation
	var tween = create_tween().set_loops()
	tween.tween_property($Sprite2D, "scale", Vector2(1.2, 1.2), 0.4)
	tween.tween_property($Sprite2D, "scale", Vector2(0.9, 0.9), 0.4)

func _physics_process(delta: float) -> void:
	if not target_player:
		var players = get_tree().get_nodes_in_group("player")
		if players.size() > 0:
			var p = players[0]
			if global_position.distance_to(p.global_position) < 180.0:
				target_player = p
		return

	# Magnetize towards player
	magnet_speed += 600.0 * delta
	global_position = global_position.move_toward(target_player.global_position, magnet_speed * delta)

func _on_body_entered(body: Node2D) -> void:
	if body.is_in_group("player") and body.has_method("gain_blood"):
		body.gain_blood(xp_value)
		queue_free()