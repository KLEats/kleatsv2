import { apiClient, API_ENDPOINTS, type ApiResponse, handleApiError } from "@/lib/api"

export interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin' | 'canteen_owner'
  phone?: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  name: string
  email: string
  password: string
  phone?: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken?: string
}

class AuthService {
  private currentUser: User | null = null

  // Get current user from localStorage on initialization
  constructor() {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("current_user")
      if (userStr) {
        try {
          this.currentUser = JSON.parse(userStr)
        } catch (error) {
          console.error("Failed to parse user from localStorage:", error)
          this.clearUser()
        }
      }
    }
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        API_ENDPOINTS.LOGIN,
        credentials
      )

      const { user, token } = response.data

      // Set token in API client
      apiClient.setToken(token)

      // Store user data
      this.setUser(user)

      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  }

  // Signup user
  async signup(data: SignupData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        API_ENDPOINTS.SIGNUP,
        data
      )

      const { user, token } = response.data

      // Set token in API client
      apiClient.setToken(token)

      // Store user data
      this.setUser(user)

      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if available
      await apiClient.post(API_ENDPOINTS.LOGOUT)
    } catch (error) {
      // Even if logout fails, clear local data
      console.warn("Logout API call failed:", error)
    } finally {
      // Clear local data
      this.clearUser()
      apiClient.clearToken()
    }
  }

  // Refresh token
  async refreshToken(): Promise<{ token: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ token: string }>>(
        API_ENDPOINTS.REFRESH_TOKEN
      )

      const { token } = response.data
      apiClient.setToken(token)

      return { token }
    } catch (error) {
      // If refresh fails, logout user
      this.clearUser()
      apiClient.clearToken()
      throw handleApiError(error)
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null && apiClient.getToken() !== null
  }

  // Check if user has specific role
  hasRole(role: User['role']): boolean {
    return this.currentUser?.role === role
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    if (!this.currentUser) {
      throw new Error("User not authenticated")
    }

    try {
      const response = await apiClient.put<ApiResponse<User>>(
        API_ENDPOINTS.USER_PROFILE(this.currentUser.id),
        updates
      )

      const updatedUser = response.data
      this.setUser(updatedUser)

      return updatedUser
    } catch (error) {
      throw handleApiError(error)
    }
  }

  // Get user profile
  async getUserProfile(userId: string): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<User>>(
        API_ENDPOINTS.USER_PROFILE(userId)
      )
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  }

  // Private methods
  private setUser(user: User): void {
    this.currentUser = user
    if (typeof window !== "undefined") {
      localStorage.setItem("current_user", JSON.stringify(user))
    }
  }

  private clearUser(): void {
    this.currentUser = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("current_user")
    }
  }
}

// Export singleton instance
export const authService = new AuthService()

// Export types
export type { User, LoginCredentials, SignupData, AuthResponse } 