import { Point, Rectangle } from '@mathigon/euclid'
import { BaseTank } from '../tanks/base-tank'
import { Entity } from '../entity'

export class BasicWall implements Entity {
  body: Rectangle

  protected doesItNeedsToBeRemoved = false

  constructor(position: Point) {
    this.body = new Rectangle(position, 1, 1)
  }

  protected markAsNeedToBeRemoved(): void {
    this.doesItNeedsToBeRemoved = true
  }

  getDoesItNeedsToBeRemoved(): boolean {
    return this.doesItNeedsToBeRemoved
  }

  collide(entity: Entity): void {
    if (
      entity instanceof BaseTank
      && entity.bullet?.checkIfItDidHit(this.body)
    ) {
      entity.destroyBullet()
      this.markAsNeedToBeRemoved()
    }
  }
}
