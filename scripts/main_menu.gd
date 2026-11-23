extends Control

@onready var start_btn = $CenterContainer/VBox/StartBtn
@onready var how_btn = $CenterContainer/VBox/HowBtn
@onready var quit_btn = $CenterContainer/VBox/QuitBtn
@onready var instructions_panel = $InstructionsPanel
@onready var class_btn = $CenterContainer/VBox/ClassContainer/ClassBtn
@onready var class_icon = $CenterContainer/VBox/ClassContainer/HeroIcon

var selected_class: int = 0
var class_names: Array[String] = ["Blood Knight", "Shadow Mage", "Phantom Rogue", "Crypt Cleric"]

func _ready() -> void:
	start_btn.pressed.connect(_on_start_pressed)
	how_btn.pressed.connect(_on_how_pressed)
	quit_btn.pressed.connect(_on_quit_pressed)
	class_btn.pressed.connect(_on_cycle_class)
	instructions_panel.get_node("VBox/CloseBtn").pressed.connect(func(): instructions_panel.visible = false)
	update_class_display()

func _on_cycle_class() -> void:
	selected_class = (selected_class + 1) % 4
	update_class_display()

func update_class_display() -> void:
	class_btn.text = "Class: %s (Click to Change)" % class_names[selected_class]
	var path = "res://assets/hero_class_%d.png" % selected_class
	if ResourceLoader.exists(path):
		class_icon.texture = load(path)

func _on_start_pressed() -> void:
	# Save choice to global or copy chosen class sprite
	var src_tex = "res://assets/hero_class_%d.png" % selected_class
	var p_scene = load("res://scenes/world.tscn").instantiate()
	var player = p_scene.get_node_or_null("Player")
	if player:
		var spr = player.get_node_or_null("Sprite2D")
		if spr:
			spr.texture = load(src_tex)
	get_tree().root.add_child(p_scene)
	get_tree().current_scene.queue_free()
	get_tree().current_scene = p_scene

func _on_how_pressed() -> void:
	instructions_panel.visible = true

func _on_quit_pressed() -> void:
	get_tree().quit()
