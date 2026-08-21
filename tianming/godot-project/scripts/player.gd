extends CharacterBody2D
class_name Player

signal health_changed(new_health: float)
signal died

@export var speed: float = 250.0
@export var max_health: float = 100.0
@export var attack_damage: float = 15.0
@export var attack_range: float = 50.0
@export var attack_cooldown: float = 0.5

var health: float = 100.0
var _attack_timer: float = 0.0
var _sprite: AnimatedSprite2D
var _attack_area: Area2D
var _is_attacking: bool = false

func _ready() -> void:
	health = max_health
	_sprite = $AnimatedSprite2D
	_attack_area = $AttackArea
	_attack_area.body_entered.connect(_on_attack_area_body_entered)

func _physics_process(delta: float) -> void:
	_attack_timer -= delta

	var direction := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")

	if direction.length() > 0:
		velocity = direction * speed
		_sprite.flip_h = direction.x < 0
		if not _is_attacking:
			_sprite.play("walk")
	else:
		velocity = Vector2.ZERO
		if not _is_attacking:
			_sprite.play("idle")

	move_and_slide()

	if Input.is_action_just_pressed("ui_accept") and _attack_timer <= 0:
		_attack()

func _attack() -> void:
	_is_attacking = true
	_attack_timer = attack_cooldown
	_sprite.play("attack")
	_attack_area.monitoring = true

func _on_animation_finished() -> void:
	_is_attacking = false
	_attack_area.monitoring = false

func _on_attack_area_body_entered(body: Node) -> void:
	if body.has_method("take_damage"):
		body.take_damage(attack_damage)

func take_damage(amount: float) -> void:
	health -= amount
	health_changed.emit(health)
	if health <= 0:
		health = 0
		died.emit()
		queue_free()
