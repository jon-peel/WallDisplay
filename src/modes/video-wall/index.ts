/// <reference types="youtube" />

const GRID_SIZE = 16
const COLS = 4

interface PlayerSlot {
  container: HTMLElement
  overlay: HTMLElement
  player: YT.Player | null
  currentVideoId: string | null
}

let ytApiLoaded = false
let ytApiReady = false
const ytReadyCallbacks: Array<() => void> = []

function loadYouTubeApi(): Promise<void> {
  return new Promise((resolve) => {
    if (ytApiReady) {
      resolve()
      return
    }
    ytReadyCallbacks.push(resolve)
    if (!ytApiLoaded) {
      ytApiLoaded = true
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        ytApiReady = true
        if (prev) prev()
        ytReadyCallbacks.forEach((cb) => cb())
        ytReadyCallbacks.length = 0
      }
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)
    }
  })
}

function buildGrid(container: HTMLElement): PlayerSlot[] {
  const grid = document.createElement('div')
  grid.style.cssText = `
    display:grid;
    grid-template-columns:repeat(${COLS},1fr);
    grid-template-rows:repeat(${COLS},1fr);
    width:100%;height:100%;
    gap:3px;
    background:#111;
  `
  container.appendChild(grid)

  const slots: PlayerSlot[] = []
  for (let i = 0; i < GRID_SIZE; i++) {
    const cell = document.createElement('div')
    cell.style.cssText = 'position:relative;overflow:hidden;background:#000;'
    const divId = `yt-player-${i}-${Date.now()}`
    const playerDiv = document.createElement('div')
    playerDiv.id = divId
    cell.appendChild(playerDiv)

    // Transparent overlay to capture clicks (sits above the iframe)
    const overlay = document.createElement('div')
    overlay.style.cssText = 'position:absolute;inset:0;z-index:2;cursor:pointer;'
    cell.appendChild(overlay)

    grid.appendChild(cell)
    slots.push({ container: cell, overlay, player: null, currentVideoId: null })
  }

  return slots
}

function initPlayers(
  slots: PlayerSlot[],
  videoIds: string[],
  pageVideoIds: string[],
): void {
  for (let i = 0; i < GRID_SIZE; i++) {
    const slot = slots[i]!
    const videoId = pageVideoIds[i]
    const divId = slot.container.querySelector('div')!.id

    if (!videoId) {
      slot.container.style.display = 'none'
      continue
    }

    slot.container.style.display = 'block'
    slot.currentVideoId = videoId

    slot.player = new YT.Player(divId, {
      videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady(e: YT.PlayerEvent) {
          e.target.setSize(
            slot.container.clientWidth,
            slot.container.clientHeight,
          )
        },
      },
    })

    // Ensure iframe fills the cell
    const iframe = slot.container.querySelector('iframe')
    if (iframe) {
      iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;'
    }
  }
}

function setPage(slots: PlayerSlot[], pageVideoIds: string[]): void {
  for (let i = 0; i < GRID_SIZE; i++) {
    const slot = slots[i]!
    const videoId = pageVideoIds[i]

    if (!videoId) {
      slot.container.style.display = 'none'
      continue
    }

    slot.container.style.display = 'block'

    if (slot.player && videoId !== slot.currentVideoId) {
      slot.player.loadVideoById(videoId)
      slot.player.mute()
      slot.currentVideoId = videoId
    }
  }
}

function buildPageControls(
  container: HTMLElement,
  totalPages: number,
  onPrev: () => void,
  onNext: () => void,
): (page: number) => void {
  const ctrl = document.createElement('div')
  ctrl.style.cssText = `
    position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
    display:flex;align-items:center;gap:16px;
    background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);
    padding:8px 20px;border-radius:24px;
    color:#fff;font-size:0.9rem;
    z-index:10;
    user-select:none;
  `

  const prevBtn = document.createElement('button')
  prevBtn.textContent = '◀'
  prevBtn.style.cssText =
    'background:none;border:none;color:#fff;cursor:pointer;font-size:1rem;padding:0 4px;'
  prevBtn.addEventListener('click', onPrev)

  const indicator = document.createElement('span')

  const nextBtn = document.createElement('button')
  nextBtn.textContent = '▶'
  nextBtn.style.cssText =
    'background:none;border:none;color:#fff;cursor:pointer;font-size:1rem;padding:0 4px;'
  nextBtn.addEventListener('click', onNext)

  ctrl.appendChild(prevBtn)
  ctrl.appendChild(indicator)
  ctrl.appendChild(nextBtn)
  container.appendChild(ctrl)

  return (page: number) => {
    indicator.textContent = `${page + 1} / ${totalPages}`
    prevBtn.style.visibility = page === 0 ? 'hidden' : 'visible'
    nextBtn.style.visibility = page === totalPages - 1 ? 'hidden' : 'visible'
  }
}

export function mountVideoWall(container: HTMLElement, videoIds: string[]): () => void {
  container.style.overflow = 'hidden'
  container.style.background = '#000'
  container.style.position = 'relative'

  if (videoIds.length === 0) {
    const msg = document.createElement('div')
    msg.textContent = 'No videos configured. Add YouTube URLs to videoWall.videos in config.json and rebuild.'
    msg.style.cssText =
      'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.5);font-size:1.1rem;text-align:center;padding:32px;'
    container.appendChild(msg)
    return () => {}
  }

  const pages = Math.ceil(videoIds.length / GRID_SIZE)
  let currentPage = 0
  let fullscreenSlot: PlayerSlot | null = null
  let destroyed = false

  const slots = buildGrid(container)

  function getPageVideoIds(page: number): string[] {
    return videoIds.slice(page * GRID_SIZE, (page + 1) * GRID_SIZE)
  }

  let updateControls: ((page: number) => void) | null = null

  if (pages > 1) {
    updateControls = buildPageControls(
      container,
      pages,
      () => {
        if (currentPage > 0) {
          currentPage--
          setPage(slots, getPageVideoIds(currentPage))
          updateControls!(currentPage)
        }
      },
      () => {
        if (currentPage < pages - 1) {
          currentPage++
          setPage(slots, getPageVideoIds(currentPage))
          updateControls!(currentPage)
        }
      },
    )
    updateControls(0)
  }

  // Click-to-fullscreen via overlay
  for (const slot of slots) {
    slot.overlay.addEventListener('click', () => {
      if (!slot.player) return
      fullscreenSlot = slot
      slot.container.requestFullscreen().then(() => {
        slot.player?.unMute()
        // Hide overlay so the user can interact with the video
        slot.overlay.style.display = 'none'
      }).catch(() => {})
    })
  }

  // Restore on fullscreen exit
  function handleFullscreenChange(): void {
    if (!document.fullscreenElement && fullscreenSlot) {
      fullscreenSlot.player?.mute()
      fullscreenSlot.overlay.style.display = ''
      fullscreenSlot = null
    }
  }
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  // Load YouTube API and init players
  loadYouTubeApi().then(() => {
    if (destroyed) return
    initPlayers(slots, videoIds, getPageVideoIds(0))
    // Ensure iframes fill cells after init
    setTimeout(() => {
      for (const slot of slots) {
        const iframe = slot.container.querySelector('iframe')
        if (iframe) {
          iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;'
        }
      }
    }, 1000)
  })

  return () => {
    destroyed = true
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    for (const slot of slots) {
      slot.player?.destroy()
    }
  }
}
