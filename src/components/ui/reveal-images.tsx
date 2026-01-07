/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

interface ImageSource {
  src: string;
  alt: string;
}

interface ShowImageListItemProps {
  text: string;
  images: readonly [ImageSource, ImageSource];
  onSelect?: () => void;
  isActive?: boolean;
}

function RevealImageListItem({
  text,
  images,
  onSelect,
  isActive,
}: ShowImageListItemProps) {
  const container = "absolute right-4 -top-1 z-40 h-20 w-16 sm:right-8";
  const effect =
    "relative duration-500 delay-100 shadow-none group-hover:shadow-xl scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 group-hover:w-full group-hover:h-full w-16 h-16 overflow-hidden transition-all rounded-md";

  return (
    <button
      type="button"
      className={cn(
        "group relative h-fit w-fit overflow-visible py-8 text-left",
        onSelect
          ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)]"
          : "cursor-default",
      )}
      onClick={onSelect}
      aria-label={text}
    >
      <h1
        className={cn(
          "text-5xl font-black text-foreground transition-all duration-500 group-hover:opacity-40 sm:text-7xl",
          isActive ? "opacity-40" : undefined,
        )}
      >
        {text}
      </h1>
      <div className={container}>
        <div className={effect}>
          <img
            alt={images[1].alt}
            src={images[1].src}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
      <div
        className={cn(
          container,
          "translate-x-0 translate-y-0 rotate-0 transition-all delay-150 duration-500 group-hover:translate-x-6 group-hover:translate-y-6 group-hover:rotate-12",
        )}
      >
        <div className={cn(effect, "duration-200")}>
          <img
            alt={images[0].alt}
            src={images[0].src}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </button>
  );
}

type RevealImageListProps = {
  title?: string;
  items?: Omit<ShowImageListItemProps, "onSelect" | "isActive">[];
  activeIndex?: number;
  onSelectIndex?: (index: number) => void;
  className?: string;
};

function RevealImageList({
  title = "Our services",
  items,
  activeIndex,
  onSelectIndex,
  className,
}: RevealImageListProps) {
  const defaultItems: Omit<ShowImageListItemProps, "onSelect" | "isActive">[] = [
    {
      text: "Branding",
      images: [
        {
          src: "https://images.unsplash.com/photo-1512295767273-ac109ac3acfa?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
          alt: "Image 1",
        },
        {
          src: "https://images.unsplash.com/photo-1567262439850-1d4dc1fefdd0?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
          alt: "Image 2",
        },
      ],
    },
    {
      text: "Web design",
      images: [
        {
          src: "https://images.unsplash.com/photo-1587440871875-191322ee64b0?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
          alt: "Image 1",
        },
        {
          src: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
          alt: "Image 2",
        },
      ],
    },
    {
      text: "Illustration",
      images: [
        {
          src: "https://images.unsplash.com/photo-1575995872537-3793d29d972c?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
          alt: "Image 1",
        },
        {
          src: "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
          alt: "Image 2",
        },
      ],
    },
  ];

  const resolvedItems = items ?? defaultItems;

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-2xl bg-background px-6 py-4",
        className,
      )}
    >
      <h3 className="text-sm font-black uppercase text-muted-foreground">
        {title}
      </h3>
      <div className="flex flex-col items-start">
        {resolvedItems.map((item, index) => (
          <RevealImageListItem
            key={index}
            text={item.text}
            images={item.images}
            onSelect={onSelectIndex ? () => onSelectIndex(index) : undefined}
            isActive={activeIndex === index}
          />
        ))}
      </div>
    </div>
  );
}

export { RevealImageList };
