import {
  Circle,
  GeoShape,
  intersections,
  Point,
} from '@mathigon/euclid'
import { NotStillDirection } from '../../types/types'
import { getVelocityFromDirection } from '../utils'
import { Entity, EntityColors } from './entity'

const BULLET_RADIUS = 0.20
const BULLET_SPEED = 800

export class Bullet implements Entity {
  body: Circle

  colors: EntityColors

  private readonly velocity: Point

  constructor(direction: NotStillDirection, position: Point, colors: EntityColors) {
    this.colors = colors
    this.velocity = getVelocityFromDirection(direction)

    this.body = new Circle(position, BULLET_RADIUS)
  }

  update(secondsPassed: number): void {
    this.body = this.body.shift(
      this.velocity.x * BULLET_SPEED * (secondsPassed ** 2),
      this.velocity.y * BULLET_SPEED * (secondsPassed ** 2),
    )
  }

  intersects(shape: GeoShape): boolean {
    return !!intersections(this.body, shape).length
  }
}
