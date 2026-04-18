const DesktopFooter = () => {
  return (
    <footer className="bg-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* App Store Badges */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <a
            href="https://apps.apple.com/br/app/fanaticamente/id6754257086"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-transform hover:scale-105"
          >
            <img
              src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
              alt="Baixar na App Store"
              className="h-12"
            />
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=br.com.app.gpu3041153.gpu2b1d548352a1db293fd37c557fea3180&hl=pt"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-transform hover:scale-105"
          >
            <img
              src="https://play.google.com/intl/en_us/badges/static/images/badges/pt-br_badge_web_generic.png"
              alt="Disponível no Google Play"
              className="h-[72px] -my-3"
            />
          </a>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-gray-600 text-sm">
            <span className="font-semibold text-gray-800">© 2025 Fanaticamente</span>
            <span className="text-gray-500"> | Fanaticamente Tecnologia e Serviços Ltda - CNPJ 56.605.156/0001-50</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default DesktopFooter;
