import './reset.css'
import './app.css'
import App from './App.svelte'

const app = new App({
  target: document.getElementById('app'),
})

export default app

//[V] - doesn't update well
//[V] - live refresh doesn't work
//[V] - update id doesn't work

//[ ] - add focus indication for icon button (for moving to it with tab)
//[ ] - tables for one to many relations - actions, don't stick to the right

//[ ] - support compound id (order details)
//[ ] - relation from product to supplier one to many, did not present in the erd
//[ ] - focus indication for buttons
//[ ] - support where on relations (select from table of tables etc....)
//[x] - store erd positions
//[ ] - support more complex relations
//[ ] - support compound id for admin and erd
//[ ] - support id column
//[ ] - add loading indication

//[ ] - serialize find options to uri
//[ ] - support checkbox :)
//[ ] - respect allow update for column
//[ ] - respect api update / delete /insert ruiles
//[x] - add json editor

// JYC added
// [x] Schema
// [x] add erd change to have the link on the good side!
// [ ] filter enter should apply the filter
// [ ] disable input (only p ?) when readonly?
// [ ] show/hide columns (global & per entity) in local storage + a reset button
// [ ] reset local storage? $LSContext (TODO Ermin to find a place in the UI?) Maybe botton left could be Diagram | Options (Options is a dialog?)

// next
// [ ] AI feature! I select a few entities / fields... And it's generates a prompt to ask about fragemnt SQL & co. (with link to doc? or copy of doc?)
