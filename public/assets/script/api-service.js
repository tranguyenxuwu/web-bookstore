import { APP_ENV } from './env.js';

export const ApiService = {
  // Book related API calls
  getBooks: async () => {
    try {
      const response = await fetch(APP_ENV.MASTER_URL);
      if (!response.ok) throw new Error('Failed to fetch books');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  getBookById: async (id) => {
    try {
      const response = await fetch(`${APP_ENV.FETCH_BY_ID_URL}${id}`);
      if (!response.ok) throw new Error('Book not found');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  searchBooks: async (query) => {
    try {
      const response = await fetch(`${APP_ENV.SEARCH_URL}?title=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  // User related API calls
  login: async (username, password) => {
    try {
      const response = await fetch(`${APP_ENV.BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      const response = await fetch(`${APP_ENV.BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};