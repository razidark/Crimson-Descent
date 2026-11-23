extends Area2D

@export var damage: int = 25
@export var lifetime: float = 0.22

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	var tween = create_tween().set_parallel(true)
	tween.tween_property(self, "scale", scale * 1.3, lifetime)
	tween.tween_property(self, "modulate:a", 0.0, lifetime)
	tween.chain().tween_callback(queue_free)

func _on_body_entered(body: Node2D) -> void:
	if body.is_in_group("enemies") and body.has_method("take_damage"):
		body.take_damage(damage)
