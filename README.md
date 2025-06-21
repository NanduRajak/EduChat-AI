# EduChat - AI Educational Assistant

A modern, intelligent educational chatbot powered by Groq AI that helps students learn, solve problems, and understand complex concepts.

## Features

- 🤖 **AI-Powered Learning**: Get instant help with homework, explanations, and study guidance
- 🖼️ **Image Analysis**: Upload images for AI analysis and explanation
- 💬 **Real-time Chat**: Stream responses for a smooth conversation experience
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- 💾 **Chat History**: Save and manage your conversation sessions

## Quick Start

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd edutech-chatbot-new
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up your Groq API key

Create a `.env.local` file in the root directory and add your Groq API key:

```bash
# .env.local
GROQ_API_KEY=your_actual_groq_api_key_here
```

**Get your free Groq API key:**
1. Visit [https://console.groq.com/keys](https://console.groq.com/keys)
2. Sign up for a free account
3. Create a new API key
4. Copy the key and paste it in your `.env.local` file

### 4. Run the development server
```bash
npm run dev
```

### 5. Open your browser
Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Text Conversations
- Simply type your questions or problems
- Get instant AI-powered responses
- Ask for explanations, help with homework, or study tips

### Image Analysis
- Click the paperclip icon or drag & drop images
- Upload images up to 10MB
- Get AI analysis and explanations of the content

### Chat Management
- Use the sidebar to manage chat sessions
- Create new conversations
- Access your chat history
- Delete old conversations

## Troubleshooting

### API Key Issues
If you see "Please add your free Groq API key" error:
1. Make sure you have a `.env.local` file in the root directory
2. Verify your API key is correct
3. Restart the development server after adding the key

### Model Issues
If you encounter model-related errors:
- The app uses `llama-3.1-8b-instant` for text and `llama-3.2-11b-vision-preview` for images
- These are free models available on Groq
- Make sure your account has access to these models

### Image Upload Issues
- Supported formats: JPEG, PNG, GIF, WebP
- Maximum file size: 10MB
- Make sure images are clear and readable

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI**: Groq AI (Llama models)
- **UI Components**: Radix UI
- **Icons**: Lucide React

## Development

### Project Structure
```
app/
├── api/           # API routes
├── components/    # React components
├── lib/          # Utility functions
└── types/        # TypeScript types
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the console for error messages
3. Make sure your Groq API key is valid and has sufficient credits
