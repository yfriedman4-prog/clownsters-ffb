import { getManagerProfile } from '../../utils/managerAnalytics'

function ManagerProfile({
  managerId,
  historicalSeasons,
  getManagerName,
  onBack,
}) {
  const profile = getManagerProfile(
    historicalSeasons,
    managerId
  )

  if (!profile) {
    return (
      <section className="panel">
        <p>Manager profile not found.</p>
        <button type="button" onClick={onBack}>
          Back to Overview
        </button>
      </section>
    )
  }

  const { career, seasons } = profile

  const firstSeason = Math.min(
    ...seasons.map((season) => season.season)
  )

  const lastSeason = Math.max(
    ...seasons.map((season) => season.season)
  )

  const record = `${career.wins}-${career.losses}${
    career.ties > 0 ? `-${career.ties}` : ''
  }`

  return (
    <section className="panel history-manager-profile">
      <button
        type="button"
        className="history-profile-back"
        onClick={onBack}
      >
        ← Back to Overview
      </button>

      <div className="page-header history-profile-header">
        <div className="eyebrow">MANAGER PROFILE</div>

        <h1>{getManagerName(managerId)}</h1>

        <p>
          {career.seasons} seasons · {firstSeason}–{lastSeason}
        </p>
      </div>

      <div className="history-profile-achievements">
        <div className="history-profile-achievement">
          <span>CHAMPIONSHIPS</span>
          <strong>{career.championships}</strong>
        </div>

        <div className="history-profile-achievement">
          <span>PLAYOFFS</span>
          <strong>
            {career.playoffAppearances}/{career.seasons}
          </strong>
          <small>
            {career.playoffPercentage.toFixed(1)}%
          </small>
        </div>

        <div className="history-profile-achievement">
          <span>PODIUMS</span>
          <strong>{career.podiums}</strong>
        </div>

        <div className="history-profile-achievement">
          <span>WIN %</span>
          <strong>
            {career.winPercentage.toFixed(1)}%
          </strong>
        </div>
      </div>

      <div className="history-profile-career">
        <div className="history-profile-section-heading">
          <div>
            <div className="eyebrow">CAREER</div>
            <h2>Career Statistics</h2>
          </div>
        </div>

        <div className="history-profile-career-grid">
          <div>
            <span>RECORD</span>
            <strong>{record}</strong>
          </div>

          <div>
            <span>SEASONS</span>
            <strong>{career.seasons}</strong>
          </div>

          <div>
            <span>PPG</span>
            <strong>
              {career.pointsPerGame.toFixed(1)}
            </strong>
          </div>

          <div>
            <span>POINTS FOR</span>
            <strong>
              {career.pointsFor.toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </strong>
          </div>

          <div>
            <span>POINTS AGAINST</span>
            <strong>
              {career.pointsAgainst.toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </strong>
          </div>

          <div>
            <span>RUNNER-UPS</span>
            <strong>{career.runnerUps}</strong>
          </div>
        </div>
      </div>
      <div className="history-profile-eras">
  <div className="history-profile-section-heading history-profile-era-heading">
    <div>
      <div className="eyebrow">ERA PERFORMANCE</div>
      <h2>Performance by Era</h2>
    </div>
  </div>

  <div className="history-profile-era-grid">
    {Object.values(profile.eras).map((era) => {
      const eraRecord = `${era.wins}-${era.losses}${
        era.ties > 0 ? `-${era.ties}` : ''
      }`

      return (
        <div
          className="history-profile-era-card"
          key={era.label}
        >
          <div className="history-profile-era-top">
            <div>
              <span className="history-profile-era-name">
                {era.label}
              </span>

              <small>
                {era.startSeason}–{era.endSeason}
              </small>
            </div>

            <strong>
              {era.seasons} {era.seasons === 1 ? 'season' : 'seasons'}
            </strong>
          </div>

          {era.seasons > 0 ? (
            <>
              <div className="history-profile-era-record">
                <strong>{eraRecord}</strong>
                <span>
                  {era.winPercentage.toFixed(1)}% win rate
                </span>
              </div>

              <div className="history-profile-era-stats">
                <div>
                  <span>PLAYOFFS</span>
                  <strong>
                    {era.playoffAppearances}/{era.seasons}
                  </strong>
                </div>

                <div>
                  <span>TITLES</span>
                  <strong>{era.championships}</strong>
                </div>

                <div>
                  <span>PODIUMS</span>
                  <strong>{era.podiums}</strong>
                </div>
              </div>
            </>
          ) : (
            <div className="history-profile-era-empty">
              Did not participate
            </div>
          )}
        </div>
      )
    })}
  </div>
</div>
<div className="history-profile-seasons">
  <div className="history-profile-section-heading">
    <div>
      <div className="eyebrow">SEASON HISTORY</div>
      <h2>Season-by-Season</h2>
    </div>
  </div>

  <div className="history-profile-season-table-wrap">
    <div className="history-profile-season-table">
      <div className="history-profile-season-row history-profile-season-heading">
        <div>SEASON</div>
        <div>TEAM</div>
        <div>RECORD</div>
        <div>WIN %</div>
        <div>PF</div>
        <div>PPG</div>
        <div>PLAYOFFS</div>
        <div>FINISH</div>
      </div>

      {profile.seasons.map((season) => {
        const record = `${season.wins}-${season.losses}${
          season.ties > 0 ? `-${season.ties}` : ''
        }`

        let finishLabel = '—'
        let finishClass = ''

        if (season.finish === 1) {
          finishLabel = 'Champion'
          finishClass = 'champion'
        } else if (season.finish === 2) {
          finishLabel = 'Runner-Up'
          finishClass = 'runner-up'
        } else if (season.finish === 3) {
          finishLabel = '3rd'
          finishClass = 'third'
        }

        return (
          <div
            className="history-profile-season-row"
            key={season.season}
          >
            <div className="history-profile-season-year">
              {season.season}
            </div>

            <div className="history-profile-season-team">
              {season.teamName ?? '—'}
            </div>

            <div>{record}</div>

            <div>
              {season.winPercentage.toFixed(1)}%
            </div>

            <div>
              {season.pointsFor.toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </div>

            <div>
              {season.pointsPerGame.toFixed(1)}
            </div>

            <div
              className={
                season.madePlayoffs
                  ? 'history-profile-playoff-yes'
                  : 'history-profile-playoff-no'
              }
            >
              {season.madePlayoffs ? 'Yes' : '—'}
            </div>

            <div
              className={`history-profile-finish ${finishClass}`}
            >
              {finishLabel}
            </div>
          </div>
        )
      })}
    </div>
  </div>
</div>
    </section>
  )
}

export default ManagerProfile