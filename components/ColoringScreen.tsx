import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  PaintBucket, Brush, Eraser, Undo, Redo, ZoomIn, ZoomOut, Download, Share2, ArrowLeft, Palette 
} from 'lucide-react';
import PixelButton from './PixelButton';
import { floodFill } from '../utils/canvasUtils';

interface ColoringScreenProps {
  lineArtImage: string;
  originalImage: string;
  onBack: () => void;
}

type Tool = 'brush' | 'fill' | 'eraser';

const Colors = [
  '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3',
  '#FFFFFF', '#C0C0C0', '#808080', '#000000', '#8B4513', '#A0522D', '#D2691E',
  '#FFC0CB', '#FF69B4', '#DB7093', '#FFA07A', '#FA8072', '#E9967A', '#F08080',
  '#CD5C5C', '#DC143C', '#B22222', '#8B0000', '#00FFFF', '#00CED1', '#48D1CC',
  '#40E0D0', '#20B2AA', '#5F9EA0', '#008B8B', '#008080', '#90EE90', '#3CB371',
];

const BrushSizes = [2, 5, 10, 20, 30];

const ColoringScreen: React.FC<ColoringScreenProps> = ({ lineArtImage, originalImage, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lineArtCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('brush');
  const [color, setColor] = useState('#FF0000');
  const [brushSize, setBrushSize] = useState(10);
  
  const history = useRef<ImageData[]>([]);
  const historyIndex = useRef(-1);

  const playSound = (url: string) => {
    new Audio(url).play().catch(e => console.error("Error playing sound:", e));
  };
  
  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    history.current.splice(historyIndex.current + 1);
    history.current.push(imageData);
    historyIndex.current = history.current.length - 1;
    if (history.current.length > 30) {
      history.current.shift();
      historyIndex.current--;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const lineArtCanvas = lineArtCanvasRef.current;
    if (!canvas || !lineArtCanvas) return;
    
    const ctx = canvas.getContext('2d');
    const lineArtCtx = lineArtCanvas.getContext('2d');
    if (!ctx || !lineArtCtx) return;

    const img = new Image();
    img.src = lineArtImage;
    img.onload = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const { width, height } = parent.getBoundingClientRect();
        const aspectRatio = img.width / img.height;
        let newWidth = width;
        let newHeight = width / aspectRatio;
        if (newHeight > height) {
            newHeight = height;
            newWidth = height * aspectRatio;
        }
        canvas.width = newWidth;
        canvas.height = newHeight;
        lineArtCanvas.width = newWidth;
        lineArtCanvas.height = newHeight;
        
        // Draw the line art onto its dedicated canvas with a white background
        lineArtCtx.fillStyle = 'white';
        lineArtCtx.fillRect(0,0,lineArtCanvas.width, lineArtCanvas.height);
        lineArtCtx.drawImage(img, 0, 0, newWidth, newHeight);

        // Clear the user's coloring canvas to be transparent
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveState();
      }
    };
  }, [lineArtImage, saveState]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if(tool === 'fill') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { offsetX, offsetY } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || tool === 'fill') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoords(e);
    
    // Set composite operation for brush vs eraser
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }
    
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if(!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.closePath();
    setIsDrawing(false);
    // Reset composite operation to default after drawing/erasing
    ctx.globalCompositeOperation = 'source-over';
    saveState();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'fill') return;

    const canvas = canvasRef.current;
    const lineArtCanvas = lineArtCanvasRef.current;
    if (!canvas || !lineArtCanvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoords(e);
    
    playSound('https://www.zapsplat.com/wp-content/uploads/2015/sound-design-elements/sfx_digital_pop_9.mp3');
    floodFill(ctx, lineArtCanvas.getContext('2d')!, Math.round(offsetX), Math.round(offsetY), hexToRgb(color));
    saveState();
  };

  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      if ('touches' in e.nativeEvent) {
          return {
              offsetX: e.nativeEvent.touches[0].clientX - rect.left,
              offsetY: e.nativeEvent.touches[0].clientY - rect.top
          };
      }
      return {
          offsetX: e.nativeEvent.offsetX,
          offsetY: e.nativeEvent.offsetY
      };
  };

  const handleUndo = useCallback(() => {
    if (historyIndex.current > 0) {
      playSound('https://www.zapsplat.com/wp-content/uploads/2015/sound-design-elements/sfx_digital_swoosh_2.mp3');
      historyIndex.current--;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && history.current[historyIndex.current]) {
        ctx.putImageData(history.current[historyIndex.current], 0, 0);
      }
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (historyIndex.current < history.current.length - 1) {
      playSound('https://www.zapsplat.com/wp-content/uploads/2015/sound-design-elements/sfx_digital_swoosh_2.mp3');
      historyIndex.current++;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && history.current[historyIndex.current]) {
        ctx.putImageData(history.current[historyIndex.current], 0, 0);
      }
    }
  }, []);
  
  const handleDownload = useCallback(() => {
    playSound('https://www.zapsplat.com/wp-content/uploads/2015/sound-design-elements/sfx_digital_whoosh_4.mp3');
    const finalCanvas = document.createElement('canvas');
    const coloringCanvas = canvasRef.current;
    const lineArtC = lineArtCanvasRef.current;
    if (!coloringCanvas || !lineArtC) return;
    finalCanvas.width = coloringCanvas.width;
    finalCanvas.height = coloringCanvas.height;
    const ctx = finalCanvas.getContext('2d');
    if (!ctx) return;

    // Draw the line art (with its white background) first
    ctx.drawImage(lineArtC, 0, 0);
    // Then draw the user's coloring on top
    ctx.drawImage(coloringCanvas, 0, 0);
    
    const link = document.createElement('a');
    link.download = 'snapdoodle-artwork.png';
    link.href = finalCanvas.toDataURL('image/png');
    link.click();
  }, []);

  function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
  }
  
  return (
    <div className="h-full w-full flex flex-col md:flex-row gap-4 p-2">
      {/* Toolbar */}
      <div className="w-full md:w-16 flex md:flex-col items-center justify-center gap-2 bg-gray-900/50 p-2 rounded-lg border-2 border-pink-500">
        <PixelButton onClick={onBack} title="Back to Upload"><ArrowLeft size={20}/></PixelButton>
        <PixelButton onClick={() => { setTool('brush'); playSound('https://www.zapsplat.com/wp-content/uploads/2015/sound-design-elements/sfx_digital_button_6.mp3'); }} active={tool==='brush'} title="Brush"><Brush size={20}/></PixelButton>
        <PixelButton onClick={() => { setTool('fill'); playSound('https://www.zapsplat.com/wp-content/uploads/2015/sound-design-elements/sfx_digital_button_6.mp3'); }} active={tool==='fill'} title="Fill Bucket"><PaintBucket size={20}/></PixelButton>
        <PixelButton onClick={() => { setTool('eraser'); playSound('https://www.zapsplat.com/wp-content/uploads/2015/sound-design-elements/sfx_digital_button_6.mp3'); }} active={tool==='eraser'} title="Eraser"><Eraser size={20}/></PixelButton>
        <div className="flex-grow md:flex-grow-0"></div>
        <PixelButton onClick={handleUndo} title="Undo"><Undo size={20}/></PixelButton>
        <PixelButton onClick={handleRedo} title="Redo"><Redo size={20}/></PixelButton>
        <PixelButton onClick={handleDownload} title="Download"><Download size={20}/></PixelButton>
      </div>

      {/* Canvas Area */}
      <div className="flex-grow relative bg-gray-900 rounded-lg overflow-hidden border-2 border-cyan-400 flex items-center justify-center">
        <canvas ref={lineArtCanvasRef} className="absolute top-0 left-0" style={{pointerEvents: 'none'}} />
        <canvas 
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          onClick={handleCanvasClick}
          className="absolute top-0 left-0 cursor-crosshair"
        />
      </div>

      {/* Color & Brush Palette */}
      <div className="w-full md:w-48 flex md:flex-col gap-4">
        <div className="flex-1 bg-gray-900/50 p-2 rounded-lg border-2 border-pink-500">
            <h3 className="text-pink-500 text-sm mb-2 text-center">Colors</h3>
            <div className="grid grid-cols-7 md:grid-cols-4 gap-1">
                {Colors.map(c => (
                    <button key={c}
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-full aspect-square rounded-full border-2 ${color === c ? 'border-cyan-400 scale-110' : 'border-transparent'} transition-transform`}>
                    </button>
                ))}
            </div>
        </div>
        <div className="flex-1 bg-gray-900/50 p-2 rounded-lg border-2 border-pink-500">
            <h3 className="text-pink-500 text-sm mb-2 text-center">Brush Size</h3>
            <div className="flex md:flex-col gap-2 items-center justify-center h-full">
            {BrushSizes.map(size => (
                <button key={size}
                    onClick={() => setBrushSize(size)}
                    className={`rounded-full bg-gray-700 hover:bg-gray-600 transition-all flex items-center justify-center ${brushSize === size ? 'ring-2 ring-cyan-400' : ''}`}
                    style={{ width: `${size+15}px`, height: `${size+15}px` }}>
                    <div className="bg-white rounded-full" style={{ width: `${size}px`, height: `${size}px`}}></div>
                </button>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ColoringScreen;