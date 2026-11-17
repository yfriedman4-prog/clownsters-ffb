// Existing page identifiers; nested history pages remain reachable through Managers/Overview.
export const navigationPages = {
  current: [['dashboard','Dashboard'],['standings','Standings'],['matchups','Matchups'],['teams','Teams'],['analytics','Analytics'],['playoffs','Playoff Scenarios'],['midseason','Midseason Report']],
  history: [['overview','Overview'],['history','Seasons'],['managers','Managers'],['records','Records'],['scoring-analytics','Scoring Analytics'],['era-comparisons','Era Comparisons']],
}
export function validNavigationPage(mode,page,saved={}) {
  const allowed=(navigationPages[mode]??[]).map(([id])=>id)
  if (mode==='history') allowed.push('manager-profile','rivalry-detail')
  if (!allowed.includes(page)) return false
  if (['manager-profile','rivalry-detail'].includes(page) && !saved.selectedManagerId) return false
  if (page==='rivalry-detail' && !saved.rivalryOpponentId) return false
  return true
}
export function restoreSectionPages(saved) {
  const result={current:'dashboard',history:'overview'}
  for (const mode of ['current','history']) {
    const page=saved?.sectionPages?.[mode]
    if (validNavigationPage(mode,page,saved)) result[mode]=page
  }
  if (saved && validNavigationPage(saved.mode,saved.page,saved)) result[saved.mode]=saved.page
  return result
}
