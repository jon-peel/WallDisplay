import type { PhotoMeta } from '../../generated/photo-manifest'

type Slide =
  | { type: 'fullscreen'; photo: PhotoMeta }
  | { type: 'portrait-pair'; photos: [PhotoMeta, PhotoMeta] }
  | { type: 'mixed-tile'; portrait: PhotoMeta; landscapes: [PhotoMeta, PhotoMeta] }

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

function groupPhotos(photos: PhotoMeta[]): Slide[] {
  const slides: Slide[] = []
  let i = 0

  while (i < photos.length) {
    const photo = photos[i]!

    if (photo.orientation === 'landscape') {
      slides.push({ type: 'fullscreen', photo })
      i++
    } else {
      const next1 = photos[i + 1]
      const next2 = photos[i + 2]

      if (next1?.orientation === 'portrait') {
        slides.push({ type: 'portrait-pair', photos: [photo, next1] })
        i += 2
      } else if (next1?.orientation === 'landscape' && next2?.orientation === 'landscape') {
        slides.push({ type: 'mixed-tile', portrait: photo, landscapes: [next1, next2] })
        i += 3
      } else {
        // lone portrait — show fullscreen
        slides.push({ type: 'fullscreen', photo })
        i++
      }
    }
  }

  return slides
}

function renderSlide(slide: Slide): HTMLElement {
  const el = document.createElement('div')
  el.className = 'slide'
  el.style.cssText =
    'position:absolute;inset:0;opacity:0;transition:opacity 0.8s ease-in-out;display:flex;background:#000;'

  if (slide.type === 'fullscreen') {
    const img = document.createElement('img')
    img.src = `/photos/${slide.photo.filename}`
    img.alt = ''
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;'
    el.appendChild(img)
  } else if (slide.type === 'portrait-pair') {
    for (const photo of slide.photos) {
      const img = document.createElement('img')
      img.src = `/photos/${photo.filename}`
      img.alt = ''
      img.style.cssText = 'width:50%;height:100%;object-fit:cover;'
      el.appendChild(img)
    }
  } else {
    const left = document.createElement('div')
    left.style.cssText = 'width:50%;height:100%;flex-shrink:0;'
    const leftImg = document.createElement('img')
    leftImg.src = `/photos/${slide.portrait.filename}`
    leftImg.alt = ''
    leftImg.style.cssText = 'width:100%;height:100%;object-fit:cover;'
    left.appendChild(leftImg)
    el.appendChild(left)

    const right = document.createElement('div')
    right.style.cssText = 'width:50%;height:100%;flex-shrink:0;display:flex;flex-direction:column;'
    for (const photo of slide.landscapes) {
      const img = document.createElement('img')
      img.src = `/photos/${photo.filename}`
      img.alt = ''
      img.style.cssText = 'width:100%;height:50%;object-fit:cover;'
      right.appendChild(img)
    }
    el.appendChild(right)
  }

  return el
}

export function mountSlideshow(
  container: HTMLElement,
  photoList: PhotoMeta[],
  opts: { interval: number },
): () => void {
  container.style.overflow = 'hidden'
  container.style.background = '#000'

  if (photoList.length === 0) {
    const msg = document.createElement('div')
    msg.textContent = 'No photos found. Add images to the photos/ directory and rebuild.'
    msg.style.cssText =
      'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.5);font-size:1.2rem;'
    container.appendChild(msg)
    return () => {}
  }

  let shuffled = shuffleArray(photoList)
  let groups = groupPhotos(shuffled)
  let groupIndex = 0
  let currentSlideEl: HTMLElement | null = null
  let timerId: ReturnType<typeof setInterval> | null = null
  let destroyed = false

  function nextGroup(): void {
    if (groupIndex >= groups.length) {
      shuffled = shuffleArray(photoList)
      groups = groupPhotos(shuffled)
      groupIndex = 0
    }
  }

  function showSlide(): void {
    if (destroyed) return
    nextGroup()

    const slide = groups[groupIndex++]!
    const el = renderSlide(slide)
    container.appendChild(el)

    // Fade in after a paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = '1'
      })
    })

    // Fade out and remove previous
    if (currentSlideEl) {
      const prev = currentSlideEl
      prev.style.opacity = '0'
      setTimeout(() => prev.remove(), 900)
    }

    currentSlideEl = el
  }

  showSlide()
  timerId = setInterval(showSlide, opts.interval * 1000)

  return () => {
    destroyed = true
    if (timerId !== null) clearInterval(timerId)
    container.innerHTML = ''
  }
}
