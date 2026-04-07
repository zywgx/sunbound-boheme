import crypto from 'crypto'

const SESSION_COOKIE = 'sunbound_admin_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7
const activeSessions = new Map()

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .reduce((cookies, pair) => {
      const separatorIndex = pair.indexOf('=')

      if (separatorIndex === -1) {
        return cookies
      }

      const key = pair.slice(0, separatorIndex)
      const value = pair.slice(separatorIndex + 1)
      cookies[key] = decodeURIComponent(value)
      return cookies
    }, {})
}

function getPasswordHash() {
  return process.env.ADMIN_PASSWORD_HASH || ''
}

export function isAdminConfigured() {
  const storedHash = getPasswordHash()
  return Boolean(
    process.env.ADMIN_SESSION_SECRET &&
      storedHash &&
      storedHash !== 'replace-me-with-a-generated-password-hash'
  )
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derivedKey}`
}

export function verifyPassword(password, storedHash) {
  if (!password || !storedHash || !storedHash.includes(':')) {
    return false
  }

  const [salt, savedHash] = storedHash.split(':')

  if (!salt || !savedHash) {
    return false
  }

  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
  const savedBuffer = Buffer.from(savedHash, 'hex')
  const derivedBuffer = Buffer.from(derivedKey, 'hex')

  if (savedBuffer.length !== derivedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(savedBuffer, derivedBuffer)
}

export function createAdminSession() {
  const token = crypto.randomBytes(32).toString('hex')

  activeSessions.set(token, {
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  })

  return token
}

export function clearAdminSession(token) {
  if (token) {
    activeSessions.delete(token)
  }
}

export function getSessionToken(req) {
  const cookies = parseCookies(req.headers.cookie)
  return cookies[SESSION_COOKIE]
}

export function setSessionCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_MS / 1000}; SameSite=Lax`
  )
}

export function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
  )
}

export function requireAdmin(req, res, next) {
  const token = getSessionToken(req)

  if (!token) {
    return res.status(401).json({ error: 'Admin login required.' })
  }

  const session = activeSessions.get(token)

  if (!session || session.expiresAt < Date.now()) {
    clearAdminSession(token)
    clearSessionCookie(res)
    return res.status(401).json({ error: 'Session expired. Please sign in again.' })
  }

  next()
}

export function getAuthStatus(req) {
  const token = getSessionToken(req)

  if (!token) {
    return false
  }

  const session = activeSessions.get(token)

  if (!session || session.expiresAt < Date.now()) {
    clearAdminSession(token)
    return false
  }

  return true
}
