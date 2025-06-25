const apiURL = 'http://localhost:3000';
let currentAdmin = null;

document.addEventListener('DOMContentLoaded', () => {
  // === Login Event Handler ===
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

  // === Sidebar Toggle ===
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('show');
  });

  // === Navigation helper ===
  window.showSection = (sectionId) => {
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
    if (sectionId === 'products-panel') loadProducts();
    if (sectionId === 'users-orders-panel') loadUsersAndOrders();
  };
});

// === Load products into the product-panel ===
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
        <button onclick="updateStock(${p.id})">Update</button>
      `;
      list.appendChild(div);
    });
  } catch (err) {
    console.error('Error loading products:', err);
  }
}

// === Load users and orders ===
async function loadUsersAndOrders() {
  try {
    const resUsers = await fetch(`${apiURL}/admin/users`);
    const users = await resUsers.json();
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    users.forEach(u => {
      const li = document.createElement('li');
      li.innerText = `${u.username} (${u.email})`;
      userList.appendChild(li);
    });

    const resOrders = await fetch(`${apiURL}/admin/orders`);
    const orders = await resOrders.json();
    const orderList = document.getElementById('order-list');
    orderList.innerHTML = '';
    orders.forEach(o => {
      const li = document.createElement('li');
      li.innerText = `${o.username} ordered ${o.items} (${o.total_price} Tk)`;
      orderList.appendChild(li);
    });

  } catch (err) {
    console.error('Error loading users or orders:', err);
  }
}

// === Updating product stock ===
async function updateStock(id) {
  const stock = document.getElementById(`stock-${id}`).value;
  try {
    await fetch(`${apiURL}/admin/products/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stock })
    });
    alert('Product stock updated successfully.');
    loadProducts();
  } catch (err) {
    console.error('Error updating stock:', err);
    alert('Error updating stock.');
  }
}
