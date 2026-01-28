"use client";

import * as React from "react";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "src/lib/utils";
import { Button } from "@components/ui/button";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  isScale?: boolean;
  className?: string;
  children: React.ReactNode;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  selectedIndex: number;
  isScale?: boolean;
} & Omit<CarouselProps, "children">;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }
  return context;
}

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ opts, plugins, isScale = false, className, children, ...props }, ref) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        align: opts?.align ?? "start",
        loop: opts?.loop ?? true,
      },
      plugins
    );
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);
    const [selectedIndex, setSelectedIndex] = React.useState(0);

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) return;
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
      setSelectedIndex(api.selectedScrollSnap());
    }, []);

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev();
    }, [api]);

    const scrollNext = React.useCallback(() => {
      api?.scrollNext();
    }, [api]);

    React.useEffect(() => {
      if (!api) return;
      onSelect(api);
      api.on("reInit", onSelect);
      api.on("select", onSelect);
      return () => {
        api.off("reInit", onSelect);
        api.off("select", onSelect);
      };
    }, [api, onSelect]);

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api,
          opts,
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
          selectedIndex,
          isScale,
        }}
      >
        <div ref={ref} className={cn("relative w-full", className)} {...props}>
          {children}
        </div>
      </CarouselContext.Provider>
    );
  }
);
Carousel.displayName = "Carousel";

const SliderContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef } = useCarousel();
  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn("flex", className)}
        // style={{ gap: "0px" }}
        {...props}
      />
    </div>
  );
});
SliderContainer.displayName = "SliderContainer";

const Slider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { slideIndex?: number }
>(({ className, slideIndex = 0, ...props }, ref) => {
  const { selectedIndex, isScale, api } = useCarousel();
  const [isInView, setIsInView] = React.useState(false);

  React.useEffect(() => {
    if (!api || !isScale) return;

    const updateInView = () => {
      const selected = api.selectedScrollSnap();
      setIsInView(selected === slideIndex);
    };

    updateInView();
    api.on("select", updateInView);
    return () => {
      api.off("select", updateInView);
    };
  }, [api, slideIndex, isScale]);

  const isSelected = isScale ? isInView : slideIndex === selectedIndex;

  const { children, style, ...restProps } = props;

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{ flexShrink: 0, ...style }}
      {...restProps}
    >
      <div
        className={cn(
          "h-full w-full transition-all duration-500 ease-out",
          isScale && isSelected
            ? "scale-100 opacity-100"
            : isScale
              ? "scale-90 opacity-75"
              : ""
        )}
      >
        {children}
      </div>
    </div>
  );
});
Slider.displayName = "Slider";

const SliderPrevButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  const { scrollPrev, canScrollPrev } = useCarousel();
  return (
    <Button
      ref={ref}
      variant="outline"
      size="icon"
      className={cn(
        "absolute top-[50%] p-2 border-2 rounded-full left-4 bg-white/25 dark:bg-black/25 dark:border-white backdrop-blur-xs text-primary disabled:opacity-20",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeft className="w-8 h-8" />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
});
SliderPrevButton.displayName = "SliderPrevButton";

const SliderNextButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  const { scrollNext, canScrollNext } = useCarousel();
  return (
    <Button
      ref={ref}
      variant="outline"
      size="icon"
      className={cn(
        "absolute right-4 p-2 border-2 rounded-full top-[50%] bg-white/25 dark:bg-black/25 dark:border-white backdrop-blur-xs text-primary disabled:opacity-20",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ChevronRight className="w-8 h-8" />
      <span className="sr-only">Next slide</span>
    </Button>
  );
});
SliderNextButton.displayName = "SliderNextButton";

const SliderDotButton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { api, selectedIndex } = useCarousel();
  const [dots, setDots] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (!api) return;
    const updateDots = () => {
      setDots(Array.from({ length: api.scrollSnapList().length }, (_, i) => i));
    };
    updateDots();
    api.on("reInit", updateDots);
    return () => {
      api.off("reInit", updateDots);
    };
  }, [api]);

  const scrollTo = React.useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api]
  );

  return (
    <div
      ref={ref}
      className={cn("flex gap-2 justify-center", className)}
      {...props}
    >
      {dots.map((dotIndex) => (
        <button
          key={dotIndex}
          onClick={() => scrollTo(dotIndex)}
          className={cn(
            "h-2 w-2 rounded-full transition-all",
            dotIndex === selectedIndex
              ? "bg-[#1B6013] w-8"
              : "bg-gray-300 hover:bg-gray-400"
          )}
          aria-label={`Go to slide ${dotIndex + 1}`}
        />
      ))}
    </div>
  );
});
SliderDotButton.displayName = "SliderDotButton";

export {
  Carousel,
  SliderContainer,
  Slider,
  SliderPrevButton,
  SliderNextButton,
  SliderDotButton,
  type CarouselApi,
};
