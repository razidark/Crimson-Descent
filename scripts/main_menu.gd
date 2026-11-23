extends Control

@onready var start_btn = $CenterContainer/VBox/StartBtn
@onready var how_btn = $CenterContainer/VBox/HowBtn
@onready var quit_btn = $CenterContainer/VBox/QuitBtn
@onready var instructions_panel = $InstructionsPanel

func _ready() -> void:
	start_btn.pressed.connect(_on_start_pressed)
	how_btn.pressed.connect(_on_how_pressed)
	quit_btn.pressed.connect(_on_quit_pressed)
	instructions_panel.get_node("VBox/CloseBtn").pressed.connect(func(): instructions_panel.visible = false)

func _on_start_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/world.tscn")

func _on_how_pressed() -> void:
	instructions_panel.visible = true

func _on_quit_pressed() -> void:
	get_tree().quit()
