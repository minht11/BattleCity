export const enum Direction {
  STILL,
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

export type NotStillDirection = Exclude<Direction, Direction.STILL>

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
