// ==================== ELEMENT REFERENCES ====================
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const themeToggle = document.getElementById('themeToggle');
const clearBtn = document.getElementById('clearChat');

// ==================== STATE & CONFIG ====================
const STORAGE_KEY = 'adinomo-ai-chat-history'; // Ubah key storage biar beda dari versi sebelumnya
let messages = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

let isDark = localStorage.getItem('theme') === 'dark';
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
themeToggle.textContent = isDark ? '☀️' : '🌙';

// ==================== GROQ CONFIG ====================
const GROQ_API_KEY = " "; // ← GANTI DENGAN API KEY GROQ KAMU!
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const MODEL = "llama-3.3-70b-versatile"; // atau "llama-3.1-8b-instant" untuk lebih ringan

// ==================== HELPER FUNCTIONS ====================
function formatTime(date = new Date()) {
  return date.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

function addMessage(content, isUser = false) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', isUser ? 'user' : 'ai');

  const bubble = document.createElement('div');
  bubble.classList.add('bubble');
  bubble.innerHTML = content;

  const time = document.createElement('div');
  time.classList.add('timestamp');
  time.textContent = formatTime();

  msgDiv.appendChild(bubble);
  msgDiv.appendChild(time);
  chatContainer.appendChild(msgDiv);

  scrollToBottom();
  
  messages.push({ content, isUser, timestamp: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

function scrollToBottom() {
  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: 'smooth'
  });
}

function showTyping() {
  const typing = document.createElement('div');
  typing.className = 'message ai';
  typing.id = 'typingIndicator';
  typing.innerHTML = `
    <div class="typing-indicator">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>
  `;
  chatContainer.appendChild(typing);
  scrollToBottom();
  return typing;
}

function removeTyping() {
  document.getElementById('typingIndicator')?.remove();
}

function clearChat() {
  if (!confirm("Yakin mau hapus semua riwayat chat?")) return;
  
  messages = [];
  localStorage.removeItem(STORAGE_KEY);
  chatContainer.innerHTML = '';
}

// ==================== GROQ API CALL ====================
async function getAIResponse(userMessage) {
  if (!GROQ_API_KEY || GROQ_API_KEY === "gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx") {
    return ["Ups! API Key Groq belum diisi. Ganti dulu di script.js ya 😅"];
  }

  const messagesToSend = messages.map(msg => ({
    role: msg.isUser ? "user" : "assistant",
    content: msg.content
  }));

  messagesToSend.push({ role: "user", content: userMessage });

  const typingEl = showTyping();

  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `Kamu adalah adinomo.AI, AI santai, helpful, sedikit humoris, dan selalu pakai bahasa Indonesia sehari-hari yang natural. 
                      Jawab sesingkat mungkin kecuali diminta detail panjang. Gunakan emoji secukupnya biar friendly.`
          },
          ...messagesToSend
        ],
        temperature: 0.7,
        max_tokens: 1200,
        top_p: 0.95
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 429) {
        throw new Error("Rate limit Groq tercapai 😅 Tunggu beberapa menit ya (reset biasanya cepat)");
      }
      throw new Error(errorData.error?.message || "Error dari Groq");
    }

    const data = await response.json();
    return [data.choices[0].message.content.trim()];

  } catch (err) {
    console.error("Groq Error:", err);
    return [`Waduh... ada masalah: ${err.message}\nCoba lagi nanti ya! 🚀`];
  } finally {
    removeTyping();
  }
}

// ==================== EVENT LISTENERS ====================
async function handleSend() {
  const text = messageInput.value.trim();
  if (!text) return;

  addMessage(text, true);
  messageInput.value = '';
  sendBtn.disabled = true;

  const responses = await getAIResponse(text);

  responses.forEach((resp, index) => {
    setTimeout(() => {
      addMessage(resp);
    }, index * 300);
  });

  sendBtn.disabled = false;
}

messageInput.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
  sendBtn.disabled = this.value.trim() === '';
});

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

sendBtn.addEventListener('click', handleSend);

themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  themeToggle.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

clearBtn.addEventListener('click', clearChat);

// ==================== INITIALIZATION ====================
window.addEventListener('load', () => {
  messages.forEach(m => addMessage(m.content, m.isUser));
  scrollToBottom();
  
  messageInput.focus();

  // Pesan selamat datang pertama kali (hanya muncul kalau chat kosong)
  if (messages.length === 0) {
    addMessage("Halo bro! 👋 Aku <strong>adinomo.AI</strong> siap nemenin ngobrol apa aja. Mau mulai dari mana nih? 😏", false);
  }

  // Peringatan kalau key belum diganti
  if (GROQ_API_KEY.includes('xxxx')) {
    addMessage("Eh... aku belum bisa jawab pake AI beneran nih 😅 Ganti dulu API Key Groq di script.js ya!", false);
  }
});