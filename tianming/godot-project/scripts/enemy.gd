extends Node2D
class_name Enemy

@export var speed: float = 80.0
@export var health: float = 30.0
@export var damage: float = 10.0
@export var detection_range: float = 300.0

var target: CharacterBody2D
var _sprite: Sprite2D
var _attack_timer: float = 0.0

func _ready() -> void:
	_sprite = $Sprite2D

func _physics_process(delta: float) -> void:
	_attack_timer -= delta

	if target == null:
		_find_target()
		return

	var distance := global_position.distance_to(target.global_position)
	if distance <= detection_range:
		var direction := (target.global_position - global_position).normalized()
		position += direction * speed * delta
		_sprite.flip_h = direction.x < 0

		if distance < 40.0 and _attack_timer <= 0:
			_attack_timer = 1.0
			if target.has_method("take_damage"):
				target.take_damage(damage)

func _find_target() -> void:
	var players := get_tree().get_nodes_in_group("player")
	if players.size() > 0:
		target = players[0]

func take_damage(amount: float) -> void:
	health -= amount
	if health <= 0:
		queue_free()
