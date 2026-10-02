import path from 'node:path'
import { setupGlobal } from 'sv/testing'

const TEST_DIR = path.resolve(import.meta.dirname, '..', '..', '.test-output')

export default setupGlobal({ TEST_DIR })
