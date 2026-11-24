extends StaticBody2D

enum NodeType { CRATE, ORE_VEIN, HERB_BUSH, CHEST, MUSHROOM }
@export var node_type: NodeType = NodeType.CRATE
@export var hits_to_break: int = 3

var current_hits: int = 0
var is_opened: bool = false
var loot_scene = preload("res://scenes/loot_drop.tscn")

@onready var sprite = $Sprite2D

func _ready() -> void:
	add_to_group("resource_nodes")
	current_hits = 1 if node_type == NodeType.CHEST else hits_to_break
	update_appearance()

func update_appearance() -> void:
	if not sprite:
		return
	var path = "res://assets/gothic/prop_barrel.png"
	match node_type:
		NodeType.CRATE: path = "res://assets/gothic/prop_barrel.png"
		NodeType.ORE_VEIN: path = "res://assets/gothic/item_ore_iron.png"
		NodeType.HERB_BUSH: path = "res://assets/gothic/item_herb.png"
		NodeType.MUSHROOM: path = "res://assets/gothic/item_mushroom.png"
		NodeType.CHEST: path = "res://assets/gothic/prop_chest_closed.png"
	if ResourceLoader.exists(path):
		sprite.texture = load(path)

func take_damage(_amount: int) -> void:
	if is_opened:
		return
	current_hits -= 1
	sprite.modulate = Color(2.5, 2.5, 2.5, 1)
	var tween = create_tween()
	tween.tween_property(sprite, "modulate", Color(1, 1, 1, 1), 0.12)
	tween.parallel().tween_property(sprite, "rotation", randf_range(-0.15, 0.15), 0.06)
	tween.chain().tween_property(sprite, "rotation", 0.0, 0.06)

	if current_hits <= 0:
		break_and_drop()

func break_and_drop() -> void:
	if node_type == NodeType.CHEST:
		is_opened = true
		remove_from_group("resource_nodes")
		sprite.texture = load("res://assets/gothic/prop_chest_open.png")
		var players = get_tree().get_nodes_in_group("player")
		if players.size() > 0 and players[0].has_method("play_sound"):
			players[0].play_sound("chest")
		# Drop gold, potions, and a guaranteed Relic!
		for i in range(3):
			var loot = loot_scene.instantiate()
			loot.item_type = ["gold", "gems", "potions", "arrows"].pick_random()
			loot.amount = randi_range(5, 14) if loot.item_type == "gold" else 1
			loot.global_position = global_position + Vector2(randf_range(-16, 16), randf_range(-16, 16))
			get_parent().call_deferred("add_child", loot)
		var rel_drop = loot_scene.instantiate()
		rel_drop.item_type = "relic"
		rel_drop.relic_data = GameState.roll_relic(GameState.current_floor)
		rel_drop.global_position = global_position + Vector2(0, 12)
		get_parent().call_deferred("add_child", rel_drop)
		return

	var drop_count = randi_range(2, 3)
	for i in range(drop_count):
		var loot = loot_scene.instantiate()
		match node_type:
			NodeType.CRATE:
				loot.item_type = "wood" if randf() < 0.72 else "gold"
				loot.amount = randi_range(3, 8) if loot.item_type == "gold" else 1
			NodeType.ORE_VEIN:
				loot.item_type = "ore" if randf() < 0.82 else "gems"
			NodeType.HERB_BUSH:
				loot.item_type = "herb"
			NodeType.MUSHROOM:
				loot.item_type = "mushroom"
		loot.global_position = global_position + Vector2(randf_range(-12, 12), randf_range(-12, 12))
		get_parent().call_deferred("add_child", loot)

	queue_free()
