import React, { FC, ReactNode } from "react";

interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  children: ReactNode;
}

const Container: FC<ContainerProps> = ({ className, children, ...props }) => {
  return (
    <section
      {...props}
      className={"lg:px-[60px] md:px-8 mx-auto px-4 w-full" + (className ? " " + className : "")}
    >
      {children}
    </section>
  );
};

export default Container;
