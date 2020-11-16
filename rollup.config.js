import typescript from 'typescript'
import ts from '@rollup/plugin-typescript'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonJs from '@rollup/plugin-commonjs'
import HTML from '@open-wc/rollup-plugin-html'
import style from './rollup-plugins/style/rollup-plugin-style'
import copy from 'rollup-plugin-copy'

const production = process.env.BUILD === 'production'
const fileNames = production && {
  entryFileNames: '[name]-[hash].js',
  chunkFileNames: '[name]-[hash].js',
}

export default {
  input: 'src/index.html',
  output: {
    dir: 'dist/',
    format: 'esm',
    sourcemap: false,
    preferConst: true,
    ...fileNames,
  },
  plugins: [
    HTML({
      minify: production,
    }),
    style({
      transform: false,
    }),
    nodeResolve({
      extensions: ['.ts', '.js'],
    }),
    commonJs(),
    copy({
      targets: [{
        src: 'src/levels', dest: 'dist/',
      }]
    }),
    ts({
      typescript,
      noEmitOnError: false,
      sourceMap: false,
    }),
  ],
}
