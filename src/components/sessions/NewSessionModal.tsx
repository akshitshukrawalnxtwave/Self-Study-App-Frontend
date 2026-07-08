import { useState, type FormEvent } from 'react';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

type NewSessionModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string, topicSlug: string) => Promise<void>;
};

export function NewSessionModal({ open, onClose, onCreate }: NewSessionModalProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreate(title.trim(), slugify(title));
      setTitle('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal__title">New session</h2>
        <p className="modal__description">
          Enter a topic to start learning. The teacher will chat with you and create lessons as you go.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="modal__label" htmlFor="session-title">
            Topic
          </label>
          <input
            id="session-title"
            className="modal__input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fluid mechanics"
            autoFocus
          />
          {error && <p className="modal__error">{error}</p>}
          <div className="modal__actions">
            <button type="button" className="modal__button modal__button--secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="modal__button modal__button--primary"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? 'Creating…' : 'Start session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
