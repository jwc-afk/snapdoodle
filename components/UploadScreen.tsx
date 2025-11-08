
import React, { useState, useCallback } from 'react';
import { generateLineArt } from '../services/geminiService';
import PixelButton from './PixelButton';
import Loader from './Loader';
import { Camera, Upload } from 'lucide-react';

interface UploadScreenProps {
  onLineArtGenerated: (lineArtUrl: string, originalUrl: string) => void;
}

const UploadScreen: React.FC<UploadScreenProps> = ({ onLineArtGenerated }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const playSound = (url: string) => {
    new Audio(url).play().catch(e => console.error("Error playing sound:", e));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      playSound('https://www.zapsplat.com/wp-content/uploads/2015/sound-design-elements/sfx_digital_button_6.mp3');
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerateClick = useCallback(async () => {
    if (!selectedFile) {
      setError("Please select a file first!");
      return;
    }

    setIsLoading(true);
    setError(null);
    playSound('https://www.zapsplat.com/wp-content/uploads/2015/sound-design-elements/sfx_digital_gliss_up_fast_3.mp3');

    try {
      const base64Image = await convertFileToBase64(selectedFile);
      const generatedBase64 = await generateLineArt(base64Image, selectedFile.type);
      
      const lineArtUrl = `data:image/png;base64,${generatedBase64}`;
      const originalUrl = URL.createObjectURL(selectedFile);
      
      onLineArtGenerated(lineArtUrl, originalUrl);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Generation Failed: ${errorMessage}`);
      playSound('https://www.zapsplat.com/wp-content/uploads/2015/sound-design-elements/sfx_digital_error_3.mp3');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, onLineArtGenerated]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center">
      {isLoading ? (
        <Loader text="Doodling your snap..." />
      ) : (
        <>
          <h2 className="text-2xl md:text-3xl mb-4 text-[#0ff]">Upload a Photo</h2>
          <p className="text-sm md:text-base mb-6 max-w-md text-gray-400">
            Choose a picture and our AI will magically turn it into a coloring page!
          </p>
          <div className="w-full max-w-sm mb-6">
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="w-full h-48 border-4 border-dashed border-pink-500 rounded-lg flex flex-col items-center justify-center bg-gray-900/50 hover:bg-gray-900 transition-colors">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-md" />
                ) : (
                  <>
                    <Camera size={48} className="text-pink-500 mb-2" />
                    <span className="text-pink-500">Click to select image</span>
                  </>
                )}
              </div>
            </label>
            <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <PixelButton onClick={handleGenerateClick} disabled={!selectedFile || isLoading} icon={<Upload size={20}/>}>
            Generate Line Art
          </PixelButton>

          {error && <p className="text-red-500 mt-4 text-xs">{error}</p>}
        </>
      )}
    </div>
  );
};

export default UploadScreen;
