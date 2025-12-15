# Stock Broker Client Web Dashboard

A real-time Stock Broker Client Web Dashboard that allows users to log in using their email, subscribe to supported stocks, and view continuously updating stock prices without refreshing the page.  
The application supports multiple users simultaneously and synchronizes subscriptions and activity logs across multiple sessions using WebSockets.

---

## Features

- User login using email ID
- Subscribe / unsubscribe to supported stocks
- Real-time stock price updates (every second)
- Supports multiple users simultaneously
- Asynchronous dashboard updates across multiple tabs/browsers
- Activity logs for subscribe and unsubscribe actions
- WebSocket-based real-time communication

---

## Supported Stocks

```
GOOG, TSLA, AMZN, META, NVDA
```

> Note: Stock prices are simulated using a random number generator for demonstration purposes.

---

## Tech Stack

### Frontend

- HTML
- CSS
- JavaScript
- Deployed on **Netlify**

### Backend

- Node.js
- Express.js
- WebSocket (`ws`)
- Deployed on **Render**

---

## System Architecture

```
User Browser (Netlify Frontend)
        |
        |  Secure WebSocket (WSS)
        |
Render Backend (Node.js + WebSocket Server)
```

---

## Installation & Local Setup

### Backend

```bash
cd Server
npm install
npm start
```

Runs on:

```
http://localhost:3000
```

### Frontend

Open `client/index.html` in browser  
(or deploy `client` folder on Netlify)

---

## Deployment Details

### Frontend

- Platform: Netlify
- Deployment: Manual (ZIP upload)

### Backend

- Platform: Render
- URL:

```
https://stock-backend-1-f1xa.onrender.com
```

---

## WebSocket Configuration

```js
const WS_URL = location.hostname.includes("localhost")
  ? "ws://localhost:3000"
  : "wss://stock-backend-1-f1xa.onrender.com";
```

---

## Application Flow

1. User logs in using email
2. WebSocket connection is established
3. User subscribes to stocks
4. Server sends price updates every second
5. Activity logs are synchronized across sessions

---

## Future Enhancements

- Add timestamps to activity logs
- Persistent database storage
- Improved UI/UX
- Authentication using JWT

---

## Author

**Rakshita Belakoppa**

---

## License

Educational use only.
