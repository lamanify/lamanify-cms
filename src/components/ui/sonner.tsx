import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-left"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-accent/80 group-[.toaster]:backdrop-blur-sm group-[.toaster]:text-accent-foreground group-[.toaster]:border-accent/20 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-accent-foreground/80",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
