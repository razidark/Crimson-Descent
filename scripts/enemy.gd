extends CharacterBody2D

enum EnemyType { BAT, DEMON_WARRIOR, GARGOYLE }
@export var enemy_type: EnemyType = EnemyType.DEMON_WARRIOR

@export var speed: float = 85.0
@export var max_hp: int = 50
@export var attack_damage: float = 12.0
var current_hp: int = 50
var target: Node2D = null

var blood_orb_scene = preload("res://scenes/blood_orb.tscn")

@onready var sprite = $Sprite2D
@onready var hp_bar = $ProgressBar

func _ready() -> void:
	current_hp = max_hp
	add_to_group("enemies")
	hp_bar.max_value = max_hp
	hp_bar.value = current_hp
	hp_bar.visible = false

func _physics_process(delta: float) -> void:
	# Subtle breath / idle animation
	sprite.position.y = sin(Time.get_ticks_msec() / 120.0) * 2.0

	if not target:
		var players = get_tree().get_nodes_in_group("player")
		if players.size() > 0:
			target = players[0]
		return

	var diff = target.global_position - global_position
	var dir = diff.normalized()
	velocity = dir * speed

	if dir.x < 0:
		sprite.flip_h = true
	elif dir.x > 0:
		sprite.flip_h = false

	move_and_slide()

	# Damage player on contact
	if global_position.distance_to(target.global_position) < 32.0:
		if target.has_method("take_damage"):
			target.take_damage(attack_damage * delta)

func take_damage(amount: int) -> void:
	current_hp -= amount
	hp_bar.visible = true
	hp_bar.value = current_hp

	# Red flash effect
	sprite.modulate = Color(3.5, 0.4, 0.4, 1)
	var tween = create_tween()
	tween.tween_property(sprite, "modulate", Color(1, 1, 1, 1), 0.15)

	if current_hp <= 0:
		spawn_blood_drop()
		queue_free()

func spawn_blood_drop() -> void:
	var count = 2 if enemy_type == EnemyType.DEMON_WARRIOR else 1
	for i in range(count):
		var orb = blood_orb_scene.instantiate()
		orb.global_position = global_position + Vector2(randf_range(-15, 15), randf_range(-15, 15))
		get_parent().call_deferred("add_child", orb)
