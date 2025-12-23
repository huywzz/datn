/**
 * LocalStorage utility functions
 */

/**
 * Get a value from localStorage by key
 */
export function getLocalStorage(key: string): any {
  if (typeof window === 'undefined') return null

  try {
    return localStorage.getItem(key)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting from localStorage:', error)
    return null
  }
}

/**
 * Set a value in localStorage
 */
export function setLocalStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(key, value)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error setting localStorage:', error)
  }
}

/**
 * Remove a value from localStorage
 */
export function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(key)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error removing from localStorage:', error)
  }
}

