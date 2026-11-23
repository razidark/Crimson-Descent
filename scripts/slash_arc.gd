extends Area2D

@export var damage: int = 25
@export var lifetime: float = 0.18

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	var tween = create_tween()
	tween.tween_property(self, "scale", Vector2(1.5, 1.5), lifetime)
	tween.parallel().tween_property($Sprite2D, "modulate:a", 0.0, lifetime)
	tween.tween_callback(queue_free)

func _on_body_entered(body: Node2D) -> void:
	if body.is_in_group("enemies") and body.has_method("take_damage"):
		body.take_damage(damage)
