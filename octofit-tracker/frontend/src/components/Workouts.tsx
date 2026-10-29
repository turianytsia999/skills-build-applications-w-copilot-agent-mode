import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  title: string;
  focus: string;
  minutes: number;
  difficulty: string;
  reason: string;
};

type WorkoutResponse = {
  suggestions: WorkoutSuggestion[];
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    getJson<WorkoutResponse>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
      .then(({ suggestions: responseSuggestions }) => {
        if (isCurrent) setSuggestions(responseSuggestions);
      })
      .catch(() => {
        if (isCurrent) setError(true);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {error ? (
          <p role="alert">Unable to load workout suggestions.</p>
        ) : suggestions === null ? (
          <p role="status">Loading workout suggestions...</p>
        ) : suggestions.length === 0 ? (
          <p>No workout suggestions yet.</p>
        ) : (
          <ul className="list-group list-group-flush">
            {suggestions.map((suggestion, index) => (
              <li className="list-group-item" key={`${suggestion.title}-${index}`}>
                <h3 className="h5">{suggestion.title}</h3>
                <p>{suggestion.focus} · {suggestion.minutes} minutes · {suggestion.difficulty}</p>
                <p className="mb-0">{suggestion.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
