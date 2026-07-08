import { useState, type FormEvent } from 'react';

type ChatInputProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
};

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue('');
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <textarea
        className="chat-input__field"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask a question or describe what you want to learn…"
        rows={3}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />
      <button className="chat-input__submit" type="submit" disabled={disabled || !value.trim()}>
        Send
      </button>
    </form>
  );
}
