import postcss from 'postcss'
import parser from 'postcss-selector-parser'
import StringIdGenerator from './string-id-generator'

const regexp = /\--[a-zA-Z0-9-_]+/g

const minifySelectorNodeValue = (debugMode, node, opts) => {
  const nodeValue = node.value
  let minifiedValue
  if (!opts.map.has(nodeValue)) {
    const newNodeValue = opts.generator.next()
    minifiedValue = debugMode
      ? `${newNodeValue}-${nodeValue}`   
      : newNodeValue

    opts.map.set(nodeValue, minifiedValue)
  } else {
    minifiedValue = opts.map.get(nodeValue)
  }

  node.value = minifiedValue
}

export const minifySelectorsNames = ({
  selectors,
  debugMode,
  idsOpts,
  classesOpts,
}) => {
  selectors.walkIds((node) => minifySelectorNodeValue(debugMode, node, idsOpts))
  selectors.walkClasses((node) => minifySelectorNodeValue(debugMode, node, classesOpts))
}

export default postcss.plugin(
  'postcss-minify-names',
  ({
    debugMode = false,
    classesOpts = {
      map: new Map(),
      generator: new StringIdGenerator()
    },
    idsOpts = {
      map: new Map(),
      generator: new StringIdGenerator()
    },
    customPropertiesOpts = {
      map: new Map(),
      generator: new StringIdGenerator()
    },
  } = {}) => {
    const getMinifiedCustomProperty = (originalProp) => {
      let minifiedValue = originalProp
      regexp.lastIndex = 0
      while (true) {
        const match = regexp.exec(originalProp)
        if (!match) {
          break
        }

        const [extractedProp] = match

        let minifiedExtractedProp
        if (!customPropertiesOpts.map.has(extractedProp)) {
          const newPropName = customPropertiesOpts.generator.next()
          const adjustedProp = debugMode
            ? `${newPropName}-${extractedProp}`   
            : newPropName

          minifiedExtractedProp = `--${adjustedProp}`
          customPropertiesOpts.map.set(extractedProp, minifiedExtractedProp)
        } else {
          minifiedExtractedProp = customPropertiesOpts.map.get(extractedProp)
        }

        minifiedValue = minifiedValue.replace(new RegExp(extractedProp), minifiedExtractedProp)
      }

      return minifiedValue
    }

    const processor = parser((selectors) => minifySelectorsNames({
      selectors,
      debugMode,
      idsOpts,
      classesOpts,
    }))

    return (root) => {
      root.walkDecls((decl) => {
        if (regexp.test(decl.prop)) {
          decl.prop = getMinifiedCustomProperty(decl.prop)
        }
        if (regexp.test(decl.value)) {
          decl.value = getMinifiedCustomProperty(decl.value)
        }
      })
      root.walkRules((ruleNode) => processor.process(ruleNode))
    }
  })