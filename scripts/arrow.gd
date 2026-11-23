extends Area2D

@export var speed: float = 480.0
@export var damage: int = 28
var velocity: Vector2 = Vector2.ZERO
var lifetime: float = 1.8

var dmg_num_scene = preload("res://scenes/damage_number.tscn")

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	area_entered.connect(_on_area_entered)

func setup(dir: Vector2) -> void:
	velocity = dir.normalized() * speed
	rotation = dir.angle()

func _physics_process(delta: float) -> void:
	position += velocity * delta
	lifetime -= delta
	if lifetime <= 0:
		queue_free()

func _on_body_entered(body: Node2D) -> void:
	hit(body)

func _on_area_entered(area: Area2D) -> void:
	hit(area.get_parent())

func hit(node: Node) -> void:
	if node.is_in_group("enemies") or node.is_in_group("resource_nodes"):
		if node.has_method("take_damage"):
			var is_crit = randf() < 0.25
			var final_dmg = int(damage * 1.5) if is_crit else damage
			node.take_damage(final_dmg)
			spawn_damage_number(final_dmg, is_crit, false)
		queue_free()
	elif node is StaticBody2D: # Walls
		queue_free()

func spawn_damage_number(amount: int, is_crit: bool, is_bleed: bool) -> void:
	var num = dmg_num_scene.instantiate()
	num.global_position = global_position + Vector2(0, -10)
	get_parent().add_child(num)
	num.setup(amount, is_crit, is_bleed)
