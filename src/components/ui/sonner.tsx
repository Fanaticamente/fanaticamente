import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--club-primary)",
          "--normal-text": "var(--club-on)",
          "--normal-border": "var(--club-primary)",
          "--success-bg": "var(--club-primary)",
          "--success-text": "var(--club-on)",
          "--success-border": "var(--club-primary)",
          "--error-bg": "var(--club-primary)",
          "--error-text": "var(--club-on)",
          "--error-border": "var(--club-primary)",
          "--info-bg": "var(--club-primary)",
          "--info-text": "var(--club-on)",
          "--info-border": "var(--club-primary)",
          "--warning-bg": "var(--club-primary)",
          "--warning-text": "var(--club-on)",
          "--warning-border": "var(--club-primary)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast shadow-lg",
          title: "",
          description: "opacity-90",
          actionButton: "group-[.toast]:bg-white/95 group-[.toast]:text-black",
          cancelButton: "group-[.toast]:bg-white/20",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
