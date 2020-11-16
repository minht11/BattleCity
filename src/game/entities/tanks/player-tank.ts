import { Direction } from '../../../types/types'
import { BaseTank } from './base-tank'

export interface PlayerControls {
  [key: string]: Direction | 'shoot',
}

export class PlayerTank extends BaseTank {
  health = 3

  private controls: PlayerControls = {}

  setControls(controls: PlayerControls): void {
    this.controls = controls
  }

  keyboardAction(keyCode: string, isPressed: boolean): void {
    Object.entries(this.controls).forEach(([key, value]) => {
      if (key !== keyCode) {
        return
      }

      if (value === 'shoot') {
        this.shoot()
        return
      }

      this.move(isPressed ? value : Direction.STILL)
    })
  }
}
