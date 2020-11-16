import { component } from 'haunted'
import { TemplateResult } from 'lit-html'

export const defineElement = <T extends HTMLElement>(
  name: string,
  renderer: (host: T) => TemplateResult,
  options = { useShadowDOM: true },
): void => {
  customElements.define(
    name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component(renderer as any, options),
  )
}
