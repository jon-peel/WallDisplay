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
    console.log('No JPEG source files found in photos/')
  } else {
    let converted = 0
    let skipped = 0

    for (const file of files) {
      const inputPath = path.join(PHOTOS_DIR, file)
      const baseName = path.basename(file, path.extname(file))
      const webpPath = path.join(PHOTOS_DIR, baseName + '.webp')
      const jpgFallbackPath = path.join(PHOTOS_DIR, baseName + '.jpg')

      if (fs.existsSync(webpPath)) {
        fs.unlinkSync(inputPath)
        console.log(`Removed ${file} (${baseName}.webp already exists)`)
        skipped++
        continue
      }

      const resized = sharp(inputPath).resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      })

      await resized.clone().webp({ quality: 82 }).toFile(webpPath)
      await resized.clone().jpeg({ quality: 85 }).toFile(jpgFallbackPath)

      const inputSize = fs.statSync(inputPath).size
      const outputSize = fs.statSync(webpPath).size
      const saving = (((inputSize - outputSize) / inputSize) * 100).toFixed(0)
      fs.unlinkSync(inputPath)
      console.log(`${file} → ${baseName}.webp + ${baseName}.jpg  (webp ${saving}% smaller than source)`)
      converted++
    }

    console.log(`\nConverted: ${converted}, skipped: ${skipped}.`)
  }

  await generateFallbacks()
}

async function generateFallbacks(): Promise<void> {
  const webpFiles = fs.readdirSync(PHOTOS_DIR).filter((f) =>
    path.extname(f).toLowerCase() === '.webp'
  )

  const missing = webpFiles.filter((f) => {
    const jpgPath = path.join(PHOTOS_DIR, path.basename(f, '.webp') + '.jpg')
    return !fs.existsSync(jpgPath)
  })

  if (missing.length === 0) {
    console.log('All WebP photos already have JPEG fallbacks.')
    return
  }

  console.log(`Generating JPEG fallbacks for ${missing.length} WebP file(s)...`)
  for (const file of missing) {
    const inputPath = path.join(PHOTOS_DIR, file)
    const jpgPath = path.join(PHOTOS_DIR, path.basename(file, '.webp') + '.jpg')
    await sharp(inputPath).jpeg({ quality: 85 }).toFile(jpgPath)
    console.log(`  ${file} → ${path.basename(jpgPath)}`)
  }
  console.log('Done generating fallbacks.')
}

convertPhotos().catch((err) => {
  console.error('convert-photos failed:', err)
  process.exit(1)
})
