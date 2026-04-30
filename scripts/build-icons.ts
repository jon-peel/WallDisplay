import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const SVG_SOURCE = path.join(process.cwd(), 'public/icons/icon.svg')
const OUTPUT_DIR = path.join(process.cwd(), 'public/icons')

const SIZES: { name: string; size: number }[] = [
  { name: 'icon-32.png', size: 32 },
  { name: 'icon-180.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
]

async function buildIcons(): Promise<void> {
  const svgBuffer = fs.readFileSync(SVG_SOURCE)

  for (const { name, size } of SIZES) {
    const outputPath = path.join(OUTPUT_DIR, name)
    await sharp(svgBuffer).resize(size, size).png().toFile(outputPath)
    console.log(`Generated ${name} (${size}×${size})`)
  }
}

buildIcons().catch((err) => {
  console.error('build-icons failed:', err)
  process.exit(1)
})
