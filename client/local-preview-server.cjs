const http = require('http')
const fs = require('fs')
const path = require('path')

const HOST = '127.0.0.1'
const PORT = 4173
const distDir = path.join(__dirname, 'dist')
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const type = mimeTypes[ext] || 'application/octet-stream'

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Failed to load file.')
      return
    }

    res.writeHead(200, { 'Content-Type': type })
    res.end(content)
  })
}

const server = http.createServer((req, res) => {
  const requestPath = decodeURIComponent((req.url || '/').split('?')[0])
  const normalizedPath = requestPath === '/' ? '/index.html' : requestPath
  const requestedFile = path.normalize(path.join(distDir, normalizedPath))

  if (!requestedFile.startsWith(distDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Forbidden')
    return
  }

  fs.stat(requestedFile, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(res, requestedFile)
      return
    }

    sendFile(res, path.join(distDir, 'index.html'))
  })
})

server.listen(PORT, HOST, () => {
  console.log(`Local preview available at http://${HOST}:${PORT}`)
})
