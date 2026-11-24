extends Area2D

@export var speed: float = 360.0
@export var damage: int = 30
var velocity: Vector2 = Vector2.ZERO
var lifetime: float = 2.0

var dmg_num_scene = preload("res://scenes/damage_number.tscn")
@onready var sprite = $Sprite2D

func _ready() -> void:
	var mat = CanvasItemMaterial.new()
	mat.light_mode = CanvasItemMaterial.LIGHT_MODE_UNSHADED
	sprite.material = mat
	sprite.texture = load("res://assets/gothic/vfx_magic_bolt.png")
	body_entered.connect(_on_body_entered)

func setup(dir: Vector2) -> void:
	velocity = dir.normalized() * speed

func _physics_process(delta: float) -> void:
	# Gentle homing toward nearest enemy
	var nearest: Node2D = null
	var best_d := 220.0
	for e in get_tree().get_nodes_in_group("enemies"):
		if is_instance_valid(e):
			var d = global_position.distance_to(e.global_position)
			if d < best_d:
				best_d = d
				nearest = e
	if nearest:
		var desired = (nearest.global_position - global_position).normalized() * speed
		velocity = velocity.lerp(desired, 4.0 * delta)

	position += velocity * delta
	lifetime -= delta
	if lifetime <= 0:
		queue_free()

func _on_body_entered(body: Node2D) -> void:
	if body.is_in_group("enemies") or body.is_in_group("resource_nodes") or body.is_in_group("boss"):
		if body.has_method("take_damage"):
			var is_crit = randf() < GameState.get_eff_crit()
			var final_dmg = int(damage * 1.5) if is_crit else damage
			body.take_damage(final_dmg)
			if body.has_method("apply_chill"):
				body.apply_chill(2.5)
			var num = dmg_num_scene.instantiate()
			num.global_position = body.global_position + Vector2(0, -16)
			get_parent().add_child(num)
			num.setup(final_dmg, is_crit, false, "", Color(0.55, 0.9, 1.0, 1.0))
		queue_free()
	elif body is StaticBody2D:
		queue_free()
