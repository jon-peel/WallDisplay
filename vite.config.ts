import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { createReadStream, existsSync } from 'fs'
import { join, extname } from 'path'

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

export default defineConfig({
  plugins: [
    legacy({
      targets: ['safari >= 12'],
    }),
    viteStaticCopy({
      targets: [{ src: 'photos/*', dest: 'photos' }],
    }),
    {
      name: 'serve-photos-dev',
      configureServer(server) {
        server.middlewares.use('/photos', (req, res, next) => {
          const name = req.url?.replace(/\?.*/, '').slice(1)
          if (!name) return next()
          const fp = join(process.cwd(), 'photos', name)
          const mime = MIME[extname(name).toLowerCase()]
          if (!mime || !existsSync(fp)) return next()
          res.setHeader('Content-Type', mime)
          createReadStream(fp).pipe(res as import('stream').Writable)
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': '/src',
      '@generated': '/src/generated',
    },
  },
})
