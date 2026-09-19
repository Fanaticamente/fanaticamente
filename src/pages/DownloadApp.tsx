import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const ANDROID_PACKAGE = "br.com.app.gpu3041153.gpu2b1d548352a1db293fd37c557fea3180";
const IOS_APP_ID = "6754257086";
const PLAY_STORE =
  `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
const APP_STORE =
  "https://apps.apple.com/br/app/fanaticamente-futebol-sa%C3%BAde/id6754257086";

type MobilePlatform = "ios" | "android" | null;

const getMobilePlatform = (): MobilePlatform => {
  const userAgent = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return null;
};

const DownloadApp = () => {
  const [platform] = useState<MobilePlatform>(() => getMobilePlatform());

  useEffect(() => {
    if (!platform) return;

    if (platform === "android") {
      const fallback = encodeURIComponent(PLAY_STORE);
      window.location.replace(
        `intent://details?id=${ANDROID_PACKAGE}#Intent;scheme=market;package=com.android.vending;S.browser_fallback_url=${fallback};end`,
      );
      return;
    }

    window.location.replace(APP_STORE);
    return;
  }, [platform]);

  if (platform) return null;

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
