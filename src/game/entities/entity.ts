import { Vec2 } from '../vec2'

export interface Entity {
  update(deltaTime: number): void,
  setDrawPoints(): void,
}

export abstract class Entity implements Entity {
  position = new Vec2(0, 0)

  velocity = new Vec2(0, 0)

  size = new Vec2(0, 0)

  setPositionTick(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime
    this.position.y += this.velocity.y * deltaTime
  }

  setVelocityTick(deltaTime: number): void {
    const speed = 6000
    this.velocity.x = speed * this.velocity.x * deltaTime
    this.velocity.y = speed * this.velocity.y * deltaTime
  }

  runTick(deltaTime: number): void {
    this.setVelocityTick(deltaTime)
    this.setPositionTick(deltaTime)
    this.setDrawPoints()
  }
}
