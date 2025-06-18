import React from 'react';
import { User, Bot, AlertCircle, Mic, Volume2 } from 'lucide-react';
import { Message } from '../types/chat';

interface MessageBubbleProps {
  message: Message;
  onPlayAudio?: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onPlayAudio }) => {
  const isUser = message.sender === 'user';
  const isBot = message.sender === 'bot';

  const playMessage = () => {
    if (onPlayAudio) {
      onPlayAudio();
    } else if ('speechSynthesis' in window && message.text) {
      const utterance = new SpeechSynthesisUtterance(message.text);
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
      <div className={`flex items-start space-x-3 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : message.isError
            ? 'bg-red-100 text-red-600'
            : 'bg-gradient-to-br from-purple-500 to-blue-600 text-white'
        }`}>
          {isUser ? <User size={18} /> : message.isError ? <AlertCircle size={18} /> : <Bot size={18} />}
        </div>

        {/* Message Content */}
        <div className={`relative group ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
          <div className={`px-4 py-3 rounded-2xl shadow-sm ${
            isUser 
              ? 'bg-blue-600 text-white rounded-br-md' 
              : message.isError
              ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-md'
              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
          }`}>
            {/* Voice indicator */}
            {message.isVoice && (
              <div className={`flex items-center space-x-2 text-xs mb-2 ${
                isUser ? 'text-blue-200' : 'text-gray-500'
              }`}>
                <Mic size={12} />
                <span>Voice message</span>
              </div>
            )}
            
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
            
            {/* Audio response indicator */}
            {(message.hasAudio || message.audioUrl) && (
              <button
                onClick={playMessage}
                className="flex items-center space-x-2 text-xs mt-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Volume2 size={12} />
                <span>Play response</span>
              </button>
            )}
          </div>
          
          {/* Timestamp */}
          <div className={`text-xs text-gray-500 mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;