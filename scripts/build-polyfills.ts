import fs from 'fs'
import path from 'path'

const cwd = process.cwd()
const coreJs = path.join(cwd, 'node_modules/core-js-bundle/minified.js')
const fetchPolyfill = path.join(cwd, 'node_modules/whatwg-fetch/dist/fetch.umd.js')
const dest = path.join(cwd, 'public/polyfills.js')

const combined =
  fs.readFileSync(coreJs, 'utf8') +
  '\n;' +
  fs.readFileSync(fetchPolyfill, 'utf8')

fs.writeFileSync(dest, combined)
console.log('Wrote public/polyfills.js (core-js-bundle + whatwg-fetch)')
