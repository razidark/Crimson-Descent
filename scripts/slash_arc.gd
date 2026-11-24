extends Area2D

@export var damage: int = 35
@export var is_dagger: bool = false
@export var lifetime: float = 0.22
@export var knockback_force: float = 180.0

var hit_targets: Array[Node] = []
var dmg_num_scene = preload("res://scenes/damage_number.tscn")

@onready var sprite = $Sprite2D

func _ready() -> void:
	var mat = CanvasItemMaterial.new()
	mat.light_mode = CanvasItemMaterial.LIGHT_MODE_UNSHADED
	sprite.material = mat
	if is_dagger:
		sprite.texture = load("res://assets/gothic/vfx_dagger_right.png")
	else:
		sprite.texture = load("res://assets/gothic/vfx_slash_right.png")

	body_entered.connect(_on_body_entered)
	area_entered.connect(_on_area_entered)
	var tween = create_tween().set_parallel(true)
	tween.tween_property(self, "scale", scale * 1.35, lifetime).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "modulate:a", 0.0, lifetime)
	tween.chain().tween_callback(queue_free)

func _on_body_entered(body: Node2D) -> void:
	hit_target(body)

func _on_area_entered(area: Area2D) -> void:
	hit_target(area.get_parent())

func hit_target(node: Node) -> void:
	if not node or node in hit_targets:
		return
	if node.is_in_group("enemies") or node.is_in_group("resource_nodes") or node.is_in_group("boss"):
		hit_targets.append(node)
		if node.has_method("take_damage"):
			var is_crit = randf() < GameState.get_eff_crit()
			var final_dmg = int(damage * 1.6) if is_crit else damage
			node.take_damage(final_dmg)
			spawn_damage_number(node.global_position, final_dmg, is_crit, false)
			trigger_shake(0.32 if is_crit else 0.16)

			if (is_dagger or GameState.all_attacks_bleed) and node.has_method("apply_bleed"):
				node.apply_bleed(max(3, int(damage * 0.25)), 4.0)
			if node.has_method("apply_knockback"):
				var push_dir = (node.global_position - global_position).normalized()
				node.apply_knockback(push_dir * knockback_force)

			var leech = GameState.get_eff_lifesteal()
			if leech > 0 and not node.is_in_group("resource_nodes"):
				var players = get_tree().get_nodes_in_group("player")
				if players.size() > 0 and players[0].has_method("heal_hp"):
					players[0].heal_hp(leech)

func trigger_shake(amount: float) -> void:
	var cameras = get_tree().get_nodes_in_group("camera")
	if cameras.size() > 0 and cameras[0].has_method("add_trauma"):
		cameras[0].add_trauma(amount)

func spawn_damage_number(pos: Vector2, amount: int, is_crit: bool, is_bleed: bool) -> void:
	var num = dmg_num_scene.instantiate()
	num.global_position = pos + Vector2(randf_range(-10, 10), -18)
	get_parent().add_child(num)
	num.setup(amount, is_crit, is_bleed)
