const Groq = require('groq-sdk');
require('dotenv').config({ path: '.env.local' });

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function testGroqVision() {
  try {
    console.log('Testing Groq API connection...');
    console.log('API Key:', process.env.GROQ_API_KEY ? 'Present' : 'Missing');
    
    // Test with a simple text request first
    console.log('\nTesting text model...');
    const textResponse = await groqClient.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'user', content: 'Hello, can you respond with "API is working"?' }
      ],
      max_tokens: 50,
    });
    
    console.log('Text model response:', textResponse.choices[0]?.message?.content);
    
    // Test vision models
    const visionModels = [
      'llama-3.2-90b-vision-preview',
      'llama-3.2-11b-vision-preview',
      'llama-3.1-8b-vision-preview'
    ];
    
    for (const model of visionModels) {
      console.log(`\nTesting vision model: ${model}`);
      try {
        const response = await groqClient.chat.completions.create({
          model,
          messages: [
            { role: 'user', content: 'Hello, can you respond with "Vision API is working"?' }
          ],
          max_tokens: 50,
        });
        
        console.log(`${model} response:`, response.choices[0]?.message?.content);
      } catch (error) {
        console.error(`${model} error:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testGroqVision(); 