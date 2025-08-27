// API configuration and utility functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  LOGOUT: "/auth/logout",
  REFRESH_TOKEN: "/auth/refresh",

  // Canteen endpoints
  CANTEENS: "/canteens",
  CANTEEN_BY_ID: (id: string) => `/canteens/${id}`,
  CANTEEN_MENU: (id: string) => `/canteens/${id}/menu`,

  // Menu item endpoints
  MENU_ITEMS: "/menu-items",
  MENU_ITEM_BY_ID: (id: string) => `/menu-items/${id}`,
  CATEGORIES: "/categories",

  // Order endpoints
  ORDERS: "/orders",
  ORDER_BY_ID: (id: string) => `/orders/${id}`,
  USER_ORDERS: (userId: string) => `/users/${userId}/orders`,
  CANTEEN_ORDERS: (canteenId: string) => `/canteens/${canteenId}/orders`,

  // User endpoints
  USERS: "/users",
  USER_PROFILE: (id: string) => `/users/${id}`,

  // Subscription endpoints
  SUBSCRIPTIONS: "/subscriptions",
  SUBSCRIPTION_PLANS: "/subscription-plans",
  USER_SUBSCRIPTION: (userId: string) => `/users/${userId}/subscription`,
}

// Generic API client
class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // Load token from localStorage if available
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

  const headers = new Headers(options.headers as HeadersInit)
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  if (this.token) headers.set("Authorization", `Bearer ${this.token}`)

    try {
      const response = await fetch(url, {
        ...options,
  headers,
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

// API response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Error handling utility
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export const handleApiError = (error: any): ApiError => {
  if (error instanceof ApiError) {
    return error
  }

  if (error.response) {
    return new ApiError(
      error.response.data?.message || "API request failed",
      error.response.status,
      error.response.data?.code,
    )
  }

  return new ApiError(error.message || "Unknown error occurred")
}
