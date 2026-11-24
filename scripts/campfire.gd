extends Node2D

@onready var light = $PointLight2D
@onready var prompt = $PromptLabel

var heal_accum: float = 0.0

func _ready() -> void:
	add_to_group("campfires")

func _process(delta: float) -> void:
	if light:
		light.energy = 1.35 + sin(Time.get_ticks_msec() / 120.0) * 0.22 + sin(Time.get_ticks_msec() / 55.0) * 0.08
	var players = get_tree().get_nodes_in_group("player")
	if players.size() > 0:
		var p = players[0]
		var near = global_position.distance_to(p.global_position) < 115.0
		if prompt:
			prompt.visible = near
		if near:
			heal_accum += delta
			if heal_accum >= 0.5:
				heal_accum = 0.0
				if p.has_method("heal_hp"):
					p.heal_hp(4.0)
				GameState.mana = min(GameState.get_eff_max_mana(), GameState.mana + 6.0)
				GameState.stats_changed.emit()
