import './reset.css'
import './app.css'
import App from './App.svelte'
import { mount } from "svelte";

const app = mount(App, {
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
// [x] - nice select
// [x] - add erd change to have the link on the good side!
// [x] - filter popup: enter should apply the filter (tabs are working correctly now)
// [x] - disable input when readonly
// [x] - reset local storage?
// [x] - It seems like there is a small bug in the admin UI. if a field has includeInApi that is a changing expression for some rows, the entire column disappear. https://discord.com/channels/975754286384418847/1258664319852482701/1259596160478347465
// [x] - better management of new item + (highlight in green, -, cancel, ...)

// next
// [x] - Make actions smoother (no jumping)
// [x] - Small thing, I get SvelteKitError: Not found: /vite.svg
// [?] - support checkbox ? (today i set a select with 2 options... maybe good enough?)
// [ ] - support more complex relations
// [ ] - support compound id (order details)
// [ ] - support compound id for admin and erd
// [ ] - remult-admin doesn't handle primary key that has compound column
// [ ] - support id column
// [x] - when making a change and canceling - the changed value still appears
// [ ] - serialize find options to uri
// [ ] - respect api update / delete / insert / forbidden rules
// [ ] - allow conditional admin - like allowed
// [ ] - understand the to many relation for the admin, based on the to one
// [ ] - relation from order details to order gave a compound id info - and it is not true - same for the relation to product
// [ ] - new row when there are relations, looks funny (see product)
// [ ] - need a way to extract the fields from the relation - for generating relation based sql
// [x] - the + row in the bottom should extend to the full width (solved another way)
// [?] - remult-admin didn't show a update for a table with a uniqua that is numeric
// [ ] - add a standardized component for displaying success/error/info messages (toast?)
// [ ] - standardize dialog (component with header/actions)
// [ ] - support create with default values
// [ ] - Manage Date only (with a different type than Date? (Task entity has the 2 cases))
// [ ] - Search on entities
// [ ] - Diagram => Show / Hide... (group)
// [ ] - show/hide columns (global & per entity) in local storage + a reset button

// NEXT ?
// [ ] - AI feature! I select a few entities / fields... And it's generates a prompt to ask about fragemnt SQL & co. (with link to doc? or copy of doc?)
