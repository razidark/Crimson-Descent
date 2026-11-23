extends CharacterBody2D

@export var speed: float = 240.0
@export var dash_speed: float = 650.0
@export var dash_duration: float = 0.2

var is_dashing: bool = false
var dash_timer: float = 0.0
var dash_dir: Vector2 = Vector2.ZERO

@onready var sprite = $Sprite2D
@onready var light = $PointLight2D

func _physics_process(dt: float) -> void:
	if is_dashing:
		dash_timer -= dt
		velocity = dash_dir * dash_speed
		move_and_slide()
		if dash_timer <= 0.0:
			is_dashing = false
		return

	var input_vec = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	if input_vec != Vector2.ZERO:
		velocity = input_vec.normalized() * speed
		if input_vec.x < 0:
			sprite.flip_h = true
		elif input_vec.x > 0:
			sprite.flip_h = false
	else:
		velocity = Vector2.ZERO

	# Space to Dash
	if Input.is_action_just_pressed("ui_accept") and not is_dashing:
		var dir = input_vec if input_vec != Vector2.ZERO else (Vector2.LEFT if sprite.flip_h else Vector2.RIGHT)
		is_dashing = true
		dash_dir = dir.normalized()
		dash_timer = dash_duration

	move_and_slide()
