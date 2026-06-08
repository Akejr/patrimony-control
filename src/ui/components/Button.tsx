import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visual do botão. */
  variant?: 'primary' | 'secondary' | 'danger';
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-container',
  secondary:
    'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest border border-outline-variant',
  danger: 'bg-error text-on-error hover:opacity-90',
};

/**
 * Botão reutilizável no estilo Material 3, com áreas de toque amplas (44px) e
 * variantes de cor. (Req. 7.3)
 */
export function Button({
  variant = 'primary',
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    // eslint-disable-next-line react/button-has-type
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 min-h-[44px] font-label-md text-label-md font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${
        VARIANT_CLASSES[variant]
      } ${className ?? ''}`}
      {...rest}
    >
      {children}
    </button>
  );
}
