import { useEffect,useRef } from 'react'
import { navigationPages } from '../utils/navigation.js'
export default function DashboardNavigation({ mode,page,onModeChange,onPageChange }) {
  const navigation=useRef(null)
  useEffect(()=>{
    const bar=navigation.current,item=bar?.querySelector('[aria-current="page"]')
    if (!bar || !item) return
    const bounds=bar.getBoundingClientRect(),active=item.getBoundingClientRect()
    // Scroll only the navigation rail, never move the page vertically.
    if (active.left<bounds.left) bar.scrollLeft-=bounds.left-active.left
    else if (active.right>bounds.right) bar.scrollLeft+=active.right-bounds.right
  },[mode,page])
  return <>
    <header className="primary-header"><div className="header-brand"><div className="brand">🏈 CLOWNSTERS FFB</div><div className="subtitle">Fantasy Football League</div></div>
      <div className="mode-switcher" role="group" aria-label="League section">{[['current','Current Season'],['history','League History']].map(([id,label])=><button type="button" key={id} className={`mode-button ${mode===id?'active':''}`} aria-pressed={mode===id} onClick={()=>onModeChange(id)}>{label}</button>)}</div>
    </header>
    <nav className="secondary-navigation" aria-label={`${mode==='current'?'Current Season':'League History'} pages`} ref={navigation}>{navigationPages[mode].map(([id,label])=><button type="button" key={id} className={`nav-item ${page===id?'active':''}`} aria-current={page===id?'page':undefined} onClick={()=>onPageChange(id)}>{label}</button>)}</nav>
  </>
}
