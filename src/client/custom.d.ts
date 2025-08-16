declare module 'react-zoom-pan-pinch' {
  import type { ComponentType, FC, ReactNode } from 'react';

  export interface TransformWrapperProps {
    children: ReactNode;
    [key: string]: any;
  }

  export const TransformWrapper: ComponentType<TransformWrapperProps>;
  export const TransformComponent: FC<{ children: ReactNode }>;
}
