extends CharacterBody2D

@export var max_hp: int = 350
@export var speed: float = 65.0
@export var attack_damage: float = 24.0

var current_hp: int = 350
var target: Node2D = null

# Boss Attack Cycle
var attack_timer: float = 3.0
var is_charging: bool = false
var charge_dir: Vector2 = Vector2.ZERO
var charge_duration: float = 0.0

var loot_scene = preload("res://scenes/loot_drop.tscn")
var arrow_scene = preload("res://scenes/arrow.tscn")
var dmg_num_scene = preload("res://scenes/damage_number.tscn")

@onready var sprite = $Sprite2D
@onready var hp_bar = $CanvasLayer/BossUI/BossBar
@onready var boss_ui = $CanvasLayer/BossUI

func _ready() -> void:
	current_hp = max_hp
	add_to_group("boss")
	add_to_group("enemies")
	hp_bar.max_value = max_hp
	hp_bar.value = current_hp
	boss_ui.visible = true

func _physics_process(delta: float) -> void:
	if not target:
		var players = get_tree().get_nodes_in_group("player")
		if players.size() > 0:
			target = players[0]
		return

	# Handle Charge Attack
	if is_charging:
		charge_duration -= delta
		velocity = charge_dir * 220.0
		move_and_slide()
		if charge_duration <= 0.0:
			is_charging = false
		return

	# Normal Advance
	attack_timer -= delta
	if attack_timer <= 0.0:
		attack_timer = randf_range(3.5, 5.0)
		execute_special_move()

	var diff = target.global_position - global_position
	var dir = diff.normalized()
	velocity = dir * speed

	if dir.x < 0:
		sprite.flip_h = true
	elif dir.x > 0:
		sprite.flip_h = false

	# Walking stomping animation
	sprite.position.y = sin(Time.get_ticks_msec() / 150.0) * 3.0

	move_and_slide()

	# Contact Damage
	if global_position.distance_to(target.global_position) < 38.0:
		if target.has_method("take_damage"):
			target.take_damage(attack_damage * delta)

func execute_special_move() -> void:
	var move_choice = randi() % 2
	if move_choice == 0:
		# Ground Tremor / Charge
		is_charging = true
		charge_duration = 0.8
		charge_dir = (target.global_position - global_position).normalized()
		# Red alert pulse
		sprite.modulate = Color(3.0, 0.5, 0.5, 1)
		var t = create_tween()
		t.tween_property(sprite, "modulate", Color(1, 1, 1, 1), 0.3)
	else:
		# Blood Ring Spikes / Shards outward
		var shard_count = 8
		for i in range(shard_count):
			var angle = (float(i) / shard_count) * TAU
			var shard = arrow_scene.instantiate()
			shard.global_position = global_position + Vector2.from_angle(angle) * 24.0
			shard.setup(Vector2.from_angle(angle))
			shard.damage = 18
			get_parent().add_child(shard)

func take_damage(amount: int) -> void:
	current_hp -= amount
	hp_bar.value = current_hp

	# Red damage flash
	sprite.modulate = Color(3.5, 0.4, 0.4, 1)
	var tween = create_tween()
	tween.tween_property(sprite, "modulate", Color(1, 1, 1, 1), 0.12)

	if current_hp <= 0:
		defeat_boss()

func defeat_boss() -> void:
	boss_ui.visible = false
	
	# Massive loot explosion: gold, gems, blood drops, victory key
	for i in range(12):
		var loot = loot_scene.instantiate()
		loot.item_type = ["coin", "gem", "ore", "potion"].pick_random()
		loot.global_position = global_position + Vector2(randf_range(-30, 30), randf_range(-30, 30))
		get_parent().call_deferred("add_child", loot)

	# Trigger Player Victory Ascension
	if target and target.has_method("trigger_victory"):
		target.trigger_victory()

	queue_free()
