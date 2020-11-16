import {
  Circle,
  GeoShape,
  intersections,
  Point,
} from '@mathigon/euclid'
import { Direction } from '../../types/types'
import { Entity } from './entity'

const BULLET_RADIUS = 0.35
const BULLET_SPEED = 900

export class Bullet implements Entity {
  body: Circle

  private readonly velocity: Point

  constructor(direction: Omit<Direction, Direction.STILL>, position: Point) {
    switch (direction) {
      case Direction.DOWN:
        this.velocity = new Point(0, 1)
        break
      case Direction.LEFT:
        this.velocity = new Point(-1, 0)
        break
      case Direction.RIGHT:
        this.velocity = new Point(1, 0)
        break
      default:
        this.velocity = new Point(0, -1)
        break
    }

    this.body = new Circle(position, BULLET_RADIUS)
  }

  update(secondsPassed: number): void {
    this.body = this.body.shift(
      this.velocity.x * BULLET_SPEED * (secondsPassed ** 2),
      this.velocity.y * BULLET_SPEED * (secondsPassed ** 2),
    )
  }

  checkIfItDidHit(shape: GeoShape): boolean {
    return !!intersections(this.body, shape).length
  }
}
