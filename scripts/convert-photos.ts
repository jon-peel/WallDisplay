import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const PHOTOS_DIR = path.join(process.cwd(), 'photos')
const MAX_DIMENSION = 1920
const JPEG_EXTS = new Set(['.jpg', '.jpeg'])

async function convertPhotos(): Promise<void> {
  const files = fs.readdirSync(PHOTOS_DIR).filter((f) =>
    JPEG_EXTS.has(path.extname(f).toLowerCase())
  )

  if (files.length === 0) {
    console.log('No JPEG files found in photos/')
    return
  }

  let converted = 0
  let skipped = 0

  for (const file of files) {
    const inputPath = path.join(PHOTOS_DIR, file)
    const outputFile = path.basename(file, path.extname(file)) + '.webp'
    const outputPath = path.join(PHOTOS_DIR, outputFile)

    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(inputPath)
      console.log(`Removed ${file} (${outputFile} already exists)`)
      skipped++
      continue
    }

    await sharp(inputPath)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outputPath)

    const inputSize = fs.statSync(inputPath).size
    const outputSize = fs.statSync(outputPath).size
    const saving = (((inputSize - outputSize) / inputSize) * 100).toFixed(0)
    fs.unlinkSync(inputPath)
    console.log(`${file} → ${outputFile}  (${saving}% smaller)`)
    converted++
  }

  console.log(`\nDone: ${converted} converted, ${skipped} skipped.`)
}

convertPhotos().catch((err) => {
  console.error('convert-photos failed:', err)
  process.exit(1)
})
