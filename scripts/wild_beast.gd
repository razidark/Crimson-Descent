extends CharacterBody2D

enum BeastType { CAVE_RAT, GIANT_SPIDER, CRYPT_GOBLIN }
@export var beast_type: BeastType = BeastType.CAVE_RAT

@export var max_hp: int = 35
@export var speed: float = 80.0
@export var flee_speed: float = 145.0
@export var is_hostile: bool = false

var current_hp: int = 35
var wander_dir: Vector2 = Vector2.ZERO
var wander_timer: float = 0.0
var state: String = "wander"
var knockback_vel: Vector2 = Vector2.ZERO

var loot_scene = preload("res://scenes/loot_drop.tscn")
@onready var sprite = $Sprite2D
@onready var hp_bar = $ProgressBar

func _ready() -> void:
	current_hp = max_hp
	add_to_group("beasts")
	add_to_group("enemies")
	hp_bar.max_value = max_hp
	hp_bar.value = current_hp
	hp_bar.visible = false
	pick_wander_direction()
	update_appearance()

func update_appearance() -> void:
	if not sprite:
		return
	var path = "res://assets/gothic/beast_rat_brown.png"
	match beast_type:
		BeastType.CAVE_RAT: path = "res://assets/gothic/beast_rat_brown.png"
		BeastType.GIANT_SPIDER: path = "res://assets/gothic/beast_spider.png"
		BeastType.CRYPT_GOBLIN: path = "res://assets/gothic/enemy_goblin_0.png"
	if ResourceLoader.exists(path):
		sprite.texture = load(path)

func _physics_process(delta: float) -> void:
	if knockback_vel.length() > 8.0:
		velocity = knockback_vel
		knockback_vel = knockback_vel.lerp(Vector2.ZERO, 10.0 * delta)
		move_and_slide()
		return

	var player = null
	var players = get_tree().get_nodes_in_group("player")
	if players.size() > 0:
		player = players[0]

	wander_timer -= delta
	if wander_timer <= 0.0:
		pick_wander_direction()

	if player:
		var dist = global_position.distance_to(player.global_position)
		if dist < 130.0 and not is_hostile:
			state = "flee"
			wander_dir = (global_position - player.global_position).normalized()
		elif dist > 220.0 and state == "flee":
			state = "wander"
		elif is_hostile and dist < 190.0:
			state = "chase"
			wander_dir = (player.global_position - global_position).normalized()
			if dist < 26.0 and player.has_method("take_damage"):
				player.take_damage(9.0 * delta)

	var cur_speed = flee_speed if state in ["flee", "chase"] else speed
	velocity = wander_dir * cur_speed

	if wander_dir.x < 0: sprite.flip_h = true
	elif wander_dir.x > 0: sprite.flip_h = false

	if velocity != Vector2.ZERO:
		sprite.position.y = sin(Time.get_ticks_msec() / 100.0) * 1.5

	move_and_slide()

func pick_wander_direction() -> void:
	wander_timer = randf_range(1.5, 4.0)
	wander_dir = Vector2.ZERO if randf() < 0.4 else Vector2.from_angle(randf_range(0, TAU))

func apply_knockback(force: Vector2) -> void:
	knockback_vel = force

func take_damage(amount: int) -> void:
	current_hp -= amount
	hp_bar.visible = true
	hp_bar.value = current_hp
	state = "flee" if not is_hostile else "chase"

	sprite.modulate = Color(2.8, 1.2, 1.2, 1)
	var tween = create_tween()
	tween.tween_property(sprite, "modulate", Color.WHITE, 0.12)

	if current_hp <= 0:
		die_and_drop_loot()

func die_and_drop_loot() -> void:
	GameState.kills += 1
	GameState.stats_changed.emit()
	for i in range(randi_range(1, 2)):
		var loot = loot_scene.instantiate()
		loot.item_type = "meat"
		loot.global_position = global_position + Vector2(randf_range(-10, 10), randf_range(-10, 10))
		get_parent().call_deferred("add_child", loot)
	if randf() < 0.65:
		var bonus = loot_scene.instantiate()
		bonus.item_type = ["herb", "bones", "gold"].pick_random()
		bonus.amount = randi_range(2, 5) if bonus.item_type == "gold" else 1
		bonus.global_position = global_position + Vector2(randf_range(-10, 10), randf_range(-10, 10))
		get_parent().call_deferred("add_child", bonus)
	queue_free()
