let users = [];
let cart = [];
let currentUser = null;


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



document.getElementById("auth-btn").addEventListener("click", async function () {
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const formTitle = document.getElementById("form-title").textContent;

  if (formTitle === "Sign Up") {
    if (!username || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    const userExists = users.some((user) => user.username === username);
    if (userExists) {
      alert("Username already exists.");
      return;
    }

    users.push({ username, email, password });
    alert("Account created successfully! You can now log in.");
    switchToLogin();

  } else {
   
    const user = users.find(
      (user) => user.username === username && user.password === password
    );

    if (user) {
      currentUser = user;
      document.getElementById("auth-section").style.display = "none";
      document.getElementById("sidebarToggle").style.display = "block";
      document.getElementById("home").style.display = "block";
      renderProducts();
    } else {
    
      try {
        const res = await fetch('http://localhost:3000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (data.success) {
          alert("Login successful (from backend)!");
          currentUser = { username, password };
          document.getElementById("auth-section").style.display = "none";
          document.getElementById("sidebarToggle").style.display = "block";
          document.getElementById("home").style.display = "block";
          renderProducts();
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




document.getElementById("toggle-link").addEventListener("click", function () {
  const formTitle = document.getElementById("form-title").textContent;
  if (formTitle === "Login") {
    switchToSignup();
  } else {
    switchToLogin();
  }
});

function switchToSignup() {
  document.getElementById("form-title").textContent = "Sign Up";
  document.getElementById("auth-btn").textContent = "Sign Up";
  document.getElementById("toggle-auth").innerHTML = `Already have an account? <span id="toggle-link">Log in</span>`;
  document.getElementById("email").classList.remove("hide");
  document.getElementById("toggle-link").addEventListener("click", () => switchToLogin());
}

function switchToLogin() {
  document.getElementById("form-title").textContent = "Login";
  document.getElementById("auth-btn").textContent = "Login";
  document.getElementById("toggle-auth").innerHTML = `Don't have an account? <span id="toggle-link">Sign up</span>`;
  document.getElementById("email").classList.add("hide");
  document.getElementById("toggle-link").addEventListener("click", () => switchToSignup());
}

document.getElementById("sidebarToggle").addEventListener("click", function () {
  document.getElementById("sidebar").classList.toggle("show");
});

function showSection(sectionId) {
  document.querySelectorAll(".page").forEach((page) => {
    page.style.display = "none";
  });

  document.getElementById(sectionId).style.display = "block";

  if (sectionId === "cart") updateCart();
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
      <button onclick="addToCart(${index})">Add to Cart</button>
    `;
    productsContainer.appendChild(card);
  });
}

function addToCart(index) {
  cart.push(products[index]);
  
}

function updateCart() {
  const cartItems = document.getElementById("cart-items");
  const totalPrice = document.getElementById("total-price");

  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `${item.name} - ${item.price} Tk <button onclick="removeFromCart(${index})">Remove</button>`;
    cartItems.appendChild(li);
    total += item.price;
  });

  totalPrice.textContent = total;
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

function updatePayment() {
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  document.getElementById("payment-total").textContent = total;
}
