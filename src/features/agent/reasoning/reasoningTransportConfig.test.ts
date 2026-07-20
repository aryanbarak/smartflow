import { describe, expect, it } from 'vitest'
import { resolveAgentReasoningTransport } from './reasoningTransportConfig'

describe('resolveAgentReasoningTransport', () => {
  it('preserves the existing stateful chat transport by default', () => {
    expect(resolveAgentReasoningTransport({
      VITE_AGENT_WORKER_URL: 'https://worker.example.test/',
    })).toEqual({
      mode: 'stateful-chat',
      endpoint: 'https://worker.example.test/chat',
      transport: 'stateful-chat',
      proposalSource: 'real-agent-worker',
    })
  })

  it('selects the explicit local structured endpoint', () => {
    expect(resolveAgentReasoningTransport({
      VITE_AGENT_REASONING_MODE: 'local-real-worker',
      VITE_AGENT_REASONING_WORKER_URL: 'http://127.0.0.1:8787',
    })).toEqual({
      mode: 'local-real-worker',
      endpoint: 'http://127.0.0.1:8787/agent/reason',
      transport: 'structured-reasoning',
      proposalSource: 'local-real-worker',
    })
  })

  it.each([
    ['missing URL', ''],
    ['production URL', 'https://dailyflow-agent-worker.example.workers.dev'],
    ['deceptive hostname', 'http://localhost.example.com:8787'],
    ['embedded username', 'http://user@127.0.0.1:8787'],
    ['path', 'http://127.0.0.1:8787/agent'],
    ['query', 'http://127.0.0.1:8787?mode=local'],
  ])('fails closed for local-real-worker with %s', (_label, url) => {
    expect(() => resolveAgentReasoningTransport({
      VITE_AGENT_REASONING_MODE: 'local-real-worker',
      VITE_AGENT_REASONING_WORKER_URL: url,
      VITE_AGENT_WORKER_URL: 'https://deployed.example.test',
    })).toThrow(/local|loopback/i)
  })

  it('does not fall back to the deployed worker after local validation fails', () => {
    expect(() => resolveAgentReasoningTransport({
      VITE_AGENT_REASONING_MODE: 'local-real-worker',
      VITE_AGENT_WORKER_URL: 'https://deployed.example.test',
    })).toThrow()
  })

  it('keeps deterministic stub mode explicit and development-only', () => {
    expect(resolveAgentReasoningTransport({
      DEV: true,
      VITE_AGENT_REASONING_MODE: 'deterministic-browser-stub',
      VITE_AGENT_REASONING_WORKER_URL: 'http://localhost:8787',
    }).proposalSource).toBe('deterministic-browser-stub')

    expect(() => resolveAgentReasoningTransport({
      DEV: false,
      VITE_AGENT_REASONING_MODE: 'deterministic-browser-stub',
      VITE_AGENT_REASONING_WORKER_URL: 'http://localhost:8787',
    })).toThrow(/development/)
  })

  it('rejects unknown modes', () => {
    expect(() => resolveAgentReasoningTransport({
      VITE_AGENT_REASONING_MODE: 'automatic-fallback',
    })).toThrow(/Unsupported/)
  })
})
