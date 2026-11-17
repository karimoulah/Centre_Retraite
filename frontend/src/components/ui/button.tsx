import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

// Pill buttons from the design. Every size keeps a touch target of at least 44px.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.1em]",
  {
    variants: {
      variant: {
        accent: 'bg-accent-400 text-brand-900 hover:bg-accent-200',
        dark: 'bg-brand-900 text-text-on-dark hover:bg-brand-800',
        ghost: 'bg-transparent text-current hover:bg-surface-muted',
        ghostOnDark: 'bg-transparent text-text-on-dark hover:bg-brand-800',
        outline: 'border border-border bg-surface text-text hover:bg-surface-muted',
        outlineOnDark: 'border border-brand-800 bg-transparent text-text-on-dark hover:bg-brand-800',
        destructive: 'bg-status-error text-white hover:bg-status-error/90',
        link: 'rounded-none text-current underline underline-offset-4 hover:no-underline',
      },
      size: {
        default: 'min-h-11 px-6 py-2 text-[0.9375rem]',
        lg: 'min-h-12 px-7 py-3 text-base',
        icon: 'size-11',
      },
    },
    // Inline links keep the text height; they sit inside text, not in toolbars.
    compoundVariants: [{ variant: 'link', className: 'min-h-0 px-0 py-0' }],
    defaultVariants: {
      variant: 'dark',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
