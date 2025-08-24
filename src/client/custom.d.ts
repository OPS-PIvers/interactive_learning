declare module 'react-zoom-pan-pinch' {
  import type { ComponentType, FC, ReactNode } from 'react';

  export interface TransformWrapperProps {
    children: ReactNode;
    [key: string]: unknown;
  }

  export const TransformWrapper: ComponentType<TransformWrapperProps>;
  export const TransformComponent: FC<{ children: ReactNode }>;
}
