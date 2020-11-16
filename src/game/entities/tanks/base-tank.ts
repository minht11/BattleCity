import {
  Bounds,
  intersections,
  Point,
  Triangle,
} from '@mathigon/euclid'
import { Direction } from '../../../types/types'
import { clamp } from '../../utils'
import { Bullet } from '../bullet'
import { Entity } from '../entity'
import { BasicWall } from '../walls/basic-wall'

export interface TankColors {
  fill: string,
  glow: string,
}

const TRIANGLE_WIDTH = 1
const TRIANGLE_HEIGHT = 0.7

export class BaseTank implements Entity {
  colors = {
    fill: '#fff',
    glow: '#fff',
  }

  private spawnPoint: Point

  private positionInternal = new Point(0, 0)

  get position(): Point {
    return this.positionInternal
  }

  set position(pos: Point) {
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
    }
    if (facing === Direction.DOWN) {
      this.body = new Triangle(
        new Point(x, y),
        new Point(x + sizeX, y),
        new Point(x + sizeX / 2, y + sizeY),
      )
    }
    if (facing === Direction.RIGHT) {
      this.body = new Triangle(
        new Point(x, y),
        new Point(x + sizeY, y + sizeX / 2),
        new Point(x, y + sizeX),
      )
    }
    if (facing === Direction.LEFT) {
      this.body = new Triangle(
        new Point(x + sizeY, y),
        new Point(x + sizeY, y + sizeX),
        new Point(x, y + sizeX / 2),
      )
    }
  }

  body = new Triangle()

  health = 1

  velocity = new Point(0, 0)

  moveDirection = Direction.STILL

  facing: Omit<Direction, Direction.STILL> = Direction.UP

  shouldIgnoreOneUpdate = false

  bullet: Bullet | null = null

  setColors(colors: TankColors): void {
    this.colors = colors
  }

  constructor(public pos: Point) {
    this.spawnPoint = pos
    this.position = pos
  }

  getSizeAdjustedForDirection(): Point {
    return this.facing === Direction.UP || this.facing === Direction.DOWN
      ? new Point(TRIANGLE_WIDTH, TRIANGLE_HEIGHT)
      : new Point(TRIANGLE_HEIGHT, TRIANGLE_WIDTH)
  }

  stopMovement(): void {
    this.moveDirection = Direction.STILL
    this.velocity = new Point(0, 0)
  }

  shoot(): void {
    if (!this.bullet) {
      this.bullet = new Bullet(this.facing, this.body.orthocenter)
    }
  }

  destroyBullet(): void {
    this.bullet = null
  }

  gotHit(): void {
    this.health -= 1
    if (this.health > 0) {
      this.position = this.spawnPoint
    }
  }

  move(direction: Direction): void {
    this.moveDirection = direction

    let velocityValues: [number, number] = [0, 0]
    if (direction !== Direction.STILL) {
      this.shouldIgnoreOneUpdate = this.facing !== direction
      this.facing = direction

      const isGoingUp = Direction.UP === direction
      const isGoingLeft = Direction.LEFT === direction
      const mainVelocityValue = isGoingUp || isGoingLeft ? -1 : 1

      velocityValues = [mainVelocityValue, 0]

      if (isGoingUp || Direction.DOWN === direction) {
        velocityValues.reverse()
      }
    }

    this.velocity = new Point(...velocityValues)
  }

  update(secondsPassed: number): void {
    this.bullet?.update(secondsPassed)

    if (this.shouldIgnoreOneUpdate) {
      return
    }

    const { velocity } = this

    const speed = 400
    const velocityIncrease = speed * (secondsPassed ** 2)

    this.position = this.position.shift(
      velocity.x * velocityIncrease,
      velocity.y * velocityIncrease,
    )
  }

  collide(entity: Entity): void {
    if (entity instanceof BaseTank && entity.bullet) {
      if (this.bullet && entity.bullet.checkIfItDidHit(this.bullet.body)) {
        this.destroyBullet()
        entity.destroyBullet()
      } else if (entity.bullet.checkIfItDidHit(this.body)) {
        this.gotHit()
        entity.destroyBullet()
      }
    }

    if (entity instanceof BasicWall) {
      if (intersections(this.body, entity.body).length) {
        this.velocity = new Point(
          this.velocity.x * -1,
          this.velocity.y * -1,
        )
      }
    }
  }

  collideMapBounds(bounds: Bounds): void {
    const size = this.getSizeAdjustedForDirection()

    this.position = new Point(
      clamp(bounds.xMin, this.position.x, bounds.xMax - size.x),
      clamp(bounds.yMin, this.position.y, bounds.yMax - size.y),
    )

    if (this.bullet?.checkIfItDidHit(bounds.rect)) {
      this.destroyBullet()
    }
  }
}
