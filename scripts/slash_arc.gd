extends Area2D

@export var damage: int = 35
@export var is_dagger: bool = false
@export var lifetime: float = 0.22

var dmg_num_scene = preload("res://scenes/damage_number.tscn")

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	area_entered.connect(_on_area_entered)
	var tween = create_tween().set_parallel(true)
	tween.tween_property(self, "scale", scale * 1.4, lifetime)
	tween.tween_property(self, "modulate:a", 0.0, lifetime)
	tween.chain().tween_callback(queue_free)

func _on_body_entered(body: Node2D) -> void:
	hit_target(body)

func _on_area_entered(area: Area2D) -> void:
	hit_target(area.get_parent())

func hit_target(node: Node) -> void:
	if node and (node.is_in_group("enemies") or node.is_in_group("resource_nodes")):
		if node.has_method("take_damage"):
			var is_crit = randf() < 0.20
			var final_dmg = int(damage * 1.5) if is_crit else damage
			node.take_damage(final_dmg)
			spawn_damage_number(final_dmg, is_crit, false)
			
			if is_dagger and node.has_method("apply_bleed"):
				node.apply_bleed(3, 4.0)

func spawn_damage_number(amount: int, is_crit: bool, is_bleed: bool) -> void:
	var num = dmg_num_scene.instantiate()
	num.global_position = global_position + Vector2(randf_range(-10, 10), -12)
	get_parent().add_child(num)
	num.setup(amount, is_crit, is_bleed)
