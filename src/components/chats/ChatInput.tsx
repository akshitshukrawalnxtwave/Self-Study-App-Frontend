import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';

type ChatInputProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
  /** Quick prompts only make sense after a lesson exists. */
  showQuickPrompts?: boolean;
};

const QUICK_PROMPTS = ['Quiz me on this', 'Explain it simpler', 'Next lesson'] as const;

const SendIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
  </svg>
);

export function ChatInput({ onSend, disabled, showQuickPrompts = false }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit(value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit(value);
    }
  }

  const placeholder = showQuickPrompts
    ? 'Ask about this lesson, request a quiz, or we can move to next topic…'
    : 'Tell me what you want to learn — your topic, goal, and level (e.g. “C++ smart pointers for interviews”)…';

  return (
    <div className="composer">
      {showQuickPrompts ? (
        <div className="composer__quick">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={disabled}
              onClick={() => submit(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : null}

      <form className="composer__field" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="submit"
          className="composer__send"
          aria-label="Send"
          disabled={disabled || !value.trim()}
        >
          {SendIcon}
        </button>
      </form>
    </div>
  );
}
