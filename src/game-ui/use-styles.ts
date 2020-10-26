import { hook, Hook, State } from 'haunted'

class StylesHook extends Hook {
  // For this app static styles are enough,
  // also updating them is prob not very efficient
  // especially on browsers where pollyfil is needed.
  /* eslint-disable-next-line class-methods-use-this */
  update() {}

  constructor(id: number, state: State, fn: () => CSSStyleSheet[]) {
    super(id, state)
    const { shadowRoot } = state.host as HTMLElement
    if (shadowRoot) {
      shadowRoot.adoptedStyleSheets = fn()
    } else {
      throw new Error('ShadowRoot needs to be enabled for styles to work.')
    }
  }
}

export const useStyles = hook(StylesHook)
