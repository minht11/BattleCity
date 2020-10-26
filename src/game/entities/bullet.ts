import { Direction } from '../../types/types'
import { GameEntity } from './game-entity'
import { Vec2 } from '../vec2'

const BULLET_SPEED = 400

export class Bullet implements GameEntity {
  radius = 0.35

  velocity = new Vec2(1, 1)

  constructor(private direction: Omit<Direction, Direction.STILL>, public position: Vec2) {
    if (direction === Direction.UP) {
      this.velocity.set(0, -1)
    }
    if (direction === Direction.DOWN) {
      this.velocity.set(0, 1)
    }
    if (direction === Direction.LEFT) {
      this.velocity.set(0, -1)
    }
    if (direction === Direction.RIGHT) {
      this.velocity.set(0, 1)
    }
  }

  update(secondsPassed: number): void {
    this.position.x += this.velocity.x * BULLET_SPEED * (secondsPassed ** 2)
    this.position.y += this.velocity.y * BULLET_SPEED * (secondsPassed ** 2)
  }
}
