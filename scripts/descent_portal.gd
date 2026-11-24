extends Area2D

var player_inside: bool = false
@onready var sprite = $Sprite2D
@onready var prompt = $PromptLabel

func _ready() -> void:
	body_entered.connect(func(b): if b.is_in_group("player"): player_inside = true; prompt.visible = true)
	body_exited.connect(func(b): if b.is_in_group("player"): player_inside = false; prompt.visible = false)

func _process(delta: float) -> void:
	sprite.rotation += delta * 1.4

func _unhandled_input(event: InputEvent) -> void:
	if player_inside and event is InputEventKey and event.pressed and event.keycode == KEY_F:
		pass # Portal uses E or walk-on? Let's allow [R] or clicking E? Wait: E is Ultimate, so let's use [R] Descend!
	if player_inside and event is InputEventKey and event.pressed and event.keycode == KEY_R:
		descend_next_floor()

func descend_next_floor() -> void:
	GameState.current_floor += 1
	GameState.hp = min(GameState.get_eff_max_hp(), GameState.hp + 25.0)
	get_tree().reload_current_scene()
