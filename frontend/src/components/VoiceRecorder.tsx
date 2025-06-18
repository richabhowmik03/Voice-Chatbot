import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';


interface VoiceRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onVoiceResult: (transcript: string) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  onVoiceResult,
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const manualStopRef = useRef(false); 
  const transcriptRef = useRef('');

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('Voice recognition started');
      };

      recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
      transcriptRef.current = currentTranscript;

        // setTranscript(finalTranscript || interimTranscript);

        // if (finalTranscript) {
        //   onVoiceResult(finalTranscript);
        //   setTranscript('');
        // }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        onStopRecording();
      };

    //   recognition.onend = () => {
    //     if (!manualStopRef.current && isRecording) {
    //       // Restart recognition if not manually stopped
    //       recognition.start();
    //     } else {
    //       onStopRecording();
    //       manualStopRef.current = false; 
    //     }
    // };
        recognition.onend = () => {
      if (!manualStopRef.current && isRecording) {
        recognition.start(); // Restart automatically if not manually stopped
      } else {
        // On manual stop, send any remaining transcript
        if (transcriptRef.current.trim()) {
          onVoiceResult(transcriptRef.current.trim());
          setTranscript('');
          transcriptRef.current = '';
        }
        onStopRecording();
        manualStopRef.current = false;
      }
    };

      recognitionRef.current = recognition;
    }

    // Keyboard shortcut: Hold Space to record
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isRecording && isSupported) {
        e.preventDefault();
        startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isRecording) {
        e.preventDefault();
        stopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, isSupported, onVoiceResult, onStopRecording]);

const startRecording = () => {
  if (recognitionRef.current && !isRecording) {
    manualStopRef.current = false; // Reset manual stop flag
    onStartRecording();
    recognitionRef.current.start();
  }
};

const stopRecording = () => {
  if (recognitionRef.current && isRecording) {
    manualStopRef.current = true;
    recognitionRef.current.stop();
    // Send transcript only on manual stop
    if (transcriptRef.current.trim()) {
      onVoiceResult(transcriptRef.current.trim());
      setTranscript('');
      transcriptRef.current = '';
    }
  }
};


// const stopRecording = () => {
//   if (recognitionRef.current && isRecording) {
//     manualStopRef.current = true; // Set manual stop flag
//     recognitionRef.current.stop();
//   }
// };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!isSupported) {
    return (
      <div className="p-3 text-xs text-gray-500 bg-gray-100 rounded-xl">
        Voice input not supported
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={toggleRecording}
        className={`relative p-4 rounded-full transition-all duration-300 transform hover:scale-105 ${
          isRecording
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/25 animate-pulse'
            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25'
        }`}
        title={isRecording ? 'Stop recording (release Space)' : 'Start recording (hold Space)'}
      >
        {isRecording ? <Square size={24} /> : <Mic size={24} />}
        
        {/* Recording animation rings */}
        {isRecording && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-ping"></div>
            <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping animation-delay-200"></div>
          </>
        )}
      </button>

      {/* Real-time transcript preview */}
      {transcript && (
        <div className="absolute bottom-full right-0 mb-2 p-2 bg-black/80 text-white text-xs rounded-lg max-w-xs">
          {transcript}
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;