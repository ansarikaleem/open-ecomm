# Open E-Commerce

A full-stack e-commerce application with Node.js backend and vanilla JavaScript frontend.

## Features

- User authentication (signup/login) with JWT
- Product catalog with categories
- Shopping cart functionality (works without login)
- Checkout process
- Admin dashboard for product/category management
- MySQL database

## Technologies

- **Backend**: Node.js, Express, MySQL
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Authentication**: JWT (JSON Web Tokens)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/ansarikaleem/open-ecomm.git
   cd open-ecomm



   cd frontend
   npm start

Generate a key:
   $ node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

add in .env
JWT_SECRET=<TOKEN>
JWT_EXPIRES_IN=7d



   cd backend
   node server.js