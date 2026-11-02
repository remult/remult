// Turns on `typedSelect` and `typedInclude` for the specs in this folder only. It's global to a TS
// program, so this folder has its own tsconfig and is excluded from tsconfig.tests.json.
import 'remult'

declare module 'remult' {
  interface RemultTypeConfig {
    typedInclude: true
    typedSelect: true
  }
}
