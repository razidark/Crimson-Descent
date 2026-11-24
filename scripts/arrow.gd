extends Area2D

@export var speed: float = 540.0
@export var damage: int = 28
@export var pierce: int = 0
var velocity: Vector2 = Vector2.ZERO
var lifetime: float = 1.6
var hit_list: Array[Node] = []

var dmg_num_scene = preload("res://scenes/damage_number.tscn")
@onready var sprite = $Sprite2D

func _ready() -> void:
	var mat = CanvasItemMaterial.new()
	mat.light_mode = CanvasItemMaterial.LIGHT_MODE_UNSHADED
	sprite.material = mat
	sprite.texture = load("res://assets/gothic/vfx_arrow_right.png")
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
	if not node or node in hit_list:
		return
	if node.is_in_group("enemies") or node.is_in_group("resource_nodes") or node.is_in_group("boss"):
		hit_list.append(node)
		if node.has_method("take_damage"):
			var is_crit = randf() < GameState.get_eff_crit()
			var final_dmg = int(damage * 1.6) if is_crit else damage
			node.take_damage(final_dmg)
			spawn_damage_number(node.global_position, final_dmg, is_crit)
			if GameState.all_attacks_bleed and node.has_method("apply_bleed"):
				node.apply_bleed(max(2, int(damage * 0.2)), 3.5)
		if pierce > 0:
			pierce -= 1
		else:
			queue_free()
	elif node is StaticBody2D:
		queue_free()

func spawn_damage_number(pos: Vector2, amount: int, is_crit: bool) -> void:
	var num = dmg_num_scene.instantiate()
	num.global_position = pos + Vector2(0, -14)
	get_parent().add_child(num)
	num.setup(amount, is_crit, false)
