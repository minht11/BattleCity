/* eslint-disable */
import { Point } from '@mathigon/euclid'
import { Bullet } from '../game/entities/bullet'
import { BasicWall } from '../game/entities/walls/basic-wall'
import { Direction } from '../types/types'

describe('bullet', () => {
  it('intersects', () => {
    const startPoint = new Point(0, 0)
    const bullet = new Bullet(Direction.DOWN, startPoint, {
      fill: '',
      border: '',
      shadow: '',
    })
    const wall = new BasicWall(startPoint)

    expect(bullet.intersects(wall.body)).toBeTruthy()
  })
})
