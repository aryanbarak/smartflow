import type { AgentReasoningTransport } from './llmReasoningService'

export type AgentReasoningMode =
  | 'stateful-chat'
  | 'local-real-worker'
  | 'deterministic-browser-stub'

export interface AgentReasoningTransportConfig {
  mode: AgentReasoningMode
  endpoint?: string
  transport: AgentReasoningTransport
  proposalSource: 'real-agent-worker' | 'local-real-worker' | 'deterministic-browser-stub'
}

type ReasoningEnv = Record<string, string | boolean | undefined>

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, '')
}

function isLoopbackWorkerUrl(value: string) {
  try {
    const url = new URL(value)
    return (
      url.protocol === 'http:' &&
      (url.hostname === '127.0.0.1' || url.hostname === 'localhost' || url.hostname === '[::1]') &&
      !url.username &&
      !url.password &&
      (!url.pathname || url.pathname === '/') &&
      !url.search &&
      !url.hash
    )
  } catch {
    return false
  }
}

export function resolveAgentReasoningTransport(
  env: ReasoningEnv,
): AgentReasoningTransportConfig {
  const rawMode = String(env.VITE_AGENT_REASONING_MODE || 'stateful-chat').trim()

  if (rawMode === 'stateful-chat') {
    const workerUrl = normalizeBaseUrl(String(env.VITE_AGENT_WORKER_URL || ''))
    return {
      mode: 'stateful-chat',
      endpoint: workerUrl ? `${workerUrl}/chat` : undefined,
      transport: 'stateful-chat',
      proposalSource: 'real-agent-worker',
    }
  }

  if (rawMode === 'local-real-worker') {
    const workerUrl = normalizeBaseUrl(String(env.VITE_AGENT_REASONING_WORKER_URL || ''))
    if (!workerUrl) {
      throw new Error('Local real-worker mode requires VITE_AGENT_REASONING_WORKER_URL.')
    }
    if (!isLoopbackWorkerUrl(workerUrl)) {
      throw new Error('Local real-worker mode requires a credential-free loopback HTTP URL.')
    }
    return {
      mode: 'local-real-worker',
      endpoint: `${workerUrl}/agent/reason`,
      transport: 'structured-reasoning',
      proposalSource: 'local-real-worker',
    }
  }

  if (rawMode === 'deterministic-browser-stub') {
    if (env.DEV !== true) {
      throw new Error('Deterministic browser-stub mode is available only in development.')
    }
    const workerUrl = normalizeBaseUrl(String(env.VITE_AGENT_REASONING_WORKER_URL || ''))
    if (!workerUrl || !isLoopbackWorkerUrl(workerUrl)) {
      throw new Error('Deterministic browser-stub mode requires an explicit loopback worker URL.')
    }
    return {
      mode: 'deterministic-browser-stub',
      endpoint: `${workerUrl}/agent/reason`,
      transport: 'structured-reasoning',
      proposalSource: 'deterministic-browser-stub',
    }
  }

  throw new Error(`Unsupported agent reasoning mode: ${rawMode}`)
}
