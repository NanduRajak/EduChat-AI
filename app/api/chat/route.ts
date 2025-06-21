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
      try {
        const imageMessages = lastMessage.images.map((image: string) => ({
          type: "image_url",
          image_url: {
            url: image // Should be in format: data:image/jpeg;base64,{base64}
          }
        }));

        // Try different vision models in order of preference
        const visionModels = [
          "llama-3.2-11b-vision-preview",
          "llama-3.1-8b-instant", // Fallback to text model if vision not available
        ];

        let completion = null;
        let modelUsed = null;

        for (const model of visionModels) {
          try {
            if (model.includes('vision')) {
              // Vision model
              completion = await groqClient.chat.completions.create({
                model: model,
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
            } else {
              // Text model fallback
              completion = await groqClient.chat.completions.create({
                model: model,
                messages: [
                  {
                    role: "system",
                    content: "You are an educational AI assistant. The user has uploaded an image but I cannot analyze it directly. Please help them with their question in a helpful and educational way."
                  },
                  {
                    role: "user",
                    content: lastMessage.content || "I've uploaded an image but you can't see it. Can you help me with my question?"
                  }
                ],
                max_tokens: 1000,
                temperature: 0.7,
              });
            }
            modelUsed = model;
            break;
          } catch (modelError) {
            console.log(`Model ${model} failed:`, modelError instanceof Error ? modelError.message : 'Unknown error');
            continue;
          }
        }

        if (completion) {
          return NextResponse.json({
            content: completion.choices[0]?.message?.content || "I couldn't analyze the image. Please try again.",
            finished: true
          });
        } else {
          throw new Error('No available models for image processing');
        }

      } catch (visionError) {
        console.error('Vision model error:', visionError);
        // Fallback to text-only response when vision model is not available
        return NextResponse.json({
          content: "I see you've uploaded an image! While I can't analyze images directly right now, I'd be happy to help you with any questions you have. Please describe what you'd like to know, and I'll do my best to assist you with your learning.",
          finished: true
        });
      }
    }

    // Handle text-only messages with Vercel AI SDK
    const result = await streamText({
      model: groq('llama-3.1-8b-instant'),
      system: `You are a helpful educational AI assistant. Keep your responses simple, clear, and easy to read. 

- Use plain text without markdown formatting
- Avoid excessive asterisks, backticks, or special characters
- Write in a conversational, friendly tone
- Keep responses concise but informative
- Use simple line breaks for readability

Focus on being helpful and educational while keeping the format clean and simple.`,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      maxTokens: 1000,
      temperature: 0.7,
    });

    // Return streaming response properly
    return result.toDataStreamResponse();
    
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
      if (error.message.includes('model')) {
        return NextResponse.json(
          { error: 'Model not available. Please try again.' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: `Failed to process request. Please try again.` },
      { status: 500 }
    );
  }
} 