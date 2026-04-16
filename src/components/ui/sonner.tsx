import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-therapy group-[.toaster]:text-therapy-foreground group-[.toaster]:border-therapy group-[.toaster]:shadow-lg",
          title: "group-[.toast]:!text-therapy-foreground",
          description: "group-[.toast]:!text-therapy-foreground/90",
          actionButton: "group-[.toast]:bg-white group-[.toast]:text-therapy",
          cancelButton: "group-[.toast]:bg-white/20 group-[.toast]:text-therapy-foreground",
          error: "group-[.toaster]:!bg-therapy group-[.toaster]:!text-therapy-foreground",
          warning: "group-[.toaster]:!bg-therapy group-[.toaster]:!text-therapy-foreground",
          success: "group-[.toaster]:!bg-therapy group-[.toaster]:!text-therapy-foreground",
          info: "group-[.toaster]:!bg-therapy group-[.toaster]:!text-therapy-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
