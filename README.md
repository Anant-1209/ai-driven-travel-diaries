# Travel Diaries 🌍✨

Travel Diaries is a professional, AI-powered travel platform inspired by modern editorial standards (like Lonely Planet). It helps explorers discover destinations, generate intelligent itineraries, and share authentic travel stories.

## 🚀 Features
- **✨ AI Trip Planner**: Generate detailed Markdown itineraries using a multi-provider fallback (Gemini, Grok, Groq).
- **🤖 WanderBot**: A specialized travel assistant chatbot.
- **🗺️ Destinations Mega-Menu**: Regional categorization for Indian destinations.
- **📰 Editorial Experience**: Premium horizontal scrolls, bento grids, and typography.
- **🛡️ Secure Community**: JWT-based authentication with Zod validation and toxicity filtering for comments.

## 🛠️ Tech Stack
- **Frontend**: React, Tailwind CSS, Flowbite, Redux Toolkit.
- **Backend**: Node.js, Express, MongoDB, Socket.io.
- **AI Integration**: Google Gemini, xAI (Grok), Groq (Llama 3.3).
- **Deployment Ready**: Fully Dockerized with `docker-compose`.

## 📦 Getting Started

### 1. Prerequisites
- Docker & Docker Desktop installed.
- API Keys for Gemini, Groq, or xAI.

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
PORT=3000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
GEMINI_API_KEY=your_key
GROQ_API_KEY=your_key
XAI_API_KEY=your_key
```

### 3. Run with Docker
```bash
docker-compose up --build
```
The frontend will be at `http://localhost:5173` and backend at `http://localhost:3000`.

## 📈 Deployment
This project is production-ready. You can deploy the Docker containers to:
- **Railway**
- **Render**
- **DigitalOcean App Platform**

## 🤝 Contributing
We welcome contributions! Please see the About page for more details.

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
© 2026 Travel Diaries™ — Beyond Horizons.
