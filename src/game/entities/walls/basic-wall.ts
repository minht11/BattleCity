import { Point, Rectangle } from '@mathigon/euclid'
import { BaseTank } from '../tanks/base-tank'
import { Entity } from '../entity'

export class BasicWall implements Entity {
  colors = {
    fill: '#40390d',
    border: '#fffce5',
    shadow: 'transparent',
  }

  body: Rectangle

  isDestroyed = false

  constructor(position: Point) {
    this.body = new Rectangle(position, 1, 1)
  }

  protected markAsDestroyed(): void {
    this.isDestroyed = true
  }

  collide(entity: Entity): void {
    if (
      entity instanceof BaseTank
      && entity.bullet?.intersects(this.body)
    ) {
      entity.destroyBullet()
      this.markAsDestroyed()
    }
  }
}
