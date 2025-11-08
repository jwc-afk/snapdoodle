
import React, { useState, useCallback } from 'react';
import UploadScreen from './components/UploadScreen';
import ColoringScreen from './components/ColoringScreen';

export type AppScreen = 'upload' | 'coloring';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>('upload');
  const [lineArtImage, setLineArtImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);

  const handleLineArtGenerated = useCallback((lineArtUrl: string, originalUrl: string) => {
    setLineArtImage(lineArtUrl);
    setOriginalImage(originalUrl);
    setScreen('coloring');
  }, []);

  const handleBackToUpload = useCallback(() => {
    setLineArtImage(null);
    setOriginalImage(null);
    setScreen('upload');
  }, []);

  return (
    <div className="bg-black text-[#0f0] min-h-screen w-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl aspect-[4/3] bg-[#0a0a0a] border-4 border-[#0ff] shadow-[0_0_20px_#0ff] rounded-lg p-4 flex flex-col">
        <header className="flex justify-between items-center pb-4 border-b-4 border-dotted border-pink-500">
          <h1 className="text-2xl md:text-4xl text-pink-500 drop-shadow-[2px_2px_0px_#000]">SnapDoodle</h1>
          <div className="text-sm text-cyan-400">v1.0.0</div>
        </header>
        <main className="flex-grow relative overflow-hidden">
          {screen === 'upload' && <UploadScreen onLineArtGenerated={handleLineArtGenerated} />}
          {screen === 'coloring' && lineArtImage && originalImage && (
            <ColoringScreen 
              lineArtImage={lineArtImage} 
              originalImage={originalImage}
              onBack={handleBackToUpload} 
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
