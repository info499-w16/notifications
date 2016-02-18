export class EnvMissing extends Error {
  constructor (env) {
    const msg = 'Failed to load required environment variable: ' + env
    super(msg)
  }
}

export class MissingParam extends Error {
	constructor (name) {
		super('Missing required parameter: ' + name)
	}
}
