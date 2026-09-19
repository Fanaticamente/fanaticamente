import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLAY_STORE =
  "https://play.google.com/store/apps/details?id=br.com.app.gpu3041153.gpu2b1d548352a1db293fd37c557fea3180";
const APP_STORE =
  "https://apps.apple.com/br/app/fanaticamente-futebol-sa%C3%BAde/id6754257086";

const getMobileStore = () => {
  const userAgent = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return APP_STORE;
  if (/Android/i.test(userAgent)) return PLAY_STORE;
  return null;
};

// Redirect happens immediately, before the page even paints.
const store = getMobileStore();
if (store) {
  window.location.replace(store);
}

const DownloadApp = () => {
  // Mobile visitors never reach this — they were redirected to their store.
  if (store) return null;

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Smartphone className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="font-sans text-3xl font-bold">Fanaticamente</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Baixe o aplicativo para acompanhar as notícias e cuidar da sua saúde emocional.
        </p>
        <div className="mt-8 grid w-full gap-3">
          <Button asChild size="lg">
            <a href={PLAY_STORE}>Baixar no Google Play</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={APP_STORE}>Baixar na App Store</a>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default DownloadApp;
