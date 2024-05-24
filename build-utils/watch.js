import fs from 'fs'
import child from 'child_process'
import process from 'process'
import { build, debounce, getEnv } from './index.js'

const env = getEnv()

function validate(filename) {
  if (filename && filename.endsWith('.tsp') && filename !== 'main.tsp') {
    console.log('File changed:', filename, 'recompiling...')
    return true
  }

  if (filename && filename.endsWith('.env')) {
    console.log('Env file changed recompiling...')
    Object.assign(env, getEnv())
    return true
  }

  return false
}

let tspProcess = null
function compile() {
  tspProcess?.kill()
  tspProcess = child.exec('tsp compile .')
  tspProcess.stdout.pipe(process.stdout)
  tspProcess.stderr.pipe(process.stderr)
  tspProcess.on('exit', () => {
    tspProcess = null
  })
}

function runBuild() {
  const buildPath = env.BUILD_PATH || 'main.tsp'
  return build(buildPath, {
    env: getEnv(),
  })
    .then(compile)
    .catch(console.error)
}

function onChanges() {
  runBuild()
}

const debouncedValidate = debounce(validate, 100)
const debouncedOnChanges = debounce(onChanges, 500)

fs.watch('./', { recursive: true }, async (_, filename) => {
  if (await debouncedValidate(filename)) {
    await debouncedOnChanges()
  }
})

runBuild()
