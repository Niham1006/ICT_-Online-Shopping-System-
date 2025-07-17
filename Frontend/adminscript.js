const apiURL = 'http://localhost:3000';
let currentAdmin = null;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('admin-login-btn').addEventListener('click', async () => {
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value;

    try {
      const res = await fetch(`${apiURL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success) {
        currentAdmin = data.username;
        document.getElementById('admin-auth').style.display = 'none';
        document.getElementById('sidebarToggle').style.display = 'block';
        document.getElementById('sidebar').style.display = 'block';
        showSection('products-panel');
        loadProducts();
        loadUsersAndOrders();
      } else {
        alert(data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Error logging in:', err);
      alert('Server error. Check console.');
    }
  });

  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('show');
  });

  window.showSection = showSection;
});

function showSection(sectionId) {
  document.querySelectorAll('.page').forEach(page => (page.style.display = 'none'));
  document.getElementById(sectionId).style.display = 'block';
  document.getElementById("client-link").style.display = "none";
  document.getElementById("admin-logout").style.display = "block";


  if (sectionId === 'products-panel') loadProducts();
  if (sectionId === 'users-orders-panel') loadUsersAndOrders();
  if (sectionId === 'review-panel') loadReviews(); // NEW
  
}


async function loadProducts() {
  try {
    const res = await fetch(`${apiURL}/admin/products`);
    const products = await res.json();
    const list = document.getElementById('product-list');
    list.innerHTML = '';

    products.forEach(p => {
      const div = document.createElement('div');
      div.className = 'product-card';
      div.innerHTML = `
        <h3>${p.name}</h3>
        <p>Stock: <input id="stock-${p.id}" value="${p.stock}" type="number" min="0"/></p>
        <p>Price: <input id="price-${p.id}" value="${p.price}" type="number" min="0"/></p>
        <button onclick="updateProduct(${p.id})">Update</button>
      `;
      list.appendChild(div);
    });
  } catch (err) {
    console.error('Error loading products:', err);
  }
}

async function updateProduct(id) {
  const stock = document.getElementById(`stock-${id}`).value;
  const price = document.getElementById(`price-${id}`).value;

  try {
    const res = await fetch(`${apiURL}/admin/products/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stock, price })
    });

    const data = await res.json();
    if (data.message) alert(data.message);
    loadProducts();
  } catch (err) {
    console.error('Error updating product:', err);
    alert('Failed to update product.');
  }
}

async function loadUsersAndOrders() {
  try {
    const resUsers = await fetch(`${apiURL}/admin/users`);
    const users = await resUsers.json();
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    users.forEach(u => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>${u.email}</td>
        <td>${u.password}</td>
      `;
      userList.appendChild(row);
    });

    const resOrders = await fetch(`${apiURL}/admin/orders`);
    const orders = await resOrders.json();
    const orderList = document.getElementById('order-list');
    orderList.innerHTML = '';
    orders.forEach(o => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${o.id}</td>
        <td>${o.username}</td>
        <td>${o.name}</td>
        <td>${o.phone}</td>
        <td>${o.address}</td>
        <td>${o.payment_method}</td>
        <td>${o.items}</td>
        <td>${o.total_price} Tk</td>
        <td>${new Date(o.order_time).toLocaleString()}</td>
      `;
      orderList.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading users or orders:', err);
  }
}

async function loadReviews() {
  try {
    const res = await fetch(`${apiURL}/admin/reviews`);
    const reviews = await res.json();
    const list = document.getElementById('review-list');
    list.innerHTML = '';

    reviews.forEach(r => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${r.id}</td>
        <td>${r.username}</td>
        <td>${r.review}</td>
        <td>${new Date(r.review_time).toLocaleString()}</td>
      `;
      list.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading reviews:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("client-link").style.display = "block";
});

document.getElementById("admin-logout").addEventListener("click", () => {
  location.reload();
});
