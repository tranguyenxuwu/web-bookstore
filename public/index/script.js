const carousel = document.querySelector('.carousel');
        const slides = document.querySelectorAll('.slide');
        const dots = document.querySelectorAll('.dot');
        const prevBtn = document.querySelector('.prev');
        const nextBtn = document.querySelector('.next');
        
        let currentSlide = 0;
        const slideCount = slides.length;

        function updateCarousel() {
            carousel.style.transform = `translateX(-${currentSlide * 25}%)`;
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
            });
        }

        function nextSlide() {
            currentSlide = (currentSlide + 1) % slideCount;
            updateCarousel();
        }

        function prevSlide() {
            currentSlide = (currentSlide - 1 + slideCount) % slideCount;
            updateCarousel();
        }

        // Event listeners
        nextBtn.addEventListener('click', nextSlide);
        prevBtn.addEventListener('click', prevSlide);

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentSlide = index;
                updateCarousel();
            });
        });

        // Auto-advance slides every 5 seconds
        setInterval(nextSlide, 5000);


// Fetch the product data from a JSON file
fetch('./product.json')
    .then(response => response.json())
    .then(data => {
        const productContainer = document.querySelector('.products');

        data.books.forEach(book => {
            const productElement = document.createElement('div');
            productElement.classList.add('product');

            const imageElement = document.createElement('img');
            imageElement.alt = book.bookName;

            if (book.image) {
                imageElement.src = book.image;
            } else {
                imageElement.src = 'https://www.genius100visions.com/wp-content/uploads/2017/09/placeholder-vertical.jpg';
                imageElement.alt = 'Placeholder image';
            }

            imageElement.onerror = () => {
                console.error(`Error loading image: ${imageElement.src}`);
                imageElement.src = 'https://www.genius100visions.com/wp-content/uploads/2017/09/placeholder-vertical.jpg';
                imageElement.alt = 'Placeholder image';
            };

            const productInfoElement = document.createElement('div');
            productInfoElement.classList.add('product-info');

            const titleElement = document.createElement('h3');
            titleElement.textContent = book.bookName;

            const typeElement = document.createElement('p');
            typeElement.textContent = `Type: ${book.type}`;

            const authorElement = document.createElement('p');
            authorElement.textContent = `by ${book.author}`;

            const priceElement = document.createElement('div');
            priceElement.classList.add('price');

            const saleElement = document.createElement('span');
            saleElement.classList.add('sale-price');
            saleElement.textContent = book.price;
            
            // nut them vao gio hang
            // const addToCartButton = document.createElement('button');
            // addToCartButton.classList.add('add-to-cart');
            // addToCartButton.textContent = 'Add to Cart';
            // addToCartButton.addEventListener('click', () => {
            //     // You'll need to implement cart functionality here
            //     console.log(`Added ${book.bookName} to cart`);
            // });
            // productInfoElement.appendChild(addToCartButton);

            if (book.originPrice) {
                const originPriceElement = document.createElement('span');
                originPriceElement.classList.add('original-price');
                originPriceElement.textContent = book.originPrice;
                priceElement.appendChild(originPriceElement);
            }

            priceElement.appendChild(saleElement);

            productInfoElement.appendChild(titleElement);
            productInfoElement.appendChild(typeElement);
            productInfoElement.appendChild(authorElement);
            productInfoElement.appendChild(priceElement);

            productElement.appendChild(imageElement);
            productElement.appendChild(productInfoElement);

            productContainer.appendChild(productElement);
        });
    })
    .catch(error => console.error('Error fetching book data:', error));
 