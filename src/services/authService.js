// authService.js
// API integration structure for backend authentication.
// Currently points to backend endpoints that need to be implemented.

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/auth`;

export const authService = {
  /**
   * Login with email and password
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{ user: any, role: string }>}
   */
  async login(email, password) {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed. Backend might not be running.');
    }
    
    return response.json();
  },

  /**
   * Register a new driver account
   * @param {object} userData { name, email, password }
   */
  async register(userData) {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Registration failed. Backend might not be running.');
    }
    
    return response.json();
  },

  /**
   * Fetch current user session
   */
  async getCurrentUser() {
    const response = await fetch(`${API_BASE}/me`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Not authenticated');
    }
    return response.json();
  },

  /**
   * Logout current user
   */
  async logout() {
    await fetch(`${API_BASE}/logout`, { 
      method: 'POST',
      credentials: 'include'
    }).catch(console.error);
  }
};
