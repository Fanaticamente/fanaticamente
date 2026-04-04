const DesktopFooter = () => {
  return (
    <footer className="bg-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* App Store Badges */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <a 
            href="https://apps.apple.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="transition-transform hover:scale-105"
          >
            <img 
              src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" 
              alt="Download on the App Store" 
              className="h-12"
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
