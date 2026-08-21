extends Node2D

@onready var player: CharacterBody2D = $Player
@onready var camera: Camera2D = $Camera2D
@onready var health_bar: ProgressBar = $UI/HealthBar
@onready var health_label: Label = $UI/HealthLabel
@onready var score_label: Label = $UI/ScoreLabel
@onready var enemy_container: Node2D = $Enemies

var score: int = 0
var _enemy_scene: PackedScene = preload("res://scenes/enemy.tscn")

func _ready() -> void:
	camera.follow_target = player
	player.health_changed.connect(_on_player_health_changed)
	player.died.connect(_on_player_died)

func _process(delta: float) -> void:
	health_bar.value = (player.health / player.max_health) * 100
	health_label.text = "生命: %d / %d" % [int(player.health), int(player.max_health)]
	score_label.text = "积分: %d" % score

	if Input.is_action_just_pressed("ui_cancel"):
		get_tree().change_scene_to_file("res://scenes/menu.tscn")

func spawn_enemy(position: Vector2) -> void:
	var enemy = _enemy_scene.instantiate()
	enemy.global_position = position
	enemy_container.add_child(enemy)

func _on_player_health_changed(new_health: float) -> void:
	pass

func _on_player_died() -> void:
	await get_tree().create_timer(1.0).timeout
	get_tree().change_scene_to_file("res://scenes/menu.tscn")
