# EduChat AI - Multimodal Ed-Tech Chatbot

A production-ready, multimodal AI chatbot designed specifically for educational purposes. Built with Next.js 14, it supports both text and image inputs, implements advanced AI capabilities through Groq, and provides a clean, responsive interface.

## 🚀 Features

- **Multimodal Support**: Handle both text and image inputs
- **Educational Focus**: Specialized prompts and responses for learning
- **Modern UI**: Clean, responsive design with dark/light mode support  
- **Real-time Streaming**: Fast, streaming responses for better UX
- **Image Analysis**: Advanced vision capabilities for educational content
- **Mobile Responsive**: Works seamlessly across all devices
- **Type Safe**: Full TypeScript implementation
- **Production Ready**: Optimized for deployment on Vercel

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 with App Router
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **AI Provider**: Groq API (llama models)
- **State Management**: React hooks (useState, useChat from ai/react)
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React
- **Theme**: next-themes for dark/light mode
- **Type Safety**: TypeScript throughout

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Groq API key (free at [console.groq.com](https://console.groq.com))

## ⚡ Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd edutech-chatbot-new
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage Examples

### Text Conversations
- Ask questions about any academic subject
- Get step-by-step problem solutions
- Request explanations of complex concepts
- Generate study materials and quizzes

### Image Analysis
- Upload photos of math problems for solutions
- Analyze scientific diagrams and charts
- Get explanations of visual content
- Process educational materials from textbooks

### Educational Contexts
- **Math**: Algebra, calculus, geometry problems
- **Science**: Physics, chemistry, biology concepts
- **Programming**: Code examples and debugging
- **General**: History, literature, and more

## 🏗️ Project Structure

```
edutech-chatbot-new/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── chat/route.ts        # Main chat endpoint
│   │   └── upload/route.ts      # File upload handler
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── ChatInterface.tsx    # Main chat component
│   │   ├── MessageList.tsx      # Message display
│   │   └── Header.tsx           # App header
│   ├── lib/                     # Utility libraries
│   │   ├── ai-config.ts         # AI configuration
│   │   └── utils.ts             # Helper functions
│   ├── types/                   # TypeScript definitions
│   └── layout.tsx               # Root layout
├── src/app/                     # Additional app files
│   ├── globals.css              # Global styles
│   └── layout.tsx               # Main layout
├── public/                      # Static assets
└── package.json                 # Dependencies
```

## 🔧 Configuration

### AI Models
The app uses different Groq models for different purposes:
- **Text**: `llama-3.1-8b-instant` (fast responses)
- **Vision**: `llama-3.2-90b-vision-preview` (image analysis)
- **Complex**: `llama-3.1-70b-versatile` (advanced reasoning)

### Customization
Modify `app/lib/ai-config.ts` to:
- Adjust system prompts for different subjects
- Change model parameters (temperature, max tokens)
- Add new educational contexts

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Environment Variables for Production
```env
GROQ_API_KEY=your_groq_api_key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## 🎨 UI Components

The app uses a comprehensive set of UI components:
- `Button` - Interactive buttons with variants
- `Card` - Content containers
- `ScrollArea` - Scrollable content areas
- `Textarea` - Multi-line text input
- Custom message components with markdown support

## 🔍 API Endpoints

### POST /api/chat
Main chat endpoint supporting both text and image inputs.

**Request:**
```json
{
  "messages": [...],
  "hasImages": boolean
}
```

**Response:** Streaming text or JSON with image analysis

### POST /api/upload
File upload endpoint for image processing.

**Request:** FormData with image file
**Response:** Base64 encoded image data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:
1. Check the environment variables are set correctly
2. Verify your Groq API key is valid
3. Review the console for error messages
4. Open an issue on GitHub with detailed information

## 🔮 Future Enhancements

- [ ] RAG implementation with vector database
- [ ] Tool calling system (calculator, code executor)
- [ ] Study session persistence
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Advanced analytics

---

Built with ❤️ for education and learning
