/* eslint-disable */
import { Point } from '@mathigon/euclid'
import { BaseTank } from '../game/entities/tanks/base-tank'
import { Direction } from '../types/types'

const startPoint = new Point(0, 0)

class Tank extends BaseTank {
  constructor(p: Point = startPoint) {
    super(p, {
      fill: '',
      border: '',
      shadow: '',
    })
  }
}

describe('tank', () => {
  it('move', () => {
    const tank = new Tank()
    tank.move(Direction.DOWN)
    tank.move(Direction.DOWN)
    tank.update(2)
    tank.move(Direction.STILL)

    expect(tank['position'].y).toEqual(2000)
  })
  it('health', () => {
    const tank = new Tank()
    tank.gotHitByTheExternalBullet()

    expect(tank.getHealth()).toEqual(0)
  })
  it('respawn', () => {
    const tank = new Tank()
    tank.gotHitByTheExternalBullet()

    tank.move(Direction.DOWN)
    tank.move(Direction.DOWN)
    tank.update(1)
    tank.move(Direction.STILL)
    tank.gotHitByTheExternalBullet(true)

    expect({ x: tank['position'].x, y: tank['position'].y }).toMatchObject({ x: 0, y: 0 })
  })
})
