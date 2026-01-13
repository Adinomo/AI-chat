// ==================== ELEMENT REFERENCES ====================
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const themeToggle = document.getElementById('themeToggle');
const clearBtn = document.getElementById('clearChat');

// ==================== STATE & CONFIG ====================
const STORAGE_KEY = 'adinomo-ai-chat-history';
let messages = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

let isDark = localStorage.getItem('theme') === 'dark';
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
themeToggle.textContent = isDark ? '☀️' : '🌙';

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

// ==================== GROQ PROXY CALL (via Vercel /api/chat) ====================
async function getAIResponse(userMessage) {
  const messagesToSend = messages.map(msg => ({
    role: msg.isUser ? "user" : "assistant",
    content: msg.content
  }));

  messagesToSend.push({ role: "user", content: userMessage });

  const typingEl = showTyping();

  try {
    const response = await fetch('/api/chat', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messagesToSend })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Proxy error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const aiReply = data.content.trim();

    return [aiReply];

  } catch (err) {
    console.error("Error fetching AI:", err);
    return [`Waduh... ada masalah koneksi ke AI 😅\n\n${err.message}\nCoba lagi ya!`];
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

  if (messages.length === 0) {
    addMessage("Halo bro! 👋 Aku <strong>adinomo.AI</strong> siap nemenin ngobrol apa aja. Mau mulai dari mana nih? 😏", false);
  }
});