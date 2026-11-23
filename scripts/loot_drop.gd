extends Node2D

@export var item_type: String = "wood"
@export var amount: int = 1

var target_player: Node2D = null
var magnet_range: float = 80.0
var pickup_range: float = 18.0
var speed: float = 260.0

@onready var sprite = $Sprite2D

func _ready() -> void:
	# Bounce tween when spawned
	var tween = create_tween()
	var jump_offset = Vector2(randf_range(-14, 14), randf_range(-14, 14))
	tween.tween_property(self, "position", position + jump_offset, 0.2).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	
	update_appearance()

func update_appearance() -> void:
	if not sprite:
		return
	var tex_path = "res://assets/loot_wood.png"
	match item_type:
		"wood": tex_path = "res://assets/loot_wood.png"
		"ore": tex_path = "res://assets/loot_ore.png"
		"herb": tex_path = "res://assets/loot_herb.png"
		"meat": tex_path = "res://assets/loot_meat.png"
		"coin": tex_path = "res://assets/loot_coin.png"
		"potion": tex_path = "res://assets/loot_potion_red.png"
	
	if ResourceLoader.exists(tex_path):
		sprite.texture = load(tex_path)

func _physics_process(delta: float) -> void:
	if not target_player:
		var players = get_tree().get_nodes_in_group("player")
		if players.size() > 0:
			var p = players[0]
			if global_position.distance_to(p.global_position) < magnet_range:
				target_player = p
		return

	var dist = global_position.distance_to(target_player.global_position)
	if dist > magnet_range * 1.5:
		target_player = null
		return

	global_position = global_position.move_toward(target_player.global_position, speed * delta)

	if dist < pickup_range:
		if target_player.has_method("add_inventory_item"):
			target_player.add_inventory_item(item_type, amount)
		queue_free()
