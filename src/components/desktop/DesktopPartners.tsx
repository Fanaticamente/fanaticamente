const partners = [
  { name: "Corinthians", logo: "🖤" },
  { name: "Flamengo", logo: "🔴" },
  { name: "Palmeiras", logo: "💚" },
  { name: "São Paulo", logo: "⚪" },
  { name: "Santos", logo: "⚫" },
  { name: "Grêmio", logo: "🔵" },
  { name: "Internacional", logo: "❤️" },
  { name: "Cruzeiro", logo: "💙" },
];

const DesktopPartners = () => {
  return (
    <section className="py-16 bg-[hsl(var(--desktop-bg))] border-y border-[hsl(var(--desktop-border))]">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-[hsl(var(--desktop-muted-fg))] mb-8 text-sm uppercase tracking-wider font-medium">
          Torcedores de todo o Brasil confiam em nós
        </p>
        
        <div className="flex items-center justify-center gap-12 flex-wrap">
          {partners.map((partner) => (
            <div 
              key={partner.name}
              className="flex items-center gap-2 text-[hsl(var(--desktop-muted-fg))] hover:text-[hsl(var(--desktop-fg))] transition-colors cursor-pointer"
            >
              <span className="text-2xl">{partner.logo}</span>
              <span className="font-medium">{partner.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DesktopPartners;
