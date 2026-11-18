import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const variants = cva('action-control inline-flex items-center justify-center rounded-xl text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] disabled:opacity-50 disabled:cursor-not-allowed', {
  variants: { variant: { default: 'bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]', highlight: 'bg-[var(--cta)] text-[var(--navy)] hover:bg-[var(--cta-hover)]', outline: 'border border-[var(--line)] bg-white text-[var(--brand)] hover:bg-[#f2f5ff]' }, size: { default: 'h-11 px-5', lg: 'h-14 px-7', sm: 'h-10 px-4' } },
  defaultVariants: { variant: 'default', size: 'default' },
});

export function Button({ className, variant, size, asChild = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof variants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={twMerge(clsx(variants({ variant, size }), className))} {...props} />;
}
