extends Node

var sounds: Dictionary = {}

func _ready() -> void:
	load_sound("slash", "res://assets/audio/sfx_slash.wav")
	load_sound("hit", "res://assets/audio/sfx_hit.wav")
	load_sound("bow", "res://assets/audio/sfx_bow.wav")
	load_sound("pickup", "res://assets/audio/sfx_pickup.wav")
	load_sound("craft", "res://assets/audio/sfx_craft.wav")

func load_sound(key: String, path: String) -> void:
	if ResourceLoader.exists(path):
		sounds[key] = load(path)

func play_sfx(key: String, volume_db: float = 0.0) -> void:
	if not sounds.has(key):
		return
	var player = AudioStreamPlayer.new()
	player.stream = sounds[key]
	player.volume_db = volume_db
	add_child(player)
	player.play()
	player.finished.connect(player.queue_free)
