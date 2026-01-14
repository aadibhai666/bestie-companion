// IMPORTANT: After deployment, set this to your Worker URL.
// Example: https://bestie-worker.yourname.workers.dev
const API_BASE = localStorage.getItem("API_BASE") || "";

const chatEl = document.getElementById("chat");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("send");
const statusEl = document.getElementById("status");

function addMsg(text, who) {
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.textContent = text;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

async function ping() {
  if (!API_BASE) {
    statusEl.textContent = "Connected: ❌ set Worker URL";
    addMsg(
      "Setup pending: Worker URL set karo.\n" +
      "1) Cloudflare deploy complete hone ke baad Worker URL milega.\n" +
      "2) Then browser me console nahi—simple: page open → prompt aayega.",
      "bot"
    );
    const url = prompt("Paste your Worker URL (starts with https://...workers.dev)");
    if (url && url.startsWith("http")) {
      localStorage.setItem("API_BASE", url.replace(/\/$/, ""));
      location.reload();
    }
    return;
  }

  try {
    const r = await fetch(`${API_BASE}/health`);
    if (!r.ok) throw new Error("bad");
    statusEl.textContent = "Connected: ✅";
  } catch {
    statusEl.textContent = "Connected: ❌";
  }
}

async function send() {
  const text = inputEl.value.trim();
  if (!text) return;
  inputEl.value = "";
  addMsg(text, "me");

  addMsg("typing…", "bot");
  const typingNode = chatEl.lastChild;

  try {
    const r = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await r.json();
    typingNode.remove();
    addMsg(data.reply || "(no reply)", "bot");
  } catch (e) {
    typingNode.remove();
    addMsg("Network/Setup issue. Worker URL sahi hai? /health check ho raha?", "bot");
  }
}

sendBtn.addEventListener("click", send);
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});

ping();
addMsg("Hi! Main tumhari Bestie AI hoon 😊\nPhase 1: Text chat.\nNext: memory + voice.", "bot");
