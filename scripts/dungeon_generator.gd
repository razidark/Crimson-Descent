extends Node2D

const MAP_W: int = 44
const MAP_H: int = 32
const TILE_SIZE: int = 64

# 0 = void, 1 = floor, 2 = wall, 3 = boss_carpet
var grid: Array = []
var explored: Array = []
var rooms: Array[Rect2i] = []

var floor_layer: TileMapLayer
var wall_layer: TileMapLayer

var player_scene = preload("res://scenes/player.tscn")
var campfire_scene = preload("res://scenes/campfire.tscn")
var resource_scene = preload("res://scenes/resource_node.tscn")
var enemy_scene = preload("res://scenes/enemy.tscn")
var beast_scene = preload("res://scenes/wild_beast.tscn")
var boss_scene = preload("res://scenes/boss_behemoth.tscn")

func _ready() -> void:
	add_to_group("dungeon")
	RenderingServer.set_default_clear_color(Color(0.035, 0.03, 0.05, 1.0))
	if not GameState.run_active:
		GameState.start_new_run(GameState.selected_class)
	
	setup_tilemap_layers()
	generate_dungeon()
	render_tiles()
	populate_dungeon()

func setup_tilemap_layers() -> void:
	var ts = TileSet.new()
	ts.tile_size = Vector2i(TILE_SIZE, TILE_SIZE)
	ts.add_physics_layer()
	ts.add_occlusion_layer()

	var atlas = TileSetAtlasSource.new()
	atlas.texture = load("res://assets/gothic/dungeon_atlas.png")
	atlas.texture_region_size = Vector2i(TILE_SIZE, TILE_SIZE)
	ts.add_source(atlas, 0)

	# Row 0: Floors (0..3)
	for cx in range(4):
		atlas.create_tile(Vector2i(cx, 0))

	# Row 1: Walls (0..4) with collision & light occlusion
	var poly = PackedVector2Array([
		Vector2(-32, -32), Vector2(32, -32),
		Vector2(32, 32), Vector2(-32, 32)
	])
	for cx in range(5):
		var coords = Vector2i(cx, 1)
		atlas.create_tile(coords)
		var td = atlas.get_tile_data(coords, 0)
		td.add_collision_polygon(0)
		td.set_collision_polygon_points(0, 0, poly)
		var occ = OccluderPolygon2D.new()
		occ.polygon = poly
		td.set_occluder(0, occ)

	floor_layer = TileMapLayer.new()
	floor_layer.name = "FloorLayer"
	floor_layer.tile_set = ts
	floor_layer.z_index = -2
	add_child(floor_layer)

	wall_layer = TileMapLayer.new()
	wall_layer.name = "WallLayer"
	wall_layer.tile_set = ts
	wall_layer.z_index = 0
	add_child(wall_layer)

func generate_dungeon() -> void:
	grid.clear()
	explored.clear()
	rooms.clear()
	for y in range(MAP_H):
		var row = []
		var erow = []
		row.resize(MAP_W)
		erow.resize(MAP_W)
		row.fill(0)
		erow.fill(false)
		grid.append(row)
		explored.append(erow)

	var target_rooms = 7
	var attempts = 0
	while rooms.size() < target_rooms and attempts < 140:
		attempts += 1
		var rw = randi_range(6, 10)
		var rh = randi_range(5, 8)
		var rx = randi_range(2, MAP_W - rw - 3)
		var ry = randi_range(2, MAP_H - rh - 3)
		var new_rect = Rect2i(rx, ry, rw, rh)
		var padded = new_rect.grow(2)
		var overlaps = false
		for r in rooms:
			if padded.intersects(r):
				overlaps = true
				break
		if not overlaps:
			rooms.append(new_rect)
			carve_room(new_rect)

	# Connect consecutive rooms with 2-tile-wide corridors
	for i in range(1, rooms.size()):
		var prev_c = rooms[i - 1].get_center()
		var cur_c = rooms[i].get_center()
		carve_corridor(prev_c, cur_c)

	# Mark Boss Room carpet
	if rooms.size() > 1:
		var boss_room = rooms[rooms.size() - 1]
		for y in range(boss_room.position.y + 1, boss_room.end.y - 1):
			for x in range(boss_room.position.x + 1, boss_room.end.x - 1):
				grid[y][x] = 3

	# Surround floor tiles with walls
	for y in range(1, MAP_H - 1):
		for x in range(1, MAP_W - 1):
			if grid[y][x] == 0:
				var touches_floor = false
				for dy in range(-1, 2):
					for dx in range(-1, 2):
						if grid[y + dy][x + dx] in [1, 3]:
							touches_floor = true
							break
					if touches_floor:
						break
				if touches_floor:
					grid[y][x] = 2

func carve_room(r: Rect2i) -> void:
	for y in range(r.position.y, r.end.y):
		for x in range(r.position.x, r.end.x):
			grid[y][x] = 1

func carve_corridor(a: Vector2i, b: Vector2i) -> void:
	var x = a.x
	var y = a.y
	while x != b.x:
		grid[y][x] = 1
		if y + 1 < MAP_H - 1:
			grid[y + 1][x] = 1
		x += 1 if b.x > x else -1
	while y != b.y:
		grid[y][x] = 1
		if x + 1 < MAP_W - 1:
			grid[y][x + 1] = 1
		y += 1 if b.y > y else -1

func render_tiles() -> void:
	var fl = GameState.current_floor
	var floor_coord = Vector2i(0, 0) # Crypt Stone
	var wall_coord = Vector2i(0, 1)  # Mossy Stone
	if fl == 2:
		floor_coord = Vector2i(1, 0) # Oak Parquet
		wall_coord = Vector2i(1, 1)  # Bookshelf
	elif fl >= 3:
		floor_coord = Vector2i(0, 0)
		wall_coord = Vector2i(3, 1)  # Red Marble

	for y in range(MAP_H):
		for x in range(MAP_W):
			var cell = grid[y][x]
			if cell == 1:
				var fc = Vector2i(2, 0) if rooms.size() > 0 and rooms[0].has_point(Vector2i(x, y)) else floor_coord
				floor_layer.set_cell(Vector2i(x, y), 0, fc)
			elif cell == 3:
				floor_layer.set_cell(Vector2i(x, y), 0, Vector2i(3, 0)) # Crimson Carpet
			elif cell == 2:
				var wc = wall_coord
				if fl == 1 and randf() < 0.25:
					wc = Vector2i(2, 1) # Castle brick mix
				elif fl >= 3 and randf() < 0.22:
					wc = Vector2i(4, 1) # Gothic arch
				wall_layer.set_cell(Vector2i(x, y), 0, wc)

func tile_to_world(t: Vector2i) -> Vector2:
	return Vector2(t.x * TILE_SIZE + TILE_SIZE * 0.5, t.y * TILE_SIZE + TILE_SIZE * 0.5)

func populate_dungeon() -> void:
	if rooms.is_empty():
		return

	# Room 0: Sanctuary / Start
	var start_room = rooms[0]
	var start_pos = tile_to_world(start_room.get_center())
	var player = player_scene.instantiate()
	player.global_position = start_pos
	add_child(player)

	var camp = campfire_scene.instantiate()
	camp.global_position = start_pos + Vector2(96, -32)
	add_child(camp)

	# Starter supply barrels
	for offset in [Vector2(-96, -48), Vector2(-96, 48)]:
		var barrel = resource_scene.instantiate()
		barrel.node_type = 0 # CRATE/BARREL
		barrel.global_position = start_pos + offset
		add_child(barrel)

	# Middle Rooms: Resources, Wildlife, Monsters, Chests
	for i in range(1, rooms.size() - 1):
		var r = rooms[i]
		var center = tile_to_world(r.get_center())

		# Resource nodes (2-4 per room)
		var res_count = randi_range(2, 4)
		for k in range(res_count):
			var rn = resource_scene.instantiate()
			rn.node_type = [0, 1, 2, 4].pick_random() # Crate, Ore, Herb, Mushroom
			rn.global_position = random_point_in_room(r)
			add_child(rn)

		# Treasure Chest (60% chance per room)
		if randf() < 0.65:
			var chest = resource_scene.instantiate()
			chest.node_type = 3 # CHEST
			chest.global_position = center + Vector2(randf_range(-40, 40), randf_range(-40, 40))
			add_child(chest)

		# Roaming Wildlife to hunt (1-2 per room)
		var beast_count = randi_range(1, 2)
		for b in range(beast_count):
			var beast = beast_scene.instantiate()
			beast.beast_type = randi() % 3
			beast.is_hostile = (beast.beast_type == 1) # Spider/Predator
			beast.global_position = random_point_in_room(r)
			add_child(beast)

		# Undead Enemies (2-4 per room, scaling with floor)
		var enemy_count = randi_range(2, 3) + min(2, GameState.current_floor - 1)
		for e in range(enemy_count):
			var enemy = enemy_scene.instantiate()
			enemy.enemy_type = randi() % 4 # Bat, Skeleton, Zombie, Ghost
			enemy.global_position = random_point_in_room(r)
			add_child(enemy)

	# Final Room: Boss Arena
	if rooms.size() > 1:
		var br = rooms[rooms.size() - 1]
		var b_pos = tile_to_world(br.get_center())
		var boss = boss_scene.instantiate()
		boss.global_position = b_pos
		add_child(boss)

		# Reward Chests in Boss room corners
		for c_off in [Vector2(-110, -80), Vector2(110, -80)]:
			var chest = resource_scene.instantiate()
			chest.node_type = 3
			chest.global_position = b_pos + c_off
			add_child(chest)

func random_point_in_room(r: Rect2i) -> Vector2:
	var tx = randi_range(r.position.x + 1, max(r.position.x + 1, r.end.x - 2))
	var ty = randi_range(r.position.y + 1, max(r.position.y + 1, r.end.y - 2))
	return tile_to_world(Vector2i(tx, ty))

func reveal_around(world_pos: Vector2, radius_tiles: int = 5) -> void:
	var cx = int(world_pos.x / TILE_SIZE)
	var cy = int(world_pos.y / TILE_SIZE)
	for dy in range(-radius_tiles, radius_tiles + 1):
		for dx in range(-radius_tiles, radius_tiles + 1):
			var nx = cx + dx
			var ny = cy + dy
			if nx >= 0 and nx < MAP_W and ny >= 0 and ny < MAP_H:
				if dx * dx + dy * dy <= radius_tiles * radius_tiles:
					explored[ny][nx] = true
