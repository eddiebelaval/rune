'use client';

import { useState, useCallback, useEffect } from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';

// ---------------------------------------------------------------------------
// VoiceInput — Text input with microphone button (Deepgram STT)
// ---------------------------------------------------------------------------

interface VoiceInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

/** Simple inline SVG microphone icon */
function MicIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Microphone body */}
      <rect
        x="9"
        y="2"
        width="6"
        height="12"
        rx="3"
        fill={active ? 'var(--rune-gold)' : 'var(--rune-muted)'}
      />
      {/* Microphone cradle arc */}
      <path
        d="M5 11a7 7 0 0 0 14 0"
        stroke={active ? 'var(--rune-gold)' : 'var(--rune-muted)'}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Stand */}
      <line
        x1="12"
        y1="18"
        x2="12"
        y2="22"
        stroke={active ? 'var(--rune-gold)' : 'var(--rune-muted)'}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Base */}
      <line
        x1="9"
        y1="22"
        x2="15"
        y2="22"
        stroke={active ? 'var(--rune-gold)' : 'var(--rune-muted)'}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Simple inline SVG send arrow icon */
function SendIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="var(--rune-bg)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function VoiceInput({ onSend, disabled = false }: VoiceInputProps) {
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    error,
  } = useVoiceInput();

  const [inputValue, setInputValue] = useState('');

  // Sync voice transcript into the input field
  useEffect(() => {
    if (isListening) {
      // While listening, show final + interim text
      const display = interimTranscript
        ? transcript + (transcript ? ' ' : '') + interimTranscript
        : transcript;
      if (display) {
        setInputValue(display);
      }
    } else if (transcript) {
      // When mic stops, set the final transcript
      setInputValue(transcript);
    }
  }, [isListening, transcript, interimTranscript]);

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || disabled) return;

    onSend(text);
    setInputValue('');
  }, [inputValue, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const toggleMic = useCallback(async () => {
    if (isListening) {
      stopListening();
    } else {
      setInputValue('');
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  const hasText = inputValue.trim().length > 0;

  return (
    <div className="px-4 py-3">
      {/* Error display */}
      {error && (
        <p
          className="text-xs mb-2 px-1"
          style={{ color: '#e57373' }}
        >
          {error}
        </p>
      )}

      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2"
        style={{
          backgroundColor: 'var(--rune-surface)',
          border: '1px solid var(--rune-border)',
        }}
      >
        {/* Microphone button */}
        <button
          type="button"
          onClick={() => void toggleMic()}
          disabled={disabled}
          className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 cursor-pointer shrink-0"
          style={{
            backgroundColor: isListening ? 'transparent' : 'var(--rune-elevated)',
          }}
          aria-label={isListening ? 'Stop recording' : 'Start recording'}
        >
          {/* Pulsing gold ring when listening */}
          {isListening && (
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                border: '2px solid var(--rune-gold)',
                opacity: 0.4,
              }}
            />
          )}
          {isListening && (
            <span
              className="absolute inset-0 rounded-full"
              style={{
                border: '2px solid var(--rune-gold)',
              }}
            />
          )}
          <MicIcon active={isListening} />
        </button>

        {/* Text input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={isListening ? 'Listening...' : 'Type or speak...'}
          className="flex-1 bg-transparent outline-none text-sm placeholder:opacity-50"
          style={{
            color: 'var(--rune-text)',
            fontFamily: 'var(--font-body, "Source Sans 3", sans-serif)',
            caretColor: 'var(--rune-gold)',
          }}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !hasText}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 cursor-pointer shrink-0"
          style={{
            backgroundColor: hasText ? 'var(--rune-gold)' : 'var(--rune-elevated)',
            opacity: hasText ? 1 : 0.4,
          }}
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
