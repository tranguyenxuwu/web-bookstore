//global enironment variables
//this file is used to set the environment variables for the application
export const APP_ENV = {
  // Base URL
  BASE_URL: "https://api.elysia-app.live",

  // GET ENDPOINTS
  SEARCH_URL: "https://api.elysia-app.live/book/search",
  MASTER_URL: "https://api.elysia-app.live/book/all",
  FETCH_BY_ID_URL: "https://api.elysia-app.live/book/id/",
  FETCH_BY_SERIES_URL: "https://api.elysia-app.live/book/series/",
  TYPES_URL: "https://api.elysia-app.live/book/types/",
  PUBLISHER_URL: "https://api.elysia-app.live/book/publishers/",
  AUTHOR_URL: "https://api.elysia-app.live/book/authors/",

  // POST ENDPOINTS
  IMAGE_PRESIGNED_URL: "https://api.elysia-app.live/upload/presigned",
  UPLOAD_BOOK_URL: "https://api.elysia-app.live/upload/book",
  UPLOAD_AUTHOR_URL: "https://api.elysia-app.live/upload/author",
  UPLOAD_PUBLISHER_URL: "https://api.elysia-app.live/upload/publisher",
  UPLOAD_SERIES_URL: "https://api.elysia-app.live/upload/series",

  // customer endpoints
  CREATE_CUSTOMER_URL: "https://api.elysia-app.live/customer/create",
  //new order endpoints
  CREATE_ORDER_URL: "https://api.elysia-app.live/customer/new-order",

  // Auth endpoints
  LOGIN_URL: "https://api.elysia-app.live/auth/login",
  REGISTER_URL: "https://api.elysia-app.live/auth/register",

  // placeholder image
  PLACEHOLDER_IMAGE: "https://placehold.co/400x600?text=Book+Cover",
  // LOGO_IMAGE: "https://api.elysia-app.live/",
  // CART_ICON: "https://api.elysia-app.live/.svg",
  // ACCOUNT_ICON: "https://api.elysia-app.live/con.svg",

  DEBUG_MODE: true,
};

// local environment variables for development
// comment phần dưới này nếu chưa thấy nó được comment, và uncomment phần trên
// NHỚ UPDATE CHO ĐẦY ĐỦ URL NẾU CÓ THAY ĐỔI
// export const APP_ENV = {
//   // Base URL
//   BASE_URL: "http://localhost:3000",

//   // GET ENDPOINTS
//   SEARCH_URL: "http://localhost:3000/book/search",
//   MASTER_URL: "http://localhost:3000/book/all",
//   FETCH_BY_ID_URL: "http://localhost:3000/book/id/",
//   FETCH_BY_SERIES_URL: "http://localhost:3000/book/series/",

//   TYPES_URL: "http://localhost:3000/book/types/",
//   PUBLISHER_URL: "http://localhost:3000/book/publishers/",
//   AUTHOR_URL: "http://localhost:3000/book/authors/",

//   // POST ENDPOINTS
//   IMAGE_PRESIGNED_URL: "http://localhost:3000/upload/presigned",
//   UPLOAD_BOOK_URL: "http://localhost:3000/upload/book",

//   UPLOAD_AUTHOR_URL: "http://localhost:3000/upload/author",
//   UPLOAD_PUBLISHER_URL: "http://localhost:3000/upload/publishers",
//   UPLOAD_SERIES_URL: "http://localhost:3000/upload/series",

//   // customer endpoints
//   CREATE_CUSTOMER_URL: "http://localhost:3000/customer/create",

//   //new order endpoints
//   CREATE_ORDER_URL: "http://localhost:3000/customer/new-order",

//   // Auth endpoints
//   LOGIN_URL: "http://localhost:3000/auth/login",
//   REGISTER_URL: "http://localhost:3000/auth/register",

//   // placeholder image
//   PLACEHOLDER_IMAGE: "https://placehold.co/400x600?text=Book+Cover",
//   LOGO_IMAGE: "http://localhost:3000/",
//   CART_ICON: "http://localhost:3000/.svg",
//   ACCOUNT_ICON: "http://localhost:3000/con.svg",

//   DEBUG_MODE: true,
// };

// Nếu dùng ES6 modules
if (typeof exports !== "undefined") {
  exports.APP_ENV = APP_ENV;
} else {
  window.APP_ENV = APP_ENV;
}
