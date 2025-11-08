type RGBA = { r: number; g: number; b: number; a: number };

function getPixel(imageData: ImageData, x: number, y: number): RGBA {
  const index = (y * imageData.width + x) * 4;
  return {
    r: imageData.data[index],
    g: imageData.data[index + 1],
    b: imageData.data[index + 2],
    a: imageData.data[index + 3],
  };
}

function setPixel(imageData: ImageData, x: number, y: number, color: RGBA) {
  const index = (y * imageData.width + x) * 4;
  imageData.data[index] = color.r;
  imageData.data[index + 1] = color.g;
  imageData.data[index + 2] = color.b;
  imageData.data[index + 3] = color.a;
}

function colorsMatch(a: RGBA, b: RGBA, tolerance = 10): boolean {
  return Math.abs(a.r - b.r) <= tolerance &&
         Math.abs(a.g - b.g) <= tolerance &&
         Math.abs(a.b - b.b) <= tolerance &&
         Math.abs(a.a - b.a) <= tolerance;
}

// Queue-based flood fill algorithm that uses the line art as a boundary map.
export function floodFill(
    ctx: CanvasRenderingContext2D,
    lineArtCtx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    fillColor: { r: number; g: number; b: number } | null
) {
    if (!fillColor) return;
    
    const coloringImageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const lineArtImageData = lineArtCtx.getImageData(0, 0, lineArtCtx.canvas.width, lineArtCtx.canvas.height);
    
    const { width, height } = coloringImageData;

    // Check if the area is already filled with this color to prevent re-filling.
    const startPixelOnColoring = getPixel(coloringImageData, startX, startY);
    if (colorsMatch(startPixelOnColoring, { ...fillColor, a: 255 })) {
        return;
    }

    // A boundary is a pixel that is not white on the line art canvas.
    // We use luminance to detect this, which is more robust than checking for pure black.
    const isBoundary = (x: number, y: number) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return true;
        const pixel = getPixel(lineArtImageData, x, y);
        // A pixel is considered a boundary if its luminance is below a threshold (i.e., it's not white).
        const luminance = 0.299 * pixel.r + 0.587 * pixel.g + 0.114 * pixel.b;
        return luminance < 240; 
    };

    // If the user clicks on a boundary, do nothing.
    if (isBoundary(startX, startY)) {
        return;
    }
    
    const queue: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();
    visited.add(`${startX},${startY}`);

    while (queue.length > 0) {
        const [x, y] = queue.shift()!;
        
        if (isBoundary(x, y)) {
            continue;
        }

        setPixel(coloringImageData, x, y, { ...fillColor, a: 255 });

        const neighbors: [number, number][] = [
            [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
        ];

        for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited.has(`${nx},${ny}`)) {
                queue.push([nx, ny]);
                visited.add(`${nx},${ny}`);
            }
        }
    }

    ctx.putImageData(coloringImageData, 0, 0);
}
