extends Area2D

@export var damage: int = 40
@export var arm_time: float = 1.0

var is_armed: bool = false
var has_triggered: bool = false

@onready var sprite = $Sprite2D
var dmg_num_scene = preload("res://scenes/damage_number.tscn")

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	var tween = create_tween()
	tween.tween_interval(arm_time)
	tween.tween_callback(func(): is_armed = true)

func _on_body_entered(body: Node2D) -> void:
	if not is_armed or has_triggered:
		return
	if body.is_in_group("enemies") or body.is_in_group("beasts") or body.is_in_group("boss"):
		has_triggered = true
		if body.has_method("take_damage"):
			body.take_damage(damage)
			spawn_damage_number(damage, true)
		
		# Spring trap animation
		sprite.scale = Vector2(1.3, 1.3)
		var tween = create_tween()
		tween.tween_property(sprite, "modulate:a", 0.0, 0.4)
		tween.tween_callback(queue_free)

func spawn_damage_number(amount: int, is_crit: bool) -> void:
	var num = dmg_num_scene.instantiate()
	num.global_position = global_position + Vector2(0, -14)
	get_parent().add_child(num)
	num.setup(amount, is_crit, false)
