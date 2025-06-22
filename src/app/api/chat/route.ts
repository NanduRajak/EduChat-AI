import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import Groq from 'groq-sdk';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, hasImages, useWebSearch } = await req.json();
    
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      return NextResponse.json({
        error: 'Please add your free Groq API key to .env.local file. Get it from: https://console.groq.com/keys'
      }, { status: 400 });
    }

    try {
      await groqClient.models.list();
    } catch (error) {
      console.error('Groq API key validation failed:', error);
      if (error instanceof Groq.APIError && error.status === 401) {
          return NextResponse.json({
          error: 'Your Groq API key is invalid or has been revoked. Please check your key in the Vercel project settings and ensure it has the correct permissions.'
        }, { status: 401 });
      }
      return NextResponse.json({
        error: 'Could not connect to the AI service. Please try again later.'
      }, { status: 500 });
    }

    const lastMessage = messages[messages.length - 1];
    
    let webSearchResults = [];
    if (useWebSearch && lastMessage.content) {
      try {
        const searchResponse = await fetch(`${req.nextUrl.origin}/api/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: lastMessage.content
          })
        });
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          webSearchResults = searchData.results || [];
        }
      } catch (searchError) {
        console.error('Web search error:', searchError);
      }
    }

    // Handle image messages with raw Groq SDK
    if (hasImages && lastMessage.images && lastMessage.images.length > 0) {
      try {
        const imageMessages = lastMessage.images.map((image: string) => ({
          type: "image_url",
          image_url: {
            url: image // Should be in format: data:image/jpeg;base64,{base64}
          }
        }));

        // Try vision models in order of preference - these are the actual Groq vision model names
        const visionModels = [
          "llama-3.2-11b-vision-preview",  // Primary vision model
          "llama-3.2-11b-vision",         // Alternative vision model name
          "llama-3.1-8b-vision-preview",  // Fallback vision model
          "meta-llama/llama-4-maverick-17b-128e-instruct", // Newer model that might support vision
          "meta-llama/llama-4-scout-17b-16e-instruct",     // Another newer model
        ];

        let completion = null;
        let modelUsed = null;
        let visionError = null;

        for (const model of visionModels) {
          try {
            console.log(`Attempting to use vision model: ${model}`);
            
            completion = await groqClient.chat.completions.create({
              model: model,
              messages: [
                {
                  role: "system",
                  content: `You are an educational AI assistant with vision capabilities. Analyze the provided image and help students understand concepts, solve problems, and learn effectively. Be clear, encouraging, and educational in your responses. If you can see the image, describe what you observe and provide educational insights.

Your responses must be in plain text format only.

CRITICAL FORMATTING REQUIREMENTS:
- NO markdown formatting (no asterisks, backticks, hashtags, etc.)
- NO asterisks around words or phrases
- NO backticks or code formatting
- Use plain text only

MANDATORY FORMATTING RULES:
- ALWAYS put each numbered point on a NEW LINE
- ALWAYS put each bullet point on a NEW LINE  
- ALWAYS separate paragraphs with line breaks
- Use numbered lists (1., 2., 3.) for sequential points
- Use bullet points (•) for non-sequential items`
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

            modelUsed = model;
            console.log(`Successfully used vision model: ${model}`);
            break;
          } catch (modelError) {
            console.log(`Vision model ${model} failed:`, modelError instanceof Error ? modelError.message : 'Unknown error');
            visionError = modelError;
            continue;
          }
        }

        if (completion && completion.choices[0]?.message?.content) {
          return NextResponse.json({
            content: completion.choices[0].message.content,
            finished: true
          });
        } else {
          throw new Error('No vision models available or successful');
        }

      } catch (visionError) {
        console.error('All vision models failed:', visionError);
        
        // Log specific error details for debugging
        if (visionError instanceof Error) {
          console.error('Vision error details:', {
            message: visionError.message,
            name: visionError.name,
            stack: visionError.stack
          });
        }
        
        // Provide a helpful fallback response
        return NextResponse.json({
          content: "I see you've uploaded an image! Unfortunately, I don't currently have access to image analysis capabilities. However, I'd be happy to help you with any questions you have about the image. Please describe what you see in the image, and I can help explain concepts, answer questions, or provide educational insights based on your description. What would you like to know about the image?",
          finished: true
        });
      }
    }

    // Prepare system message with web search results if available
    let systemMessage = `You are a helpful educational AI assistant. Your responses must be in plain text format only.

CRITICAL FORMATTING REQUIREMENTS:
- NO markdown formatting (no asterisks, backticks, hashtags, etc.)
- NO asterisks around words or phrases
- NO backticks or code formatting
- Use plain text only
- Write in a conversational, friendly tone
- Keep responses concise but informative

MANDATORY FORMATTING RULES:
- ALWAYS put each numbered point on a NEW LINE
- ALWAYS put each bullet point on a NEW LINE  
- ALWAYS separate paragraphs with line breaks
- Use numbered lists (1., 2., 3.) for sequential points
- Use bullet points (•) for non-sequential items
- Start each new point or paragraph on a new line
- Keep the format clean and easy to read

Example of CORRECT formatting:
"Here are the key points about photosynthesis:

1. Plants capture sunlight through their leaves

2. They convert carbon dioxide and water into glucose

3. Oxygen is released as a byproduct

This process happens in the chloroplasts of plant cells.

The glucose produced provides energy for the plant to grow and survive."

IMPORTANT: Always use line breaks to separate points and paragraphs. Never put multiple points on the same line.`;

    // Add web search results to system message if available
    if (webSearchResults.length > 0) {
      // If the search result is from the system clock, provide a direct instruction
      if (webSearchResults[0].source === 'System Clock') {
        systemMessage += `\n\The user is asking for the current date or time. Use the following information to answer directly:\n\n${webSearchResults[0].snippet}`;
      } else {
        systemMessage += `\n\nCURRENT WEB SEARCH RESULTS (use this up-to-date information to answer the user's question):\n`;
        webSearchResults.forEach((result: any, index: number) => {
          systemMessage += `\n${index + 1}. ${result.title}\nSource: ${result.source}\nURL: ${result.url}\nInformation: ${result.snippet}\n`;
        });
        systemMessage += `\nUse the above web search results to provide current, accurate information. If the search results don't fully answer the question, combine them with your knowledge to give a comprehensive response.`;
      }
    }

    // Handle text-only messages with Vercel AI SDK
    const result = await streamText({
      model: groq('llama-3.1-8b-instant'),
      system: systemMessage,
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