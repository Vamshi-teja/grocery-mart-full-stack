// API Base URL
const API_URL = 'http://localhost:3000/api';

// Global state
let currentUser = null;
let cart = [];
let products = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

function initializeApp() {
    showPage('home');
    loadCategories();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.dataset.page;
            navigateTo(page);
        });
    });

    // Auth buttons
    document.getElementById('loginBtn')?.addEventListener('click', () => openModal('loginModal'));
    document.getElementById('registerBtn')?.addEventListener('click', () => openModal('registerModal'));
    document.getElementById('logoutBtn')?.addEventListener('click', logout);

    // Forms
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
    document.getElementById('checkoutForm')?.addEventListener('submit', handleCheckout);
    document.getElementById('productForm')?.addEventListener('submit', handleProductSubmit);

    // Filters
    document.getElementById('categoryFilter')?.addEventListener('change', filterProducts);
    document.getElementById('searchInput')?.addEventListener('input', filterProducts);

    // Checkout button
    document.getElementById('checkoutBtn')?.addEventListener('click', () => openCheckoutModal());

    // Add product button
    document.getElementById('addProductBtn')?.addEventListener('click', () => openProductModal());

    // Modal close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            closeModal(e.target.closest('.modal').id);
        });
    });

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

// Authentication
async function checkAuthStatus() {
    try {
        const response = await fetch(`http://localhost:3000/api/auth/me`, { credentials: 'include' });
        if (response.ok) {
            currentUser = await response.json();
            updateUIForLoggedInUser();
        } else {
            updateUIForLoggedOutUser();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        updateUIForLoggedOutUser();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`http://localhost:3000/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
            currentUser = data.user;
            closeModal('loginModal');
            updateUIForLoggedInUser();
            showNotification('Login successful!', 'success');
        } else {
            showNotification(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        showNotification('Network error', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`http://localhost:3000/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role: 'customer' })
        });

        const data = await response.json();
        if (response.ok) {
            closeModal('registerModal');
            showNotification('Registration successful! Please login.', 'success');
            openModal('loginModal');
        } else {
            showNotification(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showNotification('Network error', 'error');
    }
}

async function logout() {
    try {
        await fetch(`http://localhost:3000/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        currentUser = null;
        updateUIForLoggedOutUser();
        navigateTo('home');
        showNotification('Logged out successfully', 'success');
    } catch (error) {
        showNotification('Logout failed', 'error');
    }
}

function updateUIForLoggedInUser() {
    document.getElementById('authButtons').style.display = 'none';
    document.getElementById('userMenu').style.display = 'flex';
    document.getElementById('userName').textContent = currentUser.username;
    
    if (currentUser.role === 'admin') {
        document.getElementById('adminNav').style.display = 'block';
    }
    
    loadCart();
}

function updateUIForLoggedOutUser() {
    document.getElementById('authButtons').style.display = 'flex';
    document.getElementById('userMenu').style.display = 'none';
    document.getElementById('adminNav').style.display = 'none';
}

// Navigation
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    document.getElementById(`${page}Page`)?.classList.add('active');
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

    if (page === 'products') loadProducts();
    if (page === 'cart') loadCart();
    if (page === 'orders') loadOrders();
    if (page === 'admin') loadAdminDashboard();
}

function showPage(page) {
    navigateTo(page);
}

// Products
async function loadProducts() {
    try {
        const response = await fetch(`http://localhost:3000/api/products`);
        products = await response.json();
        displayProducts(products);
        loadCategoryFilter();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function displayProducts(productsToDisplay) {
    const grid = document.getElementById('productsGrid');
    if (!productsToDisplay || productsToDisplay.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><p>No products found</p></div>';
        return;
    }

    grid.innerHTML = productsToDisplay.map(product => `
        <div class="product-card">
            <img src="${product.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                 alt="${product.name}" class="product-image">
            <div class="product-info">
                <div class="product-category">${product.category || 'Uncategorized'}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description || ''}</p>
                <div class="product-footer">
                    <span class="product-price">$${parseFloat(product.price).toFixed(2)}</span>
                    <span class="stock-info ${product.stock_quantity < 10 ? 'stock-low' : ''} ${product.stock_quantity === 0 ? 'stock-out' : ''}">
                        ${product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                    </span>
                </div>
                <button class="btn btn-primary btn-block" 
                        onclick="addToCart(${product.id})" 
                        ${product.stock_quantity === 0 || !currentUser ? 'disabled' : ''}>
                    ${currentUser ? 'Add to Cart' : 'Login to Buy'}
                </button>
            </div>
        </div>
    `).join('');
}

async function loadCategories() {
    try {
        const response = await fetch(`http://localhost:3000/api/categories`);
        const categories = await response.json();
        // Display on home page if needed
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadCategoryFilter() {
    try {
        const response = await fetch(`http://localhost:3000/api/categories`);
        const categories = await response.json();
        const filter = document.getElementById('categoryFilter');
        filter.innerHTML = '<option value="">All Categories</option>' +
            categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    } catch (error) {
        console.error('Error loading category filter:', error);
    }
}

function filterProducts() {
    const category = document.getElementById('categoryFilter').value;
    const search = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = products;
    
    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }
    
    if (search) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(search) || 
            (p.description && p.description.toLowerCase().includes(search))
        );
    }
    
    displayProducts(filtered);
}

// Cart Functions
async function loadCart() {
    if (!currentUser) {
        document.getElementById('cartItems').innerHTML = 
            '<div class="empty-state"><div class="empty-state-icon">🛒</div><p>Please login to view cart</p></div>';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/cart`, { credentials: 'include' });
        cart = await response.json();
        displayCart();
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

function displayCart() {
    const container = document.getElementById('cartItems');
    
    if (!cart || cart.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🛒</div><p>Your cart is empty</p></div>';
        updateCartSummary(0, 0, 0);
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image_url || 'https://via.placeholder.com/100'}" 
                 alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <h3 class="cart-item-name">${item.name}</h3>
                <p class="cart-item-price">$${parseFloat(item.price).toFixed(2)} each</p>
                <div class="cart-item-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateCartQuantity(${item.product_id}, ${item.quantity - 1})">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" 
                               onchange="updateCartQuantity(${item.product_id}, this.value)" min="1" max="${item.stock_quantity}">
                        <button class="quantity-btn" onclick="updateCartQuantity(${item.product_id}, ${item.quantity + 1})" 
                                ${item.quantity >= item.stock_quantity ? 'disabled' : ''}>+</button>
                    </div>
                    <button class="btn btn-danger btn-small" onclick="removeFromCart(${item.product_id})">Remove</button>
                </div>
            </div>
            <div class="cart-item-total">
                <strong>$${parseFloat(item.subtotal).toFixed(2)}</strong>
            </div>
        </div>
    `).join('');

    const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    updateCartSummary(subtotal, tax, total);
    updateCartCount();
}

function updateCartSummary(subtotal, tax, total) {
    document.getElementById('cartSubtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cartTax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
}

async function addToCart(productId) {
    if (!currentUser) {
        showNotification('Please login first', 'error');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/cart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ product_id: productId, quantity: 1 })
        });

        const data = await response.json();
        if (response.ok) {
            showNotification('Added to cart!', 'success');
            loadCart();
        } else {
            showNotification(data.message || 'Failed to add to cart', 'error');
        }
    } catch (error) {
        showNotification('Network error', 'error');
    }
}

async function updateCartQuantity(productId, quantity) {
    quantity = parseInt(quantity);
    if (quantity < 1) return;

    try {
        const response = await fetch(`http://localhost:3000/api/cart/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ quantity })
        });

        if (response.ok) {
            loadCart();
        } else {
            const data = await response.json();
            showNotification(data.message || 'Failed to update cart', 'error');
        }
    } catch (error) {
        showNotification('Network error', 'error');
    }
}

async function removeFromCart(productId) {
    try {
        const response = await fetch(`http://localhost:3000/api/cart/${productId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            showNotification('Item removed from cart', 'success');
            loadCart();
        }
    } catch (error) {
        showNotification('Network error', 'error');
    }
}

// Checkout
function openCheckoutModal() {
    if (!cart || cart.length === 0) {
        showNotification('Cart is empty', 'error');
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    const total = subtotal * 1.08;
    document.getElementById('checkoutTotal').textContent = `$${total.toFixed(2)}`;
    openModal('checkoutModal');
}

async function handleCheckout(e) {
    e.preventDefault();
    const shippingAddress = document.getElementById('shippingAddress').value;
    const paymentMethod = document.getElementById('paymentMethod').value;

    try {
        const response = await fetch(`http://localhost:3000/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ shipping_address: shippingAddress, payment_method: paymentMethod })
        });

        const data = await response.json();
        if (response.ok) {
            closeModal('checkoutModal');
            showNotification('Order placed successfully!', 'success');
            document.getElementById('checkoutForm').reset();
            navigateTo('orders');
        } else {
            showNotification(data.message || 'Order failed', 'error');
        }
    } catch (error) {
        showNotification('Network error', 'error');
    }
}

// Orders
async function loadOrders() {
    if (!currentUser) {
        document.getElementById('ordersList').innerHTML = 
            '<div class="empty-state"><div class="empty-state-icon">📦</div><p>Please login to view orders</p></div>';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/orders`, { credentials: 'include' });
        const orders = await response.json();
        displayOrders(orders);
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function displayOrders(orders) {
    const container = document.getElementById('ordersList');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><p>No orders yet</p></div>';
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <div class="order-id">Order #${order.id}</div>
                    <small>${new Date(order.created_at).toLocaleDateString()}</small>
                </div>
                <span class="order-status status-${order.status}">${order.status.toUpperCase()}</span>
            </div>
            <div class="order-info">
                <p><strong>Shipping Address:</strong> ${order.shipping_address}</p>
                <p><strong>Payment Method:</strong> ${order.payment_method.replace('_', ' ')}</p>
            </div>
            <div class="order-total">Total: $${parseFloat(order.total_amount).toFixed(2)}</div>
        </div>
    `).join('');
}

// Admin Dashboard
async function loadAdminDashboard() {
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Admin access required', 'error');
        return;
    }

    loadAdminStats();
    loadAdminProducts();
    loadAdminOrders();
}

async function loadAdminStats() {
    try {
        const response = await fetch(`http://localhost:3000/api/admin/stats`, { credentials: 'include' });
        const stats = await response.json();
        
        document.getElementById('adminStats').innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${stats.totalUsers || 0}</div>
                <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.totalProducts || 0}</div>
                <div class="stat-label">Total Products</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.totalOrders || 0}</div>
                <div class="stat-label">Total Orders</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">$${(stats.totalRevenue || 0).toFixed(2)}</div>
                <div class="stat-label">Total Revenue</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.lowStock || 0}</div>
                <div class="stat-label">Low Stock Items</div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadAdminProducts() {
    try {
        const response = await fetch(`http://localhost:3000/api/products`);
        const products = await response.json();
        
        const table = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(p => `
                        <tr>
                            <td>${p.id}</td>
                            <td>${p.name}</td>
                            <td>${p.category || 'N/A'}</td>
                            <td>$${parseFloat(p.price).toFixed(2)}</td>
                            <td class="${p.stock_quantity < 10 ? 'stock-low' : ''}">${p.stock_quantity}</td>
                            <td>
                                <button class="btn btn-small btn-outline" onclick="editProduct(${p.id})">Edit</button>
                                <button class="btn btn-small btn-danger" onclick="deleteProduct(${p.id})">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('adminProductsTable').innerHTML = table;
    } catch (error) {
        console.error('Error loading admin products:', error);
    }
}

async function loadAdminOrders() {
    try {
        const response = await fetch(`http://localhost:3000/api/orders`, { credentials: 'include' });
        const orders = await response.json();
        
        const table = `
            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(o => `
                        <tr>
                            <td>#${o.id}</td>
                            <td>${o.username || 'N/A'}</td>
                            <td>$${parseFloat(o.total_amount).toFixed(2)}</td>
                            <td><span class="order-status status-${o.status}">${o.status}</span></td>
                            <td>${new Date(o.created_at).toLocaleDateString()}</td>
                            <td>
                                <select onchange="updateOrderStatus(${o.id}, this.value)">
                                    <option value="">Update Status</option>
                                    <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                                    <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Processing</option>
                                    <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                                    <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                                    <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                </select>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('adminOrdersTable').innerHTML = table;
    } catch (error) {
        console.error('Error loading admin orders:', error);
    }
}

async function updateOrderStatus(orderId, status) {
    if (!status) return;

    try {
        const response = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            showNotification('Order status updated', 'success');
            loadAdminOrders();
        }
    } catch (error) {
        showNotification('Failed to update order status', 'error');
    }
}

function openProductModal(productId = null) {
    if (productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
            document.getElementById('productModalTitle').textContent = 'Edit Product';
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productCategory').value = product.category || '';
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productStock').value = product.stock_quantity;
            document.getElementById('productImage').value = product.image_url || '';
        }
    } else {
        document.getElementById('productModalTitle').textContent = 'Add Product';
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
    }
    openModal('productModal');
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const productData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock_quantity: parseInt(document.getElementById('productStock').value),
        image_url: document.getElementById('productImage').value
    };

    const url = productId ? `http://localhost:3000/api/products/${productId}` : `${API_URL}/products`;
    const method = productId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            closeModal('productModal');
            showNotification(productId ? 'Product updated' : 'Product created', 'success');
            loadAdminProducts();
            loadProducts();
        }
    } catch (error) {
        showNotification('Failed to save product', 'error');
    }
}

function editProduct(productId) {
    openProductModal(productId);
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            showNotification('Product deleted', 'success');
            loadAdminProducts();
            loadProducts();
        }
    } catch (error) {
        showNotification('Failed to delete product', 'error');
    }
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
