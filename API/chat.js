export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Kamu adalah adinomo.AI, AI santai, helpful, sedikit humoris, pakai bahasa Indonesia natural. Gunakan emoji secukupnya." },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1200
      })
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    res.status(200).json(data.choices[0].message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error dari Groq" });
  }
}