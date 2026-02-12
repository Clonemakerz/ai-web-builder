import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key Missing" }, { status: 500 });
    }

    const systemPrompt = `You are a web developer. Generate ONLY valid HTML code.

REQUEST: "${prompt}"

Rules:
- Only HTML/CSS (no explanations)
- Use Tailwind CSS
- Make it responsive
- Add animations
- Include FontAwesome icons
- Start with <html> end with </html>`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: systemPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'API Error' }, { status: 500 });
    }

    const data = await response.json();
    let html = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (!html) {
      return NextResponse.json({ error: "No content generated" }, { status: 500 });
    }

    html = html.replace(/```html\n?/g, "").replace(/```\n?/g, "").trim();

    return NextResponse.json({ html, success: true });

  } catch (error) {
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 });
  }
}
