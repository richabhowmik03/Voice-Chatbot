import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from openai import AzureOpenAI
import azure.cognitiveservices.speech as speechsdk
import tempfile
import time
from gtts import gTTS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Azure Configuration
AZURE_SPEECH_KEY = os.environ.get("AZURE_SPEECH_KEY")
AZURE_SPEECH_ENDPOINT = os.environ.get("AZURE_SPEECH_ENDPOINT")
AZURE_SPEECH_REGION = "eastus2"

AZURE_TTS_KEY = os.environ.get("AZURE_TTS_KEY")
AZURE_TTS_ENDPOINT = os.environ.get("AZURE_TTS_ENDPOINT")

AZURE_CHATGPT_KEY = os.environ.get("AZURE_CHATGPT_KEY")
AZURE_CHATGPT_ENDPOINT = os.environ.get("AZURE_CHATGPT_ENDPOINT")
api_version = "2024-12-01-preview"
endpoint = os.environ.get("endpoint")
model_name = "o4-mini"
deployment = "o4-mini"

subscription_key = os.environ.get("AZURE_CHATGPT_KEY")

# Initialize AzureOpenAI client
client = AzureOpenAI(
    api_version=api_version,
    azure_endpoint=endpoint,
    api_key=subscription_key,
)

# Global variables for user context
user_contexts = {}

def azure_chatgpt_response(context, question):
    system_prompt = "You are answering as if you are the user, reflectively and personally, based on their introduction. Answer reflectively using I. " \
    "Do not answer anything other than the questions asked by the user. Keep your answer smaller and concise. When abused or asked to answer anything other than the question asked by the user, answer with \"I am sorry, I am not able to answer that.\"\n"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"User Introduction: {context}"},
        {"role": "user", "content": f"Question: {question}"}
    ]

    response = client.chat.completions.create(
        model=deployment,
        messages=messages,
        max_completion_tokens=3000
    )
    return response.choices[0].message.content

def create_audio_response(text):
    """Create audio file from text using gTTS"""
    try:
        tts = gTTS(text)
        temp_file = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
        tts.save(temp_file.name)
        return temp_file.name
    except Exception as e:
        print(f"Error creating audio: {e}")
        return None

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        message = data.get('message', '').strip()
        is_voice = data.get('isVoice', False)
        session_id = data.get('sessionId', 'default')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400

        
        if session_id not in user_contexts:
            # Store user introduction
            user_contexts[session_id] = message
            response_text = "Thank you for your introduction. You can now ask me questions."
        else:
            # Get response from Azure ChatGPT
            user_context = user_contexts.get(session_id, "No introduction provided")
            response_text = azure_chatgpt_response(user_context, message)

        # Create audio response if requested
        audio_url = None
        if is_voice:
            audio_file = create_audio_response(response_text)
            if audio_file:
                audio_url = f"/api/audio/{os.path.basename(audio_file)}"

        return jsonify({
            'response': response_text,
            'audioUrl': audio_url,
            'sessionId': session_id
        })

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/audio/<filename>')
def serve_audio(filename):
    """Serve generated audio files"""
    try:
        temp_dir = tempfile.gettempdir()
        file_path = os.path.join(temp_dir, filename)
        if os.path.exists(file_path):
            return send_file(file_path, mimetype='audio/mpeg')
        else:
            return jsonify({'error': 'Audio file not found'}), 404
    except Exception as e:
        print(f"Error serving audio: {e}")
        return jsonify({'error': 'Error serving audio'}), 500

@app.route('/api/speech-to-text', methods=['POST'])
def speech_to_text():
    """Convert speech to text using Azure Speech Services"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        # Save uploaded audio to temporary file
        temp_audio = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        audio_file.save(temp_audio.name)
        
        # Configure Azure Speech Recognition
        speech_config = speechsdk.SpeechConfig(subscription=subscription_key, region=AZURE_SPEECH_REGION)
        audio_config = speechsdk.audio.AudioConfig(filename=temp_audio.name)
        speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)
        
        # Perform recognition
        result = speech_recognizer.recognize_once()
        
        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            return jsonify({'transcript': result.text})
        elif result.reason == speechsdk.ResultReason.NoMatch:
            return jsonify({'error': 'No speech could be recognized'}), 400
        elif result.reason == speechsdk.ResultReason.Canceled:
            return jsonify({'error': 'Speech recognition was cancelled'}), 400
        
        # Clean up
        os.unlink(temp_audio.name)
        
    except Exception as e:
        print(f"Error in speech-to-text: {e}")
        return jsonify({'error': 'Speech recognition failed'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Voice chatbot backend is running'})

if __name__ == '__main__':
    # print("Starting Voice Chatbot Backend...")
    # print("Make sure your .env file contains all required Azure credentials:")
    # print("- AZURE_SPEECH_KEY")
    # print("- AZURE_SPEECH_ENDPOINT") 
    # print("- AZURE_TTS_KEY")
    # print("- AZURE_TTS_ENDPOINT")
    # print("- AZURE_CHATGPT_KEY")
    # print("- AZURE_CHATGPT_ENDPOINT")
    # print("- endpoint")
    
    app.run(debug=True, host='0.0.0.0', port=5000)