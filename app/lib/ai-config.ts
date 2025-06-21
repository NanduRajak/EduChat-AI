import { groq } from '@ai-sdk/groq';
import Groq from 'groq-sdk';

// Initialize Groq clients
const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

// Note: Using raw Groq SDK for both text and vision processing

// Models configuration
export const MODELS = {
  TEXT: 'llama-3.1-8b-instant', // Fast text model via Vercel AI SDK
  VISION: 'llama-3.2-90b-vision-preview', // Primary vision model via raw Groq SDK
  VISION_FALLBACK: 'llama-3.2-11b-vision-preview', // Fallback vision model
  LARGE: 'llama-3.1-70b-versatile', // Large model for complex tasks
} as const;

// System prompts for different contexts
export const SYSTEM_PROMPTS = {
  GENERAL: `You are EduChat AI, an advanced educational assistant designed to help students learn across various subjects. 

Your capabilities include:
- Explaining complex concepts in simple terms
- Solving step-by-step problems
- Analyzing images and diagrams
- Generating quizzes and study materials
- Creating personalized study plans
- Executing code and calculations
- Searching for educational resources

Guidelines:
- Always provide clear, accurate, and educational responses
- Break down complex problems into manageable steps
- Use analogies and examples to make concepts more understandable
- Encourage critical thinking and learning
- Cite sources when providing factual information
- Adapt your language to the student's level
- Be patient and supportive in your explanations`,

  MATH: `You are a mathematics tutor specialized in helping students understand mathematical concepts from basic arithmetic to advanced calculus. 

When solving problems:
- Show each step clearly
- Explain the reasoning behind each step
- Use proper mathematical notation
- Provide alternative solution methods when applicable
- Help students identify common mistakes
- Connect concepts to real-world applications`,

  SCIENCE: `You are a science educator helping students understand scientific concepts across physics, chemistry, biology, and earth sciences.

When explaining science:
- Use clear, accurate scientific terminology
- Provide concrete examples and analogies
- Explain the underlying principles
- Connect concepts to observable phenomena
- Encourage scientific thinking and inquiry
- Relate topics to current scientific discoveries`,

  PROGRAMMING: `You are a programming instructor helping students learn to code across various programming languages and concepts.

When teaching programming:
- Provide clear, well-commented code examples
- Explain concepts step-by-step
- Show best practices and common patterns
- Help debug code and explain errors
- Encourage problem-solving thinking
- Connect programming concepts to real applications`,
} as const;

// Vision processing function using raw Groq SDK
export async function processImageWithGroq(
  imageData: string,
  userPrompt: string = "What do you see in this image? Please provide a detailed description and analysis."
): Promise<string> {
  const visionModels = [
    MODELS.VISION,
    MODELS.VISION_FALLBACK,
    'llama-3.1-8b-vision-preview'
  ];

  for (const model of visionModels) {
    try {
      console.log(`Attempting image analysis with model: ${model}`);
      const response = await groqClient.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPTS.GENERAL
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData // Should be in format: data:image/jpeg;base64,{base64}
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        console.log(`Image analysis successful with model: ${model}`);
        return content;
      }
    } catch (error) {
      console.error(`Vision processing error with model ${model}:`, error);
      // Continue to next model if this one fails
      continue;
    }
  }
  
  throw new Error('All vision models failed to process the image');
}

// Text completion function using raw Groq SDK (fallback)
export async function processTextWithGroq(
  messages: Array<{ role: string; content: string }>,
  model: string = MODELS.TEXT
): Promise<string> {
  try {
    const response = await groqClient.chat.completions.create({
      model,
      messages: messages as any,
      max_tokens: 2000,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "I couldn't process your request.";
  } catch (error) {
    console.error('Text processing error:', error);
    throw new Error('Failed to process text with Groq model');
  }
}

// Configuration for different educational contexts
export const EDUCATION_CONFIG = {
  maxTokens: {
    quick: 500,
    detailed: 1500,
    comprehensive: 3000,
  },
  temperature: {
    factual: 0.1,
    creative: 0.7,
    balanced: 0.4,
  },
  subjects: {
    math: {
      systemPrompt: SYSTEM_PROMPTS.MATH,
      temperature: 0.2,
      maxTokens: 1500,
    },
    science: {
      systemPrompt: SYSTEM_PROMPTS.SCIENCE,
      temperature: 0.3,
      maxTokens: 1500,
    },
    programming: {
      systemPrompt: SYSTEM_PROMPTS.PROGRAMMING,
      temperature: 0.2,
      maxTokens: 2000,
    },
    general: {
      systemPrompt: SYSTEM_PROMPTS.GENERAL,
      temperature: 0.4,
      maxTokens: 1500,
    },
  },
} as const;

// Helper function to get appropriate configuration based on context
export function getAIConfig(subject?: string, complexity?: 'quick' | 'detailed' | 'comprehensive') {
  const subjectConfig = EDUCATION_CONFIG.subjects[subject as keyof typeof EDUCATION_CONFIG.subjects] || EDUCATION_CONFIG.subjects.general;
  const maxTokens = complexity ? EDUCATION_CONFIG.maxTokens[complexity] : subjectConfig.maxTokens;
  
  return {
    ...subjectConfig,
    maxTokens,
  };
}

// Format messages for different AI providers
export function formatMessagesForGroq(messages: Array<{ role: string; content: string; images?: string[] }>) {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
}

// Error handling utilities
export function handleAIError(error: any): string {
  if (error.message?.includes('rate limit')) {
    return 'I\'m experiencing high demand right now. Please try again in a moment.';
  }
  
  if (error.message?.includes('context length')) {
    return 'The conversation has become too long. Please start a new chat to continue.';
  }
  
  if (error.message?.includes('content policy')) {
    return 'I can\'t help with that request. Please ask me something related to education and learning.';
  }
  
  return 'I encountered an error while processing your request. Please try again.';
} 