import fs from 'fs'
import path from 'path'

const src = path.join(process.cwd(), 'node_modules/core-js-bundle/minified.js')
const dest = path.join(process.cwd(), 'public/polyfills.js')

fs.copyFileSync(src, dest)
console.log('Copied core-js-bundle to public/polyfills.js')
