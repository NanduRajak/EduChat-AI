import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import Groq from 'groq-sdk';

// Initialize Groq clients
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, hasImages } = await req.json();
    
    // Check if GROQ_API_KEY exists
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      return NextResponse.json({
        error: 'Please add your free Groq API key to .env.local file. Get it from: https://console.groq.com/keys'
      }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    
    // Handle image messages with raw Groq SDK
    if (hasImages && lastMessage.images && lastMessage.images.length > 0) {
      const imageMessages = lastMessage.images.map((image: string) => ({
        type: "image_url",
        image_url: {
          url: image // Should be in format: data:image/jpeg;base64,{base64}
        }
      }));

      const completion = await groqClient.chat.completions.create({
        model: "llama-3.2-11b-vision-preview", // Free vision model
        messages: [
          {
            role: "system",
            content: "You are an educational AI assistant. Analyze images and help students understand concepts, solve problems, and learn effectively. Be clear, encouraging, and educational in your responses."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: lastMessage.content || "Please analyze this image and help me understand it."
              },
              ...imageMessages
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      return NextResponse.json({
        content: completion.choices[0]?.message?.content || "I couldn't analyze the image. Please try again.",
        finished: true
      });
    }

    // Handle text-only messages with Vercel AI SDK
    const result = await streamText({
      model: groq('llama-3.1-8b-instant'), // Free text model
      system: `You are an educational AI assistant specialized in helping students learn. You can:
- Explain complex concepts in simple terms
- Solve math and science problems step-by-step
- Provide study tips and learning strategies
- Generate practice questions and quizzes
- Help with homework and assignments
- Offer encouragement and motivation

Always be patient, clear, and encouraging in your responses. Break down complex topics into manageable parts.`,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      maxTokens: 1000,
      temperature: 0.7,
    });

    // Convert stream to simple response for now
    const chunks = [];
    for await (const chunk of result.textStream) {
      chunks.push(chunk);
    }

    return NextResponse.json({
      content: chunks.join(''),
      finished: true
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle specific Groq API errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid Groq API key. Please check your .env.local file.' },
          { status: 401 }
        );
      }
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit reached. Please try again in a moment.' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: `Failed to process request. Please try again.` },
      { status: 500 }
    );
  }
} 