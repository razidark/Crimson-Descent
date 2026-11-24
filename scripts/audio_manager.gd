extends Node

var sounds: Dictionary = {}

func _ready() -> void:
	load_sound("slash", "res://assets/audio/sfx_slash.wav")
	load_sound("hit", "res://assets/audio/sfx_hit.wav")
	load_sound("bow", "res://assets/audio/sfx_bow.wav")
	load_sound("pickup", "res://assets/audio/sfx_pickup.wav")
	load_sound("craft", "res://assets/audio/sfx_craft.wav")
	load_sound("levelup", "res://assets/audio/sfx_levelup.wav")
	load_sound("chest", "res://assets/audio/sfx_chest.wav")
	load_sound("dash", "res://assets/audio/sfx_dash.wav")
	load_sound("magic", "res://assets/audio/sfx_magic.wav")

func load_sound(key: String, path: String) -> void:
	if ResourceLoader.exists(path):
		sounds[key] = load(path)

func play_sfx(key: String, volume_db: float = -4.0, pitch_rand: float = 0.08) -> void:
	if GameState.sound_muted or not sounds.has(key):
		return
	var player = AudioStreamPlayer.new()
	player.stream = sounds[key]
	player.volume_db = volume_db
	player.pitch_scale = randf_range(1.0 - pitch_rand, 1.0 + pitch_rand)
	add_child(player)
	player.play()
	player.finished.connect(player.queue_free)
