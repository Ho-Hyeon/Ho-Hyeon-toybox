import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Eraser, Play, Trophy, Brain, Timer, Sparkles } from 'lucide-react';

export const metadata = {
  title: "AI 그림 맞추기",
  description: "그림을 그리면 AI가 실시간으로 맞춰봅니다! Quick Draw 스타일의 재미있는 게임",
  type: "react" as const,
  author: "Claude",
  tags: ["ai", "game", "drawing", "tensorflow", "interactive", "machine-learning"],
  createdAt: "2024-12-24",
  updatedAt: "2024-12-24"
};

// Quick Draw 모델의 클래스 목록 (100개) - 모델과 순서 일치 필요
const CLASS_LIST = [
  'aircraft carrier', 'airplane', 'alarm clock', 'ambulance', 'angel',
  'animal migration', 'ant', 'anvil', 'apple', 'arm',
  'asparagus', 'axe', 'backpack', 'banana', 'bandage',
  'barn', 'baseball', 'baseball bat', 'basket', 'basketball',
  'bat', 'bathtub', 'beach', 'bear', 'beard',
  'bed', 'bee', 'belt', 'bench', 'bicycle',
  'binoculars', 'bird', 'birthday cake', 'blackberry', 'blueberry',
  'book', 'boomerang', 'bottlecap', 'bowtie', 'bracelet',
  'brain', 'bread', 'bridge', 'broccoli', 'broom',
  'bucket', 'bulldozer', 'bus', 'bush', 'butterfly',
  'cactus', 'cake', 'calculator', 'calendar', 'camel',
  'camera', 'camouflage', 'campfire', 'candle', 'cannon',
  'canoe', 'car', 'carrot', 'castle', 'cat',
  'ceiling fan', 'cell phone', 'cello', 'chair', 'chandelier',
  'church', 'circle', 'clarinet', 'clock', 'cloud',
  'coffee cup', 'compass', 'computer', 'cookie', 'cooler',
  'couch', 'cow', 'crab', 'crayon', 'crocodile',
  'crown', 'cruise ship', 'cup', 'diamond', 'dishwasher',
  'diving board', 'dog', 'dolphin', 'donut', 'door',
  'dragon', 'dresser', 'drill', 'drums', 'duck'
];

// 한국어 매핑
const KOREAN_NAMES: { [key: string]: string } = {
  'aircraft carrier': '항공모함',
  'airplane': '비행기',
  'alarm clock': '알람시계',
  'ambulance': '구급차',
  'angel': '천사',
  'ant': '개미',
  'anvil': '모루',
  'apple': '사과',
  'arm': '팔',
  'axe': '도끼',
  'backpack': '배낭',
  'banana': '바나나',
  'bandage': '붕대',
  'barn': '헛간',
  'baseball': '야구공',
  'baseball bat': '야구배트',
  'basket': '바구니',
  'basketball': '농구공',
  'bat': '박쥐',
  'bathtub': '욕조',
  'beach': '해변',
  'bear': '곰',
  'beard': '수염',
  'bed': '침대',
  'bee': '벌',
  'belt': '벨트',
  'bench': '벤치',
  'bicycle': '자전거',
  'binoculars': '쌍안경',
  'bird': '새',
  'birthday cake': '생일케이크',
  'book': '책',
  'boomerang': '부메랑',
  'bowtie': '나비넥타이',
  'bracelet': '팔찌',
  'brain': '뇌',
  'bread': '빵',
  'bridge': '다리',
  'broccoli': '브로콜리',
  'broom': '빗자루',
  'bucket': '양동이',
  'bulldozer': '불도저',
  'bus': '버스',
  'bush': '덤불',
  'butterfly': '나비',
  'cactus': '선인장',
  'cake': '케이크',
  'calculator': '계산기',
  'calendar': '달력',
  'camel': '낙타',
  'camera': '카메라',
  'campfire': '캠프파이어',
  'candle': '촛불',
  'cannon': '대포',
  'canoe': '카누',
  'car': '자동차',
  'carrot': '당근',
  'castle': '성',
  'cat': '고양이',
  'ceiling fan': '천장선풍기',
  'cell phone': '휴대폰',
  'cello': '첼로',
  'chair': '의자',
  'chandelier': '샹들리에',
  'church': '교회',
  'circle': '원',
  'clarinet': '클라리넷',
  'clock': '시계',
  'cloud': '구름',
  'coffee cup': '커피컵',
  'compass': '나침반',
  'computer': '컴퓨터',
  'cookie': '쿠키',
  'couch': '소파',
  'cow': '소',
  'crab': '게',
  'crayon': '크레용',
  'crocodile': '악어',
  'crown': '왕관',
  'cruise ship': '크루즈선',
  'cup': '컵',
  'diamond': '다이아몬드',
  'dog': '강아지',
  'dolphin': '돌고래',
  'donut': '도넛',
  'door': '문',
  'dragon': '용',
  'dresser': '서랍장',
  'drill': '드릴',
  'drums': '드럼',
  'duck': '오리'
};

// 게임에서 사용할 쉬운 단어들
const EASY_WORDS = [
  'apple', 'banana', 'car', 'cat', 'dog', 'bird', 'book', 'bus',
  'cake', 'clock', 'cloud', 'cup', 'door', 'duck', 'bed', 'bear',
  'bicycle', 'butterfly', 'camera', 'chair', 'cookie', 'crown',
  'donut', 'dragon', 'drums', 'umbrella', 'tree', 'sun', 'star', 'house'
];

// 게임에서 실제 사용할 단어 (모델이 지원하는 것만)
const GAME_WORDS = EASY_WORDS.filter(w => CLASS_LIST.includes(w));

type GameState = 'loading' | 'ready' | 'playing' | 'success' | 'failed' | 'error';

const AIQuickDraw: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [gameState, setGameState] = useState<GameState>('loading');
  const [currentWord, setCurrentWord] = useState<string>('');
  const [predictions, setPredictions] = useState<{ label: string; confidence: number }[]>([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('초기화 중...');
  const [hasDrawn, setHasDrawn] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPredictTime = useRef<number>(0);

  // Quick Draw 모델 로드
  useEffect(() => {
    const loadModel = async () => {
      try {
        setLoadingMessage('TensorFlow.js 초기화 중...');
        setLoadingProgress(10);
        await tf.ready();

        setLoadingMessage('Quick Draw 모델 다운로드 중...');
        setLoadingProgress(30);

        // 공개된 Quick Draw 모델 로드
        const modelUrl = 'https://raw.githubusercontent.com/zaidalyafeai/zaidalyafeai.github.io/master/sketcher/model2.json';

        const loadedModel = await tf.loadLayersModel(modelUrl, {
          onProgress: (fraction) => {
            setLoadingProgress(30 + Math.floor(fraction * 60));
          }
        });

        setLoadingMessage('모델 워밍업 중...');
        setLoadingProgress(95);

        // 모델 워밍업
        const dummyInput = tf.zeros([1, 28, 28, 1]);
        const warmupResult = loadedModel.predict(dummyInput) as tf.Tensor;
        await warmupResult.data();
        dummyInput.dispose();
        warmupResult.dispose();

        setLoadingProgress(100);
        setModel(loadedModel);
        setGameState('ready');
      } catch (error) {
        console.error('Model loading error:', error);
        setLoadingMessage('모델 로드 실패. 로컬 모델로 전환 중...');

        // 외부 모델 로드 실패 시 간단한 로컬 모델 생성
        try {
          const fallbackModel = createFallbackModel();
          setModel(fallbackModel);
          setGameState('ready');
        } catch (e) {
          setGameState('error');
        }
      }
    };

    loadModel();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 폴백 모델 생성 (외부 모델 로드 실패 시)
  const createFallbackModel = () => {
    const model = tf.sequential();
    model.add(tf.layers.conv2d({
      inputShape: [28, 28, 1],
      filters: 32,
      kernelSize: 3,
      activation: 'relu'
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    model.add(tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu' }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    model.add(tf.layers.dense({ units: CLASS_LIST.length, activation: 'softmax' }));
    model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });
    return model;
  };

  // 캔버스 초기화
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  // 게임 시작
  const startGame = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * GAME_WORDS.length);
    const word = GAME_WORDS[randomIndex];

    setCurrentWord(word);
    setTimeLeft(20);
    setGameState('playing');
    setPredictions([]);
    setHasDrawn(false);
    setRound(r => r + 1);
    initCanvas();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setGameState('failed');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [initCanvas]);

  // 캔버스 이미지를 텐서로 변환
  const getCanvasTensor = useCallback((): tf.Tensor | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 그림이 있는 영역 찾기 (바운딩 박스)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    let hasContent = false;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        // 검은색 픽셀 찾기 (그려진 부분)
        if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) {
          hasContent = true;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (!hasContent) return null;

    // 패딩 추가
    const padding = 20;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width, maxX + padding);
    maxY = Math.min(canvas.height, maxY + padding);

    // 정사각형으로 만들기
    const width = maxX - minX;
    const height = maxY - minY;
    const size = Math.max(width, height);
    const offsetX = (size - width) / 2;
    const offsetY = (size - height) / 2;

    // 28x28로 리사이즈
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 28;
    tempCanvas.height = 28;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return null;

    // 흰색 배경
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, 28, 28);

    // 중앙에 그림 배치
    tempCtx.drawImage(
      canvas,
      minX, minY, width, height,
      offsetX * 28 / size, offsetY * 28 / size,
      width * 28 / size, height * 28 / size
    );

    const resizedData = tempCtx.getImageData(0, 0, 28, 28);

    // 그레이스케일로 변환 및 정규화
    const grayscale = new Float32Array(28 * 28);
    for (let i = 0; i < 28 * 28; i++) {
      const r = resizedData.data[i * 4];
      const g = resizedData.data[i * 4 + 1];
      const b = resizedData.data[i * 4 + 2];
      // 반전: 흰색(255) -> 0, 검은색(0) -> 1
      grayscale[i] = 1 - (r + g + b) / 3 / 255;
    }

    return tf.tensor4d(grayscale, [1, 28, 28, 1]);
  }, []);

  // AI 예측
  const predict = useCallback(async () => {
    if (!model || gameState !== 'playing' || !hasDrawn) return;

    const now = Date.now();
    if (now - lastPredictTime.current < 300) return;
    lastPredictTime.current = now;

    try {
      const tensor = getCanvasTensor();
      if (!tensor) return;

      // 모델 예측
      const prediction = model.predict(tensor) as tf.Tensor;
      const probabilities = await prediction.data();

      tensor.dispose();
      prediction.dispose();

      // 상위 5개 예측 추출
      const indexed = Array.from(probabilities).map((prob, i) => ({
        label: CLASS_LIST[i] || `class_${i}`,
        confidence: prob as number
      }));

      indexed.sort((a, b) => b.confidence - a.confidence);
      const top5 = indexed.slice(0, 5);

      setPredictions(top5);

      // 정답 확인 - 상위 3개 안에 정답이 있고 신뢰도가 일정 이상이면 성공
      const correctPrediction = top5.findIndex(p => p.label === currentWord);
      if (correctPrediction === 0 && top5[0].confidence > 0.3) {
        if (timerRef.current) clearInterval(timerRef.current);
        setScore(s => s + Math.ceil(timeLeft * 10));
        setGameState('success');
      }
    } catch (error) {
      console.error('Prediction error:', error);
    }
  }, [model, gameState, hasDrawn, getCanvasTensor, currentWord, timeLeft]);

  // 그리기 중 주기적 예측
  useEffect(() => {
    if (gameState === 'playing' && hasDrawn) {
      const interval = setInterval(predict, 500);
      return () => clearInterval(interval);
    }
  }, [gameState, hasDrawn, predict]);

  // 마우스/터치 이벤트 핸들러
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== 'playing') return;

    const coords = getCoordinates(e);
    if (!coords) return;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || gameState !== 'playing') return;

    const coords = getCoordinates(e);
    if (!coords) return;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (hasDrawn) predict();
  };

  const clearCanvas = () => {
    initCanvas();
    setPredictions([]);
    setHasDrawn(false);
  };

  // 로딩 화면
  if (gameState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-indigo-500 animate-pulse" />
            <h2 className="text-xl font-bold mb-2">AI 모델 로딩 중...</h2>
            <p className="text-sm text-gray-500 mb-4">{loadingMessage}</p>
            <Progress value={loadingProgress} className="mb-2" />
            <p className="text-sm text-gray-500">{loadingProgress}%</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 에러 화면
  if (gameState === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-500 text-lg mb-4">모델 로딩에 실패했습니다.</p>
            <Button onClick={() => window.location.reload()}>다시 시도</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              AI 그림 맞추기
            </CardTitle>
            <p className="text-gray-500 text-sm">그림을 그리면 AI가 실시간으로 맞춰봅니다!</p>
          </CardHeader>
        </Card>

        {/* 점수 및 상태 */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <Trophy className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
              <p className="text-2xl font-bold">{score}</p>
              <p className="text-xs text-gray-500">점수</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Timer className="w-6 h-6 mx-auto mb-1 text-blue-500" />
              <p className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : ''}`}>
                {timeLeft}초
              </p>
              <p className="text-xs text-gray-500">남은 시간</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Brain className="w-6 h-6 mx-auto mb-1 text-purple-500" />
              <p className="text-2xl font-bold">{round}</p>
              <p className="text-xs text-gray-500">라운드</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 캔버스 영역 */}
          <Card className="lg:col-span-2">
            <CardContent className="pt-4">
              {/* 출제어 */}
              {gameState === 'playing' && (
                <div className="text-center mb-4">
                  <p className="text-lg">그려주세요:</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {KOREAN_NAMES[currentWord] || currentWord}
                  </p>
                  <p className="text-sm text-gray-400">({currentWord})</p>
                </div>
              )}

              {/* 시작 화면 */}
              {gameState === 'ready' && (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                  <h2 className="text-2xl font-bold mb-4">준비되셨나요?</h2>
                  <p className="text-gray-600 mb-6">
                    20초 안에 주어진 단어를 그려주세요!<br />
                    AI가 실시간으로 추측합니다.
                  </p>
                  <Button size="lg" onClick={startGame}>
                    <Play className="w-5 h-5 mr-2" />
                    게임 시작!
                  </Button>
                </div>
              )}

              {/* 성공 화면 */}
              {gameState === 'success' && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold text-green-600 mb-2">정답!</h2>
                  <p className="text-lg mb-4">
                    AI가 <strong>{KOREAN_NAMES[currentWord] || currentWord}</strong>을(를) 맞췄습니다!
                  </p>
                  <p className="text-gray-600 mb-6">+{Math.ceil(timeLeft * 10)}점</p>
                  <Button size="lg" onClick={startGame}>
                    <Play className="w-5 h-5 mr-2" />
                    다음 문제
                  </Button>
                </div>
              )}

              {/* 실패 화면 */}
              {gameState === 'failed' && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">😢</div>
                  <h2 className="text-2xl font-bold text-red-600 mb-2">시간 초과!</h2>
                  <p className="text-lg mb-4">
                    정답은 <strong>{KOREAN_NAMES[currentWord] || currentWord}</strong>이었습니다.
                  </p>
                  <Button size="lg" onClick={startGame}>
                    <Play className="w-5 h-5 mr-2" />
                    다시 도전
                  </Button>
                </div>
              )}

              {/* 캔버스 */}
              {(gameState === 'playing' || gameState === 'success' || gameState === 'failed') && (
                <>
                  <div className="flex justify-center mb-4">
                    <canvas
                      ref={canvasRef}
                      width={280}
                      height={280}
                      className={`border-2 rounded-lg bg-white touch-none ${
                        gameState === 'playing'
                          ? 'border-indigo-300 cursor-crosshair'
                          : 'border-gray-300'
                      }`}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>

                  {gameState === 'playing' && (
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" onClick={clearCanvas}>
                        <Eraser className="w-4 h-4 mr-2" />
                        지우기
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* AI 예측 패널 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI 추측
              </CardTitle>
            </CardHeader>
            <CardContent>
              {predictions.length > 0 ? (
                <div className="space-y-3">
                  {predictions.map((pred, i) => (
                    <div key={pred.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className={`font-medium ${
                          pred.label === currentWord ? 'text-green-600' : ''
                        }`}>
                          {i + 1}. {KOREAN_NAMES[pred.label] || pred.label}
                        </span>
                        <span className="text-gray-500">
                          {(pred.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={pred.confidence * 100}
                        className={`h-2 ${
                          pred.label === currentWord ? '[&>div]:bg-green-500' : ''
                        }`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>그림을 그리면<br />AI가 추측을 시작합니다</p>
                </div>
              )}

              {/* 가능한 단어 목록 */}
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm font-medium mb-2">그릴 수 있는 것들:</p>
                <div className="flex flex-wrap gap-1">
                  {GAME_WORDS.slice(0, 10).map(word => (
                    <span key={word} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {KOREAN_NAMES[word] || word}
                    </span>
                  ))}
                  {GAME_WORDS.length > 10 && (
                    <span className="text-xs text-gray-400">+{GAME_WORDS.length - 10}개</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 사용 팁 */}
        <Card className="mt-4">
          <CardContent className="pt-4">
            <h3 className="font-medium mb-2">💡 플레이 팁</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 간단하고 특징적인 형태로 그리세요 (디테일보다 전체 모양이 중요!)</li>
              <li>• 굵은 선으로 명확하게 그리세요</li>
              <li>• 빠르게 그릴수록 높은 점수를 얻습니다</li>
              <li>• AI는 실시간으로 여러분의 그림을 분석합니다</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIQuickDraw;
