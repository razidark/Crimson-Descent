extends CharacterBody2D

var is_dashing: bool = false
var dash_timer: float = 0.0
var dash_cooldown: float = 0.0
var dash_dir: Vector2 = Vector2.ZERO
var attack_cooldown: float = 0.0
var ult_cooldown: float = 0.0
var crit_surge_timer: float = 0.0
var invuln_timer: float = 0.0

var anim_timer: float = 0.0
var anim_frame: int = 0
var tex_0: Texture2D
var tex_1: Texture2D

var slash_scene = preload("res://scenes/slash_arc.tscn")
var arrow_scene = preload("res://scenes/arrow.tscn")
var bolt_scene = preload("res://scenes/magic_bolt.tscn")
var trap_scene = preload("res://scenes/spike_trap.tscn")

@onready var sprite = $Sprite2D
@onready var light = $PointLight2D
@onready var cam = $Camera2D
@onready var audio_mgr = $AudioManager

@onready var hp_bar = $CanvasLayer/HUD/TopLeft/HealthBar
@onready var hp_text = $CanvasLayer/HUD/TopLeft/HealthBar/HpText
@onready var mana_bar = $CanvasLayer/HUD/TopLeft/ManaBar
@onready var mana_text = $CanvasLayer/HUD/TopLeft/ManaBar/ManaText
@onready var xp_bar = $CanvasLayer/HUD/TopLeft/XpBar
@onready var class_label = $CanvasLayer/HUD/TopLeft/ClassLabel
@onready var floor_label = $CanvasLayer/HUD/FloorLabel
@onready var stats_label = $CanvasLayer/HUD/StatsLabel
@onready var message_label = $CanvasLayer/HUD/MessageBanner
@onready var hotbar_label = $CanvasLayer/HUD/HotbarPanel/HotbarLabel

@onready var crafting_panel = $CanvasLayer/CraftingPanel
@onready var equip_label = $CanvasLayer/CraftingPanel/MainHBox/GearCol/EquipLabel
@onready var relic_list = $CanvasLayer/CraftingPanel/MainHBox/GearCol/RelicScroll/RelicList
@onready var levelup_panel = $CanvasLayer/LevelUpPanel
@onready var pause_menu = $CanvasLayer/PauseMenu
@onready var game_over_screen = $CanvasLayer/GameOverScreen

var current_blessings: Array[Dictionary] = []

func _ready() -> void:
	add_to_group("player")
	var cls = GameState.get_class_data()
	tex_0 = load(cls["sprite_0"])
	tex_1 = load(cls["sprite_1"])
	if sprite and tex_0:
		sprite.texture = tex_0

	GameState.stats_changed.connect(update_hud)
	GameState.inventory_changed.connect(update_hud)
	setup_ui_buttons()
	update_hud()

func setup_ui_buttons() -> void:
	if crafting_panel:
		var craft_col = crafting_panel.get_node("MainHBox/CraftCol")
		craft_col.get_node("BtnJerky").pressed.connect(func(): craft_item("jerky"))
		craft_col.get_node("BtnPotion").pressed.connect(func(): craft_item("potion"))
		craft_col.get_node("BtnArrows").pressed.connect(func(): craft_item("arrows"))
		craft_col.get_node("BtnTrap").pressed.connect(func(): craft_item("trap"))
		craft_col.get_node("BtnBlade").pressed.connect(func(): craft_item("blade"))
		craft_col.get_node("BtnArmor").pressed.connect(func(): craft_item("armor"))
		crafting_panel.get_node("MainHBox/GearCol/CloseBtn").pressed.connect(func(): crafting_panel.visible = false)

	if pause_menu:
		pause_menu.get_node("VBox/ResumeBtn").pressed.connect(toggle_pause)
		pause_menu.get_node("VBox/RestartBtn").pressed.connect(restart_game)
		pause_menu.get_node("VBox/QuitBtn").pressed.connect(go_to_main_menu)

	if game_over_screen:
		game_over_screen.get_node("VBox/RetryBtn").pressed.connect(restart_game)
		game_over_screen.get_node("VBox/MenuBtn").pressed.connect(go_to_main_menu)

	if levelup_panel:
		for i in range(3):
			var btn = levelup_panel.get_node("VBox/CardsHBox/Card%d" % i)
			btn.pressed.connect(func(): pick_blessing(i))

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP and event.pressed and cam:
			cam.zoom = (cam.zoom + Vector2(0.1, 0.1)).clamp(Vector2(0.65, 0.65), Vector2(1.45, 1.45))
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN and event.pressed and cam:
			cam.zoom = (cam.zoom - Vector2(0.1, 0.1)).clamp(Vector2(0.65, 0.65), Vector2(1.45, 1.45))
	elif event is InputEventKey and event.pressed:
		match event.keycode:
			KEY_ESCAPE:
				if crafting_panel.visible:
					crafting_panel.visible = false
				elif not game_over_screen.visible and not levelup_panel.visible:
					toggle_pause()
			KEY_C, KEY_I, KEY_TAB:
				if not levelup_panel.visible and not game_over_screen.visible:
					toggle_crafting()
			KEY_Q:
				GameState.current_weapon = (GameState.current_weapon + 1) % 4
				show_banner("Equipped: %s" % get_weapon_name())
				update_hud()
			KEY_1: select_weapon(0)
			KEY_2: select_weapon(1)
			KEY_3: select_weapon(2)
			KEY_4: select_weapon(3)
			KEY_E: trigger_ultimate()
			KEY_F: use_potion()
			KEY_G: place_spike_trap()
			KEY_M:
				GameState.sound_muted = not GameState.sound_muted
				show_banner("Audio: %s" % ("Muted" if GameState.sound_muted else "Unmuted"))

func select_weapon(idx: int) -> void:
	GameState.current_weapon = idx
	show_banner("Equipped: %s" % get_weapon_name())
	update_hud()

func get_weapon_name() -> String:
	match GameState.current_weapon:
		0: return "Blood Greatsword"
		1: return "Twin Daggers"
		2: return "Shadow Bow"
		3: return "Soul Staff"
	return "Blade"

func _physics_process(dt: float) -> void:
	light.energy = 1.1 + sin(Time.get_ticks_msec() / 220.0) * 0.08
	if attack_cooldown > 0.0: attack_cooldown -= dt
	if dash_cooldown > 0.0: dash_cooldown -= dt
	if ult_cooldown > 0.0: ult_cooldown -= dt
	if crit_surge_timer > 0.0: crit_surge_timer -= dt
	if invuln_timer > 0.0: invuln_timer -= dt

	# Passive Mana Regeneration
	var max_m = GameState.get_eff_max_mana()
	if GameState.mana < max_m:
		GameState.mana = min(max_m, GameState.mana + GameState.bonus_mana_regen * dt)
		if mana_bar:
			mana_bar.value = GameState.mana
		if mana_text:
			mana_text.text = "MP: %d / %d" % [int(GameState.mana), int(max_m)]

	if is_dashing:
		dash_timer -= dt
		velocity = dash_dir * 660.0
		move_and_slide()
		if dash_timer <= 0.0:
			is_dashing = false
			sprite.modulate.a = 1.0
		return

	var input_vec = Input.get_vector("move_left", "move_right", "move_up", "move_down")
	if input_vec != Vector2.ZERO:
		var spd = GameState.get_eff_speed() * (1.2 if crit_surge_timer > 0.0 else 1.0)
		velocity = input_vec.normalized() * spd
		if input_vec.x < 0: sprite.flip_h = true
		elif input_vec.x > 0: sprite.flip_h = false

		anim_timer += dt
		if anim_timer >= 0.18:
			anim_timer = 0.0
			anim_frame = 1 - anim_frame
			if sprite and tex_0 and tex_1:
				sprite.texture = tex_1 if anim_frame == 1 else tex_0
	else:
		velocity = Vector2.ZERO
		if sprite and tex_0:
			sprite.texture = tex_0

	if Input.is_action_just_pressed("ui_accept") and dash_cooldown <= 0.0:
		var dir = input_vec if input_vec != Vector2.ZERO else (Vector2.LEFT if sprite.flip_h else Vector2.RIGHT)
		is_dashing = true
		invuln_timer = 0.25
		dash_dir = dir.normalized()
		dash_timer = 0.20
		dash_cooldown = 0.75 * GameState.bonus_cooldown_mult
		sprite.modulate.a = 0.55
		play_sound("dash")

	# Continuous attack while holding Left Mouse Button!
	if Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
		execute_attack()

	move_and_slide()

func execute_attack() -> void:
	if attack_cooldown > 0.0 or is_dashing or crafting_panel.visible or levelup_panel.visible or get_tree().paused:
		return

	var mouse_pos = get_global_mouse_position()
	var angle = (mouse_pos - global_position).angle()
	var atk = GameState.get_eff_attack()
	var cd_mult = GameState.bonus_cooldown_mult

	match GameState.current_weapon:
		0: # Greatsword
			attack_cooldown = 0.36 * cd_mult
			var slash = slash_scene.instantiate()
			slash.global_position = global_position + Vector2.from_angle(angle) * 34.0
			slash.rotation = angle
			slash.scale = Vector2(1.25, 1.25)
			slash.damage = int(atk * 1.45)
			slash.is_dagger = false
			slash.knockback_force = 210.0
			get_parent().add_child(slash)
			play_sound("slash")
		1: # Twin Daggers
			attack_cooldown = 0.17 * cd_mult
			var slash = slash_scene.instantiate()
			slash.global_position = global_position + Vector2.from_angle(angle) * 26.0
			slash.rotation = angle
			slash.scale = Vector2(0.85, 0.85)
			slash.damage = int(atk * 0.75)
			slash.is_dagger = true
			slash.knockback_force = 90.0
			get_parent().add_child(slash)
			play_sound("slash")
		2: # Shadow Bow
			if GameState.inventory.get("arrows", 0) <= 0:
				attack_cooldown = 0.3
				show_banner("Out of arrows! Craft more in [C] Forge.")
				return
			attack_cooldown = 0.30 * cd_mult
			GameState.inventory["arrows"] -= 1
			var arrow = arrow_scene.instantiate()
			arrow.global_position = global_position + Vector2.from_angle(angle) * 20.0
			arrow.setup(Vector2.from_angle(angle))
			arrow.damage = int(atk * 1.15)
			get_parent().add_child(arrow)
			play_sound("bow")
			update_hud()
		3: # Soul Staff
			if GameState.mana < 6.0:
				attack_cooldown = 0.3
				show_banner("Not enough Mana!")
				return
			attack_cooldown = 0.28 * cd_mult
			GameState.mana -= 6.0
			var bolt = bolt_scene.instantiate()
			bolt.global_position = global_position + Vector2.from_angle(angle) * 20.0
			bolt.setup(Vector2.from_angle(angle))
			bolt.damage = int(atk * 1.2)
			get_parent().add_child(bolt)
			play_sound("magic")
			update_hud()

func trigger_ultimate() -> void:
	if ult_cooldown > 0.0 or crafting_panel.visible or levelup_panel.visible or get_tree().paused:
		return
	if GameState.mana < 20.0:
		show_banner("Need 20 Mana for Signature Skill!")
		return

	GameState.mana -= 20.0
	ult_cooldown = 6.0 * GameState.bonus_cooldown_mult
	var atk = GameState.get_eff_attack()
	var cls_id = GameState.get_class_data()["id"]

	match cls_id:
		"knight":
			# Blood Nova: 8 radiating crimson slashes + heal
			for i in range(8):
				var ang = (float(i) / 8.0) * TAU
				var slash = slash_scene.instantiate()
				slash.global_position = global_position + Vector2.from_angle(ang) * 40.0
				slash.rotation = ang
				slash.scale = Vector2(1.3, 1.3)
				slash.damage = int(atk * 1.6)
				get_parent().add_child(slash)
			heal_hp(15.0)
			play_sound("slash")
			show_banner("BLOOD NOVA!")
		"mage":
			# Frost Rift: 10 homing bolts!
			for i in range(10):
				var ang = (float(i) / 10.0) * TAU
				var bolt = bolt_scene.instantiate()
				bolt.global_position = global_position + Vector2.from_angle(ang) * 24.0
				bolt.setup(Vector2.from_angle(ang))
				bolt.damage = int(atk * 1.25)
				get_parent().add_child(bolt)
			play_sound("magic")
			show_banner("FROST RIFT!")
		"stalker":
			# Snare Volley: 7 spread piercing arrows
			var aim = (get_global_mouse_position() - global_position).angle()
			for i in range(-3, 4):
				var ang = aim + i * 0.14
				var arr = arrow_scene.instantiate()
				arr.global_position = global_position + Vector2.from_angle(ang) * 22.0
				arr.setup(Vector2.from_angle(ang))
				arr.damage = int(atk * 1.3)
				arr.pierce = 2
				get_parent().add_child(arr)
			play_sound("bow")
			show_banner("SNARE VOLLEY!")
		"assassin":
			# Phantom Flurry: speed + crit surge
			crit_surge_timer = 3.5
			invuln_timer = 0.6
			play_sound("dash")
			show_banner("PHANTOM FLURRY! (+Speed & Dodge)")
	update_hud()

func use_potion() -> void:
	var max_h = GameState.get_eff_max_hp()
	if GameState.inventory.get("potions", 0) > 0 and GameState.hp < max_h:
		GameState.inventory["potions"] -= 1
		heal_hp(55.0)
		play_sound("pickup")
		show_banner("Drank Crimson Elixir (+55 HP)")
		update_hud()

func place_spike_trap() -> void:
	if GameState.inventory.get("traps", 0) > 0:
		GameState.inventory["traps"] -= 1
		var trap = trap_scene.instantiate()
		trap.global_position = global_position
		get_parent().add_child(trap)
		play_sound("craft")
		show_banner("Placed Hunting Spike Trap!")
		update_hud()
	else:
		show_banner("No traps! Craft in [C] Forge.")

func toggle_crafting() -> void:
	crafting_panel.visible = not crafting_panel.visible
	if crafting_panel.visible:
		refresh_gear_ui()

func refresh_gear_ui() -> void:
	if not equip_label or not relic_list:
		return
	var lines: Array[String] = []
	for slot in ["weapon", "armor", "accessory"]:
		var r = GameState.equipped.get(slot)
		if r == null:
			lines.append("%s: [Empty]" % slot.capitalize())
		else:
			lines.append("%s: %s (%s)" % [slot.capitalize(), r["name"], GameState.format_relic_stats(r)])
	lines.append("\nTotal: %d Atk | %d Def | %d%% Crit | %d Leech" % [
		GameState.get_eff_attack(), GameState.get_eff_defense(),
		int(GameState.get_eff_crit() * 100), GameState.get_eff_lifesteal()
	])
	equip_label.text = "\n".join(lines)

	for child in relic_list.get_children():
		child.queue_free()

	if GameState.relic_bag.is_empty():
		var empty_lbl = Label.new()
		empty_lbl.text = "Backpack empty — open chests or slay foes to loot Relics."
		empty_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD
		relic_list.add_child(empty_lbl)
		return

	for i in range(GameState.relic_bag.size()):
		var r = GameState.relic_bag[i]
		var hbox = HBoxContainer.new()
		var lbl = Label.new()
		lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		lbl.text = "%s (%s)" % [r["name"], GameState.format_relic_stats(r)]
		lbl.modulate = GameState.RARITY_COLORS.get(r.get("rarity", "Common"), Color.WHITE)
		lbl.autowrap_mode = TextServer.AUTOWRAP_WORD

		var eq_btn = Button.new()
		eq_btn.text = "Equip"
		var idx := i
		eq_btn.pressed.connect(func():
			GameState.equip_from_bag(idx)
			play_sound("pickup")
			refresh_gear_ui()
		)
		var sal_btn = Button.new()
		sal_btn.text = "Salvage"
		sal_btn.pressed.connect(func():
			var res = GameState.salvage_from_bag(idx)
			play_sound("craft")
			show_banner("Salvaged +%d Gold" % res.get("gold", 10))
			refresh_gear_ui()
		)
		hbox.add_child(lbl)
		hbox.add_child(eq_btn)
		hbox.add_child(sal_btn)
		relic_list.add_child(hbox)

func craft_item(recipe: String) -> void:
	var inv = GameState.inventory
	match recipe:
		"jerky":
			if inv["meat"] >= 1 and inv["herb"] >= 1:
				inv["meat"] -= 1; inv["herb"] -= 1
				heal_hp(60.0)
				GameState.mana = min(GameState.get_eff_max_mana(), GameState.mana + 30.0)
				play_sound("craft")
				show_banner("Roasted Beast Meal (+60 HP, +30 MP)!")
			else: show_banner("Need 1 Meat + 1 Herb")
		"potion":
			if inv["herb"] >= 2:
				inv["herb"] -= 2; inv["potions"] += 1
				play_sound("craft")
				show_banner("Brewed Crimson Elixir! Press [F] to drink.")
			else: show_banner("Need 2 Herbs")
		"arrows":
			if inv["wood"] >= 1 and inv["ore"] >= 1:
				inv["wood"] -= 1; inv["ore"] -= 1; inv["arrows"] += 15
				play_sound("craft")
				show_banner("Fletched +15 Shadow Arrows!")
			else: show_banner("Need 1 Wood + 1 Ore")
		"trap":
			if inv["wood"] >= 1 and inv["ore"] >= 1:
				inv["wood"] -= 1; inv["ore"] -= 1; inv["traps"] += 2
				play_sound("craft")
				show_banner("Crafted +2 Spike Traps! Press [G] to place.")
			else: show_banner("Need 1 Wood + 1 Ore")
		"blade":
			if inv["ore"] >= 3:
				inv["ore"] -= 3; GameState.base_attack += 10
				play_sound("craft")
				show_banner("Honed Weapon! (+10 Base Attack)")
			else: show_banner("Need 3 Ore")
		"armor":
			if inv["ore"] >= 3 and inv["bones"] >= 2:
				inv["ore"] -= 3; inv["bones"] -= 2
				GameState.base_max_hp += 30.0; GameState.base_defense += 2
				heal_hp(30.0)
				play_sound("craft")
				show_banner("Tempered Dark Plate! (+30 Max HP, +2 Def)")
			else: show_banner("Need 3 Ore + 2 Bones")
	update_hud()
	if crafting_panel.visible:
		refresh_gear_ui()

func pickup_relic(relic: Dictionary) -> void:
	GameState.add_relic(relic)
	play_sound("chest")
	show_banner("Looted Relic: %s!" % relic["name"])

func add_inventory_item(item_type: String, amount: int) -> void:
	GameState.inventory[item_type] = GameState.inventory.get(item_type, 0) + amount
	play_sound("pickup")
	show_banner("+%d %s" % [amount, item_type.capitalize()])
	update_hud()

func gain_xp_and_blood(xp_amt: int, heal_amt: float) -> void:
	heal_hp(heal_amt)
	GameState.xp += xp_amt
	if GameState.xp >= GameState.next_xp:
		GameState.xp -= GameState.next_xp
		GameState.level += 1
		GameState.next_xp = int(GameState.next_xp * 1.4) + 15
		show_levelup_cards()
	else:
		play_sound("pickup")
	update_hud()

func show_levelup_cards() -> void:
	play_sound("levelup")
	current_blessings = GameState.get_three_blessings()
	if not levelup_panel:
		return
	for i in range(current_blessings.size()):
		var b = current_blessings[i]
		var card = levelup_panel.get_node("VBox/CardsHBox/Card%d" % i)
		card.text = "%s\n\n%s" % [b["name"], b["desc"]]
		if ResourceLoader.exists(b["icon"]):
			card.icon = load(b["icon"])
	levelup_panel.visible = true
	get_tree().paused = true

func pick_blessing(idx: int) -> void:
	if idx < current_blessings.size():
		var b = current_blessings[idx]
		GameState.apply_blessing(b["id"])
		show_banner("Blessing Unlocked: %s!" % b["name"])
	levelup_panel.visible = false
	get_tree().paused = false
	update_hud()

func heal_hp(amount: float) -> void:
	GameState.hp = min(GameState.get_eff_max_hp(), GameState.hp + amount)
	update_hud()

func take_damage(amount: float) -> void:
	if GameState.hp <= 0.0 or invuln_timer > 0.0:
		return
	var def_reduction = max(0.3, 1.0 - GameState.get_eff_defense() * 0.03)
	GameState.hp = max(0.0, GameState.hp - amount * def_reduction)
	update_hud()
	if randf() < 0.25:
		play_sound("hit")
	sprite.modulate = Color(2.5, 0.35, 0.35, 1)
	var tween = create_tween()
	tween.tween_property(sprite, "modulate", Color.WHITE, 0.12)
	if GameState.hp <= 0.0:
		die()

func die() -> void:
	GameState.run_active = false
	if game_over_screen:
		game_over_screen.get_node("VBox/StatsLabel").text = "Reached %s\nLevel %d | Slain Foes: %d | Gold: %d" % [
			GameState.get_floor_title(), GameState.level, GameState.kills, GameState.inventory["gold"]
		]
		game_over_screen.visible = true
		get_tree().paused = true

func toggle_pause() -> void:
	var is_paused = not get_tree().paused
	get_tree().paused = is_paused
	pause_menu.visible = is_paused

func restart_game() -> void:
	get_tree().paused = false
	GameState.start_new_run(GameState.selected_class)
	get_tree().reload_current_scene()

func go_to_main_menu() -> void:
	get_tree().paused = false
	GameState.run_active = false
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

func show_banner(text: String) -> void:
	if message_label:
		message_label.text = text
		message_label.visible = true
		var tween = create_tween()
		tween.tween_interval(2.0)
		tween.tween_property(message_label, "visible", false, 0.0)

func play_sound(sfx_key: String) -> void:
	if audio_mgr and audio_mgr.has_method("play_sfx"):
		audio_mgr.play_sfx(sfx_key)

func update_hud() -> void:
	var max_h = GameState.get_eff_max_hp()
	var max_m = GameState.get_eff_max_mana()
	if hp_bar:
		hp_bar.max_value = max_h
		hp_bar.value = GameState.hp
	if hp_text:
		hp_text.text = "HP: %d / %d" % [int(GameState.hp), int(max_h)]
	if mana_bar:
		mana_bar.max_value = max_m
		mana_bar.value = GameState.mana
	if mana_text:
		mana_text.text = "MP: %d / %d" % [int(GameState.mana), int(max_m)]
	if xp_bar:
		xp_bar.max_value = GameState.next_xp
		xp_bar.value = GameState.xp
	if class_label:
		class_label.text = "%s (Lv.%d)" % [GameState.get_class_data()["name"], GameState.level]
	if floor_label:
		floor_label.text = GameState.get_floor_title()
	var inv = GameState.inventory
	if stats_label:
		stats_label.text = "Wood:%d  Ore:%d  Herb:%d  Meat:%d  Bones:%d  Gold:%d  Kills:%d" % [
			inv["wood"], inv["ore"], inv["herb"], inv["meat"], inv["bones"], inv["gold"], GameState.kills
		]
	if hotbar_label:
		var w_names = ["[1] Sword", "[2] Daggers", "[3] Bow(%d)" % inv["arrows"], "[4] Staff"]
		w_names[GameState.current_weapon] = "▶ " + w_names[GameState.current_weapon]
		hotbar_label.text = "%s  |  [E] %s  |  [F] Potions:%d  |  [G] Traps:%d  |  [C] Gear & Forge" % [
			"  ".join(w_names), GameState.get_class_data()["ult_name"], inv["potions"], inv["traps"]
		]
