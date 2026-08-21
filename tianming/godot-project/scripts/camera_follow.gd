extends Camera2D

@export var follow_target: Node2D
@export var smooth_speed: float = 5.0
@export var offset: Vector2 = Vector2(0, -20)

func _physics_process(delta: float) -> void:
	if follow_target == null:
		return

	var target_pos := follow_target.global_position + offset
	global_position = global_position.lerp(target_pos, smooth_speed * delta)
