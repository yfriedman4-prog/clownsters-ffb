import test from 'node:test'
import assert from 'node:assert/strict'
import {navigationPages,restoreSectionPages,validNavigationPage} from '../src/utils/navigation.js'
test('existing identifiers and display order are preserved',()=>{
 assert.deepEqual(navigationPages.current.map(([id])=>id),['dashboard','standings','matchups','teams','analytics','playoffs','midseason'])
 assert.deepEqual(navigationPages.history.map(([id])=>id),['overview','history','managers','records','scoring-analytics','era-comparisons'])
 assert.ok(validNavigationPage('current','midseason'))
 assert.ok(!validNavigationPage('current','records'))
})
test('legacy saved navigation restores current page and safe defaults for the other section',()=>{
 assert.deepEqual(restoreSectionPages({mode:'current',page:'playoffs'}),{current:'playoffs',history:'overview'})
 assert.deepEqual(restoreSectionPages(null),{current:'dashboard',history:'overview'})
})
test('independent section pages survive refresh, nested pages require identities and invalid saved state is ignored',()=>{
 const saved={mode:'history',page:'records',sectionPages:{current:'midseason',history:'overview'}}
 assert.deepEqual(restoreSectionPages(saved),{current:'midseason',history:'records'})
 assert.deepEqual(restoreSectionPages({sectionPages:{current:'unknown',history:'manager-profile'}}),{current:'dashboard',history:'overview'})
 assert.ok(validNavigationPage('history','rivalry-detail',{selectedManagerId:'yaron',rivalryOpponentId:'jeff'}))
 assert.ok(!validNavigationPage('history','rivalry-detail',{selectedManagerId:'yaron'}))
})
