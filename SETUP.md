# Setup Guide - EduChat AI Assistant

## Quick Setup Instructions

### Step 1: Get Your Free Groq API Key

1. **Visit Groq Console**: Go to [https://console.groq.com/keys](https://console.groq.com/keys)
2. **Sign Up/Login**: Create a free account or log in
3. **Create API Key**: Click "Create API Key" and give it a name
4. **Copy the Key**: Copy the generated API key (it starts with `gsk_`)

### Step 2: Configure Your Environment

1. **Create .env.local file**: In your project root directory, create a file named `.env.local`
2. **Add your API key**: Add this line to the file:
   ```
   GROQ_API_KEY=your_actual_api_key_here
   ```
   Replace `your_actual_api_key_here` with the key you copied from Groq

### Step 3: Restart the Development Server

1. **Stop the server**: Press `Ctrl+C` in your terminal
2. **Restart**: Run `npm run dev` again
3. **Test**: Open [http://localhost:3000](http://localhost:3000) and try sending a message

## Example .env.local file

```
GROQ_API_KEY=gsk_your_actual_api_key_here
```

## Troubleshooting

### "Please add your free Groq API key" error
- Make sure the `.env.local` file is in the root directory (same level as `package.json`)
- Verify the API key is correct and starts with `gsk_`
- Restart the development server after adding the key

### "Invalid API key" error
- Check that your API key is copied correctly
- Make sure there are no extra spaces or characters
- Verify your Groq account is active

### "Rate limit reached" error
- The free tier has rate limits
- Wait a moment and try again
- Consider upgrading to a paid plan for higher limits

## Features Now Working

✅ **Text Chat**: Ask questions, get explanations, solve problems
✅ **Image Analysis**: Upload images for AI analysis
✅ **Streaming Responses**: Real-time AI responses
✅ **Chat History**: Save and manage conversations
✅ **Dark Mode**: Toggle between themes

## Next Steps

1. Test text conversations by asking educational questions
2. Try uploading images for analysis
3. Explore the chat history feature
4. Customize the interface as needed

Your EduChat AI assistant is now ready to help with learning! 🎉 