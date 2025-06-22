import { NextRequest, NextResponse } from 'next/server';
import { streamText, tool } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import Groq from 'groq-sdk';
import { TavilyClient } from 'tavily';
import { z } from 'zod';

// Initialize clients
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const tavily = new TavilyClient({
  apiKey: process.env.TAVILY_API_KEY,
});

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { messages, hasImages, useWebSearch } = await req.json();
    
    // API Key Checks
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      return NextResponse.json({
        error: 'Please add your free Groq API key to .env.local file.'
      }, { status: 400 });
    }
    
    if (useWebSearch && (!process.env.TAVILY_API_KEY || process.env.TAVILY_API_KEY === 'your_tavily_api_key_here')) {
      return NextResponse.json({
        error: 'Please add your Tavily API key to .env.local to use web search.'
      }, { status: 400 });
    }

    // Define the search tool using Tavily
    const searchTool = tool({
      description: 'Search for up-to-date information on the web. Use this for current events, facts, and any topic that requires real-time data.',
      parameters: z.object({
        query: z.string().describe('The search query to find information for.'),
      }),
      execute: async ({ query }) => {
        try {
          const searchResult = await tavily.search({ query, max_results: 5 });
          return searchResult.results.map(result => ({
            title: result.title,
            url: result.url,
            content: result.content,
          }));
        } catch (error) {
          console.error('Tavily search failed:', error);
          return { error: 'Search failed, please try again.' };
        }
      },
    });

    // Handle image messages (no web search for now)
    if (hasImages) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.images && lastMessage.images.length > 0) {
        try {
          const imageMessages = lastMessage.images.map((image: string) => ({
            type: "image_url",
            image_url: {
              url: image
            }
          }));

          const visionModels = [
            "llama-3.2-11b-vision-preview",
            "llama-3.1-8b-vision-preview",
          ];

          for (const model of visionModels) {
            try {
              const completion = await groqClient.chat.completions.create({
                model: model,
                messages: [
                  {
                    role: "system",
                    content: "You are an educational AI assistant with vision capabilities. Analyze the provided image and help students understand concepts, solve problems, and learn effectively."
                  },
                  {
                    role: "user",
                    content: [
                      {
                        type: "text",
                        text: lastMessage.content || "Please analyze this image."
                      },
                      ...imageMessages
                    ]
                  }
                ],
                max_tokens: 1000,
              });

              if (completion.choices[0]?.message?.content) {
                return NextResponse.json({
                  content: completion.choices[0].message.content,
                  finished: true
                });
              }
            } catch (modelError) {
              console.log(`Vision model ${model} failed, trying next...`);
              continue;
            }
          }

          throw new Error('All vision models failed.');

        } catch (visionError) {
          console.error('Image analysis failed:', visionError);
          return NextResponse.json({
            content: "I see you've uploaded an image, but I'm currently unable to analyze it. Please describe the image, and I'll do my best to help!",
            finished: true
          });
        }
      }
    }

    // Handle text messages, with or without web search
    const result = await streamText({
      model: groq('llama-3.1-8b-instant'),
      system: `You are a helpful educational AI assistant.
- If the user provides search results, use them to answer the question.
- If you don't know the answer and no search results are provided, say so.
- Keep your responses simple, clear, and educational.`,
      messages,
      tools: useWebSearch ? { search: searchTool } : undefined,
    });

    // Return streaming response
    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: `Failed to process request. Please try again.` },
      { status: 500 }
    );
  }
} 