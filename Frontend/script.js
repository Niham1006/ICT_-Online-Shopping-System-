let users = [];
let cart = [];
let currentUser = null;

const apiURL = 'http://localhost:3000';

async function renderProducts() {
  const productsContainer = document.getElementById("products");
  productsContainer.innerHTML = "";

  try {
    const res = await fetch(`${apiURL}/products`);
    const products = await res.json();

    if (!Array.isArray(products) || products.length === 0) {
      productsContainer.innerHTML = "<p>No products available.</p>";
      return;
    }

    products.forEach((product) => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${apiURL}/${product.image}" alt="${product.name}" class="product-image" />
        <h3>${product.name}</h3>
        <p>${product.price} Tk</p>
        <p>Stock: ${product.stock}</p>
        <input type="number" id="qty-${product.id}" value="1" min="1" max="${product.stock}" />
        <button onclick='addToCart(${JSON.stringify(product)})'>Add to Cart</button>
      `;
      productsContainer.appendChild(card);
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    productsContainer.innerHTML = "<p>Failed to load products.</p>";
  }
}

document.getElementById("auth-btn").addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const formTitle = document.getElementById("form-title").textContent;

  if (!username || !password || (formTitle === "Sign Up" && !email)) {
    alert("Please fill in all fields.");
    return;
  }

  if (formTitle === "Sign Up") {
    try {
      const res = await fetch(`${apiURL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (data.success) {
        alert("Account created successfully! You can now log in.");
        switchToLogin();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Error connecting to backend:", err);
      alert("Server error. Try again later.");
    }
  } else {
    try {
      const res = await fetch(`${apiURL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        loginSuccess({ username });
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Error connecting to backend:", err);
      alert("Server error. Try again later.");
    }
  }
});

function loginSuccess(user) {
  currentUser = user;
  localStorage.setItem("currentUser", JSON.stringify(user));
  document.getElementById("auth-section").style.display = "none";
  document.getElementById("login-info").style.display = "none"; 
  document.getElementById("sidebarToggle").style.display = "block";
  document.getElementById("home").style.display = "block";
  document.getElementById("admin-link").style.display = "none";
  document.getElementById("client-logout").style.display = "block";

  const scrollBanner = document.getElementById("scroll-banner");
  if (scrollBanner) {
    scrollBanner.style.display = "none";
  }

  renderProducts();
}

document.addEventListener("click", function (e) {
  if (e.target && e.target.classList.contains("toggle-link")) {
    const formTitle = document.getElementById("form-title").textContent;
    formTitle === "Login" ? switchToSignup() : switchToLogin();
  }
});

function switchToSignup() {
  document.getElementById("form-title").textContent = "Sign Up";
  document.getElementById("auth-btn").textContent = "Sign Up";
  document.getElementById("email").classList.remove("hide");
  document.getElementById("toggle-auth").innerHTML = `Already have an account? <span class="toggle-link">Log in</span>`;
}

function switchToLogin() {
  document.getElementById("form-title").textContent = "Login";
  document.getElementById("auth-btn").textContent = "Login";
  document.getElementById("email").classList.add("hide");
  document.getElementById("toggle-auth").innerHTML = `Don't have an account? <span class="toggle-link">Sign up</span>`;
}

document.getElementById("sidebarToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("show");
});

function showSection(sectionId) {
  document.querySelectorAll(".page").forEach(page => page.style.display = "none");
  document.getElementById(sectionId).style.display = "block";

  if (sectionId === "cart") showCart();
  if (sectionId === "payment") updatePayment();
}

async function addToCart(product) {
  if (!currentUser || !currentUser.username) {
    alert("Please login first to add items to cart.");
    return;
  }

  const qtyInput = document.getElementById(`qty-${product.id}`);
  const quantity = qtyInput ? parseInt(qtyInput.value) : 1;

  if (isNaN(quantity) || quantity < 1) {
    alert("Please enter a valid quantity (minimum 1).");
    return;
  }

  try {
    for (let i = 0; i < quantity; i++) {
      const res = await fetch(`${apiURL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username,
          name: product.name,
          price: product.price,
          image: product.image
        })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(`Failed to add item ${i + 1}: ${data.message || 'Unknown error'}`);
        return;
      }
    }

    alert(`Added ${quantity} ${product.name} to cart successfully!`);
    showCart(); 

  } catch (err) {
    console.error("Error adding to cart:", err);
    alert("Failed to add to cart due to server error.");
  }
}

async function showCart() {
  try {
    const res = await fetch(`${apiURL}/cart?username=${currentUser.username}`);
    const cartItems = await res.json();
    const cartList = document.getElementById("cart-items");
    const totalPrice = document.getElementById("total-price");

    cartList.innerHTML = "";
    let total = 0;

    cartItems.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <img src="${item.image}" alt="${item.product_name}" class="cart-product-image" />
        <span>${item.product_name}</span> - <span>${item.price} Tk</span>
        <button onclick="removeFromCart(${item.id}, '${item.product_name}')">Remove</button>
      `;
      cartList.appendChild(li);
      total += Number(item.price);
    });

    totalPrice.textContent = total;
  } catch (err) {
    console.error("Error loading cart:", err);
  }
}

async function removeFromCart(id, productName) {
  try {
    const res = await fetch(`${apiURL}/cart/${id}?productName=${encodeURIComponent(productName)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Delete failed');
    showCart();
  } catch (err) {
    console.error("Error removing from cart:", err);
    alert("Failed to remove item from cart.");
  }
}

function updatePayment() {
  const totalElement = document.getElementById("payment-total");
  if (totalElement) {
    fetch(`${apiURL}/cart?username=${currentUser.username}`)
      .then(res => res.json())
      .then(cartItems => {
        const total = cartItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
        totalElement.textContent = total.toFixed(2);
      })
      .catch(err => {
        console.error("Error updating payment:", err);
        totalElement.textContent = "Error";
      });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const proceedButton = document.getElementById("proceed-to-pay");

  if (proceedButton) {
    proceedButton.addEventListener("click", () => {
      const method = document.getElementById("payment-method").value;

      if (!method) {
        alert("Please select a payment method.");
        return;
      }

      const name = prompt("Enter your name:");
      const phone = prompt("Enter your phone number:");
      const address = prompt("Enter your address:");

      if (!name || !phone || !address) {
        alert("All fields are required.");
        return;
      }

      fetch(`${apiURL}/cart?username=${currentUser.username}`)
        .then(res => res.json())
        .then(cartItems => {
          if (!Array.isArray(cartItems) || cartItems.length === 0) {
            alert("Cart is empty or failed to load.");
            return;
          }

          const orderDetails = {
            username: currentUser?.username || "guest",
            name,
            phone,
            address,
            paymentMethod: method,
          };

          fetch(`${apiURL}/save-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderDetails)
          })
          .then(res => res.text())
          .then(msg => {
            alert(msg);
            clearCart();
          })
          .catch(err => {
            console.error('Error saving order:', err);
            alert("Order failed to submit.");
          });
        })
        .catch(err => {
          console.error("Error fetching cart:", err);
          alert("Failed to load cart items.");
        });
    });
  }
});

function clearCart() {
  fetch(`${apiURL}/cart?username=${currentUser.username}`)
    .then(res => res.json())
    .then(cart => {
      for (let i = cart.length - 1; i >= 0; i--) {
        fetch(`${apiURL}/cart/${cart[i].id}`, { method: 'DELETE' });
      }
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const homeSection = document.getElementById("home");
  const cartSection = document.getElementById("cart");
  const paymentSection = document.getElementById("payment");

  document.getElementById("go-to-cart").addEventListener("click", () => {
    homeSection.style.display = "none";
    cartSection.style.display = "block";
    paymentSection.style.display = "none";
  });

  document.getElementById("go-to-payment").addEventListener("click", () => {
    homeSection.style.display = "none";
    cartSection.style.display = "none";
    paymentSection.style.display = "block";
  });
});

function submitReview() {
  const review = document.getElementById("review-text").value.trim();
  if (!review) {
    alert("Please write something in your complaint box.");
    return;
  }

  fetch(`${apiURL}/submit-review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: currentUser?.username || 'guest',
      review
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Thanks for your patience, we will thoroughly review the issue.");
        document.getElementById("review-text").value = '';
      } else {
        alert(data.message || "Failed to submit a complaint.");
      }
    })
    .catch(err => {
      console.error("Error submitting complaint:", err);
      alert("Server error.");
    });
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("admin-link").style.display = "block";
});

document.getElementById("client-logout").addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  location.reload();
});

function populateScrollBanner() {
  const scrollTrack = document.getElementById('scroll-track');
  if (!scrollTrack) return;

  fetch(`${apiURL}/products`)
    .then(res => res.json())
    .then(products => {
      if (!Array.isArray(products) || products.length === 0) return;

      scrollTrack.innerHTML = '';

      const scrollingProducts = [...products, ...products]; 

      scrollingProducts.forEach(product => {
        const item = document.createElement('div');
        item.classList.add('scroll-item');

        const imagePath = `${apiURL}/${product.image}`;

        item.innerHTML = `
          <img src="${imagePath}" alt="${product.name}" />
          <span>${product.name}</span>
        `;

        scrollTrack.appendChild(item);
      });
    })
    .catch(err => {
      console.error("Failed to fetch products for scroll banner:", err);
    });
}

window.onload = () => {
  renderProducts();     
  populateScrollBanner(); 
};
