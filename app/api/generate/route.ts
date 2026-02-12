import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;

    console.log('API Key exists:', !!apiKey);
    console.log('Prompt:', prompt);

    if (!apiKey) {
      console.error('API Key is missing!');
      return NextResponse.json(
        { error: "API Key is not configured. Please set GEMINI_API_KEY in environment variables." },
        { status: 500 }
      );
    }

    if (!prompt || prompt.trim() === '') {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert web developer. Generate ONLY valid HTML/CSS code.

User Request: "${prompt}"

IMPORTANT RULES:
1. Return ONLY the HTML code - no markdown, no explanations
2. Use Tailwind CSS (already included via CDN)
3. Use Unsplash images: https://source.unsplash.com/random/800x600
4. Add animations and transitions
5. Make it fully responsive
6. Include FontAwesome icons if needed
7. DO NOT wrap code in backticks or markdown
8. Start directly with <html> and end with </html>`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: systemPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096
      }
    };

    console.log('Calling Gemini API...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: `Gemini API Error: ${errorData.error?.message || 'Unknown error'}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Gemini response received');

    const html = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!html) {
      console.error('No HTML generated');
      return NextResponse.json(
        { error: "No content was generated. Please try again with a different prompt." },
        { status: 500 }
      );
    }

    // Clean up the HTML
    let cleanedHtml = html
      .replace(/^```html\n?/gm, '')
      .replace(/^```\n?/gm, '')
      .replace(/```$/gm, '')
      .trim();

    console.log('HTML generated successfully');

    return NextResponse.json({
      html: cleanedHtml,
      success: true
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: `Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}
