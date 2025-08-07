import React, { useState, useEffect, useRef } from 'react';

const metadata = {
  title: "알고리즘 복잡도 레이싱 🏁",
  description: "시간 복잡도별 속도 차이를 시각적으로 체험하는 레이싱 게임",
  type: "react" as const,
  author: "Claude",
  tags: ["algorithm", "complexity", "educational", "interactive", "racing"],
  dateCreated: new Date().toISOString().split('T')[0]
};

interface Racer {
  id: string;
  name: string;
  complexity: string;
  emoji: string;
  color: string;
  position: number;
  speed: number;
  description: string;
  calculateSpeed: (n: number) => number;
}

const AlgorithmComplexityRacing: React.FC = () => {
  const [inputSize, setInputSize] = useState(10);
  const [isRacing, setIsRacing] = useState(false);
  const [raceTime, setRaceTime] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(false);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  
  const racers: Racer[] = [
    {
      id: 'o1',
      name: '상수 로켓',
      complexity: 'O(1)',
      emoji: '🚀',
      color: '#FF6B6B',
      position: 0,
      speed: 0,
      description: '입력 크기와 상관없이 항상 일정한 속도! (해시 테이블 접근)',
      calculateSpeed: (n: number) => 100
    },
    {
      id: 'ologn',
      name: '로그 스포츠카',
      complexity: 'O(log n)',
      emoji: '🏎️',
      color: '#4ECDC4',
      position: 0,
      speed: 0,
      description: '입력이 커져도 천천히 느려짐 (이진 탐색)',
      calculateSpeed: (n: number) => Math.max(10, 100 - Math.log2(n) * 15)
    },
    {
      id: 'on',
      name: '선형 자전거',
      complexity: 'O(n)',
      emoji: '🚴',
      color: '#45B7D1',
      position: 0,
      speed: 0,
      description: '입력에 비례해서 느려짐 (단순 반복문)',
      calculateSpeed: (n: number) => Math.max(5, 100 - n * 0.8)
    },
    {
      id: 'onlogn',
      name: '엔로그엔 오토바이',
      complexity: 'O(n log n)',
      emoji: '🏍️',
      color: '#96CEB4',
      position: 0,
      speed: 0,
      description: '효율적인 정렬 알고리즘의 속도 (병합 정렬)',
      calculateSpeed: (n: number) => Math.max(3, 100 - n * Math.log2(n) * 0.15)
    },
    {
      id: 'on2',
      name: '이차 거북이',
      complexity: 'O(n²)',
      emoji: '🐢',
      color: '#FFEAA7',
      position: 0,
      speed: 0,
      description: '입력의 제곱에 비례해서 느려짐 (중첩 반복문)',
      calculateSpeed: (n: number) => Math.max(1, 100 - (n * n) * 0.08)
    },
    {
      id: 'o2n',
      name: '지수 달팽이',
      complexity: 'O(2ⁿ)',
      emoji: '🐌',
      color: '#DDA0DD',
      position: 0,
      speed: 0,
      description: '기하급수적으로 느려짐 (부분집합 생성)',
      calculateSpeed: (n: number) => n <= 10 ? Math.max(0.1, 100 / Math.pow(2, n/2)) : 0.1
    }
  ];

  const [racerStates, setRacerStates] = useState(racers);
  const [chartData, setChartData] = useState<{n: number, values: Record<string, number>}[]>([]);

  // 차트 데이터 생성
  useEffect(() => {
    const data = [];
    for (let n = 1; n <= 50; n += 2) {
      const values: Record<string, number> = {};
      racers.forEach(racer => {
        values[racer.id] = racer.calculateSpeed(n);
      });
      data.push({ n, values });
    }
    setChartData(data);
  }, []);

  // 레이싱 애니메이션
  useEffect(() => {
    if (isRacing) {
      startTimeRef.current = Date.now();
      
      const animate = () => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setRaceTime(elapsed);
        
        setRacerStates(prevRacers => {
          const updated = prevRacers.map(racer => {
            const speed = racer.calculateSpeed(inputSize);
            const newPosition = Math.min(100, racer.position + speed * 0.05);
            
            // 승자 확인
            if (newPosition >= 100 && !winner) {
              setWinner(racer.name);
              setIsRacing(false);
            }
            
            return { ...racer, position: newPosition, speed };
          });
          
          return updated;
        });
        
        if (isRacing) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRacing, inputSize, winner]);

  const startRace = () => {
    setRacerStates(racers.map(r => ({ ...r, position: 0 })));
    setWinner(null);
    setRaceTime(0);
    setIsRacing(true);
  };

  const resetRace = () => {
    setIsRacing(false);
    setRacerStates(racers.map(r => ({ ...r, position: 0 })));
    setWinner(null);
    setRaceTime(0);
  };

  const getSpeedIndicator = (speed: number) => {
    if (speed > 80) return '⚡⚡⚡';
    if (speed > 50) return '⚡⚡';
    if (speed > 20) return '⚡';
    return '💤';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">알고리즘 복잡도 레이싱 🏁</h1>
          <p className="text-gray-300">입력 크기(n)를 조절하고 각 복잡도의 속도 차이를 확인해보세요!</p>
        </div>

        {/* 컨트롤 패널 */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex-1 w-full">
              <label className="text-white text-sm block mb-2">
                입력 크기 (n = {inputSize})
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={inputSize}
                  onChange={(e) => setInputSize(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  disabled={isRacing}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-yellow-300">
                {inputSize <= 10 && "📊 작은 입력: 모든 알고리즘이 빠름"}
                {inputSize > 10 && inputSize <= 30 && "📊 중간 입력: 복잡도 차이가 나타나기 시작"}
                {inputSize > 30 && inputSize <= 60 && "📊 큰 입력: O(n²)이 확실히 느려짐"}
                {inputSize > 60 && "📊 매우 큰 입력: 효율적인 알고리즘만 살아남음"}
              </div>
            </div>
            
            <div className="flex gap-4 items-center">
              <button
                onClick={startRace}
                disabled={isRacing}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
              >
                {isRacing ? '레이싱 중...' : '🏁 시작!'}
              </button>
              <button
                onClick={resetRace}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors"
              >
                🔄 리셋
              </button>
              <button
                onClick={() => setShowChart(!showChart)}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg transition-colors"
              >
                📈 {showChart ? '레이스' : '차트'}
              </button>
            </div>
          </div>
          
          {raceTime > 0 && (
            <div className="mt-4 text-center">
              <span className="text-white text-lg">⏱️ 경과 시간: {raceTime.toFixed(1)}초</span>
            </div>
          )}
        </div>

        {/* 레이싱 트랙 또는 차트 */}
        {!showChart ? (
          <div className="space-y-4">
            {racerStates.map((racer, index) => (
              <div key={racer.id} className="bg-black/30 backdrop-blur-md rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{racer.emoji}</span>
                    <div>
                      <div className="text-white font-bold">{racer.name}</div>
                      <div className="text-sm" style={{ color: racer.color }}>
                        {racer.complexity}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-sm">
                      속도: {racer.speed.toFixed(1)}
                    </div>
                    <div className="text-lg">{getSpeedIndicator(racer.speed)}</div>
                  </div>
                </div>
                
                {/* 레이싱 트랙 */}
                <div className="relative h-12 bg-gray-800 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center">
                    {/* 트랙 라인 */}
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute h-full w-px bg-gray-600"
                        style={{ left: `${(i + 1) * 10}%` }}
                      />
                    ))}
                  </div>
                  
                  {/* 레이서 */}
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 text-3xl transition-all duration-100"
                    style={{
                      left: `${racer.position}%`,
                      transform: `translateX(-50%) translateY(-50%)`,
                    }}
                  >
                    {racer.emoji}
                    {racer.position >= 100 && winner === racer.name && (
                      <span className="ml-2 text-yellow-400">🏆</span>
                    )}
                  </div>
                  
                  {/* 피니시 라인 */}
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-r from-white to-black opacity-50" />
                </div>
                
                <div className="mt-2 text-xs text-gray-400">{racer.description}</div>
              </div>
            ))}
          </div>
        ) : (
          /* 성능 차트 */
          <div className="bg-black/30 backdrop-blur-md rounded-xl p-6">
            <h3 className="text-white text-xl font-bold mb-4">복잡도별 성능 비교 차트</h3>
            <div className="relative h-64 bg-gray-800 rounded-lg p-4">
              <div className="absolute bottom-4 left-4 right-4 top-4">
                {/* Y축 레이블 */}
                <div className="absolute left-0 top-0 text-xs text-gray-400">빠름</div>
                <div className="absolute left-0 bottom-0 text-xs text-gray-400">느림</div>
                
                {/* X축 레이블 */}
                <div className="absolute bottom-0 left-0 text-xs text-gray-400">n=1</div>
                <div className="absolute bottom-0 right-0 text-xs text-gray-400">n=50</div>
                
                {/* 차트 라인 */}
                <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {racers.map((racer) => {
                    const points = chartData.map((data, i) => {
                      const x = (i / (chartData.length - 1)) * 100;
                      const y = 100 - data.values[racer.id];
                      return `${x},${y}`;
                    }).join(' ');
                    
                    return (
                      <polyline
                        key={racer.id}
                        points={points}
                        fill="none"
                        stroke={racer.color}
                        strokeWidth="2"
                        opacity="0.8"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
            
            {/* 범례 */}
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {racers.map(racer => (
                <div key={racer.id} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: racer.color }}
                  />
                  <span className="text-sm text-white">{racer.complexity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 우승자 발표 */}
        {winner && (
          <div className="mt-6 text-center">
            <div className="inline-block bg-yellow-500/20 backdrop-blur-md rounded-xl p-6 border-2 border-yellow-400">
              <h2 className="text-3xl font-bold text-yellow-400 mb-2">🏆 우승! 🏆</h2>
              <p className="text-white text-xl">{winner}이(가) 1등으로 도착했습니다!</p>
              <p className="text-gray-300 mt-2">입력 크기 n={inputSize}에서의 결과입니다</p>
            </div>
          </div>
        )}

        {/* 교육 정보 */}
        <div className="mt-8 bg-black/30 backdrop-blur-md rounded-xl p-6">
          <h3 className="text-white text-xl font-bold mb-4">💡 알고리즘 복잡도란?</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="text-white font-semibold mb-2">빠른 복잡도 (추천)</h4>
              <ul className="space-y-1">
                <li>• <span className="text-red-400">O(1)</span>: 상수 시간 - 가장 빠름</li>
                <li>• <span className="text-cyan-400">O(log n)</span>: 로그 시간 - 매우 효율적</li>
                <li>• <span className="text-blue-400">O(n)</span>: 선형 시간 - 적절함</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">느린 복잡도 (주의)</h4>
              <ul className="space-y-1">
                <li>• <span className="text-green-400">O(n log n)</span>: 준선형 - 정렬에 적합</li>
                <li>• <span className="text-yellow-400">O(n²)</span>: 이차 시간 - 작은 입력만</li>
                <li>• <span className="text-purple-400">O(2ⁿ)</span>: 지수 시간 - 피해야 함</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-500/20 rounded-lg">
            <p className="text-blue-300 text-sm">
              💡 <strong>Pro Tip:</strong> 실제 개발에서는 O(n log n) 이하의 복잡도를 목표로 하세요. 
              n이 1000만 넘어가면 O(n²)은 실용적이지 않습니다!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { metadata };
export default AlgorithmComplexityRacing;