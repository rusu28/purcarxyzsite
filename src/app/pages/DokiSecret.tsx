import React from 'react';

export const DokiSecret: React.FC = () => {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      <iframe
        title="Doki Doki"
        src="/dokisecret/index.html"
        className="absolute inset-0 h-full w-full border-0 bg-black"
        allow="autoplay; fullscreen"
      />
    </main>
  );
};
