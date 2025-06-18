# Voice Chatbot Backend

This Flask backend integrates with your existing voice.py chatbot logic and provides REST API endpoints for the React frontend.

## Setup

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in your Azure credentials:
     ```
     AZURE_SPEECH_KEY=your_azure_speech_key_here
     AZURE_SPEECH_ENDPOINT=your_azure_speech_endpoint_here
     AZURE_TTS_KEY=your_azure_tts_key_here
     AZURE_TTS_ENDPOINT=your_azure_tts_endpoint_here
     AZURE_CHATGPT_KEY=your_azure_chatgpt_key_here
     AZURE_CHATGPT_ENDPOINT=your_azure_chatgpt_endpoint_here
     endpoint=your_azure_openai_endpoint_here
     ```

3. **Run the backend server:**
   ```bash
   python app.py
   ```

The server will start on `http://localhost:5000`

## API Endpoints

- `POST /api/chat` - Send messages to the chatbot
- `GET /api/audio/<filename>` - Serve generated audio files
- `POST /api/speech-to-text` - Convert speech to text (optional)
- `GET /api/health` - Health check endpoint

## Features

- Integrates your existing Azure ChatGPT logic
- Maintains user context/introductions per session
- Generates audio responses using gTTS
- CORS enabled for frontend integration
- Error handling and logging

## Usage

The frontend will automatically connect to this backend when you start both servers. Make sure to:

1. Start the backend server first: `python backend/app.py`
2. Start the frontend: `npm run dev`
3. The frontend will show connection status in the header