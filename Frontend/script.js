let users = [];
let cart = [];
let currentUser = null;

const apiURL = 'http://localhost:3000'; 

const products = [
  { name: "Rice", price: 70, image: "images/rice.jpg" },
  { name: "Oil", price: 160, image: "images/oil.jpg" },
  { name: "Potato", price: 30, image: "images/potato.jpg" },
  { name: "Tomato", price: 50, image: "images/tomato.jpg" },
  { name: "Onion", price: 40, image: "images/onion.jpg" },
  { name: "Milk", price: 90, image: "images/milk.jpg" },
  { name: "Salt", price: 20, image: "images/salt.jpg" },
  { name: "Sugar", price: 50, image: "images/sugar.jpg" },
  { name: "Flour", price: 60, image: "images/flour.jpg" },
  { name: "Tea", price: 120, image: "images/tea.jpg" }
];

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
    const user = users.find(user => user.username === username && user.password === password);
    if (user) {
      loginSuccess(user);
    } else {
      try {
        const res = await fetch(`${apiURL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
          loginSuccess({ username, password });
        } else {
          alert(data.message);
        }
      } catch (err) {
        console.error("Error connecting to backend:", err);
        alert("Server error. Try again later.");
      }
    }
  }
});


function loginSuccess(user) {
  currentUser = user;
  localStorage.setItem("currentUser", JSON.stringify(user));
  document.getElementById("auth-section").style.display = "none";
  document.getElementById("sidebarToggle").style.display = "block";
  document.getElementById("home").style.display = "block";
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

function renderProducts() {
  const productsContainer = document.getElementById("products");
  productsContainer.innerHTML = "";
  products.forEach((product, index) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" />
      <h3>${product.name}</h3>
      <p>${product.price} Tk</p>
      <button onclick="addToCart(products[${index}])">Add to Cart</button>
    `;
    productsContainer.appendChild(card);
  });
}

async function addToCart(product) {
  try {
    await fetch(`${apiURL}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    showCart();
  } catch (err) {
    console.error("Error adding to cart:", err);
  }
}

async function showCart() {
  try {
    const res = await fetch(`${apiURL}/cart`);
    const cartItems = await res.json();
    const cartList = document.getElementById("cart-items");
    const totalPrice = document.getElementById("total-price");

    cartList.innerHTML = "";
    let total = 0;

    cartItems.forEach((item, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="cart-product-image" />
        <span>${item.name}</span> - <span>${item.price} Tk</span>
        <button onclick="removeFromCart(${index})">Remove</button>
      `;
      cartList.appendChild(li);
      total += item.price;
    });

    totalPrice.textContent = total;
  } catch (err) {
    console.error("Error loading cart:", err);
  }
}

async function removeFromCart(index) {
  try {
    await fetch(`${apiURL}/cart/${index}`, {
      method: 'DELETE'
    });
    showCart();
  } catch (err) {
    console.error("Error removing from cart:", err);
  }
}

function updatePayment() {
  const totalElement = document.getElementById("payment-total");
  if (totalElement) {
    fetch(`${apiURL}/cart`)
      .then(res => res.json())
      .then(cartItems => {
        const total = cartItems.reduce((sum, item) => sum + item.price, 0);
        totalElement.textContent = total;
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

      fetch('/cart')
        .then(res => res.json())
        .then(cartItems => {
          const orderDetails = {
            name,
            phone,
            address,
            items: cartItems,
            paymentMethod: method,
            time: new Date().toLocaleString()
          };

          fetch('/save-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderDetails)
          })
          .then(res => res.text())
          .then(msg => {
            alert(msg);
            clearCart(); 
          })
          .catch(err => console.error('Error saving order:', err));
        });
    });
  }
});

function clearCart() {
  fetch('/cart')
    .then(res => res.json())
    .then(cart => {
      for (let i = cart.length - 1; i >= 0; i--) {
        fetch(`/cart/${i}`, { method: 'DELETE' });
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
