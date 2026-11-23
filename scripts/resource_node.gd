extends StaticBody2D

enum NodeType { CRATE, ORE_VEIN, HERB_BUSH, CHEST }
@export var node_type: NodeType = NodeType.CRATE
@export var hits_to_break: int = 3

var current_hits: int = 0
var loot_scene = preload("res://scenes/loot_drop.tscn")

@onready var sprite = $Sprite2D
@onready var interact_label = $InteractLabel

func _ready() -> void:
	add_to_group("resource_nodes")
	current_hits = hits_to_break
	update_appearance()

func update_appearance() -> void:
	if not sprite:
		return
	var path = "res://assets/prop_crate.png"
	match node_type:
		NodeType.CRATE: path = "res://assets/prop_crate.png"
		NodeType.ORE_VEIN: path = "res://assets/prop_barrel.png"
		NodeType.HERB_BUSH: path = "res://assets/loot_herb.png"
		NodeType.CHEST: path = "res://assets/prop_chest.png"
	if ResourceLoader.exists(path):
		sprite.texture = load(path)

func take_damage(_amount: int) -> void:
	current_hits -= 1
	# Wobble and white flash effect
	sprite.modulate = Color(2.5, 2.5, 2.5, 1)
	var tween = create_tween()
	tween.tween_property(sprite, "modulate", Color(1, 1, 1, 1), 0.12)
	tween.parallel().tween_property(sprite, "rotation", randf_range(-0.15, 0.15), 0.06)
	tween.chain().tween_property(sprite, "rotation", 0.0, 0.06)

	if current_hits <= 0:
		break_and_drop()

func break_and_drop() -> void:
	var drop_count = randi_range(2, 4)
	for i in range(drop_count):
		var loot = loot_scene.instantiate()
		match node_type:
			NodeType.CRATE:
				loot.item_type = "wood" if randf() < 0.8 else "coin"
			NodeType.ORE_VEIN:
				loot.item_type = "ore" if randf() < 0.85 else "gem"
			NodeType.HERB_BUSH:
				loot.item_type = "herb"
			NodeType.CHEST:
				loot.item_type = ["ore", "potion", "coin", "gem"].pick_random()
		loot.global_position = global_position + Vector2(randf_range(-10, 10), randf_range(-10, 10))
		get_parent().call_deferred("add_child", loot)

	queue_free()
