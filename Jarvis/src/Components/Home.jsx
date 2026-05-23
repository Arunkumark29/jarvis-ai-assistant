import React, { useState, useRef, useEffect } from 'react';
import './Home.css';
import helmetImg from '../assets/Logo.jpg';

function Home() {
  const [listening, setListening] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: "Welcome, Commander.\nI'm online and ready for your command." }
  ]);
  const [error, setError] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [speechActive, setSpeechActive] = useState(false);
  const [savedCommands, setSavedCommands] = useState([]);

  const recognitionRef = useRef(null);
  const speechUtteranceRef = useRef(null);
  const messagesEndRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const loadCommands = () => {
      const saved = localStorage.getItem('jarvisCommands');
      if (saved) {
        try {
          setSavedCommands(JSON.parse(saved));
        } catch (err) {
          console.warn('Unable to parse saved commands', err);
        }
      }
    };

    loadCommands();
    window.addEventListener('focus', loadCommands);
    return () => window.removeEventListener('focus', loadCommands);
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0]?.transcript;
      if (transcript) {
        setInputMessage(transcript);
        handleSendClick(transcript);
      }
    };

    recognition.onerror = (event) => {
      setError(`Voice recognition error: ${event.error || 'Unknown error'}`);
      setListening(false);
    };

    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatMessages, listening]);

  const speakText = (text) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    setSpeechActive(false);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.volume = 1;
    utterance.rate = 1;

    utterance.onstart = () => setSpeechActive(true);
    utterance.onend = () => {
      setSpeechActive(false);
      speechUtteranceRef.current = null;
    };
    utterance.onerror = () => {
      setSpeechActive(false);
      speechUtteranceRef.current = null;
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleStopVoice = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    speechUtteranceRef.current = null;
    setSpeechActive(false);
  };

  const findMatchingCommand = (message) => {
    const normalized = message.toLowerCase().trim();
    return savedCommands.find((cmd) =>
      normalized === cmd.name.toLowerCase() || normalized.includes(cmd.name.toLowerCase())
    );
  };

  const updateAssistantText = (text) => {
    setChatMessages((prev) => {
      const updated = [...prev];
      if (!updated.length || updated[updated.length - 1].role !== 'assistant') {
        updated.push({ role: 'assistant', text });
      } else {
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          text,
        };
      }
      return updated;
    });
  };

  const handleSendClick = async (messageOverride = null) => {
    const message = (messageOverride ?? inputMessage).trim();
    if (!message) return;

    setError('');
    setInputMessage('');

    const matchedCommand = findMatchingCommand(message);
    setChatMessages((prev) => [
      ...prev,
      { role: 'user', text: message },
      { role: 'assistant', text: 'Thinking...' }
    ]);

    if (matchedCommand) {
      const reply = `Opening ${matchedCommand.name}...`;
      updateAssistantText(reply);
      speakText(reply);
      window.open(matchedCommand.url, '_blank');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/gemini/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'AI server returned an error.');
      }

      const reply = data.reply || 'I could not generate a response. Please try again.';
      updateAssistantText(reply);
      speakText(reply);
    } catch (err) {
      const errMessage = err.message || 'Unable to connect to the backend.';
      updateAssistantText('Sorry, I could not process that. Please try again.');
      setError(errMessage);
    }
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      setError('Voice recognition is not supported in this browser.');
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    setError('');
    setListening(true);

    try {
      recognitionRef.current.start();
    } catch (err) {
      setError(err.message || 'Unable to start voice recognition.');
      setListening(false);
    }
  };

  return (
    <main className="jarvis-layout">
      <div className="left-panel">
        <div className="helmet-holo">
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
          <img src={helmetImg} alt="Iron Man Helmet" />
        </div>
      </div>

      <div className="right-panel">
        <div className="chat-output">
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`chat-message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <div className="message-label">
                {msg.role === 'user' ? 'YOU' : 'JARVIS'}
              </div>
              <p>{msg.text}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="chat-footer">
          <div className="footer-left">
            <button className={`speak-btn ${listening ? 'listening' : ''}`} onClick={handleMicClick}>
              {listening ? '⏹ Stop' : '🎤 Speak'}
            </button>
            <button className="stop-btn" onClick={handleStopVoice} disabled={!speechActive}>
              ⏹ Stop Voice
            </button>
            {!voiceSupported && (
              <span className="voice-warning">Voice not supported in this browser.</span>
            )}
          </div>

          <div className="footer-right">
            <input
              type="text"
              placeholder="Type your message..."
              className="chat-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendClick()}
            />
            <button className="send-btn" onClick={() => handleSendClick()}>
              ➤
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Home;
