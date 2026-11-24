extends Control

@onready var start_btn = $CenterContainer/VBox/BtnRow/StartBtn
@onready var how_btn = $CenterContainer/VBox/BtnRow/HowBtn
@onready var quit_btn = $CenterContainer/VBox/BtnRow/QuitBtn
@onready var instructions_panel = $InstructionsPanel
@onready var class_cards_row = $CenterContainer/VBox/ClassCardsRow
@onready var selected_desc = $CenterContainer/VBox/SelectedDesc

var selected_class: int = 0

func _ready() -> void:
	start_btn.pressed.connect(_on_start_pressed)
	how_btn.pressed.connect(func(): instructions_panel.visible = true)
	quit_btn.pressed.connect(func(): get_tree().quit())
	instructions_panel.get_node("VBox/CloseBtn").pressed.connect(func(): instructions_panel.visible = false)

	for i in range(4):
		var card = class_cards_row.get_node("Card%d" % i)
		var cls = GameState.CLASSES[i]
		card.get_node("VBox/Icon").texture = load(cls["sprite_0"])
		card.get_node("VBox/NameLabel").text = cls["name"]
		card.get_node("VBox/StatsLabel").text = "HP:%d  MP:%d  Atk:%d" % [int(cls["hp"]), int(cls["mana"]), cls["attack"]]
		var idx := i
		card.get_node("SelectBtn").pressed.connect(func(): select_class(idx))

	select_class(GameState.selected_class)

func select_class(idx: int) -> void:
	selected_class = idx
	var cls = GameState.CLASSES[idx]
	selected_desc.text = "%s — %s\n%s" % [cls["name"], cls["title"], cls["desc"]]
	for i in range(4):
		var card = class_cards_row.get_node("Card%d" % i)
		var btn = card.get_node("SelectBtn")
		btn.text = "SELECTED" if i == idx else "Choose"
		btn.modulate = Color(1.0, 0.4, 0.45, 1.0) if i == idx else Color(0.8, 0.8, 0.85, 1.0)

func _on_start_pressed() -> void:
	GameState.start_new_run(selected_class)
	get_tree().change_scene_to_file("res://scenes/world.tscn")
