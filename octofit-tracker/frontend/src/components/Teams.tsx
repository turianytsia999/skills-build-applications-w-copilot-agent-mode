import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = {
  name: string;
  mascot?: string;
  members: string[];
};

type TeamResponse = {
  teams: Team[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    getJson<TeamResponse>('/api/teams')
      .then(({ teams: responseTeams }) => {
        if (isCurrent) setTeams(responseTeams);
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
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {error ? (
          <p role="alert">Unable to load teams.</p>
        ) : teams === null ? (
          <p role="status">Loading teams...</p>
        ) : teams.length === 0 ? (
          <p>No teams yet.</p>
        ) : (
          <ul className="list-group list-group-flush">
            {teams.map((team, index) => (
              <li className="list-group-item" key={`${team.name}-${index}`}>
                <h3 className="h5">{team.name}</h3>
                {team.mascot && <p>Mascot: {team.mascot}</p>}
                <p className="mb-0">Members: {team.members.length ? team.members.join(', ') : 'None yet'}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
