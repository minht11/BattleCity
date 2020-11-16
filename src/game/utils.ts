import { Point } from '@mathigon/euclid'
import { Direction } from '../types/types'

export const clamp = (min: number, value: number, max: number): number => (
  Math.min(Math.max(value, min), max)
)

export const getVelocityFromDirection = (direction: Direction): Point => {
  switch (direction) {
    case Direction.UP: return new Point(0, -1)
    case Direction.DOWN: return new Point(0, 1)
    case Direction.LEFT: return new Point(-1, 0)
    case Direction.RIGHT: return new Point(1, 0)
    default: return new Point(0, 0)
  }
}
