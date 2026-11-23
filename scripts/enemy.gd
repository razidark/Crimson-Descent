extends CharacterBody2D

enum EnemyType { BAT, DEMON_WARRIOR, SKELETON }
@export var enemy_type: EnemyType = EnemyType.DEMON_WARRIOR

@export var speed: float = 110.0
@export var max_hp: int = 35
@export var attack_damage: float = 12.0
var current_hp: int = 35
var target: Node2D = null

# Bleed Status Effect
var bleed_damage: int = 0
var bleed_timer: float = 0.0
var bleed_tick_timer: float = 0.0

var blood_orb_scene = preload("res://scenes/blood_orb.tscn")
var dmg_num_scene = preload("res://scenes/damage_number.tscn")

@onready var sprite = $Sprite2D
@onready var hp_bar = $ProgressBar

func _ready() -> void:
	current_hp = max_hp
	add_to_group("enemies")
	hp_bar.max_value = max_hp
	hp_bar.value = current_hp
	hp_bar.visible = false

func _physics_process(delta: float) -> void:
	sprite.position.y = sin(Time.get_ticks_msec() / 120.0) * 1.5

	# Process Bleed DoT
	if bleed_timer > 0.0:
		bleed_timer -= delta
		bleed_tick_timer -= delta
		if bleed_tick_timer <= 0.0:
			bleed_tick_timer = 0.8
			apply_bleed_tick()

	if not target:
		var players = get_tree().get_nodes_in_group("player")
		if players.size() > 0:
			target = players[0]
		return

	var diff = target.global_position - global_position
	var to_player_dir = diff.normalized()

	# Repulsion force
	var separation = Vector2.ZERO
	var nearby = get_tree().get_nodes_in_group("enemies")
	for other in nearby:
		if other != self and is_instance_valid(other):
			var dist = global_position.distance_to(other.global_position)
			if dist < 36.0 and dist > 0.1:
				var force = (36.0 - dist) / 36.0
				separation += (global_position - other.global_position).normalized() * force * 180.0

	var move_dir = (to_player_dir * speed + separation).limit_length(speed)
	velocity = move_dir

	if move_dir.x < 0:
		sprite.flip_h = true
	elif move_dir.x > 0:
		sprite.flip_h = false

	move_and_slide()

	# Damage player on contact
	if global_position.distance_to(target.global_position) < 26.0:
		if target.has_method("take_damage"):
			target.take_damage(attack_damage * delta)

func apply_bleed(dmg_per_tick: int, duration: float) -> void:
	bleed_damage = dmg_per_tick
	bleed_timer = duration
	bleed_tick_timer = 0.5

func apply_bleed_tick() -> void:
	current_hp -= bleed_damage
	hp_bar.visible = true
	hp_bar.value = current_hp
	spawn_damage_number(bleed_damage, false, true)
	
	# Blood red pulse
	sprite.modulate = Color(2.0, 0.2, 0.2, 1)
	var tween = create_tween()
	tween.tween_property(sprite, "modulate", Color(1, 1, 1, 1), 0.15)

	if current_hp <= 0:
		die()

func take_damage(amount: int) -> void:
	current_hp -= amount
	hp_bar.visible = true
	hp_bar.value = current_hp

	# Red flash effect
	sprite.modulate = Color(3.5, 0.4, 0.4, 1)
	var tween = create_tween()
	tween.tween_property(sprite, "modulate", Color(1, 1, 1, 1), 0.15)

	if current_hp <= 0:
		die()

func spawn_damage_number(amount: int, is_crit: bool, is_bleed: bool) -> void:
	var num = dmg_num_scene.instantiate()
	num.global_position = global_position + Vector2(0, -18)
	get_parent().add_child(num)
	num.setup(amount, is_crit, is_bleed)

func die() -> void:
	if target and target.has_method("add_kill"):
		target.add_kill()
	spawn_blood_drop()
	queue_free()

func spawn_blood_drop() -> void:
	var count = 2 if enemy_type == EnemyType.DEMON_WARRIOR else 1
	for i in range(count):
		var orb = blood_orb_scene.instantiate()
		orb.global_position = global_position + Vector2(randf_range(-12, 12), randf_range(-12, 12))
		get_parent().call_deferred("add_child", orb)
