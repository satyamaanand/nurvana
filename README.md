# Nurvana – Online Plant Nursery Management System

Nurvana is a complete, production-ready, full-stack web application designed for a digital plant nursery. It enables customers to browse plants, maintain wishlists and carts, purchase items, and track orders in real-time, while providing administrators with a powerful dashboard to manage inventory, update order statuses, register users, and resolve client inquiries.

The project represents a clean architectural implementation with a decoupled **Node.js/Express** backend and a **responsive HTML5/CSS3/Vanilla JS** frontend.

---

## Technical Stack

*   **Frontend**: HTML5, CSS3, Bootstrap 5, Vanilla JavaScript, Fetch API
*   **Backend**: Node.js, Express.js
*   **Database**: MongoDB Atlas (Mongoose ODM)
*   **Authentication**: JWT (JSON Web Tokens), bcryptjs Password Hashing
*   **File Uploads**: Multer (disk storage engine)

---

## Directory Structure

```text
nurvana/
│
├── backend/
│   ├── config/
│   │   └── db.js            # MongoDB Mongoose Connection
│   ├── middleware/
│   │   ├── auth.js          # JWT Verification & Role Authorization
│   │   └── upload.js        # Multer disk upload config
│   ├── models/
│   │   ├── User.js          # User Schema (User/Admin roles)
│   │   ├── Plant.js         # Plant Schema (Care details & inventory)
│   │   ├── Category.js      # Category Schema
│   │   ├── Order.js         # Order Schema (Shipping, Status Tracker Logs)
│   │   ├── Cart.js          # Shopping Cart Schema
│   │   ├── Wishlist.js      # Wishlist Schema
│   │   ├── Review.js        # Product Reviews Schema (Aggregate Avg Rating)
│   │   └── ContactMessage.js# Customer messages & inquiries
│   ├── routes/
│   │   ├── authRoutes.js    # Register, login, profile check
│   │   ├── plantRoutes.js   # Catalog lookup, pagination, filtering, CRUD
│   │   ├── categoryRoutes.js# Categories list, admin CRUD
│   │   ├── cartRoutes.js    # Add, update, delete, guest cart sync
│   │   ├── wishlistRoutes.js# Save, remove, listing
│   │   ├── orderRoutes.js   # Checkout, user history, tracking logs
│   │   ├── reviewRoutes.js  # Submit feedback, average rating aggregate
│   │   ├── contactRoutes.js # Inquiry submissions
│   │   └── adminRoutes.js   # Admin KPIs, users list, order updates
│   ├── uploads/             # local uploads directory
│   ├── utils/
│   │   └── seeder.js        # Database seeder (Unsplash premium plant data)
│   ├── server.js            # Express app entry point
│   ├── package.json
│   └── .env                 # Port, JWT Secret, MongoDB URI configs
│
├── css/
│   ├── style.css            # Base template CSS
│   ├── modern.css           # Premium theme updates (stepper, toasts, layouts)
│   └── bootstrap.css
│
├── js/
│   ├── api.js               # Global Fetch wrapper & notifications
│   ├── auth.js              # Navbar navigation updates & logouts
│   ├── catalog.js           # Querying, filtering, sorting, pagination
│   ├── details.js           # Spec details, care cards, reviews posting
│   ├── wishlist.js          # Wishlist items grids
│   ├── cart-handler.js      # Cart actions & drawer rendering
│   ├── checkout.js          # Address forms & dummy payment processing
│   ├── account.js           # User order logs & stepper status tracking
│   ├── contact-handler.js   # Inquiry posting
│   └── admin.js             # Admin stats loader, CRUD forms, status selects
│
├── index.html               # Home Page
├── buy.html                 # Shop / Catalog Page
├── details.html             # Product Details / Reviews Page
├── wishlist.html            # User Saved Wishlist
├── pay.html                 # Checkout / Payment Form
├── account.html             # Customer Orders / Stepper Tracker
├── admin.html               # Administrator Dashboard
├── contact.html             # Customer Support Page
├── about.html               # About Page
└── services.html            # Services Page
```

---

## MongoDB Schemas & Relations

1.  **User**: Name, Email (unique), Password (hashed), Role (`user` or `admin`).
2.  **Category**: Name (unique), Description.
3.  **Plant**: Name, Price, Description, Stock count, Category (ObjectId reference), CareInstructions (Light, Water, Soil, Temperature), Images (array of URLs), AverageRating, NumReviews.
4.  **Cart**: User (ObjectId reference), Items array of { Plant reference, quantity }.
5.  **Wishlist**: User (ObjectId reference), Plants array of { Plant reference }.
6.  **Order**: User (ObjectId reference), Items array of { Plant, quantity, price }, ShippingAddress (Name, Street, City, State, Zip, Phone), OrderTotal, PaymentStatus, PaymentMethod, OrderStatus (`Pending`, `Shipped`, `Delivered`, `Cancelled`), TrackingLogs array of { Status, Message, Date }.
7.  **Review**: User (ObjectId reference), Plant (ObjectId reference), Rating (1-5), Comment. Includes a Mongoose aggregate hook to automatically recalculate average plant score.
8.  **ContactMessage**: Name, Email, Subject, Message, Status (`Pending`, `Resolved`).

---

## API Endpoints

### Auth
*   `POST /api/auth/register` - Create new customer/admin user
*   `POST /api/auth/login` - Authenticate credentials & return token
*   `GET /api/auth/me` - Fetch profile metadata (Private)

### Plants
*   `GET /api/plants` - Query catalog with text search, categories, sorting, and pagination
*   `GET /api/plants/:id` - Fetch detailed specifications
*   `POST /api/plants` - Create a new plant with file upload (Admin)
*   `PUT /api/plants/:id` - Update plant spec & stock (Admin)
*   `DELETE /api/plants/:id` - Delete plant (Admin)

### Categories
*   `GET /api/categories` - Fetch categories
*   `POST /api/categories` - Create category (Admin)
*   `DELETE /api/categories/:id` - Remove category (Admin)

### Cart
*   `GET /api/cart` - Fetch current shopping cart (Private)
*   `POST /api/cart` - Add or update item quantity (Private)
*   `DELETE /api/cart/:plantId` - Remove item (Private)
*   `POST /api/cart/sync` - Synchronize local guest cart with DB on login (Private)

### Wishlist
*   `GET /api/wishlist` - Fetch wishlist items (Private)
*   `POST /api/wishlist` - Add item to wishlist (Private)
*   `DELETE /api/wishlist/:plantId` - Remove item (Private)

### Orders
*   `POST /api/orders` - Place checkout order & decrement stock (Private)
*   `GET /api/orders/myorders` - Fetch user order history (Private)
*   `GET /api/orders/:id` - Fetch single order details (Private)
*   `GET /api/orders/:id/track` - Get tracker status logs (Private)

### Reviews
*   `GET /api/reviews/:plantId` - Load plant feedback list
*   `POST /api/reviews` - Submit review rating and comment (Private)

### Support Messages
*   `POST /api/contact` - Submit contact inquiry form
*   `GET /api/contact` - List inquiries (Admin)
*   `PUT /api/contact/:id/resolve` - Mark query as resolved (Admin)

### Administrative Panel
*   `GET /api/admin/dashboard` - Get KPIs (total orders, low stock, user list, recent items)
*   `GET /api/admin/orders` - Get global orders
*   `PUT /api/admin/orders/:id/status` - Update status (e.g. ship, cancel, deliver) and append logs
*   `GET /api/admin/users` - Get all users

---

## Setup & Running Locally

### 1. Configure the Environment
Inside `backend/.env`, set your connection parameters:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/nurvana
JWT_SECRET=nurvana_secret_key_123_nature
NODE_ENV=development
```

### 2. Install Dependencies
```bash
# Navigate to backend folder
cd backend
npm install
```

### 3. Seed Database
Seeding loads standard high-quality royalty-free plant categories and entries:
```bash
npm run seed
```
**Demo login credentials created by seeder:**
*   **Customer**: `user@nurvana.com` / `user123`
*   **Administrator**: `admin@nurvana.com` / `admin123`

### 4. Run Development Server
```bash
npm start
```
The server will boot up on `http://localhost:5000`.

### 5. Access the Frontend
Open `index.html` directly in your browser (or serve it using a local dev tool like Live Server). The frontend is configured to call `http://localhost:5000/api`.

---

## Deployment Instructions

### Frontend (Netlify / Vercel)
1.  Configure the `API_URL` parameter in `js/api.js` to point to your hosted Render backend (e.g., `https://nurvana-backend.onrender.com/api`).
2.  Deploy the root directory containing the HTML/CSS/JS files directly as a static site.

### Backend (Render)
1.  Create a Web Service on Render and link your backend repository.
2.  Set the Root Directory to `backend`.
3.  Configure Build Command: `npm install`.
4.  Configure Start Command: `npm start`.
5.  Add environment variables in Render: `MONGO_URI`, `JWT_SECRET`, and `NODE_ENV=production`.

### Database (MongoDB Atlas)
1.  Create a free database cluster on MongoDB Atlas.
2.  Go to Network Access and allow connections from anywhere (`0.0.0.0/0`) since Render uses dynamic IPs.
3.  Generate an Atlas Connection String and paste it in `MONGO_URI` inside your backend configuration.
