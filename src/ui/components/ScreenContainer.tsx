import type { ReactNode } from 'react';

interface ScreenContainerProps {
  /** Título exibido no topo da tela. */
  title: string;
  /** Texto auxiliar opcional abaixo do título. */
  subtitle?: string;
  /** Conteúdo da tela. */
  children?: ReactNode;
}

/**
 * Contêiner padrão de uma tela: título em headline e pilha de conteúdo.
 * O padding horizontal e o espaço para a navegação inferior são providos
 * pelo layout principal (App). Estilo Material 3. (Req. 7.3)
 */
export function ScreenContainer({
  title,
  subtitle,
  children,
}: ScreenContainerProps) {
  return (
    <section className="flex flex-col gap-stack-lg w-full">
      <div className="flex flex-col gap-stack-sm pt-2">
        <h1 className="font-headline-lg text-headline-lg text-on-background">
          {title}
        </h1>
        {subtitle && (
          <p className="font-body-md text-body-md text-on-surface-variant">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-gutter">{children}</div>
    </section>
  );
}
