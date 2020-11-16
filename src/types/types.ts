import { Point } from '@mathigon/euclid'
import { Entity } from '../game/entities/entity'

export const enum Direction {
  STILL,
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

export interface GameLevel {
  levelNumber: number,
  entities: Entity[],
  mapSize: Point,
}

declare global {
  interface Document {
    adoptedStyleSheets: readonly CSSStyleSheet[],
  }
  interface ShadowRoot {
    adoptedStyleSheets: readonly CSSStyleSheet[],
  }
  interface CSSStyleSheet {
    replaceSync(cssText: string): void,
    replace(cssText: string): Promise<void>,
  }
  interface Window {
    dynamicImportsBaseNames: string[],
  }
}
