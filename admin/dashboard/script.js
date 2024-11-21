// Đường dẫn đến file JSON
const jsonUrl = './data.json'; // Đổi thành đúng đường dẫn file JSON của bạn

// Lấy bảng từ DOM
const tableBody = document.querySelector("#bookTable tbody");

// Hàm tải và hiển thị dữ liệu từ file JSON
// Fetch and display data from JSON
fetch(jsonUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load JSON file');
        }
        return response.json();
    })
    .then(response => {
        // Check if response is valid and has data
        if (response.status !== 'success' || !Array.isArray(response.data)) {
            throw new Error('Invalid data format');
        }

        const books = response.data;
        tableBody.innerHTML = '';

        books.forEach((book, index) => {
            // Create new row
            const row = document.createElement("tr");
            
            // Get first author name if exists
            const authorName = book.tac_gias?.[0]?.ten_tac_gia ?? "Unknown";
            
            // Get categories as comma-separated string
            const categories = book.the_loais?.map(cat => cat.ten_the_loai).join(", ") ?? "Unknown";
            
            // Format price
            const price = new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
            }).format(book.gia_tien);

            row.innerHTML = `
                <td>${index + 1}</td>
                <td><img src="images/${book.ma_sach}.jpg" alt="${book.tieu_de}" width="50" height="70"></td>
                <td>${book.tieu_de}</td>
                <td>${categories}</td>
                <td>${authorName}</td>
                <td class="price">${price}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" onclick="editBook(${book.ma_sach})">Edit</button>
                        <button class="delete-btn" onclick="deleteBook(${book.ma_sach})">Delete</button>
                    </div>
                </td>
            `;

            tableBody.appendChild(row);
        });
    })
    .catch(error => {
        console.error('Error loading books:', error);
        tableBody.innerHTML = `<tr><td colspan="7">Error loading books: ${error.message}</td></tr>`;
    });
// Các hàm xử lý hành động "Sửa", "Xóa"
function editBook(index) {
    alert(`Chỉnh sửa sách ở vị trí: ${index + 1}`);
    // Thực hiện hành động sửa, ví dụ mở form sửa thông tin
}

function deleteBook(index) {
    if (confirm(`Bạn có chắc chắn muốn xóa sách ở vị trí: ${index + 1}?`)) {
        const row = document.querySelectorAll("#bookTable tbody tr")[index];
        row.remove();
        alert(`Sách ở vị trí ${index + 1} đã bị xóa.`);
    }
}
