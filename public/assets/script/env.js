//global enironment variables
//this file is used to set the environment variables for the application
export const APP_ENV = {
  // Base URL
  BASE_URL: 'https://api.elysia-app.live',
  
  // GET ENDPOINTS
  FETCH_STORE_URL: 'https://api.elysia-app.live/book/randomStoreIndex',
  SEARCH_URL: 'https://api.elysia-app.live/book/search',
  MASTER_URL: 'https://api.elysia-app.live/book/all',
  FETCH_BY_ID_URL: 'https://api.elysia-app.live/book/id/',
  
  // POST ENDPOINTS   
  IMAGE_PRESIGNED_URL: 'https://api.elysia-app.live/upload/presigned',
  UPLOAD_BOOK_URL: 'https://api.elysia-app.live/upload/book',  
  
  // Auth endpoints
  LOGIN_URL: 'https://api.elysia-app.live/auth/login',
  REGISTER_URL: 'https://api.elysia-app.live/auth/register',

  // placeholder image
  PLACEHOLDER_IMAGE: 'https://cdn.elysia-app.live/placeholder.jpg',
  LOGO_IMAGE: 'https://cdn.elysia-app.live/logo.png',

  DEBUG_MODE: true
};