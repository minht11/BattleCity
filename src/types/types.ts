import { Vec2 } from '../game/vec2'

export const enum Direction {
  STILL,
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

export const enum Tanks {
  PLAYER_TANK,
  REGULAR_TANK,
  ARMORED_TANK,
}

export const enum Tiles {
  EMPTY,
  REGULAR_WALL,
  ARMORED_WALL,
  FLAG,
}

export interface MapTile {
  type: Tiles,
  position: Vec2,
}

export interface PlayerData {
  type: Tanks,
  spawn: Vec2,
  controls: {
    [key: string]: Direction | 'shoot',
  },
}

export interface GameLevel {
  levelNumber: number,
  players: PlayerData[],
  map: MapTile[],
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
