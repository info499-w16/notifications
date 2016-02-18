export class EnvMissing extends Error {
  constructor (env) {
    const msg = 'Failed to load required environment variable: ' + env
    super(msg)
  }
}