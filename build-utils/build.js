import child from 'child_process'
import { build, getEnv } from './index.js'

const env = getEnv()
const BUILD_PATH = env.BUILD_PATH || 'main.tsp'

build(BUILD_PATH, {
  env,
}).then(() => {
  const tsp = child.exec('tsp compile .')
  tsp.stdout.pipe(process.stdout)
  tsp.stderr.pipe(process.stderr)
})
