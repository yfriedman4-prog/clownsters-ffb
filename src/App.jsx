import seasonData from './data/2025.json'
import matchupData from './data/2025-matchups.json'
import { calculateStandings } from './utils/standings'

function App() {
  const standings = calculateStandings(seasonData, matchupData)

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial' }}>
      <h1>🏈 Clownsters FFB</h1>
      <h2>2025 Standings Test</h2>

      <table
        style={{
          borderCollapse: 'collapse',
          width: '800px',
          maxWidth: '100%',
        }}
      >
        <thead>
          <tr>
            <th>Rank</th>
            <th>Team</th>
            <th>Record</th>
            <th>PF</th>
            <th>PA</th>
            <th>All-Play</th>
<th>Expected Wins</th>
          </tr>
        </thead>

        <tbody>
          {standings.map((team, index) => (
            <tr key={team.team}>
              <td>{index + 1}</td>
              <td>{team.team}</td>
              <td>
                {team.wins}-{team.losses}
                {team.ties > 0 ? `-${team.ties}` : ''}
              </td>
              <td>{team.pointsFor.toFixed(2)}</td>
              <td>{team.pointsAgainst.toFixed(2)}</td>
              <td>
  {team.allPlayWins}-{team.allPlayLosses}
</td>

<td>
  {(team.allPlayWins / 11).toFixed(1)}
</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App