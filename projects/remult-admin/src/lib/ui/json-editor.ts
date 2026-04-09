// Minimal replacement for the subset of `svelte-jsoneditor` we actually use:
// a single modal `JSONEditor` component that lets the user edit a JSON value
// and reports changes via an `onChange` callback. Backed directly by
// CodeMirror 6 core + @codemirror/lang-json.
//
// API-compatible with svelte-jsoneditor for the `{ content, onChange }` shape
// so replacing the import is a one-line change in call sites.
export { default as JSONEditor } from './JsonEditor.svelte'

export type Content = { json: any }
