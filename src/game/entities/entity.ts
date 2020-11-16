import { GeoShape, Bounds } from '@mathigon/euclid'

export interface EntityColors {
  fill: string,
  border: string,
  shadow: string,
}

export interface Entity {
  colors: EntityColors,
  body: GeoShape,
  update?(deltaTime: number): void,
  collide?(entity: Entity): void,
  collideMapBounds?(bounds: Bounds): void,
}
