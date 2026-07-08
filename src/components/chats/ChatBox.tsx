import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import type { Message } from '../../types/api';

type ChatBoxProps = {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSend: (message: string) => void;
};

export function ChatBox({ messages, isLoading, error, onSend }: ChatBoxProps) {
  return (
    <section className="chat-box">
      <header className="chat-box__header">
        <h2>Chat</h2>
      </header>
      <div className="chat-box__messages">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>
      {error && <p className="chat-box__error">{error}</p>}
      <ChatInput onSend={onSend} disabled={isLoading} />
    </section>
  );
}
