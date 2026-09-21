import childProcess from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { rename } from 'node:fs/promises'
import { resolve } from 'node:path'

const RENDER_FORMATS = new Set(['svg', 'png'])

const runGraphviz = (args, signal, captureVersion = false) => {
  signal.throwIfAborted()

  return new Promise((resolve, reject) => {
    const child = childProcess.spawn('dot', args, {
      stdio: ['ignore', captureVersion ? 'pipe' : 'ignore', 'pipe']
    })
    let stdout = ''
    let stderr = ''
    let childError

    const abort = () => child.kill('SIGKILL')
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) abort()

    child.on('error', error => {
      childError = error
    })
    if (captureVersion) {
      child.stdout.setEncoding('utf8')
      child.stdout.on('data', data => {
        stdout += data
      })
    }
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', data => {
      stderr += data
    })

    // close, rather than exit, also waits for the child's streams before cleanup.
    child.on('close', (code, killedBy) => {
      signal.removeEventListener('abort', abort)
      if (signal.aborted) return reject(signal.reason)
      if (childError) return reject(childError)
      if (code !== 0) {
        const status = killedBy ? `signal ${killedBy}` : `code ${code}`
        const error = new Error(`Graphviz exited with ${status}${stderr ? `: ${stderr.trim()}` : ''}`)
        error.code = code
        error.signal = killedBy
        error.stderr = stderr
        return reject(error)
      }
      resolve(captureVersion ? `${stdout}\0${stderr}` : undefined)
    })
  })
}

const initGraphviz = ({ storage }) => {
  const root = resolve(storage.config.path)
  const inFlight = new Map()
  const active = new Set()
  let version
  let versionJob
  let closed = false
  let closing

  const createJob = (run, settled) => {
    const job = { controller: new AbortController(), consumers: 0, done: false }
    active.add(job)
    job.promise = Promise.resolve()
      .then(() => {
        job.controller.signal.throwIfAborted()
        return run(job.controller.signal)
      })
      .finally(() => {
        job.done = true
        active.delete(job)
        settled(job)
      })
    return job
  }

  const consume = (job, signal) => {
    signal?.throwIfAborted()
    job.consumers += 1

    return new Promise((resolve, reject) => {
      let finished = false
      const finish = (callback, value) => {
        if (finished) return
        finished = true
        signal?.removeEventListener('abort', abort)
        job.consumers -= 1
        if (job.consumers === 0 && !job.done) job.controller.abort()
        callback(value)
      }
      const abort = () => finish(reject, signal.reason)
      signal?.addEventListener('abort', abort, { once: true })
      job.promise.then(value => finish(resolve, value), error => finish(reject, error))
    })
  }

  const getVersion = async signal => {
    signal.throwIfAborted()
    if (version) return version
    if (!versionJob || versionJob.controller.signal.aborted) {
      versionJob = createJob(
        async signal => {
          const output = await runGraphviz(['-V'], signal, true)
          signal.throwIfAborted()
          version = createHash('sha256').update(output).digest('hex')
          return version
        },
        job => {
          if (versionJob === job) versionJob = undefined
        }
      )
    }
    return consume(versionJob, signal)
  }

  const layout = async (source, format, key, signal) => {
    const graphvizVersion = await getVersion(signal)
    signal.throwIfAborted()
    const artifact = `dot/graphviz-v1-${graphvizVersion}-${key}`
    const target = resolve(root, artifact)
    if (await storage.exists(artifact)) {
      signal.throwIfAborted()
      return target
    }

    // each layout owns its input too: svg and png can run and clean up independently.
    const temporary = `dot/graphviz-v1-${randomUUID()}`
    const input = `${temporary}.dot.tmp`
    const output = `${temporary}.${format}.tmp`
    try {
      signal.throwIfAborted()
      await storage.write(input, source)
      signal.throwIfAborted()
      await runGraphviz([`-T${format}`, resolve(root, input), '-o', resolve(root, output)], signal)
      signal.throwIfAborted()
      await rename(resolve(root, output), target)
      return target
    } finally {
      const cleanup = await Promise.allSettled([storage.remove(input), storage.remove(output)])
      for (const result of cleanup) {
        if (result.status === 'rejected') throw result.reason
      }
    }
  }

  const render = async (source, format, { signal } = {}) => {
    if (!RENDER_FORMATS.has(format)) throw new Error(`Unsupported visualization format: ${format}`)
    signal?.throwIfAborted()
    if (closed) throw new Error('Graphviz provider is closed')

    const key = `${createHash('sha256').update(source).digest('hex')}.${format}`
    let job = inFlight.get(key)
    if (!job || job.controller.signal.aborted) {
      job = createJob(
        signal => layout(source, format, key, signal),
        job => {
          if (inFlight.get(key) === job) inFlight.delete(key)
        }
      )
      inFlight.set(key, job)
    }
    return consume(job, signal)
  }

  const close = () => {
    if (!closing) {
      closed = true
      for (const job of active) job.controller.abort()
      closing = Promise.allSettled([...active].map(job => job.promise)).then(() => {})
    }
    return closing
  }

  return { render, close }
}

export { initGraphviz }
