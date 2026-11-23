extends CharacterBody2D

@export var speed: float = 240.0
@export var dash_speed: float = 750.0
@export var dash_duration: float = 0.22

var max_hp: float = 100.0
var current_hp: float = 100.0
var blood_essence: int = 0
var kills: int = 0
var level: int = 1
var next_level_threshold: int = 5

var attack_power: int = 25
var attack_scale: float = 1.0

var is_dashing: bool = false
var dash_timer: float = 0.0
var dash_dir: Vector2 = Vector2.ZERO
var attack_cooldown: float = 0.0

var slash_scene = preload("res://scenes/slash_arc.tscn")

@onready var sprite = $Sprite2D
@onready var light = $PointLight2D
@onready var hp_bar = $CanvasLayer/HUD/HealthBar
@onready var blood_label = $CanvasLayer/HUD/BloodLabel
@onready var level_label = $CanvasLayer/HUD/LevelLabel
@onready var kills_label = $CanvasLayer/HUD/KillsLabel
@onready var upgrade_panel = $CanvasLayer/HUD/UpgradePanel
@onready var pause_menu = $CanvasLayer/PauseMenu
@onready var game_over_screen = $CanvasLayer/GameOverScreen

func _ready() -> void:
	add_to_group("player")
	update_hud()
	
	if upgrade_panel:
		var btn_blade = upgrade_panel.get_node_or_null("VBox/BtnBlade")
		var btn_swift = upgrade_panel.get_node_or_null("VBox/BtnSwift")
		var btn_leech = upgrade_panel.get_node_or_null("VBox/BtnLeech")
		if btn_blade:
			btn_blade.pressed.connect(func(): choose_upgrade("blade"))
		if btn_swift:
			btn_swift.pressed.connect(func(): choose_upgrade("swift"))
		if btn_leech:
			btn_leech.pressed.connect(func(): choose_upgrade("leech"))

	if pause_menu:
		pause_menu.get_node("VBox/ResumeBtn").pressed.connect(toggle_pause)
		pause_menu.get_node("VBox/RestartBtn").pressed.connect(restart_game)
		pause_menu.get_node("VBox/QuitBtn").pressed.connect(go_to_main_menu)

	if game_over_screen:
		game_over_screen.get_node("VBox/RetryBtn").pressed.connect(restart_game)
		game_over_screen.get_node("VBox/MenuBtn").pressed.connect(go_to_main_menu)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		if not game_over_screen.visible and not upgrade_panel.visible:
			toggle_pause()
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		attack_melee()

func toggle_pause() -> void:
	var is_paused = not get_tree().paused
	get_tree().paused = is_paused
	pause_menu.visible = is_paused

func restart_game() -> void:
	get_tree().paused = false
	Engine.time_scale = 1.0
	get_tree().reload_current_scene()

func go_to_main_menu() -> void:
	get_tree().paused = false
	Engine.time_scale = 1.0
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

func _physics_process(dt: float) -> void:
	light.energy = 1.0 + sin(Time.get_ticks_msec() / 250.0) * 0.1
	if attack_cooldown > 0.0:
		attack_cooldown -= dt

	if is_dashing:
		dash_timer -= dt
		velocity = dash_dir * dash_speed
		move_and_slide()
		if dash_timer <= 0.0:
			is_dashing = false
		return

	var input_vec = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	if input_vec != Vector2.ZERO:
		velocity = input_vec.normalized() * speed
		if input_vec.x < 0:
			sprite.flip_h = true
		elif input_vec.x > 0:
			sprite.flip_h = false
	else:
		velocity = Vector2.ZERO

	if Input.is_action_just_pressed("ui_accept") and not is_dashing:
		var dir = input_vec if input_vec != Vector2.ZERO else (Vector2.LEFT if sprite.flip_h else Vector2.RIGHT)
		is_dashing = true
		dash_dir = dir.normalized()
		dash_timer = dash_duration

	move_and_slide()

func attack_melee() -> void:
	if attack_cooldown > 0.0 or is_dashing or (upgrade_panel and upgrade_panel.visible) or get_tree().paused:
		return
	attack_cooldown = 0.25

	var slash = slash_scene.instantiate()
	var mouse_pos = get_global_mouse_position()
	var angle = (mouse_pos - global_position).angle()
	slash.global_position = global_position + Vector2.from_angle(angle) * 32.0
	slash.rotation = angle
	slash.scale = Vector2(attack_scale, attack_scale)
	slash.damage = attack_power
	get_parent().add_child(slash)

func take_damage(amount: float) -> void:
	if current_hp <= 0:
		return
	current_hp = max(0.0, current_hp - amount)
	update_hud()
	sprite.modulate = Color(3.0, 0.4, 0.4, 1)
	var tween = create_tween()
	tween.tween_property(sprite, "modulate", Color(1, 1, 1, 1), 0.12)

	if current_hp <= 0.0:
		die()

func die() -> void:
	if game_over_screen:
		game_over_screen.get_node("VBox/StatsLabel").text = "Slain Enemies: %d\nBlood Gathered: %d\nRank: %d" % [kills, blood_essence, level]
		game_over_screen.visible = true
		get_tree().paused = true

func add_kill() -> void:
	kills += 1
	update_hud()

func gain_blood(amount: int) -> void:
	blood_essence += amount
	current_hp = min(max_hp, current_hp + 6.0)
	if blood_essence >= next_level_threshold:
		level_up()
	update_hud()

func level_up() -> void:
	level += 1
	next_level_threshold += 5 + level * 3
	if upgrade_panel:
		upgrade_panel.visible = true
		Engine.time_scale = 0.05

func choose_upgrade(choice: String) -> void:
	if choice == "blade":
		attack_power = int(attack_power * 1.4)
		attack_scale += 0.25
	elif choice == "swift":
		speed += 50.0
		dash_speed += 120.0
	elif choice == "leech":
		max_hp += 30.0
		current_hp = max_hp

	if upgrade_panel:
		upgrade_panel.visible = false
	Engine.time_scale = 1.0
	update_hud()

func update_hud() -> void:
	if hp_bar:
		hp_bar.max_value = max_hp
		hp_bar.value = current_hp
	if blood_label:
		blood_label.text = "Blood Essence: %d / %d" % [blood_essence, next_level_threshold]
	if level_label:
		level_label.text = "Rank: %d" % level
	if kills_label:
		kills_label.text = "Kills: %d" % kills
