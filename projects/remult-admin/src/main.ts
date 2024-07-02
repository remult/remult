import './reset.css'
import './app.css'
import App from './App.svelte'

const app = new App({
  target: document.getElementById('app'),
})

export default app

// [x] - doesn't update well
// [x] - live refresh doesn't work
// [x] - update id doesn't work
// [x] - add focus indication for icon button (for moving to it with tab)
// [x] - focus indication for buttons
// [x] - Actions on the right should be always visible
// [x] - tables for one to many relations - actions, don't stick to the right
// [x] - relation from product to supplier one to many, did not present in the erd
// [x] - add loading indication
// [x] - loading toOne relation (🔎)
// [x] - support where on relations (select from table of tables etc....)
// [x] - store erd positions
// [x] - add json editor
// [x] - Schema
// [ ] - nice select
// [x] - add erd change to have the link on the good side!
// [ ] - filter popup: enter should apply the filter
// [x] - disable input when readonly
// [ ] - reset local storage? $LSContext (TODO Ermin to find a place in the UI?) Maybe botton left could be Diagram | Options (Options is a dialog?)

// next
// [?] - Small thing, I get SvelteKitError: Not found: /vite.svg
// [ ] - support checkbox :)
// [ ] - support more complex relations
// [ ] - support compound id (order details)
// [ ] - support compound id for admin and erd
// [ ] - support id column
// [ ] - when making a change and canceling - the changed value still appears
// [ ] - serialize find options to uri
// [ ] - respect api update / delete / insert / forbidden rules
// [ ] - understand the to many relation for the admin, based on the to one
// [ ] - relation from order details to order gave a compound id info - and it is not true - same for the relation to product
// [ ] - new row when there are relations, looks funny (see product)
// [ ] - need a way to extract the fields from the relation - for generating relation based sql
// [ ] - allow conditional admin - like allowed
// [ ] - the + row in the bottom should extend to the full width
// [ ] - remult-admin doesn't handle primary key that has compound column
// [ ] - remult-admin didn't show a update for a table with a uniqua that is numeric

// NEXT ?
// [ ] - show/hide columns (global & per entity) in local storage + a reset button
// [ ] - AI feature! I select a few entities / fields... And it's generates a prompt to ask about fragemnt SQL & co. (with link to doc? or copy of doc?)
