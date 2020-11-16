/* eslint-disable */
import { Point } from '@mathigon/euclid'
import { Bullet } from '../game/entities/bullet'
import { BaseTank } from '../game/entities/tanks/base-tank'
import { ArmoredWall } from '../game/entities/walls/armored-wall'
import { BasicWall } from '../game/entities/walls/basic-wall'
import { Direction } from '../types/types'

class Tank extends BaseTank {
  constructor(p: Point = startPoint) {
    super(p, {
      fill: '',
      border: '',
      shadow: '',
    })
  }
}

const startPoint = new Point(0, 0)

const createTankWithBullet = () => {
  const tank = new Tank()
  tank['bullet'] = new Bullet(Direction.DOWN, new Point(0, 0), tank.colors)
  return tank
}

describe('basic-wall', () => {
  it('bullet-destroys-wall', () => {
    const wall = new BasicWall(startPoint)
    wall.collide(createTankWithBullet())

    expect(wall.isDestroyed).toBeTruthy()
  })
})

describe('armored-wall', () => {
  it('bullet-cannot-destroy-wall', () => {
    const wall = new ArmoredWall(startPoint)
    wall.collide(createTankWithBullet())

    expect(wall.isDestroyed).toBeFalsy()
  })
})
