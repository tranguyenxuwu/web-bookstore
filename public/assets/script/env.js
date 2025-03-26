//global enironment variables
//this file is used to set the environment variables for the application
export const APP_ENV = {
  // Base URL
  BASE_URL: 'https://api.elysia-app.live',
  
  // GET ENDPOINTS
  FETCH_STORE_URL: 'https://api.elysia-app.live/book/randomStoreIndex',
  SEARCH_URL: './assets/data/books.json',
  MASTER_URL: './assets/data/books.json',
  FETCH_BY_ID_URL: './assets/data/books.json?id=',
  
  // POST ENDPOINTS   
  IMAGE_PRESIGNED_URL: 'https://api.elysia-app.live/upload/presigned',
  UPLOAD_BOOK_URL: 'https://api.elysia-app.live/upload/book',  
  
  // Auth endpoints
  LOGIN_URL: 'https://api.elysia-app.live/auth/login',
  REGISTER_URL: 'https://api.elysia-app.live/auth/register',

  // placeholder image
  PLACEHOLDER_IMAGE: 'https://placehold.co/400x600?text=Book+Cover',
  LOGO_IMAGE: './assets/image/logo.png',
  CART_ICON: './assets/image/cart-icon.svg',
  ACCOUNT_ICON: './assets/image/account-icon.svg',

  DEBUG_MODE: true
};

// Nếu dùng ES6 modules
if (typeof exports !== 'undefined') {
  exports.APP_ENV = APP_ENV;
} else {
  window.APP_ENV = APP_ENV;
}