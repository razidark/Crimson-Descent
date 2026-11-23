extends Node2D

@export var bat_scene: PackedScene = preload("res://scenes/enemy.tscn")
@export var spawn_interval: float = 3.5
@export var max_enemies: int = 25

var timer: float = 1.0
var wave: int = 1
var player: Node2D = null

func _ready() -> void:
	pass

func _process(delta: float) -> void:
	if not player:
		var players = get_tree().get_nodes_in_group("player")
		if players.size() > 0:
			player = players[0]
		return

	timer -= delta
	if timer <= 0.0:
		timer = max(1.2, spawn_interval - wave * 0.15)
		spawn_wave()

func spawn_wave() -> void:
	var enemies = get_tree().get_nodes_in_group("enemies")
	if enemies.size() >= max_enemies:
		return

	var spawn_count = 2 + int(wave / 2.0)
	wave += 1

	for i in range(spawn_count):
		var angle = randf_range(0, TAU)
		var dist = randf_range(350, 550)
		var spawn_pos = player.global_position + Vector2.from_angle(angle) * dist
		
		var enemy = bat_scene.instantiate()
		enemy.global_position = spawn_pos
		get_parent().add_child(enemy)
