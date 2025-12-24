import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, Eraser, Paintbrush, Undo, Redo, Grid, ZoomIn, ZoomOut } from 'lucide-react';

export const metadata = {
  title: "픽셀 아트 변환기",
  description: "사진을 업로드하여 레트로 감성의 픽셀 아트로 변환하세요! 직접 편집도 가능합니다.",
  type: "react" as const,
  author: "Claude",
  tags: ["pixel-art", "image", "converter", "editor", "creative", "retro"],
  createdAt: "2024-12-24",
  updatedAt: "2024-12-24"
};

interface PixelData {
  width: number;
  height: number;
  pixels: string[][];
}

interface HistoryState {
  pixels: string[][];
}

const PixelArtConverter: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [pixelData, setPixelData] = useState<PixelData | null>(null);
  const [pixelSize, setPixelSize] = useState(8);
  const [colorCount, setColorCount] = useState(16);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [palette, setPalette] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 색상 양자화 - Median Cut 알고리즘 간소화 버전
  const quantizeColors = useCallback((imageData: ImageData, numColors: number): string[] => {
    const pixels: [number, number, number][] = [];

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3];
      if (a > 128) {
        pixels.push([r, g, b]);
      }
    }

    if (pixels.length === 0) return ['#000000'];

    // 간단한 k-means 스타일 클러스터링
    const clusters: [number, number, number][] = [];
    const step = Math.max(1, Math.floor(pixels.length / numColors));

    for (let i = 0; i < numColors && i * step < pixels.length; i++) {
      clusters.push(pixels[i * step]);
    }

    // 몇 번의 반복으로 클러스터 중심 조정
    for (let iter = 0; iter < 5; iter++) {
      const assignments: [number, number, number][][] = clusters.map(() => []);

      for (const pixel of pixels) {
        let minDist = Infinity;
        let closest = 0;

        for (let i = 0; i < clusters.length; i++) {
          const dist = Math.pow(pixel[0] - clusters[i][0], 2) +
                       Math.pow(pixel[1] - clusters[i][1], 2) +
                       Math.pow(pixel[2] - clusters[i][2], 2);
          if (dist < minDist) {
            minDist = dist;
            closest = i;
          }
        }

        assignments[closest].push(pixel);
      }

      for (let i = 0; i < clusters.length; i++) {
        if (assignments[i].length > 0) {
          const avg: [number, number, number] = [0, 0, 0];
          for (const p of assignments[i]) {
            avg[0] += p[0];
            avg[1] += p[1];
            avg[2] += p[2];
          }
          clusters[i] = [
            Math.round(avg[0] / assignments[i].length),
            Math.round(avg[1] / assignments[i].length),
            Math.round(avg[2] / assignments[i].length)
          ];
        }
      }
    }

    return clusters.map(([r, g, b]) =>
      `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    );
  }, []);

  // 가장 가까운 팔레트 색상 찾기
  const findClosestColor = useCallback((r: number, g: number, b: number, palette: string[]): string => {
    let minDist = Infinity;
    let closest = palette[0] || '#000000';

    for (const color of palette) {
      const cr = parseInt(color.slice(1, 3), 16);
      const cg = parseInt(color.slice(3, 5), 16);
      const cb = parseInt(color.slice(5, 7), 16);

      const dist = Math.pow(r - cr, 2) + Math.pow(g - cg, 2) + Math.pow(b - cb, 2);

      if (dist < minDist) {
        minDist = dist;
        closest = color;
      }
    }

    return closest;
  }, []);

  // 이미지를 픽셀 아트로 변환
  const convertToPixelArt = useCallback(() => {
    if (!originalImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 픽셀화된 크기 계산
    const pixelWidth = Math.ceil(originalImage.width / pixelSize);
    const pixelHeight = Math.ceil(originalImage.height / pixelSize);

    // 작은 캔버스에 이미지 그리기 (자동 다운샘플링)
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(originalImage, 0, 0, pixelWidth, pixelHeight);

    const imageData = ctx.getImageData(0, 0, pixelWidth, pixelHeight);

    // 색상 팔레트 추출
    const extractedPalette = quantizeColors(imageData, colorCount);
    setPalette(extractedPalette);
    if (extractedPalette.length > 0) {
      setSelectedColor(extractedPalette[0]);
    }

    // 픽셀 데이터 생성
    const pixels: string[][] = [];

    for (let y = 0; y < pixelHeight; y++) {
      const row: string[] = [];
      for (let x = 0; x < pixelWidth; x++) {
        const i = (y * pixelWidth + x) * 4;
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];

        if (a < 128) {
          row.push('transparent');
        } else {
          row.push(findClosestColor(r, g, b, extractedPalette));
        }
      }
      pixels.push(row);
    }

    const newPixelData = { width: pixelWidth, height: pixelHeight, pixels };
    setPixelData(newPixelData);

    // 히스토리 초기화
    setHistory([{ pixels: JSON.parse(JSON.stringify(pixels)) }]);
    setHistoryIndex(0);
  }, [originalImage, pixelSize, colorCount, quantizeColors, findClosestColor]);

  // 이미지 로드 시 자동 변환
  useEffect(() => {
    if (originalImage) {
      convertToPixelArt();
    }
  }, [originalImage, pixelSize, colorCount, convertToPixelArt]);

  // 캔버스에 픽셀 아트 그리기
  useEffect(() => {
    if (!pixelData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displayPixelSize = Math.max(4, Math.floor(400 / Math.max(pixelData.width, pixelData.height))) * zoom;

    canvas.width = pixelData.width * displayPixelSize;
    canvas.height = pixelData.height * displayPixelSize;

    ctx.imageSmoothingEnabled = false;

    // 배경 (체크무늬 - 투명 표시)
    for (let y = 0; y < pixelData.height; y++) {
      for (let x = 0; x < pixelData.width; x++) {
        const isLight = (x + y) % 2 === 0;
        ctx.fillStyle = isLight ? '#f0f0f0' : '#d0d0d0';
        ctx.fillRect(x * displayPixelSize, y * displayPixelSize, displayPixelSize, displayPixelSize);
      }
    }

    // 픽셀 그리기
    for (let y = 0; y < pixelData.height; y++) {
      for (let x = 0; x < pixelData.width; x++) {
        const color = pixelData.pixels[y][x];
        if (color !== 'transparent') {
          ctx.fillStyle = color;
          ctx.fillRect(x * displayPixelSize, y * displayPixelSize, displayPixelSize, displayPixelSize);
        }
      }
    }

    // 그리드 그리기
    if (showGrid && zoom >= 1) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;

      for (let x = 0; x <= pixelData.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * displayPixelSize, 0);
        ctx.lineTo(x * displayPixelSize, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y <= pixelData.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * displayPixelSize);
        ctx.lineTo(canvas.width, y * displayPixelSize);
        ctx.stroke();
      }
    }
  }, [pixelData, showGrid, zoom]);

  // 파일 업로드 처리
  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  // 드래그 앤 드롭
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 픽셀 편집
  const getPixelCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!pixelData || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const displayPixelSize = Math.max(4, Math.floor(400 / Math.max(pixelData.width, pixelData.height))) * zoom;

    const x = Math.floor((e.clientX - rect.left) / displayPixelSize);
    const y = Math.floor((e.clientY - rect.top) / displayPixelSize);

    if (x >= 0 && x < pixelData.width && y >= 0 && y < pixelData.height) {
      return { x, y };
    }
    return null;
  }, [pixelData, zoom]);

  const saveToHistory = useCallback(() => {
    if (!pixelData) return;

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ pixels: JSON.parse(JSON.stringify(pixelData.pixels)) });

    // 최대 50개 히스토리 유지
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [pixelData, history, historyIndex]);

  const paintPixel = useCallback((x: number, y: number) => {
    if (!pixelData) return;

    const newPixels = pixelData.pixels.map(row => [...row]);
    newPixels[y][x] = tool === 'eraser' ? 'transparent' : selectedColor;

    setPixelData({ ...pixelData, pixels: newPixels });
  }, [pixelData, tool, selectedColor]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getPixelCoords(e);
    if (coords) {
      setIsDrawing(true);
      paintPixel(coords.x, coords.y);
    }
  }, [getPixelCoords, paintPixel]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const coords = getPixelCoords(e);
    if (coords) {
      paintPixel(coords.x, coords.y);
    }
  }, [isDrawing, getPixelCoords, paintPixel]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing) {
      saveToHistory();
    }
    setIsDrawing(false);
  }, [isDrawing, saveToHistory]);

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0 && pixelData) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPixelData({
        ...pixelData,
        pixels: JSON.parse(JSON.stringify(history[newIndex].pixels))
      });
    }
  }, [historyIndex, history, pixelData]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1 && pixelData) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setPixelData({
        ...pixelData,
        pixels: JSON.parse(JSON.stringify(history[newIndex].pixels))
      });
    }
  }, [historyIndex, history, pixelData]);

  // 다운로드
  const downloadImage = useCallback(() => {
    if (!pixelData) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const exportPixelSize = 10; // 내보내기 시 픽셀 크기
    canvas.width = pixelData.width * exportPixelSize;
    canvas.height = pixelData.height * exportPixelSize;

    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < pixelData.height; y++) {
      for (let x = 0; x < pixelData.width; x++) {
        const color = pixelData.pixels[y][x];
        if (color !== 'transparent') {
          ctx.fillStyle = color;
          ctx.fillRect(x * exportPixelSize, y * exportPixelSize, exportPixelSize, exportPixelSize);
        }
      }
    }

    const link = document.createElement('a');
    link.download = 'pixel-art.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [pixelData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl flex items-center gap-2">
              🎨 픽셀 아트 변환기
            </CardTitle>
            <p className="text-gray-500 text-sm">사진을 업로드하여 레트로 감성의 픽셀 아트로 변환하세요!</p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 설정 패널 */}
          <Card className="lg:col-span-1">
            <CardContent className="pt-4 space-y-4">
              {/* 파일 업로드 */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  클릭하거나 이미지를 드래그하세요
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </div>

              {/* 픽셀 크기 */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  픽셀 크기: {pixelSize}px
                </label>
                <Slider
                  value={[pixelSize]}
                  onValueChange={([v]) => setPixelSize(v)}
                  min={2}
                  max={32}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  작을수록 더 세밀한 픽셀 아트
                </p>
              </div>

              {/* 색상 수 */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  색상 팔레트
                </label>
                <Select value={colorCount.toString()} onValueChange={(v) => setColorCount(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4색 (Game Boy)</SelectItem>
                    <SelectItem value="8">8색</SelectItem>
                    <SelectItem value="16">16색 (NES)</SelectItem>
                    <SelectItem value="32">32색</SelectItem>
                    <SelectItem value="64">64색</SelectItem>
                    <SelectItem value="128">128색</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 편집 도구 */}
              {pixelData && (
                <>
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium mb-2 block">편집 도구</label>
                    <div className="flex gap-2">
                      <Button
                        variant={tool === 'brush' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTool('brush')}
                      >
                        <Paintbrush className="w-4 h-4 mr-1" />
                        브러시
                      </Button>
                      <Button
                        variant={tool === 'eraser' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTool('eraser')}
                      >
                        <Eraser className="w-4 h-4 mr-1" />
                        지우개
                      </Button>
                    </div>
                  </div>

                  {/* 색상 선택 */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">현재 색상</label>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-10 h-10 rounded border-2 border-gray-300"
                        style={{ backgroundColor: selectedColor }}
                      />
                      <input
                        type="color"
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="w-10 h-10 cursor-pointer"
                      />
                    </div>

                    {/* 팔레트 */}
                    <div className="flex flex-wrap gap-1">
                      {palette.map((color, i) => (
                        <button
                          key={i}
                          className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${
                            selectedColor === color ? 'border-black' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedColor(color)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 보기 옵션 */}
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium mb-2 block">보기 옵션</label>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant={showGrid ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowGrid(!showGrid)}
                      >
                        <Grid className="w-4 h-4 mr-1" />
                        그리드
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <span className="text-sm self-center">{Math.round(zoom * 100)}%</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Undo/Redo */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={undo}
                      disabled={historyIndex <= 0}
                    >
                      <Undo className="w-4 h-4 mr-1" />
                      실행취소
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={redo}
                      disabled={historyIndex >= history.length - 1}
                    >
                      <Redo className="w-4 h-4 mr-1" />
                      다시실행
                    </Button>
                  </div>

                  {/* 다운로드 */}
                  <Button onClick={downloadImage} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    PNG로 다운로드
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* 캔버스 영역 */}
          <Card className="lg:col-span-2">
            <CardContent className="pt-4">
              <div
                ref={containerRef}
                className="flex items-center justify-center min-h-[400px] bg-gray-100 rounded-lg overflow-auto"
              >
                {pixelData ? (
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="cursor-crosshair"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">🖼️</div>
                    <p>이미지를 업로드하면 여기에 픽셀 아트가 표시됩니다</p>
                  </div>
                )}
              </div>

              {pixelData && (
                <div className="mt-2 text-sm text-gray-500 text-center">
                  {pixelData.width} × {pixelData.height} 픽셀 | {palette.length}색 팔레트
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 사용 팁 */}
        <Card className="mt-4">
          <CardContent className="pt-4">
            <h3 className="font-medium mb-2">💡 사용 팁</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>픽셀 크기</strong>를 줄이면 더 세밀한 픽셀 아트가 됩니다</li>
              <li>• <strong>색상 수</strong>를 줄이면 레트로 게임 느낌이 강해집니다 (4색 = Game Boy, 16색 = NES)</li>
              <li>• 캔버스를 클릭하거나 드래그하여 <strong>직접 편집</strong>할 수 있습니다</li>
              <li>• <strong>팔레트</strong>에서 색상을 선택하거나 컬러 피커로 새 색상을 지정하세요</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PixelArtConverter;
