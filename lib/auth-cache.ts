import { authService } from './services/auth.service'

// Shared auth cache across all hooks/components
const authCache = new Map<string, { data: any; expiry: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
let authPromise: Promise<any> | null = null

export const getCachedUser = async () => {
  const now = Date.now()
  const cached = authCache.get('me')

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
    authCache.set('me', { data: authData, expiry: now + CACHE_DURATION })
  }

  return authData
}

// Clear cache on logout
export const clearAuthCache = () => {
  authCache.clear()
  authPromise = null
}
