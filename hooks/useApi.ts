import { useState, useCallback } from 'react'
import { handleApiError } from '@/lib/api'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
  setData: (data: T) => void
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  initialData: T | null = null
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const result = await apiFunction(...args)
        setState(prev => ({ ...prev, data: result, loading: false }))
        return result
      } catch (error) {
        const apiError = handleApiError(error)
        setState(prev => ({ 
          ...prev, 
          error: apiError.message, 
          loading: false 
        }))
        return null
      }
    },
    [apiFunction]
  )

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    })
  }, [initialData])

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }))
  }, [])

  return {
    ...state,
    execute,
    reset,
    setData,
  }
}

// Specialized hooks for common API patterns
export function useApiGet<T = any>(
  apiFunction: () => Promise<T>,
  initialData: T | null = null
): UseApiReturn<T> {
  return useApi(apiFunction, initialData)
}

export function useApiPost<T = any, P = any>(
  apiFunction: (params: P) => Promise<T>
): UseApiReturn<T> {
  return useApi(apiFunction)
}

export function useApiPut<T = any, P = any>(
  apiFunction: (id: string, params: P) => Promise<T>
): UseApiReturn<T> {
  return useApi(apiFunction)
}

export function useApiDelete<T = any>(
  apiFunction: (id: string) => Promise<T>
): UseApiReturn<T> {
  return useApi(apiFunction)
}

// Hook for managing multiple API calls
export function useApiMultiple<T extends Record<string, any>>(
  apiFunctions: {
    [K in keyof T]: (...args: any[]) => Promise<T[K]>
  }
) {
  const [state, setState] = useState<{
    [K in keyof T]: UseApiState<T[K]>
  }>({} as any)

  const execute = useCallback(
    async <K extends keyof T>(
      key: K,
      ...args: any[]
    ): Promise<T[K] | null> => {
      setState(prev => ({
        ...prev,
        [key]: { ...prev[key], loading: true, error: null }
      }))

      try {
        const result = await apiFunctions[key](...args)
        setState(prev => ({
          ...prev,
          [key]: { data: result, loading: false, error: null }
        }))
        return result
      } catch (error) {
        const apiError = handleApiError(error)
        setState(prev => ({
          ...prev,
          [key]: { 
            ...prev[key], 
            error: apiError.message, 
            loading: false 
          }
        }))
        return null
      }
    },
    [apiFunctions]
  )

  const reset = useCallback((key?: keyof T) => {
    if (key) {
      setState(prev => ({
        ...prev,
        [key]: { data: null, loading: false, error: null }
      }))
    } else {
      setState({} as any)
    }
  }, [])

  return {
    state,
    execute,
    reset,
  }
}

// Hook for optimistic updates
export function useOptimisticUpdate<T>(
  apiFunction: (data: T) => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: string) => void
) {
  const [loading, setLoading] = useState(false)

  const execute = useCallback(
    async (data: T): Promise<T | null> => {
      setLoading(true)

      try {
        const result = await apiFunction(data)
        onSuccess?.(result)
        return result
      } catch (error) {
        const apiError = handleApiError(error)
        onError?.(apiError.message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [apiFunction, onSuccess, onError]
  )

  return {
    execute,
    loading,
  }
} 