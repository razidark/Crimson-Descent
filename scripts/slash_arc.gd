extends Area2D

@export var damage: int = 35
@export var lifetime: float = 0.25

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	area_entered.connect(_on_area_entered)
	var tween = create_tween().set_parallel(true)
	tween.tween_property(self, "scale", scale * 1.5, lifetime)
	tween.tween_property(self, "modulate:a", 0.0, lifetime)
	tween.chain().tween_callback(queue_free)

func _on_body_entered(body: Node2D) -> void:
	hit_target(body)

func _on_area_entered(area: Area2D) -> void:
	hit_target(area.get_parent())

func hit_target(node: Node) -> void:
	if node and node.is_in_group("enemies") and node.has_method("take_damage"):
		node.take_damage(damage)
