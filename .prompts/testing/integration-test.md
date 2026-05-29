# Integration Test — dailyFlow

Write an integration test for the following feature.

## Stack
- Vitest + React Testing Library
- Supabase: mocked
- React Query: wrap with QueryClientProvider

## Test Setup

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    </BrowserRouter>
  )
}
```

## What to Test in Integration
- Component renders correct data from hook
- User interaction triggers mutation
- Loading state shown during fetch
- Error state shown on failure
- Toast notification fires on success/error
- Empty state renders when data is []

## Example Test

```typescript
import { vi } from 'vitest'
import * as shoppingHooks from '@/features/shopping/useShoppingList'

vi.mock('@/features/shopping/useShoppingList')

describe('ShoppingList', () => {
  it('shows empty state when list is empty', () => {
    vi.mocked(shoppingHooks.useShoppingList).mockReturnValue({
      data: [], isLoading: false,
    } as any)

    renderWithProviders(<ShoppingList />)
    expect(screen.getByText(/empty/i)).toBeInTheDocument()
  })

  it('shows items when data exists', () => {
    vi.mocked(shoppingHooks.useShoppingList).mockReturnValue({
      data: [{ id: '1', name: 'Milk', checked: false, category: 'Dairy' }],
      isLoading: false,
    } as any)

    renderWithProviders(<ShoppingList />)
    expect(screen.getByText('Milk')).toBeInTheDocument()
  })
})
```

## Component/Feature to Test:
[PASTE COMPONENT HERE]

## Scenarios to Cover:
[LIST THE USER FLOWS TO TEST]
