// src/lib/impersonation.ts

/**
 * Adds impersonation parameters to a URL if the user is impersonating
 * @param href - The base URL/path to add parameters to
 * @param isImpersonating - Whether the user is currently impersonating
 * @param businessId - The business ID being impersonated
 * @returns The URL with impersonation parameters if applicable
 */
export function addImpersonationParams(
    href: string,
    isImpersonating: boolean,
    businessId?: string
  ): string {
    if (!isImpersonating || !businessId) return href
  
    try {
      const url = new URL(href, window.location.origin)
      url.searchParams.set('impersonate', 'true')
      url.searchParams.set('businessId', businessId)
      return url.pathname + url.search
    } catch (error) {
      // If URL parsing fails, return original href
      console.error('Error parsing URL:', error)
      return href
    }
  }
  
  /**
   * Custom hook to get impersonation state from session and pathname
   * Use this in client components that need to check impersonation status
   */
  export function useImpersonation(businessId: string) {
    if (typeof window === 'undefined') {
      return { isImpersonating: false, addParams: (href: string) => href }
    }
  
    const searchParams = new URLSearchParams(window.location.search)
    const isImpersonating = searchParams.get('impersonate') === 'true'
  
    const addParams = (href: string) => 
      addImpersonationParams(href, isImpersonating, businessId)
  
    return { isImpersonating, addParams }
  }