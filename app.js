const ALL_TICKERS = ['GOOG','TSLA','AMZN','META','NVDA'];

let ws = null;
let subscriptions = [];
let prices = {};
let activityLogs = [];

/* Connect to WebSocket */
function connect(email){

  const WS_URL = location.hostname.includes("localhost")
    ? "ws://localhost:3000"
    : "wss://stock-backend-1-f1xa.onrender.com";

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "login", email }));
    document.getElementById("status").textContent = "Connected";
  };

  ws.onmessage = e => {
    const msg = JSON.parse(e.data);

    if (msg.type === "sync-subscriptions") {
      subscriptions = msg.subscriptions;
      renderSubscriptions();
    }

    if (msg.type === "price-update") {
      prices = { ...prices, ...msg.prices };
      renderPrices();
    }

    if (msg.type === "activity-log") {
      activityLogs = msg.logs;
      renderLogs();
    }
  };

  ws.onerror = (err) => {
    console.error("WebSocket error", err);
  };
}

/* Render stock cards */
function renderTickers(){
  const container = document.getElementById("tickers");
  container.innerHTML = "";

  ALL_TICKERS.forEach(t => {
    const d = document.createElement("div");
    d.innerHTML = `
      <strong>${t}</strong><br>
      Price: <span id="price-${t}">---</span><br>
      <button onclick="toggle('${t}')">
        ${subscriptions.includes(t) ? "Unsubscribe" : "Subscribe"}
      </button>
    `;
    container.appendChild(d);
  });

  renderPrices();
}

/* Subscribe / Unsubscribe */
function toggle(ticker){
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert("Login first!");
    return;
  }

  if (subscriptions.includes(ticker)) {
    ws.send(JSON.stringify({ type: "unsubscribe", ticker }));
  } else {
    ws.send(JSON.stringify({ type: "subscribe", ticker }));
  }
}

/* Render subscriptions list */
function renderSubscriptions(){
  document.getElementById("mySubs").innerHTML =
    subscriptions.length === 0
      ? "<li>No subscriptions</li>"
      : subscriptions.map(s =>
          `<li>${s} — <span id="my-${s}">${prices[s] || "---"}</span></li>`
        ).join("");

  renderTickers();
}

/* Render prices */
function renderPrices(){
  ALL_TICKERS.forEach(t => {
    const p1 = document.getElementById(`price-${t}`);
    const p2 = document.getElementById(`my-${t}`);
    if (p1) p1.textContent = prices[t] || "---";
    if (p2) p2.textContent = prices[t] || "---";
  });
}

/* Render activity logs */
function renderLogs(){
  const list = document.getElementById("activityLogs");
  list.innerHTML =
    activityLogs.length === 0
      ? "<li>No activity yet</li>"
      : activityLogs.map(log => `<li>${log}</li>`).join("");
}

/* Page load */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginBtn").onclick = () => {
    const email = document.getElementById("email").value.trim();
    if (!email) return alert("Enter email");
    connect(email);
  };

  renderTickers();
});
