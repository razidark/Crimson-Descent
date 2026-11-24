extends Node2D

@export var item_type: String = "wood"
@export var amount: int = 1
var relic_data: Dictionary = {}

var target_player: Node2D = null
var magnet_range: float = 95.0
var pickup_range: float = 22.0
var speed: float = 280.0
var can_pickup: bool = false

@onready var sprite = $Sprite2D
@onready var beam = $Beam

func _ready() -> void:
	var mat = CanvasItemMaterial.new()
	mat.light_mode = CanvasItemMaterial.LIGHT_MODE_UNSHADED
	sprite.material = mat
	if beam:
		beam.material = mat
	
	var tween = create_tween()
	var jump_offset = Vector2(randf_range(-20, 20), randf_range(-20, 20))
	tween.tween_property(self, "position", position + jump_offset, 0.25).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_callback(func(): can_pickup = true)
	
	update_appearance()

func update_appearance() -> void:
	if not sprite:
		return
	if item_type == "relic" and not relic_data.is_empty():
		var path = relic_data.get("icon", "res://assets/gothic/relic_sword_blood.png")
		if ResourceLoader.exists(path):
			sprite.texture = load(path)
		sprite.scale = Vector2(0.85, 0.85)
		if beam:
			beam.visible = true
			var rarity = relic_data.get("rarity", "Common")
			beam.color = GameState.RARITY_COLORS.get(rarity, Color.WHITE)
			beam.color.a = 0.45
		magnet_range = 65.0
		return

	if beam:
		beam.visible = false
	sprite.scale = Vector2(0.7, 0.7)
	var tex_path = "res://assets/gothic/item_wood_bark.png"
	match item_type:
		"wood": tex_path = "res://assets/gothic/item_wood_bark.png"
		"ore": tex_path = "res://assets/gothic/item_ore_iron.png"
		"herb": tex_path = "res://assets/gothic/item_herb.png"
		"mushroom": tex_path = "res://assets/gothic/item_mushroom.png"
		"meat": tex_path = "res://assets/gothic/item_meat_fang.png"
		"bones": tex_path = "res://assets/gothic/item_bone.png"
		"gems": tex_path = "res://assets/gothic/item_gem_ruby.png"
		"gold": tex_path = "res://assets/gothic/item_ingot_gold.png"
		"potions": tex_path = "res://assets/gothic/item_potion_red.png"
		"arrows": tex_path = "res://assets/gothic/vfx_arrow_right.png"
	if ResourceLoader.exists(tex_path):
		sprite.texture = load(tex_path)

func _physics_process(delta: float) -> void:
	if not can_pickup:
		return
	sprite.position.y = sin(Time.get_ticks_msec() / 220.0 + position.y) * 2.5

	if not target_player:
		var players = get_tree().get_nodes_in_group("player")
		if players.size() > 0:
			var p = players[0]
			if global_position.distance_to(p.global_position) < magnet_range:
				target_player = p
		return

	var dist = global_position.distance_to(target_player.global_position)
	if dist > magnet_range * 1.6:
		target_player = null
		return

	global_position = global_position.move_toward(target_player.global_position, speed * delta)

	if dist < pickup_range:
		if item_type == "relic" and not relic_data.is_empty():
			if target_player.has_method("pickup_relic"):
				target_player.pickup_relic(relic_data)
		elif target_player.has_method("add_inventory_item"):
			var actual_type = "herb" if item_type == "mushroom" else item_type
			target_player.add_inventory_item(actual_type, amount)
		queue_free()
