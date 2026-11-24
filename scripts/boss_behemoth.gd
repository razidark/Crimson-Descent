extends CharacterBody2D

@export var max_hp: int = 380
@export var speed: float = 82.0
@export var attack_damage: float = 24.0

var current_hp: int = 380
var target: Node2D = null
var attack_timer: float = 2.8
var is_charging: bool = false
var charge_dir: Vector2 = Vector2.ZERO
var charge_duration: float = 0.0
var bleed_timer: float = 0.0
var bleed_damage: int = 0
var bleed_tick: float = 0.0
var anim_t: float = 0.0
var anim_f: int = 0

var loot_scene = preload("res://scenes/loot_drop.tscn")
var arrow_scene = preload("res://scenes/arrow.tscn")
var portal_scene = preload("res://scenes/descent_portal.tscn")

@onready var sprite = $Sprite2D
@onready var hp_bar = $CanvasLayer/BossUI/BossBar
@onready var boss_name_label = $CanvasLayer/BossUI/Label
@onready var boss_ui = $CanvasLayer/BossUI

func _ready() -> void:
	add_to_group("boss")
	add_to_group("enemies")
	max_hp = 360 + (GameState.current_floor - 1) * 220
	current_hp = max_hp
	hp_bar.max_value = max_hp
	hp_bar.value = current_hp
	boss_ui.visible = false
	if boss_name_label:
		match GameState.current_floor:
			1: boss_name_label.text = "BARON MARROW — KEEPER OF THE CRYPT"
			2: boss_name_label.text = "VESPERA — MATRIARCH OF THE ARCHIVES"
			_: boss_name_label.text = "LORD KAIN'S SHADE (CIRCLE %d)" % GameState.current_floor

func _physics_process(delta: float) -> void:
	anim_t += delta
	if anim_t >= 0.35:
		anim_t = 0.0
		anim_f = 1 - anim_f
		sprite.texture = load("res://assets/gothic/enemy_reaper_%d.png" % anim_f)

	if bleed_timer > 0.0:
		bleed_timer -= delta
		bleed_tick -= delta
		if bleed_tick <= 0.0:
			bleed_tick = 0.8
			take_damage(bleed_damage)

	if not target:
		var players = get_tree().get_nodes_in_group("player")
		if players.size() > 0:
			target = players[0]
		return

	var dist = global_position.distance_to(target.global_position)
	if dist < 520.0:
		if not boss_ui.visible:
			boss_ui.visible = true
	else:
		if boss_ui.visible:
			boss_ui.visible = false
		return

	if is_charging:
		charge_duration -= delta
		velocity = charge_dir * 235.0
		move_and_slide()
		if charge_duration <= 0.0:
			is_charging = false
		return

	attack_timer -= delta
	if attack_timer <= 0.0:
		attack_timer = randf_range(3.0, 4.2)
		execute_special_move()

	var dir = (target.global_position - global_position).normalized()
	velocity = dir * speed
	if dir.x < 0: sprite.flip_h = true
	elif dir.x > 0: sprite.flip_h = false

	move_and_slide()

	if dist < 40.0 and target.has_method("take_damage"):
		target.take_damage(attack_damage * delta)

func execute_special_move() -> void:
	if randi() % 2 == 0:
		is_charging = true
		charge_duration = 0.75
		charge_dir = (target.global_position - global_position).normalized()
		sprite.modulate = Color(2.5, 0.4, 0.4, 1)
		var t = create_tween()
		t.tween_property(sprite, "modulate", Color.WHITE, 0.3)
	else:
		var shard_count = 8 + min(6, GameState.current_floor * 2)
		for i in range(shard_count):
			var angle = (float(i) / shard_count) * TAU
			var shard = arrow_scene.instantiate()
			shard.global_position = global_position + Vector2.from_angle(angle) * 28.0
			shard.setup(Vector2.from_angle(angle))
			shard.damage = 16 + GameState.current_floor * 4
			get_parent().add_child(shard)

func apply_bleed(dmg: int, dur: float) -> void:
	bleed_damage = dmg
	bleed_timer = dur
	bleed_tick = 0.5

func take_damage(amount: int) -> void:
	current_hp -= amount
	hp_bar.value = current_hp
	sprite.modulate = Color(3.0, 0.4, 0.4, 1)
	var tween = create_tween()
	tween.tween_property(sprite, "modulate", Color.WHITE, 0.12)
	if current_hp <= 0:
		defeat_boss()

func defeat_boss() -> void:
	boss_ui.visible = false
	GameState.kills += 1
	GameState.stats_changed.emit()

	# Massive loot explosion + Mythic Relic
	for i in range(8):
		var loot = loot_scene.instantiate()
		loot.item_type = ["gold", "gems", "ore", "potions"].pick_random()
		loot.amount = randi_range(8, 18) if loot.item_type == "gold" else 1
		loot.global_position = global_position + Vector2(randf_range(-32, 32), randf_range(-32, 32))
		get_parent().call_deferred("add_child", loot)

	var rel = loot_scene.instantiate()
	rel.item_type = "relic"
	rel.relic_data = GameState.roll_relic(GameState.current_floor, "Mythic")
	rel.global_position = global_position
	get_parent().call_deferred("add_child", rel)

	# Spawn Descent Portal to next Biome Floor!
	var portal = portal_scene.instantiate()
	portal.global_position = global_position + Vector2(0, -48)
	get_parent().call_deferred("add_child", portal)

	queue_free()
