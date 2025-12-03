## JALA Magnus Portal Clone

This project is a **local clone** of the JALA Magnus portal at [`http://magnus.jalatechnologies.com`](http://magnus.jalatechnologies.com), including:

- **Login page** with the same demo credentials shown on the site (`training@jalaacademy.com` / `jobprogram`) as per the portal information and academy details in the reference site [`https://magnus.jalatechnologies.com/Home/Menu?utm_source=openai`](https://magnus.jalatechnologies.com/Home/Menu?utm_source=openai) and [`https://magnus.jalatechnologies.com/Subscription/Index?utm_source=openai`](https://magnus.jalatechnologies.com/Subscription/Index?utm_source=openai).
- **Remember Me**, **Forgot Password**, and **Admin Login** entry points.
- Authenticated **Home**, **Menu**, and **Subscription** pages that mirror the structure of the original portal.

> Note: This clone focuses on structure and navigation; business logic (payments, emails, full admin features) is intentionally simplified so you can extend it.

### Tech Stack

- **Backend**: Node.js, Express
- **Views**: EJS templates
- **Session/Auth**: `express-session` (simple demo session-based login)
- **Styling**: Custom CSS (`public/css/styles.css`)

### How to Run

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server**

   ```bash
   npm run dev
   ```

   or run in normal mode:

   ```bash
   npm start
   ```

3. Open your browser at:

   - `http://localhost:3000` → redirects to the **Login** page

4. **Login credentials**

   - Email: `training@jalaacademy.com`
   - Password: `jobprogram`

### Implemented Routes / Features

- `GET /login` – Login page with Remember Me, Forgot Password, Admin Login links.
- `POST /login` – Validates the demo credentials and sets a session.
- `GET /logout` – Logs out and redirects to login.
- `GET /home` – Authenticated home/dashboard page.
- `GET /home/menu` – Menu page with placeholder modules similar to the Magnus portal menu.
- `GET /subscription` – Subscription page with placeholder plans like those described under the subscription area of the reference portal.
- `GET /admin/login` – Admin login placeholder page.
- `GET /forgot-password` – Forgot password placeholder page.

### Where to Extend (to get closer to full production functionality)

- **Users/Employees/Courses**: Add real CRUD routes and database models (e.g., using SQLite, MySQL, or PostgreSQL).
- **Admin module**: Implement role-based access control and separate admin dashboard under `/admin`.
- **Forgot Password**: Hook into an email provider and generate secure reset tokens.
- **Subscription/Payments**: Integrate payment gateways and enforce subscription-based access control.

This structure gives you a working base that visually and functionally resembles the Magnus portal while remaining easy to extend for real-world training or project work.


