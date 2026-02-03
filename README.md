# 🛒 Grocery Management System

A full-stack web application for managing a grocery store, built with Node.js, Express, MySQL, and vanilla JavaScript.

## 📋 Features

### Customer Features
- **User Authentication**: Secure registration and login system with bcrypt password hashing
- **Product Browsing**: View all available products with search and category filtering
- **Shopping Cart**: Add items to cart, update quantities, and remove items
- **Order Management**: Place orders and track order history
- **Responsive Design**: Mobile-friendly interface

### Admin Features
- **Dashboard**: View key statistics (users, products, orders, revenue, low stock)
- **Product Management**: Create, update, and delete products
- **Order Management**: View all orders and update order status
- **Inventory Control**: Track stock levels and manage inventory

## 🏗️ Project Structure

```
grocery-management-system/
│
├── backend/
│   ├── server.js          # Express server with all API endpoints
│   ├── package.json       # Backend dependencies
│   └── .env              # Environment variables
│
├── frontend/
│   ├── index.html        # Main HTML file
│   ├── styles.css        # All CSS styles
│   └── app.js            # Frontend JavaScript
│
├── database/
│   └── schema.sql        # MySQL database schema and seed data
│
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Installation

1. **Clone or download the repository**

2. **Set up the database**

   ```bash
   # Login to MySQL
   mysql -u root -p

   # Run the schema file
   source database/schema.sql
   ```

3. **Configure backend environment**

   Edit `backend/.env` file with your MySQL credentials:

   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password_here
   DB_NAME=grocery_db
   SESSION_SECRET=your-secret-key-change-this-in-production
   NODE_ENV=development
   ```

4. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

5. **Start the backend server**

   ```bash
   npm start
   ```

   The server will run on `http://localhost:3000`

6. **Open the frontend**

   Open `frontend/index.html` in your browser, or serve it using a local web server:

   ```bash
   # Using Python 3
   cd frontend
   python -m http.server 8000

   # Or using Node.js http-server
   npx http-server frontend -p 8000
   ```

   Then visit `http://localhost:8000`

## 📱 Usage

### Default Accounts

The database comes with pre-seeded accounts:

**Admin Account:**
- Email: `admin@grocery.com`
- Password: `admin123`
- Access to admin dashboard and product management

**Customer Account:**
- Email: `john@example.com`
- Password: `customer123`
- Can browse products, add to cart, and place orders

### Customer Workflow

1. **Register/Login**: Create an account or login with existing credentials
2. **Browse Products**: Navigate to the Products page to view all items
3. **Add to Cart**: Click "Add to Cart" on products you want to purchase
4. **View Cart**: Check your cart to review items and quantities
5. **Checkout**: Fill in shipping address and payment method
6. **Track Orders**: View order history and status in the Orders page

### Admin Workflow

1. **Login**: Use admin credentials to access the system
2. **Dashboard**: View key metrics and statistics
3. **Manage Products**: Add new products, update existing ones, or remove items
4. **Manage Orders**: View all customer orders and update their status
5. **Monitor Inventory**: Keep track of stock levels and low-stock alerts

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Products
- `GET /api/products` - Get all products (with optional filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)
- `GET /api/categories` - Get all product categories

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:productId` - Update cart item quantity
- `DELETE /api/cart/:productId` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

### Orders
- `GET /api/orders` - Get user's orders (or all orders for admin)
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order (checkout)
- `PUT /api/orders/:id/status` - Update order status (Admin only)

### Admin
- `GET /api/admin/stats` - Get dashboard statistics (Admin only)

## 🗄️ Database Schema

### Tables

- **users**: User accounts with authentication
- **products**: Product catalog with pricing and inventory
- **cart**: Shopping cart items for each user
- **orders**: Customer orders with status tracking
- **order_items**: Individual items in each order

### Views

- **low_stock_products**: Products with stock < 10
- **order_summary**: Order overview with user details
- **revenue_by_category**: Sales statistics by category
- **user_purchase_history**: Customer purchase analytics

## 🛠️ Technologies Used

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MySQL2**: Database driver
- **bcrypt**: Password hashing
- **express-session**: Session management
- **dotenv**: Environment configuration
- **cors**: Cross-origin resource sharing

### Frontend
- **HTML5**: Structure
- **CSS3**: Styling with modern features (Grid, Flexbox)
- **Vanilla JavaScript**: Client-side logic
- **Fetch API**: HTTP requests

### Database
- **MySQL**: Relational database management

## 🔒 Security Features

- Password hashing with bcrypt
- Session-based authentication
- SQL injection prevention with parameterized queries
- Role-based access control (RBAC)
- HTTP-only cookies
- Input validation

## 📊 Key Functionalities

1. **Inventory Management**: Real-time stock tracking and low stock alerts
2. **Order Processing**: Complete order lifecycle from cart to delivery
3. **User Management**: Role-based permissions for customers and admins
4. **Search & Filter**: Product search and category-based filtering
5. **Responsive UI**: Mobile-friendly design for all devices
6. **Analytics**: Sales reports and revenue tracking

## 🎨 UI/UX Features

- Clean and modern interface
- Intuitive navigation
- Real-time cart updates
- Loading states and notifications
- Form validation
- Responsive modals
- Status badges for orders

## 📝 Development Notes

### Running in Development Mode

For auto-restart on file changes, install nodemon:

```bash
npm install -g nodemon
cd backend
nodemon server.js
```

### Database Migrations

To reset the database:

```bash
mysql -u root -p grocery_db < database/schema.sql
```

### Adding New Products

Use the admin panel or insert directly via SQL:

```sql
INSERT INTO products (name, description, category, price, stock_quantity, image_url)
VALUES ('Product Name', 'Description', 'Category', 9.99, 100, 'image_url');
```

## 🐛 Troubleshooting

### Backend won't start
- Check MySQL is running
- Verify database credentials in `.env`
- Ensure port 3000 is available

### Frontend can't connect to backend
- Verify backend is running on port 3000
- Check CORS settings in `server.js`
- Update `API_URL` in `frontend/app.js` if needed

### Database connection errors
- Verify MySQL service is running
- Check database name and credentials
- Ensure `grocery_db` database exists

## 📈 Future Enhancements

- Payment gateway integration
- Email notifications
- Product reviews and ratings
- Wishlist functionality
- Advanced search with filters
- Order tracking with shipping updates
- Multi-language support
- PWA (Progressive Web App) capabilities
- Image upload for products
- Export reports to PDF/Excel

## 📄 License

This project is open source and available for educational purposes.

## 👥 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## 📞 Support

For questions or issues, please open an issue in the repository.

---

*
