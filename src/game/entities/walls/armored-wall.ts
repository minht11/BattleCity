import { BasicWall } from './basic-wall'

export class ArmoredWall extends BasicWall {
  colors = {
    fill: '#fffce5',
    border: 'transparent',
    shadow: 'transparent',
  }

  protected markAsDestroyed(): void {}
}
