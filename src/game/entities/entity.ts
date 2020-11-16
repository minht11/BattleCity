import { GeoShape, Bounds } from '@mathigon/euclid'

export interface Entity {
  body: GeoShape,
  update?(deltaTime: number): void,
  collide?(entity: Entity): void,
  collideMapBounds?(bounds: Bounds): void,
}
