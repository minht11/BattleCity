import { Point } from '@mathigon/euclid'
import { Direction } from '../../../types/types'
import { EntityColors } from '../entity'
import { BaseTank } from './base-tank'

export interface PlayerControls {
  [key: string]: Direction | 'fire',
}

export class PlayerTank extends BaseTank {
  protected health = 3

  constructor(private controls: PlayerControls, pos: Point, colors: EntityColors) {
    super(pos, colors)
  }

  keyboardAction(keyCode: string, isPressed: boolean): void {
    Object.entries(this.controls).forEach(([key, value]) => {
      if (key !== keyCode) {
        return
      }

      if (value !== 'fire') {
        this.move(isPressed ? value : Direction.STILL)
      } else if (isPressed) {
        this.fireBullet()
      }
    })
  }
}
