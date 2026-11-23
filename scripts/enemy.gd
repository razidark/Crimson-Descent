extends CharacterBody2D

@export var speed: float = 90.0
@export var max_hp: int = 40
var current_hp: int = 40

var target: Node2D = null

func _ready() -> void:
	current_hp = max_hp
	add_to_group("enemies")

func _physics_process(_delta: float) -> void:
	if not target:
		var players = get_tree().get_nodes_in_group("player")
		if players.size() > 0:
			target = players[0]
		return

	var dir = (target.global_position - global_position).normalized()
	velocity = dir * speed
	move_and_slide()

func take_damage(amount: int) -> void:
	current_hp -= amount
	# Flash red effect
	$Sprite2D.modulate = Color(2, 0.2, 0.2, 1)
	var tween = create_tween()
	tween.tween_property($Sprite2D, "modulate", Color(1, 1, 1, 1), 0.15)
	
	if current_hp <= 0:
		queue_free()
