export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isVoice?: boolean;
  hasAudio?: boolean;
  audioUrl?: string;
  isError?: boolean;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}