import { authService } from './services/auth.service'

// Shared auth cache across all hooks/components
const authCache = new Map<string, { data: any; expiry: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
// In-memory request deduplication
let authPromise: Promise<any> | null = null

export const getCachedUser = async () => {
  const now = Date.now()
  
  // 1. Cek di memori dulu
  let cached = authCache.get('me')
  
  // 2. Kalau tidak ada di memori, coba cek di sessionStorage (berguna saat F5 reload)
  if (!cached && typeof window !== 'undefined') {
    const sessionData = sessionStorage.getItem('auth_me_cache')
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData)
        if (parsed.expiry > now) {
          cached = parsed
          authCache.set('me', parsed) // restore to memory
        }
      } catch (e) {
        // ignore
      }
    }
  }

  // Return cached auth if still valid
  if (cached && cached.expiry > now) {
    return cached.data
  }

  // If a request is already in-flight, wait for it instead of making a new request
  if (authPromise) {
    return authPromise.then(() => {
      const cached = authCache.get('me')
      return cached?.data
    })
  }

  // Fetch fresh auth data (mark as in-flight)
  authPromise = authService.me()
  const authData = await authPromise
  authPromise = null // Clear the in-flight marker

  if (authData) {
    const cacheObj = { data: authData, expiry: now + CACHE_DURATION }
    authCache.set('me', cacheObj)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_me_cache', JSON.stringify(cacheObj))
    }
  }

  return authData
}

// Clear cache on logout
export const clearAuthCache = () => {
  authCache.clear()
  authPromise = null
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('auth_me_cache')
  }
}
