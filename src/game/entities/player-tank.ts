import { Direction, PlayerData } from '../../types/types'
import { BaseTank } from './base-tank'

export class PlayerTank extends BaseTank {
  health = 3

  constructor(private spawn: PlayerData['spawn'], private controls: PlayerData['controls']) {
    super()
    this.position = spawn.clone()
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
