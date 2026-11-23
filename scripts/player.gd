extends CharacterBody2D

@export var speed: float = 230.0
@export var dash_speed: float = 650.0
@export var dash_duration: float = 0.22

var max_hp: float = 100.0
var current_hp: float = 100.0
var attack_power: int = 25
var attack_scale: float = 1.0

# Survival & Gathering Inventory
var inventory: Dictionary = {
	"wood": 4,
	"ore": 2,
	"herb": 2,
	"meat": 0,
	"coin": 10,
	"potion": 1
}

var is_dashing: bool = false
var dash_timer: float = 0.0
var dash_dir: Vector2 = Vector2.ZERO
var attack_cooldown: float = 0.0

var slash_scene = preload("res://scenes/slash_arc.tscn")

@onready var sprite = $Sprite2D
@onready var light = $PointLight2D
@onready var hp_bar = $CanvasLayer/HUD/HealthBar
@onready var hp_text = $CanvasLayer/HUD/HealthBar/HpText
@onready var wood_label = $CanvasLayer/HUD/ResourcePanel/HBox/WoodLabel
@onready var ore_label = $CanvasLayer/HUD/ResourcePanel/HBox/OreLabel
@onready var herb_label = $CanvasLayer/HUD/ResourcePanel/HBox/HerbLabel
@onready var meat_label = $CanvasLayer/HUD/ResourcePanel/HBox/MeatLabel
@onready var coin_label = $CanvasLayer/HUD/ResourcePanel/HBox/CoinLabel
@onready var message_label = $CanvasLayer/HUD/MessageBanner

@onready var crafting_panel = $CanvasLayer/CraftingPanel
@onready var pause_menu = $CanvasLayer/PauseMenu
@onready var game_over_screen = $CanvasLayer/GameOverScreen

func _ready() -> void:
	add_to_group("player")
	update_hud()
	setup_crafting_buttons()

	if pause_menu:
		pause_menu.get_node("VBox/ResumeBtn").pressed.connect(toggle_pause)
		pause_menu.get_node("VBox/RestartBtn").pressed.connect(restart_game)
		pause_menu.get_node("VBox/QuitBtn").pressed.connect(go_to_main_menu)

	if game_over_screen:
		game_over_screen.get_node("VBox/RetryBtn").pressed.connect(restart_game)
		game_over_screen.get_node("VBox/MenuBtn").pressed.connect(go_to_main_menu)

func setup_crafting_buttons() -> void:
	if not crafting_panel:
		return
	crafting_panel.get_node("VBox/BtnJerky").pressed.connect(func(): craft_item("jerky"))
	crafting_panel.get_node("VBox/BtnPotion").pressed.connect(func(): craft_item("potion"))
	crafting_panel.get_node("VBox/BtnBlade").pressed.connect(func(): craft_item("blade"))
	crafting_panel.get_node("VBox/BtnArmor").pressed.connect(func(): craft_item("armor"))
	crafting_panel.get_node("VBox/CloseBtn").pressed.connect(func(): crafting_panel.visible = false)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_ESCAPE:
			if crafting_panel.visible:
				crafting_panel.visible = false
			elif not game_over_screen.visible:
				toggle_pause()
		elif event.keycode == KEY_C or event.keycode == KEY_TAB:
			toggle_crafting()
		elif event.keycode == KEY_1:
			use_potion()

	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		attack_melee()

func toggle_crafting() -> void:
	crafting_panel.visible = not crafting_panel.visible

func craft_item(recipe: String) -> void:
	match recipe:
		"jerky":
			# 1 Meat + 1 Herb -> Restores 40 HP
			if inventory["meat"] >= 1 and inventory["herb"] >= 1:
				inventory["meat"] -= 1
				inventory["herb"] -= 1
				current_hp = min(max_hp, current_hp + 40.0)
				show_banner("Crafted & Ate Cured Beast Jerky (+40 HP)!")
			else:
				show_banner("Requires 1 Beast Meat + 1 Blood Herb!")

		"potion":
			# 2 Herbs -> +1 Health Potion
			if inventory["herb"] >= 2:
				inventory["herb"] -= 2
				inventory["potion"] += 1
				show_banner("Brewed Vitality Potion! Press [1] to drink.")
			else:
				show_banner("Requires 2 Blood Herbs!")

		"blade":
			# 3 Ore + 2 Wood -> +15 Attack Power
			if inventory["ore"] >= 3 and inventory["wood"] >= 2:
				inventory["ore"] -= 3
				inventory["wood"] -= 2
				attack_power += 15
				attack_scale += 0.2
				show_banner("Forged Sharpened Crypt Blade! (Damage +15)")
			else:
				show_banner("Requires 3 Ore + 2 Wood!")

		"armor":
			# 4 Ore + 2 Meat -> +40 Max HP
			if inventory["ore"] >= 4 and inventory["meat"] >= 2:
				inventory["ore"] -= 4
				inventory["meat"] -= 2
				max_hp += 40.0
				current_hp = max_hp
				show_banner("Forged Plated Beast Armor! (+40 Max HP)")
			else:
				show_banner("Requires 4 Ore + 2 Beast Meat!")

	update_hud()

func use_potion() -> void:
	if inventory.get("potion", 0) > 0 and current_hp < max_hp:
		inventory["potion"] -= 1
		current_hp = min(max_hp, current_hp + 50.0)
		show_banner("Drank Vitality Potion (+50 HP)!")
		update_hud()

func show_banner(text: String) -> void:
	if message_label:
		message_label.text = text
		message_label.visible = true
		var tween = create_tween()
		tween.tween_interval(2.5)
		tween.tween_property(message_label, "visible", false, 0.0)

func add_inventory_item(item_type: String, amount: int) -> void:
	inventory[item_type] = inventory.get(item_type, 0) + amount
	show_banner("+%d %s gathered" % [amount, item_type.capitalize()])
	update_hud()

func _physics_process(dt: float) -> void:
	light.energy = 1.0 + sin(Time.get_ticks_msec() / 250.0) * 0.08
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
	if attack_cooldown > 0.0 or is_dashing or crafting_panel.visible or get_tree().paused:
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
		game_over_screen.get_node("VBox/StatsLabel").text = "Wood: %d | Ore: %d | Meat: %d | Coins: %d" % [inventory["wood"], inventory["ore"], inventory["meat"], inventory["coin"]]
		game_over_screen.visible = true
		get_tree().paused = true

func toggle_pause() -> void:
	var is_paused = not get_tree().paused
	get_tree().paused = is_paused
	pause_menu.visible = is_paused

func restart_game() -> void:
	get_tree().paused = false
	get_tree().reload_current_scene()

func go_to_main_menu() -> void:
	get_tree().paused = false
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

func update_hud() -> void:
	if hp_bar:
		hp_bar.max_value = max_hp
		hp_bar.value = current_hp
	if hp_text:
		hp_text.text = "HP: %d / %d" % [int(current_hp), int(max_hp)]
	if wood_label: wood_label.text = "Wood: %d" % inventory.get("wood", 0)
	if ore_label: ore_label.text = "Ore: %d" % inventory.get("ore", 0)
	if herb_label: herb_label.text = "Herb: %d" % inventory.get("herb", 0)
	if meat_label: meat_label.text = "Meat: %d" % inventory.get("meat", 0)
	if coin_label: coin_label.text = "Gold: %d" % inventory.get("coin", 0)
