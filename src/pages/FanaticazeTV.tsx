import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Tv, Radio } from "lucide-react";

const CHANNEL_ID = "UCZiYbVptd3PVPf4f6eR6UaQ";
const CHANNEL_HANDLE = "CazeTV";
const LIVE_EMBED_URL = `https://www.youtube.com/embed/live_stream?channel=${CHANNEL_ID}&autoplay=1&modestbranding=1&rel=0`;
// Uploads playlist = UU + channel ID without UC prefix
const UPLOADS_PLAYLIST_EMBED = `https://www.youtube.com/embed/videoseries?list=UU${CHANNEL_ID.slice(2)}&modestbranding=1&rel=0`;

const FanaticazeTV = () => {
  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />

      <main className="pt-20 px-4 max-w-3xl mx-auto space-y-6">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center">
            <Tv className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-yellow-400">FanatiCazé TV</h1>
            <p className="text-sm text-muted-foreground">Conteúdo exclusivo do canal CazéTV</p>
          </div>
        </div>

        {/* Live player */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-4 h-4 text-destructive animate-pulse" />
            <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wide">
              Ao vivo agora
            </h2>
          </div>
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-border">
            <iframe
              src={LIVE_EMBED_URL}
              title="CazéTV Ao Vivo"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </section>

        {/* Latest videos playlist */}
        <section>
          <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wide mb-2">
            Últimos vídeos do canal
          </h2>
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-border">
            <iframe
              src={UPLOADS_PLAYLIST_EMBED}
              title="Vídeos CazéTV"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Conteúdo de @{CHANNEL_HANDLE} reproduzido dentro do app.
          </p>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default FanaticazeTV;
