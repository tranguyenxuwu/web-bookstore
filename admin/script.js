document
        .getElementById("bookForm")
        .addEventListener("submit", function (event) {
          event.preventDefault();
          const errorContainer = document.getElementById("errorContainer");
          errorContainer.innerHTML = ""; // Clear previous errors

          const formData = new FormData(event.target);
          const data = Object.fromEntries(formData.entries());

          // Convert multiple select values to arrays
          data.tac_gias = formData.getAll("tac_gias[]");
          data.the_loais = formData.getAll("the_loais[]");

          axios
            .post("http://localhost:80/api/addNewBook", data, {
              headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
              },
            })
            .then(function (response) {
              alert("Thêm sách thành công!");
              console.log(response.data);
              event.target.reset(); // Reset form
            })
            .catch(function (error) {
              if (error.response && error.response.data.errors) {
                // Display validation errors
                const errors = error.response.data.errors;
                let errorHtml = "<ul>";
                for (const [field, messages] of Object.entries(errors)) {
                  messages.forEach((message) => {
                    errorHtml += `<li>${field}: ${message}</li>`;
                  });
                }
                errorHtml += "</ul>";
                errorContainer.innerHTML = errorHtml;
              } else {
                alert(
                  "Có lỗi xảy ra: " +
                    (error.response
                      ? error.response.data.message
                      : error.message)
                );
              }
            });
        });