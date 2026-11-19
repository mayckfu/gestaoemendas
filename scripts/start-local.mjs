import { spawn } from 'node:child_process'

const children = [
  spawn(process.execPath, ['local-services/sismob-agent.mjs'], { stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit' }),
]

let stopping = false
function stop(exitCode = 0) {
  if (stopping) return
  stopping = true
  for (const child of children) {
    if (!child.killed) child.kill()
  }
  setTimeout(() => process.exit(exitCode), 250)
}

for (const child of children) {
  child.on('exit', (code) => {
    if (!stopping && code && code !== 0) stop(code)
  })
}

process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))
