import {
  Bounds,
  intersections,
  Point,
  Triangle,
} from '@mathigon/euclid'
import { Direction, NotStillDirection } from '../../../types/types'
import { clamp, getVelocityFromDirection } from '../../utils'
import { Bullet } from '../bullet'
import { Entity, EntityColors } from '../entity'
import { BasicWall } from '../walls/basic-wall'

const TRIANGLE_WIDTH = 1
const TRIANGLE_HEIGHT = 0.7

const TANK_SPEED = 500

export abstract class BaseTank implements Entity {
  colors = {
    fill: '#fff',
    border: '#fff',
    shadow: 'transparent',
  }

  body = new Triangle()

  bullet: Bullet | null = null

  protected spawnPoint: Point

  private positionInternal = new Point(0, 0)

  protected get position(): Point {
    return this.positionInternal
  }

  protected set position(pos: Point) {
    this.positionInternal = pos

    const { facing } = this
    const { x, y } = pos

    const sizeX = TRIANGLE_WIDTH
    const sizeY = TRIANGLE_HEIGHT

    if (facing === Direction.UP) {
      this.body = new Triangle(
        new Point(x + sizeX / 2, y),
        new Point(x + sizeX, y + sizeY),
        new Point(x, y + sizeY),
      )
    } else if (facing === Direction.DOWN) {
      this.body = new Triangle(
        new Point(x, y),
        new Point(x + sizeX, y),
        new Point(x + sizeX / 2, y + sizeY),
      )
    } else if (facing === Direction.RIGHT) {
      this.body = new Triangle(
        new Point(x, y),
        new Point(x + sizeY, y + sizeX / 2),
        new Point(x, y + sizeX),
      )
    } else if (facing === Direction.LEFT) {
      this.body = new Triangle(
        new Point(x + sizeY, y),
        new Point(x + sizeY, y + sizeX),
        new Point(x, y + sizeX / 2),
      )
    }
  }

  protected health = 1

  protected velocity = new Point(0, 0)

  protected facing: NotStillDirection = Direction.UP

  protected shouldIgnoreOneUpdate = false

  constructor(pos: Point, colors: EntityColors) {
    this.spawnPoint = pos
    this.position = pos
    this.colors = colors
  }

  protected getSizeAdjustedForDirection(): Point {
    return this.facing === Direction.UP || this.facing === Direction.DOWN
      ? new Point(TRIANGLE_WIDTH, TRIANGLE_HEIGHT)
      : new Point(TRIANGLE_HEIGHT, TRIANGLE_WIDTH)
  }

  getHealth(): number {
    return this.health
  }

  fireBullet(): void {
    if (!this.bullet) {
      this.bullet = new Bullet(this.facing, this.body.orthocenter, this.colors)
    }
  }

  destroyBullet(): void {
    this.bullet = null
  }

  gotHitByTheExternalBullet(forceRespwan = false): void {
    this.health -= 1
    if (this.health > 0 || forceRespwan) {
      this.position = this.spawnPoint
    }
  }

  move(direction: Direction): void {
    if (direction !== Direction.STILL) {
      this.shouldIgnoreOneUpdate = this.facing !== direction
      this.facing = direction
    }

    this.velocity = getVelocityFromDirection(direction)
  }

  update(secondsPassed: number): void {
    this.bullet?.update(secondsPassed)

    if (this.shouldIgnoreOneUpdate) {
      return
    }

    const { velocity } = this

    const velocityIncrease = TANK_SPEED * (secondsPassed ** 2)

    this.position = this.position.shift(
      velocity.x * velocityIncrease,
      velocity.y * velocityIncrease,
    )
  }

  collide(entity: Entity): void {
    if (entity instanceof BaseTank && entity.bullet) {
      const { bullet: externalBullet } = entity

      const hitBullet = this.bullet && externalBullet.intersects(this.bullet.body)
      const hitTank = !hitBullet && externalBullet.intersects(this.body)

      if (hitBullet || hitTank) {
        entity.destroyBullet()
      }

      if (hitBullet) {
        this.destroyBullet()
      } else if (hitTank) {
        this.gotHitByTheExternalBullet()
      }
    }

    if (entity instanceof BasicWall && intersections(this.body, entity.body).length) {
      this.velocity = new Point(
        this.velocity.x * -1,
        this.velocity.y * -1,
      )
    }
  }

  collideMapBounds(bounds: Bounds): void {
    const size = this.getSizeAdjustedForDirection()

    this.position = new Point(
      clamp(bounds.xMin, this.position.x, bounds.xMax - size.x),
      clamp(bounds.yMin, this.position.y, bounds.yMax - size.y),
    )

    if (this.bullet?.intersects(bounds.rect)) {
      this.destroyBullet()
    }
  }
}
