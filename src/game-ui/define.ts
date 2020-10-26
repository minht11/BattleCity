import { component } from 'haunted'
import { Component } from 'haunted/lib/component'
import { GenericRenderer } from 'haunted/lib/core'
import { TemplateResult } from 'lit-html'

export { Component }

// Copied from 'haunted/lib/component' since it doesn't export it.
interface Renderer<P extends {}> extends GenericRenderer {
  (this: Component<P>, host: Component<P>): unknown | void,
  observedAttributes?: (keyof P)[],
}

export const defineElement = <T extends HTMLElement>(
  name: string,
  renderer: (host: T) => TemplateResult,
  options = { useShadowDOM: true },
): void => {
  customElements.define(
    name,
    component(renderer as Renderer<T>, options),
  )
}
