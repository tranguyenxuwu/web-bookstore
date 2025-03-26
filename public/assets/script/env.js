//global enironment variables
//this file is used to set the environment variables for the application
export const APP_ENV = {
  // Base URL
  BASE_URL: "http://localhost:3000",

  // GET ENDPOINTS
  FETCH_STORE_URL: "http://localhost:3000/book/randomStoreIndex",
  SEARCH_URL: "http://localhost:3000/book/search",
  MASTER_URL: "http://localhost:3000/book/all",
  FETCH_BY_ID_URL: "http://localhost:3000/book/id/",

  // POST ENDPOINTS
  IMAGE_PRESIGNED_URL: "http://localhost:3000/upload/presigned",
  UPLOAD_BOOK_URL: "http://localhost:3000/upload/book",

  // Auth endpoints
  LOGIN_URL: "http://localhost:3000/auth/login",
  REGISTER_URL: "http://localhost:3000/auth/register",

  // placeholder image
  PLACEHOLDER_IMAGE: "https://placehold.co/400x600?text=Book+Cover",
  LOGO_IMAGE: "http://localhost:3000/",
  CART_ICON: "http://localhost:3000/.svg",
  ACCOUNT_ICON: "http://localhost:3000/con.svg",

  DEBUG_MODE: true,
};

// Nếu dùng ES6 modules
if (typeof exports !== "undefined") {
  exports.APP_ENV = APP_ENV;
} else {
  window.APP_ENV = APP_ENV;
}
