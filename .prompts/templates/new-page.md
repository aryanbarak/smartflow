# New Page Template — dailyFlow

Create a new page for the dailyFlow app.

## Page Name: [PAGE NAME]
## Route: /[route]
## Description: [WHAT IT SHOWS]

## Checklist

### File to create
`src/pages/[Name]Page.tsx`

### Register in App.tsx
```tsx
import [Name]Page from './pages/[Name]Page';
// Inside ProtectedRoute:
<Route path="/[route]" element={<[Name]Page />} />
```

### Add to navigation
In `src/components/layout/Sidebar.tsx` and `src/components/layout/MobileNav.tsx`:
```tsx
{ icon: SomeIcon, key: 'nav_[name]', path: '/[route]' }
```

### Add translation keys to `src/i18n/index.ts`
```typescript
nav_[name]: '[Page Name]',  // in en, de, fa
[name]_title: '[Page Name]',
```

## Page Structure

```tsx
import { useT } from '@/i18n';

export default function [Name]Page() {
  const { t } = useT();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <SomeIcon className="text-primary" size={22} />
            {t('[name]_title')}
          </h1>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center text-muted-foreground py-12 text-sm">{t('loading')}</div>
      )}

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <div className="text-center text-muted-foreground py-16">
          <SomeIcon size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">{t('[name]_no_items')}</p>
        </div>
      )}

      {/* Content */}
    </div>
  );
}
```
