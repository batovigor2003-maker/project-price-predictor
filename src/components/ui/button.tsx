import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const variants = cva('inline-flex items-center justify-center rounded-full text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#03195b] disabled:opacity-50 disabled:cursor-not-allowed', {
  variants: { variant: { default: 'bg-[#1951fc] text-white hover:bg-[#0b2cb1]', outline: 'border border-[#1951fc] bg-white text-[#1951fc] hover:bg-[#e3f1ff]' }, size: { default: 'h-11 px-5', lg: 'h-13 px-7', sm: 'h-9 px-4' } },
  defaultVariants: { variant: 'default', size: 'default' },
});

export function Button({ className, variant, size, asChild = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof variants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={twMerge(clsx(variants({ variant, size }), className))} {...props} />;
}
