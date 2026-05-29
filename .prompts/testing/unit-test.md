# Unit Test — dailyFlow

Write a Vitest unit test for the following code.

## Setup
- Test runner: Vitest
- Config: vite.config.ts
- Run tests: `npm run test`
- Test files: `src/**/*.test.ts` or `src/**/*.spec.ts`

## Service Function Test Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/integrations/supabase/client'

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}))

describe('featureService', () => {
  beforeEach(() => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    } as any)
  })

  it('should return empty array when no data', async () => {
    const result = await featureService.getAll()
    expect(result).toEqual([])
  })

  it('should throw when not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null }, error: null,
    } as any)
    await expect(featureService.getAll()).rejects.toThrow('Not authenticated')
  })
})
```

## Utility Function Test Pattern

```typescript
import { describe, it, expect } from 'vitest'
import { yourFunction } from '@/lib/yourModule'

describe('yourFunction', () => {
  it('should handle normal input', () => {
    expect(yourFunction('input')).toBe('expected')
  })

  it('should handle edge case', () => {
    expect(yourFunction('')).toBe('')
  })
})
```

## SM-2 / Pure Logic Test Pattern

```typescript
import { describe, it, expect } from 'vitest'
import { sm2 } from '@/features/flashcards/spacedRepetition'

describe('sm2', () => {
  it('should reset interval on rating < 2', () => {
    const result = sm2(2.5, 6, 0)
    expect(result.interval).toBe(1)
  })

  it('should increase ease on easy rating', () => {
    const result = sm2(2.5, 1, 3)
    expect(result.ease).toBeGreaterThan(2.5)
  })
})
```

## Code to Test:
[PASTE CODE HERE]

## What to Test:
[DESCRIBE WHAT BEHAVIOR TO VERIFY]
