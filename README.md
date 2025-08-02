# 🍽 KL Eats - Food Ordering Website

KL Eats is an innovative platform designed to streamline campus dining for students and faculty. Our mission is to provide a convenient way to pre-order and book meals from various canteens across our campus.

This project was developed with the invaluable support of *KL GLUG (GNU/Linux User Group)*, showcasing the power of open-source collaboration in creating practical solutions for our campus community.

---

## 🚀 Built With

- [HTML](https://www.w3schools.com/html/)
- [CSS](https://www.w3schools.com/css/)
- [JavaScript](https://www.w3schools.com/js/)
- [Bootstrap](https://www.w3schools.com/bootstrap5/index.php)
- [ExpressJS](https://expressjs.com/)
- [Supabase](https://supabase.com/)

---

## 📦 Installation & Setup

1. **Clone the repository:**  
   ```sh
   git clone https://github.com/jashwanth/kleatsv1
   ```
2. **Navigate to the project folder:**  
   ```sh
   cd kleatsv1
   ```
3. **Install dependencies:**  
   ```sh
   npm install
   ```
4. **Start the server:**  
   ```sh
   npm start
   ```

---

## 🔄 Reset & Reinstall Dependencies


### Install dependencies:
```sh
npm install
```

### Install required packages:
```sh
npm install dotenv express body-parser cookie-parser ejs express-fileupload uuid mysql2 nodemailer crypto @supabase/supabase-js path express-session https fs http qrcode axios bcrypt web-push firebase-admin helmet
```

### Install global dependencies:
```sh
npm install -g semver
```

---

## 🛠 Environment Configuration  
> ℹ️ Need environment variables? Contact [**@varun28sharma**](https://github.com/varun28sharma).

Create a `.env` file and add the following:
```ini
PORT=3000
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_KEY=your-supabase-key

# Web Push configuration
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key

# Temporarily disable email configuration for testing
ENABLE_EMAIL=false

# Set environment mode
NODE_ENV=development
```

---

## 🌐 Web Push Configuration (`app.js`)

```js
const webpush = require('web-push');

const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
};

webpush.setVapidDetails(
    'mailto:your-email@example.com', // Replace with your email
    vapidKeys.publicKey,
    vapidKeys.privateKey
);
```

## 🏆 Contributing

We welcome contributions from the community! Feel free to submit pull requests, report bugs, and suggest new features.

Join our community group : https://t.me/+X0n_azyktiVmMzI0

---

## 📜 License

This project is licensed under the **GNU General Public License (GPL)**

---

⭐ *Star this repository* if you found it useful! 🚀

