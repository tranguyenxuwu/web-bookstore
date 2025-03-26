// Add this at the beginning of the file
let books = [
  {
    image: "https://cdn.elysia-app.live/placeholder.jpg",
    title: "Mẫu sách 1",
    price: 150000,
    publisher: "NXB Kim Đồng"
  },
  {
    image: "https://cdn.elysia-app.live/placeholder.jpg",
    title: "Mẫu sách 2",
    price: 120000,
    publisher: "NXB Trẻ"
  }
];

// Cập nhật hàm renderBooks
function renderBooks() {
    const bookList = document.getElementById("bookList");
    bookList.innerHTML = books
      .map(
        (book) => `
          <tr>
            <td><img src="${
              book.image
            }" width="50" style="border-radius: 4px;"></td>
            <td>${book.title}</td>
            <td>${book.price.toLocaleString()} đ</td>
            <td>${book.publisher}</td>
          </tr>`
      )
      .join("");
  }

  // Cập nhật hàm submitBook
  function submitBook() {
    const form = document.getElementById("bookForm");
    const title = document.getElementById("title").value;
    const price = document.getElementById("price").value;
    const publisher = document.getElementById("publisher").value;

    if (!title || !price) {
      alert("Vui lòng nhập đủ thông tin!");
      return;
    }

    const priceNumber = parseInt(price);
    if (isNaN(priceNumber) || priceNumber < 0) {
      alert("Giá tiền không hợp lệ!");
      return;
    }

    const newBook = {
      image: "https://via.placeholder.com/50",
      title,
      price: priceNumber,
      publisher: publisher || "Chưa xác định",
    };

    books.push(newBook);
    renderBooks();
    form.reset();
    closeSidePanel();
  }

  // Thêm hàm xử lý sự kiện cho input file
  document
    .getElementById("fileInput")
    .addEventListener("change", function (e) {
      const fileName = e.target.files[0].name;
      this.nextElementSibling.placeholder = `Đã chọn: ${fileName}`;
    });

  function openSidePanel() {
    document.getElementById("sidePanel").classList.add("open");
  }

  function closeSidePanel() {
    document.getElementById("sidePanel").classList.remove("open");
  }

  function showBooks() {
    document.getElementById("dashboardSection").style.display = "none";
    document.getElementById("booksSection").style.display = "block";
    closeSidePanel();
    fetchBooks();
  }

  async function fetchBooks() {
    // Giả lập gọi API
    renderBooks();
  }

  // Add missing showDashboard function
  function showDashboard() {
    document.getElementById("dashboardSection").style.display = "block";
    document.getElementById("booksSection").style.display = "none";
    closeSidePanel();
  }

  // Hàm khởi tạo ban đầu
  function init() {
    showDashboard();
  }

  // Gọi init khi trang load
  init();