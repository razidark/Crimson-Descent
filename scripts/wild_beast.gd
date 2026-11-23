extends CharacterBody2D

enum BeastType { CAVE_BOAR, SHADOW_WOLF, GIANT_SPIDER }
@export var beast_type: BeastType = BeastType.CAVE_BOAR

@export var max_hp: int = 40
@export var speed: float = 75.0
@export var flee_speed: float = 140.0
@export var is_hostile: bool = false

var current_hp: int = 40
var wander_dir: Vector2 = Vector2.ZERO
var wander_timer: float = 0.0
var state: String = "wander" # wander, idle, alert, flee

var loot_scene = preload("res://scenes/loot_drop.tscn")

@onready var sprite = $Sprite2D
@onready var hp_bar = $ProgressBar

func _ready() -> void:
	current_hp = max_hp
	add_to_group("beasts")
	add_to_group("enemies") # Can be targeted by player attacks
	hp_bar.max_value = max_hp
	hp_bar.value = current_hp
	hp_bar.visible = false
	pick_wander_direction()
	update_appearance()

func update_appearance() -> void:
	if not sprite:
		return
	var path = "res://assets/creature_boar.png"
	match beast_type:
		BeastType.CAVE_BOAR: path = "res://assets/creature_boar.png"
		BeastType.SHADOW_WOLF: path = "res://assets/creature_wolf.png"
		BeastType.GIANT_SPIDER: path = "res://assets/creature_spider.png"
	if ResourceLoader.exists(path):
		sprite.texture = load(path)

func _physics_process(delta: float) -> void:
	var player = null
	var players = get_tree().get_nodes_in_group("player")
	if players.size() > 0:
		player = players[0]

	wander_timer -= delta
	if wander_timer <= 0.0:
		pick_wander_direction()

	if player:
		var dist = global_position.distance_to(player.global_position)
		if dist < 120.0 and not is_hostile:
			# Flee from player when close
			state = "flee"
			wander_dir = (global_position - player.global_position).normalized()
		elif dist > 200.0 and state == "flee":
			state = "wander"
		elif is_hostile and dist < 160.0:
			# Charge player
			state = "chase"
			wander_dir = (player.global_position - global_position).normalized()
			if dist < 24.0 and player.has_method("take_damage"):
				player.take_damage(8.0 * delta)

	var cur_speed = flee_speed if state in ["flee", "chase"] else speed
	velocity = wander_dir * cur_speed

	if wander_dir.x < 0:
		sprite.flip_h = true
	elif wander_dir.x > 0:
		sprite.flip_h = false

	# Slight walking bob
	if velocity != Vector2.ZERO:
		sprite.position.y = sin(Time.get_ticks_msec() / 100.0) * 1.5

	move_and_slide()

func pick_wander_direction() -> void:
	wander_timer = randf_range(1.5, 4.0)
	if randf() < 0.4:
		wander_dir = Vector2.ZERO # Stop and graze / sniff ground
	else:
		wander_dir = Vector2.from_angle(randf_range(0, TAU))

func take_damage(amount: int) -> void:
	current_hp -= amount
	hp_bar.visible = true
	hp_bar.value = current_hp
	state = "flee" if not is_hostile else "chase"

	# Flash white
	sprite.modulate = Color(2.8, 1.5, 1.5, 1)
	var tween = create_tween()
	tween.tween_property(sprite, "modulate", Color(1, 1, 1, 1), 0.12)

	if current_hp <= 0:
		die_and_drop_loot()

func die_and_drop_loot() -> void:
	# Hunt rewards: Raw Beast Meat, Sinew, Bones
	var meat_count = randi_range(2, 3)
	for i in range(meat_count):
		var loot = loot_scene.instantiate()
		loot.item_type = "meat"
		loot.global_position = global_position + Vector2(randf_range(-12, 12), randf_range(-12, 12))
		get_parent().call_deferred("add_child", loot)

	# Chance of herb/bone
	if randf() < 0.5:
		var bonus = loot_scene.instantiate()
		bonus.item_type = "herb" if randf() < 0.5 else "ore"
		bonus.global_position = global_position + Vector2(randf_range(-12, 12), randf_range(-12, 12))
		get_parent().call_deferred("add_child", bonus)

	queue_free()
