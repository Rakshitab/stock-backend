// server.js
// Simple Express + WebSocket server for Stock Dashboard demo
// Required packages: express, ws
// Install with: npm install express ws

const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static client files from ../client
app.use(express.static(path.join(__dirname, '..', 'client')));

// In-memory user store
// users[email] = { subscriptions: [], sockets: Set<WebSocket>, logs: [] }
const users = {};
const ALL_TICKERS = ['GOOG','TSLA','AMZN','META','NVDA'];

// Simulated price store
const prices = {};
ALL_TICKERS.forEach(t => prices[t] = +(100 + Math.random()*3000).toFixed(2));

function ensureUser(email){
  if (!users[email]) {
    users[email] = {
      subscriptions: [],
      sockets: new Set(),
      logs: []          // ✅ activity logs added
    };
  }
  return users[email];
}

// Periodically update prices and push updates to connected sockets
setInterval(() => {
  ALL_TICKERS.forEach(t => {
    const delta = (Math.random() - 0.5) * 10;
    prices[t] = +(Math.max(1, prices[t] + delta)).toFixed(2);
  });

  Object.entries(users).forEach(([email, u]) => {
    if (!u.sockets.size || !u.subscriptions.length) return;

    const payload = { type: 'price-update', prices: {} };
    u.subscriptions.forEach(t => {
      if (prices[t] !== undefined) payload.prices[t] = prices[t];
    });

    const msg = JSON.stringify(payload);
    u.sockets.forEach(s => {
      if (s.readyState === WebSocket.OPEN) s.send(msg);
    });
  });

}, 1000);

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch (e) { return; }

    // LOGIN
    if (msg.type === 'login') {
      const email = (msg.email || '').toLowerCase();
      if (!email) return;

      ws.email = email;
      const u = ensureUser(email);
      u.sockets.add(ws);

      // send subscriptions
      ws.send(JSON.stringify({
        type: 'sync-subscriptions',
        subscriptions: u.subscriptions
      }));

      // send activity logs ✅
      ws.send(JSON.stringify({
        type: 'activity-log',
        logs: u.logs
      }));

      // send price snapshot
      const snapshot = { type: 'price-update', prices: {} };
      u.subscriptions.forEach(t => {
        if (prices[t] !== undefined) snapshot.prices[t] = prices[t];
      });
      ws.send(JSON.stringify(snapshot));

      console.log(`${new Date().toISOString()} - ${email} connected. sockets=${u.sockets.size}`);
    }

    // SUBSCRIBE
    if (msg.type === 'subscribe') {
      const ticker = (msg.ticker || '').toUpperCase();
      const email = ws.email;
      if (!email || !ticker) return;

      const u = ensureUser(email);
      if (!u.subscriptions.includes(ticker)) {
        u.subscriptions.push(ticker);

        // ✅ add activity log
        const log = `Subscribed to ${ticker}`;
        u.logs.unshift(log);
      }

      const syncMsg = JSON.stringify({
        type: 'sync-subscriptions',
        subscriptions: u.subscriptions
      });

      const priceMsg = JSON.stringify({
        type: 'price-update',
        prices: { [ticker]: prices[ticker] }
      });

      const logMsg = JSON.stringify({
        type: 'activity-log',
        logs: u.logs
      });

      // broadcast to all tabs of same user
      u.sockets.forEach(s => {
        if (s.readyState === WebSocket.OPEN) {
          s.send(syncMsg);
          s.send(priceMsg);
          s.send(logMsg);
        }
      });

      console.log(`${new Date().toISOString()} - ${email} subscribed ${ticker}`);
    }

    // UNSUBSCRIBE
    if (msg.type === 'unsubscribe') {
      const ticker = (msg.ticker || '').toUpperCase();
      const email = ws.email;
      if (!email || !ticker) return;

      const u = ensureUser(email);
      u.subscriptions = u.subscriptions.filter(t => t !== ticker);

      // ✅ add activity log
      const log = `Unsubscribed from ${ticker}`;
      u.logs.unshift(log);

      const syncMsg = JSON.stringify({
        type: 'sync-subscriptions',
        subscriptions: u.subscriptions
      });

      const logMsg = JSON.stringify({
        type: 'activity-log',
        logs: u.logs
      });

      u.sockets.forEach(s => {
        if (s.readyState === WebSocket.OPEN) {
          s.send(syncMsg);
          s.send(logMsg);
        }
      });

      console.log(`${new Date().toISOString()} - ${email} unsubscribed ${ticker}`);
    }
  });

  ws.on('close', () => {
    const email = ws.email;
    if (email && users[email]) {
      users[email].sockets.delete(ws);
      console.log(`${new Date().toISOString()} - ${email} disconnected. sockets=${users[email].sockets.size}`);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error', err && err.message);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Server + WS running on http://0.0.0.0:${PORT}`)
);
