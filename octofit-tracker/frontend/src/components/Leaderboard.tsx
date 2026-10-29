import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[];
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    getJson<LeaderboardResponse>('/api/leaderboard')
      .then(({ leaderboard: responseLeaderboard }) => {
        if (isCurrent) setLeaderboard(responseLeaderboard);
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
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {error ? (
          <p role="alert">Unable to load leaderboard.</p>
        ) : leaderboard === null ? (
          <p role="status">Loading leaderboard...</p>
        ) : leaderboard.length === 0 ? (
          <p>No leaderboard scores yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr><th scope="col">Rank</th><th scope="col">Team</th><th scope="col">Points</th></tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={`${entry.rank}-${entry.teamName}`}>
                    <th scope="row">{entry.rank}</th>
                    <td>{entry.teamName}</td>
                    <td>{entry.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
