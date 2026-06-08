# Tailwind CSS Patterns

> Based on [Tailwind CSS Official Documentation](https://tailwindcss.com/docs) — v3.4.x

## Configuration

> **Reference**: https://tailwindcss.com/docs/configuration

### `tailwind.config.ts` — Design Tokens

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom design tokens
      colors: {
        brand: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}

export default config
```

> **Rule**: Define design tokens in `tailwind.config.ts`, not as arbitrary values in JSX.

## Utility Composition with `clsx` + `tailwind-merge`

> This project uses `clsx` (v2.1) and `tailwind-merge` (v2.3) for class composition.

### The `cn()` Helper Pattern

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

### Usage in Components

```tsx
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-lg font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2',
        'disabled:pointer-events-none disabled:opacity-50',
        // Variant styles
        {
          'bg-brand-600 text-white hover:bg-brand-700': variant === 'primary',
          'border border-gray-300 bg-white hover:bg-gray-50': variant === 'secondary',
          'hover:bg-gray-100': variant === 'ghost',
        },
        // Size styles
        {
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4 text-sm': size === 'md',
          'h-12 px-6 text-base': size === 'lg',
        },
        // Allow external overrides
        className,
      )}
      {...props}
    />
  )
}
```

> **Reference** (clsx): https://github.com/lukeed/clsx
> **Reference** (tailwind-merge): https://github.com/dcastil/tailwind-merge

## Responsive Design

> **Reference**: https://tailwindcss.com/docs/responsive-design

### Mobile-First Approach

Tailwind uses a **mobile-first** breakpoint system. Unprefixed utilities apply to all screens, prefixed utilities apply at that breakpoint **and above**.

```tsx
<div className="
  grid grid-cols-1        {/* Mobile: 1 column */}
  md:grid-cols-2          {/* Tablet: 2 columns */}
  lg:grid-cols-3          {/* Desktop: 3 columns */}
  gap-4 md:gap-6          {/* Responsive gap */}
">
```

### Breakpoints

| Prefix | Min-Width | Common Device |
|---|---|---|
| `sm:` | 640px | Large phone |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Laptop |
| `xl:` | 1280px | Desktop |
| `2xl:` | 1536px | Large desktop |

## Dark Mode

> **Reference**: https://tailwindcss.com/docs/dark-mode

```typescript
// tailwind.config.ts
const config: Config = {
  darkMode: 'class', // or 'media' for OS preference
  // ...
}
```

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  <h1 className="text-gray-900 dark:text-white">Title</h1>
</div>
```

## Component Patterns

### Card Pattern

```tsx
export function Card({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(
      'rounded-xl border border-gray-200 bg-white p-6',
      'shadow-sm transition-shadow hover:shadow-md',
      'dark:border-gray-800 dark:bg-gray-900',
      className,
    )}>
      {children}
    </div>
  )
}
```

### Form Input Pattern

```tsx
export function Input({
  label,
  error,
  className,
  ...props
}: {
  label: string
  error?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <input
        className={cn(
          'w-full rounded-lg border border-gray-300 px-3 py-2',
          'text-sm placeholder:text-gray-400',
          'focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
          'disabled:cursor-not-allowed disabled:bg-gray-50',
          'dark:border-gray-700 dark:bg-gray-800',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className,
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
```

## Anti-Patterns to Avoid

### ❌ Arbitrary Values in JSX

```tsx
// ❌ BAD: arbitrary values not in design system
<div className="mt-[13px] text-[#1a2b3c] w-[347px]">

// ✅ GOOD: use design tokens
<div className="mt-3 text-gray-800 w-full max-w-sm">
```

### ❌ Inline Styles

```tsx
// ❌ BAD: mixing inline styles with Tailwind
<div className="flex" style={{ gap: '12px', color: '#333' }}>

// ✅ GOOD: all in Tailwind
<div className="flex gap-3 text-gray-700">
```

### ❌ Utility Sprawl

```tsx
// ❌ BAD: 20+ utilities repeated across files
<button className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">

// ✅ GOOD: extract to component
<Button variant="primary" size="md">Click me</Button>
```

## Spacing & Typography Scale

> **Reference**: https://tailwindcss.com/docs/customizing-spacing

### Consistent Spacing

Use the default spacing scale. Prefer `gap-*` over margins between flex/grid children.

```tsx
// ✅ Consistent spacing
<div className="space-y-4">     {/* Vertical stack with 1rem gaps */}
<div className="flex gap-3">    {/* Horizontal with 0.75rem gaps */}
<div className="p-6 md:p-8">   {/* Responsive padding */}
```

### Typography

```tsx
// Heading hierarchy
<h1 className="text-2xl font-bold tracking-tight md:text-3xl">
<h2 className="text-xl font-semibold">
<h3 className="text-lg font-medium">
<p className="text-sm text-gray-600 leading-relaxed">
```

> **Reference**: https://tailwindcss.com/docs/font-size
