import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { loginWithGoogle, type ApiUser } from '@/lib/api'

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: { access_token: string }) => void
          }) => {
            requestAccessToken: () => void
          }
        }
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }) => void
          prompt: (momentNotification?: (notification: {
            isNotDisplayed: () => boolean
            isSkippedMoment: () => boolean
            isDismissedMoment: () => boolean
            getNotDisplayedReason: () => string
            getSkippedReason: () => string
            getDismissedReason: () => string
          }) => void) => void
          disableAutoSelect: () => void
          storeCredential: (credentials: { id: string; password: string }) => void
          cancel: () => void
          onGoogleLibraryLoad: () => void
          revoke: (accessToken: string, done: () => void) => void
        }
      }
    }
  }
}

interface GoogleLoginButtonProps {
  redirectTo?: string
}

export function GoogleLoginButton({ redirectTo }: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const buttonRef = useRef<HTMLDivElement>(null)
  const isInitializedRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const normalizeUser = useCallback((user?: ApiUser | null) => {
    if (!user) {
      return null
    }

    const roles = Array.isArray(user.role)
      ? user.role.filter(Boolean)
      : user.role
        ? [user.role].filter(Boolean)
        : []

    return {
      userId: user.userId,
      accountNo: user.accountNo,
      name: user.name ?? (user.email ? user.email.split('@')[0] : undefined),
      email: user.email ?? '',
      role: roles,
      status: user.status,
      exp: user.exp,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }, [])

  // Load Google Identity Services script
  useEffect(() => {
    // Check if script is already loaded
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existingScript) {
      // Wait a bit to ensure Google API is ready
      setTimeout(() => {
        if (window.google?.accounts?.id) {
          setIsScriptLoaded(true)
        }
      }, 100)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      // Wait a bit to ensure Google API is fully loaded
      setTimeout(() => {
        if (window.google?.accounts?.id) {
          setIsScriptLoaded(true)
        }
      }, 100)
    }
    script.onerror = () => {
      toast.error('Không thể tải Google Sign-In')
    }
    document.head.appendChild(script)

    // Cleanup function
    return () => {
      // Cancel any pending operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      setIsLoading(true)

      try {
        // Call backend API with idToken
        const result = await loginWithGoogle(response.credential)

        // Store access token if returned
        if (result.accessToken) {
          auth.setAccessToken(result.accessToken)
        }

        // Store user data if returned
        const mappedUser = normalizeUser(result.user)

        if (mappedUser) {
          auth.setUser(mappedUser)
        } else if (result.accessToken) {
          // If user data is not returned, create a minimal user object
          // You might want to decode the JWT token or make another API call to get user info
          auth.setUser({
            email: '',
            role: [],
            exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          })
        }

        toast.success('Đăng nhập thành công!')

        const latestUser = useAuthStore.getState().auth.user
        const isAdmin =
          Array.isArray(latestUser?.role) &&
          latestUser?.role.some((r) => r.toLowerCase() === 'admin')

        // Admin -> trang quản lý đợt đăng ký, Student -> trang chào mừng
        const targetPath = isAdmin ? '/admin/cohort-schedule' : '/'
        navigate({ to: targetPath, replace: true })
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Google login error:', error)
        toast.error('Đăng nhập thất bại. Vui lòng thử lại.')
      } finally {
        setIsLoading(false)
      }
    },
    [auth, navigate, normalizeUser, redirectTo],
  )

  // Initialize Google Sign-In when script is loaded
  useEffect(() => {
    // Prevent multiple initializations
    if (!isScriptLoaded || !window.google?.accounts?.id || isInitializedRef.current) {
      return
    }

    // Get Google Client ID from environment variable
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    // Debug: Check if environment variable is loaded
     
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('VITE_GOOGLE_CLIENT_ID:', clientId)
    }

    if (!clientId || clientId === 'undefined' || clientId.trim() === '') {
      // eslint-disable-next-line no-console
      console.error('VITE_GOOGLE_CLIENT_ID is not set or is undefined in environment variables')
      toast.error('Google Client ID chưa được cấu hình. Vui lòng kiểm tra file .env và restart dev server.')
      return
    }

    try {
      // Create abort controller for this initialization
      abortControllerRef.current = new AbortController()

      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      isInitializedRef.current = true
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error initializing Google Sign-In:', error)
      toast.error('Không thể khởi tạo Google Sign-In')
    }

    // Cleanup function
    return () => {
      // Cancel any pending operations when component unmounts
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort()
          // Cancel Google Sign-In prompt if active
          if (window.google?.accounts?.id) {
            window.google.accounts.id.cancel()
          }
        } catch (error) {
          // Ignore errors during cleanup
          // eslint-disable-next-line no-console
          if (import.meta.env.DEV) console.warn('Error during Google Sign-In cleanup:', error)
        }
      }
      isInitializedRef.current = false
    }
  }, [isScriptLoaded, handleCredentialResponse])


  // Fallback: Show helpful message when FedCM is disabled
  // Note: Redirect flow would require backend changes to handle OAuth callback
  // For now, we'll provide clear instructions to the user
  const handleFedCMDisabled = useCallback(() => {
    toast.error('FedCM đã bị vô hiệu hóa', {
      description: 'Vui lòng bật "Third-party sign-in" trong cài đặt trình duyệt (biểu tượng bên trái thanh địa chỉ) và tải lại trang.',
      duration: 8000,
    })
  }, [])

  const handleGoogleLogin = () => {
    if (!isScriptLoaded || !window.google?.accounts?.id || !isInitializedRef.current) {
      toast.error('Google Sign-In chưa sẵn sàng. Vui lòng thử lại sau.')
      return
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || clientId === 'undefined' || clientId.trim() === '') {
      toast.error('Google Client ID chưa được cấu hình. Vui lòng kiểm tra file .env và restart dev server.')
      // eslint-disable-next-line no-console
      console.error('VITE_GOOGLE_CLIENT_ID is not set:', clientId)
      return
    }

    try {
      // Trigger Google Sign-In popup (One Tap)
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason()
          // eslint-disable-next-line no-console
          if (import.meta.env.DEV) console.log('One Tap not displayed:', reason)
          
          // Check for FedCM-related errors
          if (reason === 'fedcm_accounts_not_returned' || 
              reason === 'fedcm_error' ||
              reason === 'fedcm_disabled') {
            handleFedCMDisabled()
            return
          }
          
          // Try alternative login method or show error based on reason
          if (reason === 'browser_not_supported' || reason === 'invalid_client') {
            toast.error('Trình duyệt không hỗ trợ hoặc cấu hình không hợp lệ.')
          } else if (reason === 'missing_client_id') {
            toast.error('Google Client ID chưa được cấu hình.')
          } else {
            // For other reasons, show generic error
            // eslint-disable-next-line no-console
            if (import.meta.env.DEV) console.warn('One Tap not displayed, reason:', reason)
            toast.error('Không thể hiển thị đăng nhập Google. Vui lòng thử lại sau.')
          }
        } else if (notification.isSkippedMoment()) {
          const reason = notification.getSkippedReason()
          // eslint-disable-next-line no-console
          if (import.meta.env.DEV) console.log('One Tap skipped:', reason)
          
          // If skipped due to FedCM, try OAuth 2.0
          if (reason === 'user_cancel' || reason === 'tap_outside') {
            // User cancelled, don't try fallback
            return
          }
        } else if (notification.isDismissedMoment()) {
          const reason = notification.getDismissedReason()
          // eslint-disable-next-line no-console
          if (import.meta.env.DEV) console.log('One Tap dismissed:', reason)
          
          // If dismissed due to FedCM issues, try OAuth 2.0
          if (reason === 'credential_returned') {
            // Credential was returned, callback should handle it
            return
          }
        }
      })
    } catch (error) {
      // Handle FedCM abort errors gracefully
      if (error instanceof Error) {
        // Check for FedCM-related errors
        if (error.message.includes('FedCM') || 
            error.message.includes('fedcm')) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn('FedCM error detected:', error.message)
          }
          
          handleFedCMDisabled()
          return
        }
        
        if (error.name === 'AbortError') {
          // eslint-disable-next-line no-console
          if (import.meta.env.DEV) console.warn('Google Sign-In was aborted:', error.message)
          // Don't show error to user if it was aborted (e.g., user navigated away)
          return
        }
      }
      
      // eslint-disable-next-line no-console
      console.error('Error triggering Google Sign-In:', error)
      toast.error('Không thể hiển thị đăng nhập Google. Vui lòng thử lại.')
    }
  }

  return (
    <div className='w-full'>
      <Button
        type='button'
        onClick={handleGoogleLogin}
        disabled={isLoading || !isScriptLoaded}
        className='w-full'
        variant='outline'
      >
        {isLoading ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Đang đăng nhập...
          </>
        ) : (
          <>
            <svg
              className='mr-2 h-4 w-4'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                fill='#4285F4'
              />
              <path
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                fill='#34A853'
              />
              <path
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                fill='#FBBC05'
              />
              <path
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                fill='#EA4335'
              />
            </svg>
            Đăng nhập với Google
          </>
        )}
      </Button>
      <div ref={buttonRef} id='google-signin-button' className='hidden' />
    </div>
  )
}

