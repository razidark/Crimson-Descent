extends Panel

@onready var player_marker = $PlayerMarker
var map_world_size: Vector2 = Vector2(2400, 1200)

func _process(_delta: float) -> void:
	var players = get_tree().get_nodes_in_group("player")
	if players.size() > 0:
		var p = players[0]
		var px_ratio = clamp(p.global_position.x / map_world_size.x, 0.0, 1.0)
		var py_ratio = clamp(p.global_position.y / map_world_size.y, 0.0, 1.0)
		
		# Map bounds inside 130x70 panel
		player_marker.position = Vector2(px_ratio * (size.x - 8), py_ratio * (size.y - 8))
