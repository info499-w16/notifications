import {EnvMissing} from './errors'

export function loadEnv (envName) {
  const env = process.env[envName]
  if (!env) throw new EnvMissing(envName)

  return env
}
