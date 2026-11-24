extends CharacterBody2D

enum EnemyType { BAT, SKELETON, ZOMBIE, GHOST }
@export var enemy_type: EnemyType = EnemyType.SKELETON

@export var speed: float = 105.0
@export var max_hp: int = 45
@export var attack_damage: float = 14.0
@export var xp_drop: int = 14

var current_hp: int = 45
var target: Node2D = null
var aggro_range: float = 310.0
var is_alerted: bool = false

var knockback_vel: Vector2 = Vector2.ZERO
var chill_timer: float = 0.0
var bleed_damage: int = 0
var bleed_timer: float = 0.0
var bleed_tick_timer: float = 0.0

var anim_timer: float = 0.0
var anim_frame: int = 0
var tex_0: Texture2D
var tex_1: Texture2D

var blood_orb_scene = preload("res://scenes/blood_orb.tscn")
var loot_scene = preload("res://scenes/loot_drop.tscn")
var dmg_num_scene = preload("res://scenes/damage_number.tscn")

@onready var sprite = $Sprite2D
@onready var hp_bar = $ProgressBar

func _ready() -> void:
	add_to_group("enemies")
	configure_stats()
	current_hp = max_hp
	hp_bar.max_value = max_hp
	hp_bar.value = current_hp
	hp_bar.visible = false

func configure_stats() -> void:
	var fl_mult = 1.0 + (GameState.current_floor - 1) * 0.35
	match enemy_type:
		EnemyType.BAT:
			speed = 145.0; max_hp = int(30 * fl_mult); attack_damage = 10.0 * fl_mult; xp_drop = 10
			tex_0 = load("res://assets/gothic/enemy_bat_0.png")
			tex_1 = load("res://assets/gothic/enemy_bat_1.png")
		EnemyType.SKELETON:
			speed = 105.0; max_hp = int(55 * fl_mult); attack_damage = 16.0 * fl_mult; xp_drop = 16
			tex_0 = load("res://assets/gothic/enemy_skeleton_0.png")
			tex_1 = load("res://assets/gothic/enemy_skeleton_1.png")
		EnemyType.ZOMBIE:
			speed = 80.0; max_hp = int(75 * fl_mult); attack_damage = 20.0 * fl_mult; xp_drop = 18
			tex_0 = load("res://assets/gothic/enemy_zombie_0.png")
			tex_1 = load("res://assets/gothic/enemy_zombie_1.png")
		EnemyType.GHOST:
			speed = 120.0; max_hp = int(45 * fl_mult); attack_damage = 15.0 * fl_mult; xp_drop = 20
			tex_0 = load("res://assets/gothic/enemy_ghost_0.png")
			tex_1 = load("res://assets/gothic/enemy_ghost_1.png")
	if sprite and tex_0:
		sprite.texture = tex_0

func _physics_process(delta: float) -> void:
	# 2-frame animation
	anim_timer += delta
	if anim_timer >= 0.25:
		anim_timer = 0.0
		anim_frame = 1 - anim_frame
		if sprite and tex_0 and tex_1:
			sprite.texture = tex_1 if anim_frame == 1 else tex_0

	if chill_timer > 0.0:
		chill_timer -= delta
		if chill_timer <= 0.0 and sprite:
			sprite.modulate = Color.WHITE

	if bleed_timer > 0.0:
		bleed_timer -= delta
		bleed_tick_timer -= delta
		if bleed_tick_timer <= 0.0:
			bleed_tick_timer = 0.75
			apply_bleed_tick()

	if knockback_vel.length() > 8.0:
		velocity = knockback_vel
		knockback_vel = knockback_vel.lerp(Vector2.ZERO, 10.0 * delta)
		move_and_slide()
		return

	if not target:
		var players = get_tree().get_nodes_in_group("player")
		if players.size() > 0:
			target = players[0]
		return

	var dist_to_player = global_position.distance_to(target.global_position)
	if not is_alerted:
		if dist_to_player < aggro_range:
			is_alerted = true
		else:
			return

	var to_player_dir = (target.global_position - global_position).normalized()
	var separation = Vector2.ZERO
	for other in get_tree().get_nodes_in_group("enemies"):
		if other != self and is_instance_valid(other):
			var dist = global_position.distance_to(other.global_position)
			if dist < 40.0 and dist > 0.1:
				var force = (40.0 - dist) / 40.0
				separation += (global_position - other.global_position).normalized() * force * 160.0

	var cur_speed = speed * (0.5 if chill_timer > 0.0 else 1.0)
	var move_dir = (to_player_dir * cur_speed + separation).limit_length(cur_speed)
	velocity = move_dir

	if move_dir.x < 0: sprite.flip_h = true
	elif move_dir.x > 0: sprite.flip_h = false

	move_and_slide()

	if dist_to_player < 28.0 and target.has_method("take_damage"):
		target.take_damage(attack_damage * delta)

func apply_knockback(force: Vector2) -> void:
	knockback_vel = force

func apply_chill(duration: float) -> void:
	chill_timer = duration
	if sprite:
		sprite.modulate = Color(0.55, 0.85, 1.35, 1.0)

func apply_bleed(dmg_per_tick: int, duration: float) -> void:
	bleed_damage = dmg_per_tick
	bleed_timer = duration
	bleed_tick_timer = 0.4

func apply_bleed_tick() -> void:
	current_hp -= bleed_damage
	hp_bar.visible = true
	hp_bar.value = current_hp
	var num = dmg_num_scene.instantiate()
	num.global_position = global_position + Vector2(0, -18)
	get_parent().add_child(num)
	num.setup(bleed_damage, false, true)
	if current_hp <= 0:
		die()

func take_damage(amount: int) -> void:
	is_alerted = true
	current_hp -= amount
	hp_bar.visible = true
	hp_bar.value = current_hp

	sprite.modulate = Color(3.0, 0.45, 0.45, 1)
	var tween = create_tween()
	var restore_col = Color(0.55, 0.85, 1.35, 1.0) if chill_timer > 0.0 else Color.WHITE
	tween.tween_property(sprite, "modulate", restore_col, 0.14)

	if current_hp <= 0:
		die()

func die() -> void:
	GameState.kills += 1
	GameState.stats_changed.emit()

	var orb = blood_orb_scene.instantiate()
	orb.xp_value = xp_drop
	orb.global_position = global_position
	get_parent().call_deferred("add_child", orb)

	if randf() < 0.55:
		var gold = loot_scene.instantiate()
		gold.item_type = "gold" if randf() < 0.7 else "bones"
		gold.amount = randi_range(2, 6) if gold.item_type == "gold" else 1
		gold.global_position = global_position + Vector2(randf_range(-10, 10), randf_range(-10, 10))
		get_parent().call_deferred("add_child", gold)

	if randf() < 0.14:
		var rel = loot_scene.instantiate()
		rel.item_type = "relic"
		rel.relic_data = GameState.roll_relic(GameState.current_floor)
		rel.global_position = global_position
		get_parent().call_deferred("add_child", rel)

	queue_free()
