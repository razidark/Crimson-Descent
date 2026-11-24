extends Panel

@onready var map_tex_rect = $MapTexture
var img: Image
var tex: ImageTexture
var last_tile: Vector2i = Vector2i(-99, -99)

func _ready() -> void:
	img = Image.create(44, 32, false, Image.FORMAT_RGBA8)
	img.fill(Color(0.04, 0.03, 0.06, 0.85))
	tex = ImageTexture.create_from_image(img)
	if map_tex_rect:
		map_tex_rect.texture = tex

func _process(_delta: float) -> void:
	var players = get_tree().get_nodes_in_group("player")
	var dungeons = get_tree().get_nodes_in_group("dungeon")
	if players.is_empty() or dungeons.is_empty():
		return

	var p = players[0]
	var d = dungeons[0]
	var pt = Vector2i(int(p.global_position.x / 64.0), int(p.global_position.y / 64.0))
	if pt != last_tile:
		last_tile = pt
		d.reveal_around(p.global_position, 5)
		redraw_map(d, pt)

func redraw_map(d: Node, pt: Vector2i) -> void:
	var w = d.MAP_W
	var h = d.MAP_H
	for y in range(h):
		for x in range(w):
			if not d.explored[y][x]:
				img.set_pixel(x, y, Color(0.04, 0.03, 0.06, 0.9))
			else:
				var cell = d.grid[y][x]
				if cell == 2:
					img.set_pixel(x, y, Color(0.38, 0.36, 0.45, 1.0))
				elif cell == 3:
					img.set_pixel(x, y, Color(0.55, 0.12, 0.18, 1.0))
				elif cell == 1:
					img.set_pixel(x, y, Color(0.18, 0.18, 0.24, 1.0))
				else:
					img.set_pixel(x, y, Color(0.04, 0.03, 0.06, 0.9))

	# Mark campfires (orange) and bosses (red) if explored
	for c in get_tree().get_nodes_in_group("campfires"):
		var ct = Vector2i(int(c.global_position.x / 64.0), int(c.global_position.y / 64.0))
		if ct.x >= 0 and ct.x < w and ct.y >= 0 and ct.y < h and d.explored[ct.y][ct.x]:
			img.set_pixel(ct.x, ct.y, Color(1.0, 0.65, 0.2, 1.0))
	for b in get_tree().get_nodes_in_group("boss"):
		var bt = Vector2i(int(b.global_position.x / 64.0), int(b.global_position.y / 64.0))
		if bt.x >= 0 and bt.x < w and bt.y >= 0 and bt.y < h and d.explored[bt.y][bt.x]:
			img.set_pixel(bt.x, bt.y, Color(1.0, 0.15, 0.25, 1.0))

	# Player position (bright cyan-white)
	if pt.x >= 0 and pt.x < w and pt.y >= 0 and pt.y < h:
		img.set_pixel(pt.x, pt.y, Color(0.3, 1.0, 0.95, 1.0))

	tex.update(img)
