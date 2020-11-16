import { BasicWall } from './basic-wall'

export class ArmoredWall extends BasicWall {
  protected markAsNeedToBeRemoved(): void {}
}
