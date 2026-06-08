import type { ReactNode } from 'react';

interface CardProps {
  children?: ReactNode;
  /** Classe adicional opcional para ajustes pontuais de layout. */
  className?: string;
}

/**
 * Cartão no estilo Material 3: fundo branco, borda sutil, cantos arredondados
 * e leve sombra no hover. (Req. 7.3)
 */
export function Card({ children, className }: CardProps) {
  return (
    <div
      className={`bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-lg transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${
        className ?? ''
      }`}
    >
      {children}
    </div>
  );
}
