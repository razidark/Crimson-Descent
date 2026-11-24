extends Node

signal stats_changed
signal inventory_changed

var selected_class: int = 0
var current_floor: int = 1
var run_active: bool = false
var sound_muted: bool = false

const CLASSES: Array[Dictionary] = [
	{
		"id": "knight",
		"name": "Razielim Knight",
		"title": "Vanguard of the Fallen Clan",
		"desc": "Armored melee bruiser wielding crimson steel.\nUltimate [E]: Blood Nova (AoE blade burst + heal)",
		"hp": 130.0,
		"mana": 60.0,
		"attack": 28,
		"defense": 4,
		"speed": 225.0,
		"crit": 0.12,
		"start_weapon": 0,
		"sprite_0": "res://assets/gothic/hero_knight_0.png",
		"sprite_1": "res://assets/gothic/hero_knight_1.png",
		"icon": "res://assets/gothic/relic_sword_blood.png",
		"ult_icon": "res://assets/gothic/skill_blood_drop.png",
		"ult_name": "Blood Nova"
	},
	{
		"id": "mage",
		"name": "Spectral Mage",
		"title": "Conduit of Soul-Fire",
		"desc": "Arcane mystic unleashing homing soul bolts.\nUltimate [E]: Frost Rift (Damages & Chills all nearby foes)",
		"hp": 95.0,
		"mana": 120.0,
		"attack": 25,
		"defense": 2,
		"speed": 235.0,
		"crit": 0.16,
		"start_weapon": 3,
		"sprite_0": "res://assets/gothic/hero_mage_0.png",
		"sprite_1": "res://assets/gothic/hero_mage_1.png",
		"icon": "res://assets/gothic/skill_crystal.png",
		"ult_icon": "res://assets/gothic/skill_crystal.png",
		"ult_name": "Frost Rift"
	},
	{
		"id": "stalker",
		"name": "Beast Stalker",
		"title": "Tracker of the Weeping Moors",
		"desc": "Agile hunter skilled with bow, traps, and wild prey.\nUltimate [E]: Snare Volley (7 piercing spectral arrows)",
		"hp": 110.0,
		"mana": 80.0,
		"attack": 26,
		"defense": 2,
		"speed": 250.0,
		"crit": 0.22,
		"start_weapon": 2,
		"sprite_0": "res://assets/gothic/hero_stalker_0.png",
		"sprite_1": "res://assets/gothic/hero_stalker_1.png",
		"icon": "res://assets/gothic/icon_bow.png",
		"ult_icon": "res://assets/gothic/skill_wolf_shield.png",
		"ult_name": "Snare Volley"
	},
	{
		"id": "assassin",
		"name": "Nightstalker",
		"title": "Phantom of the Shadows",
		"desc": "Lethal dual-dagger duelist infusing bleeding wounds.\nUltimate [E]: Phantom Flurry (Speed + Crit Surge)",
		"hp": 95.0,
		"mana": 80.0,
		"attack": 23,
		"defense": 2,
		"speed": 270.0,
		"crit": 0.30,
		"start_weapon": 1,
		"sprite_0": "res://assets/gothic/hero_assassin_0.png",
		"sprite_1": "res://assets/gothic/hero_assassin_1.png",
		"icon": "res://assets/gothic/relic_dagger.png",
		"ult_icon": "res://assets/gothic/skill_batswarm.png",
		"ult_name": "Phantom Flurry"
	}
]

const RARITY_COLORS: Dictionary = {
	"Common": Color(0.85, 0.85, 0.88, 1.0),
	"Magic": Color(0.35, 0.65, 1.0, 1.0),
	"Rare": Color(1.0, 0.82, 0.25, 1.0),
	"Mythic": Color(0.95, 0.22, 0.32, 1.0)
}

const RELIC_TEMPLATES: Array[Dictionary] = [
	{"name": "Bloodthirst Broadsword", "slot": "weapon", "icon": "res://assets/gothic/relic_sword_blood.png", "atk": 10, "crit": 0.05, "lifesteal": 2},
	{"name": "Raziel's Dark Edge", "slot": "weapon", "icon": "res://assets/gothic/relic_sword_dark.png", "atk": 12, "crit": 0.08, "lifesteal": 0},
	{"name": "Reaper's Curved Scythe", "slot": "weapon", "icon": "res://assets/gothic/relic_scythe.png", "atk": 14, "crit": 0.10, "lifesteal": 3},
	{"name": "Shadow Fang Dagger", "slot": "weapon", "icon": "res://assets/gothic/relic_dagger.png", "atk": 8, "crit": 0.14, "lifesteal": 1},
	{"name": "Crimson Rapier", "slot": "weapon", "icon": "res://assets/gothic/relic_rapier.png", "atk": 9, "crit": 0.12, "speed": 15},
	{"name": "Spiked Crypt Flail", "slot": "weapon", "icon": "res://assets/gothic/relic_flail.png", "atk": 15, "crit": 0.04, "hp": 15},
	{"name": "Obsidian Plate", "slot": "armor", "icon": "res://assets/gothic/relic_armor_obsidian.png", "hp": 45, "def": 4, "atk": 2},
	{"name": "Vampiric Crimson Cape", "slot": "armor", "icon": "res://assets/gothic/relic_cape_crimson.png", "hp": 25, "def": 2, "speed": 25, "lifesteal": 2},
	{"name": "Coffin Wall Shield", "slot": "armor", "icon": "res://assets/gothic/relic_shield_coffin.png", "hp": 55, "def": 6},
	{"name": "Bat-Wing Aegis", "slot": "armor", "icon": "res://assets/gothic/relic_shield_bat.png", "hp": 35, "def": 4, "speed": 15},
	{"name": "Void Flame Ring", "slot": "accessory", "icon": "res://assets/gothic/relic_ring_void.png", "atk": 6, "mana": 30, "crit": 0.08},
	{"name": "Blood Ruby Amulet", "slot": "accessory", "icon": "res://assets/gothic/relic_amulet_ruby.png", "hp": 30, "lifesteal": 3},
	{"name": "Skull Signet", "slot": "accessory", "icon": "res://assets/gothic/relic_ring_skull.png", "crit": 0.12, "atk": 5},
	{"name": "Crimson Chalice", "slot": "accessory", "icon": "res://assets/gothic/relic_chalice.png", "hp": 20, "mana": 25, "lifesteal": 2},
	{"name": "Sarafan Silver Cross", "slot": "accessory", "icon": "res://assets/gothic/relic_cross.png", "def": 3, "mana": 20, "atk": 4}
]

const BLESSINGS: Array[Dictionary] = [
	{"id": "might", "name": "Bloodforged Might", "desc": "+22% Attack Damage", "icon": "res://assets/gothic/relic_sword_blood.png"},
	{"id": "vitality", "name": "Undying Vitae", "desc": "+35 Max HP & Restore 45 HP", "icon": "res://assets/gothic/skill_blood_drop.png"},
	{"id": "quicksilver", "name": "Phantom Quicksilver", "desc": "+25 Move Speed & -15% Dash CD", "icon": "res://assets/gothic/skill_boots.png"},
	{"id": "crit", "name": "Assassin's Precision", "desc": "+12% Crit Chance & +4 Attack", "icon": "res://assets/gothic/relic_dagger.png"},
	{"id": "leech", "name": "Crimson Siphon", "desc": "Restore +3 HP per enemy hit", "icon": "res://assets/gothic/relic_chalice.png"},
	{"id": "mana", "name": "Spectral Conduit", "desc": "+35 Max Mana & +3 Mana/sec", "icon": "res://assets/gothic/skill_crystal.png"},
	{"id": "serrated", "name": "Serrated Steel", "desc": "ALL weapons inflict Bleed!", "icon": "res://assets/gothic/skill_sickle.png"},
	{"id": "haste", "name": "Arcane Haste", "desc": "-20% Skill Cooldown & +15% Attack Speed", "icon": "res://assets/gothic/skill_batswarm.png"}
]

# Run state variables
var base_max_hp: float = 130.0
var hp: float = 130.0
var base_max_mana: float = 60.0
var mana: float = 60.0
var base_attack: int = 28
var base_defense: int = 4
var base_speed: float = 225.0
var base_crit: float = 0.12
var bonus_lifesteal: int = 0
var bonus_attack_mult: float = 1.0
var bonus_cooldown_mult: float = 1.0
var bonus_mana_regen: float = 2.0
var all_attacks_bleed: bool = false

var level: int = 1
var xp: int = 0
var next_xp: int = 40
var kills: int = 0
var current_weapon: int = 0

var inventory: Dictionary = {
	"wood": 5,
	"ore": 3,
	"herb": 3,
	"meat": 1,
	"bones": 2,
	"gems": 0,
	"gold": 25,
	"potions": 2,
	"arrows": 24,
	"traps": 2
}

var equipped: Dictionary = {"weapon": null, "armor": null, "accessory": null}
var relic_bag: Array[Dictionary] = []
var acquired_blessings: Array[String] = []

func start_new_run(class_idx: int) -> void:
	selected_class = clampi(class_idx, 0, CLASSES.size() - 1)
	var cls = CLASSES[selected_class]
	current_floor = 1
	run_active = true
	base_max_hp = cls["hp"]
	hp = cls["hp"]
	base_max_mana = cls["mana"]
	mana = cls["mana"]
	base_attack = cls["attack"]
	base_defense = cls["defense"]
	base_speed = cls["speed"]
	base_crit = cls["crit"]
	current_weapon = cls["start_weapon"]
	
	bonus_lifesteal = 0
	bonus_attack_mult = 1.0
	bonus_cooldown_mult = 1.0
	bonus_mana_regen = 2.5 if selected_class == 1 else 1.8
	all_attacks_bleed = false
	level = 1
	xp = 0
	next_xp = 35
	kills = 0
	
	inventory = {
		"wood": 5,
		"ore": 3,
		"herb": 3,
		"meat": 1,
		"bones": 2,
		"gems": 0,
		"gold": 25,
		"potions": 2,
		"arrows": 36 if selected_class == 2 else 20,
		"traps": 3 if selected_class == 2 else 2
	}
	equipped = {"weapon": null, "armor": null, "accessory": null}
	relic_bag.clear()
	acquired_blessings.clear()
	stats_changed.emit()
	inventory_changed.emit()

func get_class_data() -> Dictionary:
	return CLASSES[selected_class]

func get_floor_title() -> String:
	match current_floor:
		1: return "Circle I: The Sunken Crypts"
		2: return "Circle II: Forbidden Archives"
		3: return "Circle III: Crimson Sanctum"
		_: return "Circle %d: Abyssal Depths" % current_floor

func get_eff_max_hp() -> float:
	var val = base_max_hp
	for slot in equipped:
		if equipped[slot] != null:
			val += equipped[slot].get("hp", 0)
	return val

func get_eff_max_mana() -> float:
	var val = base_max_mana
	for slot in equipped:
		if equipped[slot] != null:
			val += equipped[slot].get("mana", 0)
	return val

func get_eff_attack() -> int:
	var val = base_attack
	for slot in equipped:
		if equipped[slot] != null:
			val += equipped[slot].get("atk", 0)
	return int(round(val * bonus_attack_mult))

func get_eff_defense() -> int:
	var val = base_defense
	for slot in equipped:
		if equipped[slot] != null:
			val += equipped[slot].get("def", 0)
	return val

func get_eff_speed() -> float:
	var val = base_speed
	for slot in equipped:
		if equipped[slot] != null:
			val += equipped[slot].get("speed", 0.0)
	return val

func get_eff_crit() -> float:
	var val = base_crit
	for slot in equipped:
		if equipped[slot] != null:
			val += equipped[slot].get("crit", 0.0)
	return clampf(val, 0.0, 0.85)

func get_eff_lifesteal() -> int:
	var val = bonus_lifesteal
	for slot in equipped:
		if equipped[slot] != null:
			val += equipped[slot].get("lifesteal", 0)
	return val

func roll_relic(floor_num: int, forced_rarity: String = "") -> Dictionary:
	var rarity = forced_rarity
	if rarity == "":
		var r = randf() + (floor_num - 1) * 0.08
		if r > 1.05: rarity = "Mythic"
		elif r > 0.78: rarity = "Rare"
		elif r > 0.42: rarity = "Magic"
		else: rarity = "Common"
	
	var mult = 1.0
	match rarity:
		"Magic": mult = 1.35
		"Rare": mult = 1.75
		"Mythic": mult = 2.35
	mult += (floor_num - 1) * 0.25
	
	var tpl = RELIC_TEMPLATES.pick_random()
	var item = {
		"id": str(randi()),
		"name": "%s %s" % [rarity, tpl["name"]] if rarity != "Common" else tpl["name"],
		"slot": tpl["slot"],
		"rarity": rarity,
		"icon": tpl["icon"],
		"atk": int(ceil(tpl.get("atk", 0) * mult)),
		"def": int(ceil(tpl.get("def", 0) * mult)),
		"hp": int(ceil(tpl.get("hp", 0) * mult)),
		"mana": int(ceil(tpl.get("mana", 0) * mult)),
		"speed": int(ceil(tpl.get("speed", 0) * mult)),
		"crit": snappedf(tpl.get("crit", 0.0) * (1.0 + (mult - 1.0) * 0.5), 0.01),
		"lifesteal": int(ceil(tpl.get("lifesteal", 0) * (1.0 + (mult - 1.0) * 0.4))),
		"value": int(20 * mult)
	}
	return item

func format_relic_stats(r: Dictionary) -> String:
	var parts: Array[String] = []
	if r.get("atk", 0) > 0: parts.append("+%d Atk" % r["atk"])
	if r.get("hp", 0) > 0: parts.append("+%d HP" % r["hp"])
	if r.get("def", 0) > 0: parts.append("+%d Def" % r["def"])
	if r.get("mana", 0) > 0: parts.append("+%d Mana" % r["mana"])
	if r.get("speed", 0) > 0: parts.append("+%d Spd" % r["speed"])
	if r.get("crit", 0.0) > 0.0: parts.append("+%d%% Crit" % int(r["crit"] * 100))
	if r.get("lifesteal", 0) > 0: parts.append("+%d Leech" % r["lifesteal"])
	return ", ".join(parts)

func add_relic(relic: Dictionary) -> void:
	var slot = relic["slot"]
	if equipped.get(slot) == null:
		equipped[slot] = relic
		hp = min(hp + relic.get("hp", 0), get_eff_max_hp())
	else:
		if relic_bag.size() >= 18:
			# Auto salvage oldest if full
			var old = relic_bag.pop_front()
			inventory["gold"] += old.get("value", 15)
		relic_bag.append(relic)
	stats_changed.emit()
	inventory_changed.emit()

func equip_from_bag(index: int) -> void:
	if index < 0 or index >= relic_bag.size():
		return
	var r = relic_bag[index]
	var slot = r["slot"]
	var old = equipped.get(slot)
	equipped[slot] = r
	relic_bag.remove_at(index)
	if old != null:
		relic_bag.append(old)
	hp = min(hp, get_eff_max_hp())
	mana = min(mana, get_eff_max_mana())
	stats_changed.emit()
	inventory_changed.emit()

func salvage_from_bag(index: int) -> Dictionary:
	if index < 0 or index >= relic_bag.size():
		return {}
	var r = relic_bag[index]
	relic_bag.remove_at(index)
	var gold_gain = r.get("value", 15)
	var ore_gain = 1 if r.get("rarity", "Common") in ["Rare", "Mythic"] else 0
	inventory["gold"] += gold_gain
	inventory["ore"] += ore_gain
	inventory_changed.emit()
	return {"gold": gold_gain, "ore": ore_gain}

func apply_blessing(id: String) -> void:
	acquired_blessings.append(id)
	match id:
		"might": bonus_attack_mult += 0.22
		"vitality":
			base_max_hp += 35.0
			hp = min(get_eff_max_hp(), hp + 45.0)
		"quicksilver":
			base_speed += 25.0
		"crit":
			base_crit += 0.12
			base_attack += 4
		"leech":
			bonus_lifesteal += 3
		"mana":
			base_max_mana += 35.0
			mana = min(get_eff_max_mana(), mana + 35.0)
			bonus_mana_regen += 3.0
		"serrated":
			all_attacks_bleed = true
		"haste":
			bonus_cooldown_mult = max(0.45, bonus_cooldown_mult * 0.80)
	stats_changed.emit()

func get_three_blessings() -> Array[Dictionary]:
	var pool = BLESSINGS.duplicate()
	pool.shuffle()
	var res: Array[Dictionary] = []
	for i in range(min(3, pool.size())):
		res.append(pool[i])
	return res
