import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--ob-navy)] text-white hover:opacity-90 focus-visible:ring-[var(--ob-navy)]',
        amber:
          'bg-[var(--ob-amber)] text-[var(--ob-navy)] font-semibold hover:opacity-90 focus-visible:ring-[var(--ob-amber)]',
        outline:
          'border border-[var(--ob-border)] bg-[var(--ob-surface)] text-[var(--ob-text)] hover:bg-[var(--ob-surface-alt)] focus-visible:ring-[var(--ob-navy)]',
        ghost:
          'text-[var(--ob-text-muted)] hover:bg-[var(--ob-surface-alt)] hover:text-[var(--ob-text)] focus-visible:ring-[var(--ob-navy)]',
        destructive:
          'bg-[var(--ob-error)] text-white hover:opacity-90 focus-visible:ring-[var(--ob-error)]',
        link:
          'text-[var(--ob-amber-dim)] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-12 px-5',
        sm: 'h-9 px-4 text-xs rounded-lg',
        lg: 'h-14 px-7 text-base',
        icon: 'h-10 w-10 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  ),
)
Button.displayName = 'Button'

export { Button, buttonVariants }
