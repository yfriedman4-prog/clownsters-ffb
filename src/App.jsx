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
    width: '1100px',
    maxWidth: '100%',
  }}
>
  <thead>
    <tr>
      <th>Rank</th>
      <th>Team</th>
      <th>Record</th>
      <th>PF</th>
      <th>Avg</th>
      <th>High</th>
      <th>Low</th>
      <th>Diff</th>
      <th>All-Play</th>
      <th>xW</th>
      <th>Luck</th>
      <th>SOS</th>
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

        <td>{team.averagePF.toFixed(1)}</td>

        <td>{team.highScore.toFixed(1)}</td>

        <td>{team.lowScore.toFixed(1)}</td>

        <td>
          {team.pointDifferential > 0 ? '+' : ''}
          {team.pointDifferential.toFixed(1)}
        </td>

        <td>
          {team.allPlayWins}-{team.allPlayLosses}
        </td>

        <td>{team.expectedWins.toFixed(1)}</td>

        <td>
          {team.luck > 0 ? '+' : ''}
          {team.luck.toFixed(1)}
        </td>

        <td>{team.strengthOfSchedule.toFixed(1)}</td>
      </tr>
    ))}
  </tbody>
</table>
    </div>
  )
}

export default App