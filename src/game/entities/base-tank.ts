import { Direction } from '../../types/types'
import { Bullet } from './bullet'
import { Vec2 } from '../vec2'
import { GameEntity } from './game-entity'

// const ACCELERATION = 120
// const DECELERATION = 80
// const DRAG_FACTOR = 1 / 60

// const getDirectionValue = (firstDir: boolean, secondDir: boolean) => {
//   if (firstDir || secondDir) {
//     return firstDir ? -1 : 1
//   }
//   return 0
// }

export class BaseTank implements GameEntity {
  size = new Vec2(1, 0.7)

  health = 1

  isObstruced = false

  velocity = new Vec2(0, 0)

  position = new Vec2(0, 0)

  points = Array.from({ length: 3 }, () => new Vec2(0, 0))

  moveDirection = Direction.STILL

  facing: Omit<Direction, Direction.STILL> = Direction.UP

  shouldIgnoreOneUpdate = false

  bullet: Bullet | null = null

  stopMovement(): void {
    this.moveDirection = Direction.STILL
    this.velocity.set(0, 0)
  }

  shoot(): void {
    if (!this.bullet) {
      const newPos = this.position.clone()
      newPos.add(0.5, 0.5)

      this.bullet = new Bullet(this.facing, newPos)
    }
  }

  destroyBullet(): void {
    this.bullet = null
  }

  gotHit(): void {
    this.health -= 1
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
    this.velocity.set(...velocityValues)
  }

  // setTickVelocityAxis(seconndsPassed: number, key: 'x' | 'y'): void {
  //   const isX = key === 'x'
  //   const isY = !isX
  //   const dir = getDirectionValue(
  //     isY && Direction.UP === this.moveDirection,
  //     isY && Direction.DOWN === this.moveDirection,
  //   ) || getDirectionValue(
  //     isX && Direction.LEFT === this.moveDirection,
  //     isX && Direction.RIGHT === this.moveDirection,
  //   )

  //   let velocity = this.velocity[key]

  //   const absVelocity = Math.abs(velocity)
  //   if (dir !== 0) {
  //     velocity += ACCELERATION * seconndsPassed * dir
  //   } else if (velocity !== 0) {
  //     const decel = Math.min(absVelocity, DECELERATION * seconndsPassed)
  //     velocity += velocity > 0 ? -decel : decel
  //   }

  //   const drag = DRAG_FACTOR * velocity * absVelocity
  //   this.velocity[key] = velocity - drag
  // }

  createPoints(): void {
    const { facing } = this

    const { x: sx, y: sy } = this.size
    const { x: px, y: py } = this.position
    const [one, two, three] = this.points

    const halfSx = sx / 2

    if (facing === Direction.UP) {
      one.set(px + halfSx, py)
      two.set(px + sx, py + sy)
      three.set(px, py + sy)
    }
    if (facing === Direction.DOWN) {
      one.set(px, py)
      two.set(px + sx, py)
      three.set(px + halfSx, py + sy)
    }
    if (facing === Direction.RIGHT) {
      one.set(px, py)
      two.set(px + sy, py + halfSx)
      three.set(px, py + sx)
    }
    if (facing === Direction.LEFT) {
      one.set(px + sy, py)
      two.set(px + sy, py + sx)
      three.set(px, py + halfSx)
    }
  }

  update(secondsPassed: number): void {
    if (this.shouldIgnoreOneUpdate || this.isObstruced) {
      this.createPoints()
      return
    }

    // this.setTickVelocityAxis(secondsPassed, 'x')
    // this.setTickVelocityAxis(secondsPassed, 'y')

    const { velocity } = this

    const speed = 400

    this.position.x += velocity.x * speed * secondsPassed * secondsPassed
    this.position.y += velocity.y * speed * secondsPassed * secondsPassed

    this.createPoints()
  }
}
