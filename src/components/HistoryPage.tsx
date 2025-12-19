import { ArrowLeft } from 'lucide-react';
import logoUrl from '../assets/unscramm-icon.png';
import type { HistoryItem } from '../hooks/useHistory';

function formatDay(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export interface HistoryPageProps {
  items: HistoryItem[];
  onBack: () => void;
}

export function HistoryPage({ items, onBack }: HistoryPageProps) {
  const groups = new Map<string, HistoryItem[]>();
  for (const item of items) {
    const day = formatDay(item.timestamp);
    const existing = groups.get(day);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(day, [item]);
    }
  }

  return (
    <div className="stage-settings">
      <img src={logoUrl} alt="Unscramm" className="logo-top-left" />
      <button type="button" className="back-button" onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={1.5} />
        Back
      </button>
      <div className="settings-title">History</div>

      {items.length === 0 ? (
        <div className="settings-hint">No history yet.</div>
      ) : (
        <div className="history-list">
          {Array.from(groups.entries()).map(([day, dayItems]) => (
            <div key={day} className="history-day">
              <div className="history-date">{day}</div>
              <div className="history-words">
                {dayItems.map((item) => (
                  <div key={item.id} className="history-word">
                    {item.word}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
