import { useState, type FormEvent } from 'react';
import type { Workspace } from '../../types/api';

type WorkspaceSwitcherProps = {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onSelect: (id: string) => void;
  onNewSkill: () => void;
  isLoading?: boolean;
};

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
  onSelect,
  onNewSkill,
  isLoading,
}: WorkspaceSwitcherProps) {
  return (
    <div className="workspace-switcher">
      <div className="workspace-switcher__row">
        <label className="workspace-switcher__label" htmlFor="workspace-select">
          Skill
        </label>
        <button type="button" className="workspace-switcher__new" onClick={onNewSkill}>
          + New skill
        </button>
      </div>
      <select
        id="workspace-select"
        className="workspace-switcher__select"
        value={activeWorkspaceId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        disabled={isLoading || workspaces.length === 0}
      >
        {workspaces.length === 0 ? (
          <option value="">No workspaces</option>
        ) : (
          workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.title}
            </option>
          ))
        )}
      </select>
    </div>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

type NewSkillModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string, topicSlug: string) => Promise<void>;
};

export function NewSkillModal({ open, onClose, onCreate }: NewSkillModalProps) {
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
      setError(err instanceof Error ? err.message : 'Failed to create skill');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal__title">New skill</h2>
        <p className="modal__description">
          Enter a topic to start a new learning workspace. The Self Study AI Assistant will interview you for your mission first.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="modal__label" htmlFor="skill-title">
            Topic
          </label>
          <input
            id="skill-title"
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
              {isSubmitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
