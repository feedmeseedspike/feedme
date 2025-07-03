declare module 'simplebar-react' {
  import { ComponentProps, ComponentType, ReactNode, CSSProperties } from 'react';

  export interface SimpleBarProps extends ComponentProps<'div'> {
    children?: ReactNode;
    scrollableNodeProps?: object;
    autoHide?: boolean;
    timeout?: number;
    forceVisible?: boolean | 'x' | 'y';
    direction?: 'rtl' | 'ltr';
    clickOnTrack?: boolean;
    style?: CSSProperties;
    className?: string;
    scrollbarMaxSize?: number;
    classNames?: {
      contentEl?: string;
      contentWrapper?: string;
      offset?: string;
      mask?: string;
      wrapper?: string;
      placeholder?: string;
      scrollbar?: string;
      track?: string;
      heightAutoObserverWrapperEl?: string;
      heightAutoObserverEl?: string;
      visible?: string;
      horizontal?: string;
      vertical?: string;
      hover?: string;
      dragging?: string;
    };
  }

  const SimpleBar: ComponentType<SimpleBarProps>;
  export default SimpleBar;
} 