import { createFilter } from 'rollup-pluginutils'
import MagicString from 'magic-string'
import postcss from 'postcss'
import parser from 'postcss-selector-parser'
import cssnano from 'cssnano'
import fs from 'fs'
import StringIdGenerator from './string-id-generator'
import postcssMinifyClasses, { minifySelectorsNames } from './postcss-plugin-minify-names'

const CREATE_STYLE_SHEET_IMPORT = 'rollup-plugin-style-createStyleSheetSync'

const processor = parser()

export default function({
  debugMode = true,
  transform = true,
  include = ['**/*.css'],
  exclude = [],
  selectorFunctionName,
} = {}) {
  const filter = createFilter(include, exclude)
  const isNonNodeModuleFilter = createFilter([], ['node_modules/**/*'])
  const classesOpts = {
    map: new Map(),
    generator: new StringIdGenerator()
  }
  const idsOpts = {
    map: new Map(),
    generator: new StringIdGenerator()
  }
  const customPropertiesOpts = {
    map: new Map(),
    generator: new StringIdGenerator()
  }

  const htmlClassOrIdRegexp = /(class|id)\=(?:["'])(.+?)(?:["'])/g
  const jsQuerySelectorRegexp = new RegExp(`${selectorFunctionName}\\((?:.+?),(?:\\s?)+(?:["'])(.+?)(?:["'])\\)|clip-path\\=(?:["'])url\\((.+?)\\)(?:["'])`, 'g')

  return {
    name: 'rollup-plugin-style',
    resolveId(id) {
      if (id === CREATE_STYLE_SHEET_IMPORT) {
        return id
      }
      return null
    },
    load(id) {
      if (id === CREATE_STYLE_SHEET_IMPORT) {
        return `
          export default (cssText) => {
            const sheet = new CSSStyleSheet()
            sheet.replaceSync(cssText)
            return sheet
          }`
      }
      if (!filter(id) || !isNonNodeModuleFilter(id)) {
        return null
      }
      return String(fs.readFileSync(id))
    },
    async transform(code, id) {
      if (!isNonNodeModuleFilter(id)) {
        return null
      }

      const isCSSFile = filter(id)
      const hasSelectorsInsideHTML = htmlClassOrIdRegexp.test(code)
      const hasQuerySelectorInJS = jsQuerySelectorRegexp.test(code)

      if (!isCSSFile && !hasSelectorsInsideHTML && !hasQuerySelectorInJS) {
        return null
      }
      
      if (isCSSFile) {
        const minifyClasses = postcssMinifyClasses({
          debugMode,
          classesOpts,
          idsOpts,
          customPropertiesOpts,
        })

        const result = await postcss([
          ...(transform ? [minifyClasses] : []),
          cssnano,
        ]).process(code, { from: undefined }).then(({ css }) => css)

        return `
          import createStyleSheetSync from '${CREATE_STYLE_SHEET_IMPORT}'
          export default createStyleSheetSync(\`${result}\`)
        `
      }

      if (!transform) {
        return null
      }

      const ms = new MagicString(code)

      if (hasSelectorsInsideHTML) {
        htmlClassOrIdRegexp.lastIndex = 0
        while (true) {
          const match = htmlClassOrIdRegexp.exec(code)
          if (!match) {
            break
          }

          const [
            fullSelector,
            selectorType,
            selector,
          ] = match
    
          const opts = selectorType === 'id'
            ? idsOpts
            : classesOpts
  
          const selectorsArr = selector.split(' ')
  
          const minifiedSelectorsArr = selectorsArr.map((name) => {
            if (!opts.map.has(name)) {
              const newName = opts.generator.next()
              const minifiedName = debugMode
                ? `${newName}-${name}`   
                : newName

              opts.map.set(name, minifiedName)
              return minifiedName
            } else {
              return opts.map.get(name)
            }
          })
  
          const [selectorStart, selectorEnd] = fullSelector.split(selector)
    
          const selectorStartIndex = match.index + selectorStart.length
          const selectorEndIndex = match.index + fullSelector.length - selectorEnd.length

          ms.overwrite(
            selectorStartIndex,
            selectorEndIndex,
            `${minifiedSelectorsArr.join(' ')}`,
          )        
        }
      }

      if (hasQuerySelectorInJS) {
        jsQuerySelectorRegexp.lastIndex = 0
        while (true) {
          const match = jsQuerySelectorRegexp.exec(code)
          if (!match) {
            break
          }
    
          const selector = match[1] || match[2]
  
          const minifiedSelector = await processor.ast(selector).then((selectors) => {
            minifySelectorsNames({
              selectors,
              debugMode,
              idsOpts,
              classesOpts,
            })
            return selectors.toString()
          })

          const [selectorStart, selectorEnd] = match[0].split(selector)
    
          const selectorStartIndex = match.index + selectorStart.length
          const selectorEndIndex = match.index + match[0].length - selectorEnd.length
  
          ms.overwrite(
            selectorStartIndex,
            selectorEndIndex,
            `${minifiedSelector}`,
          )
        }
      }


      return {
        code: ms.toString(),
        map: ms.generateMap({ hires: true })
      }
    },
  }
}
