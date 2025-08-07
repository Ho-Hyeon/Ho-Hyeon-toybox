import React, { useState, useEffect, useRef, useCallback } from 'react';

const metadata = {
  title: "리듬 타자 서커스 🎪",
  description: "타이핑 속도와 리듬에 맞춰 펼쳐지는 환상적인 서커스 공연!",
  type: "react" as const,
  author: "Claude",
  tags: ["interactive", "typing", "animation", "game"],
  dateCreated: new Date().toISOString().split('T')[0]
};

interface Performer {
  id: number;
  type: 'acrobat' | 'juggler' | 'clown' | 'tightrope';
  x: number;
  y: number;
  animation: string;
  scale: number;
}

interface Particle {
  id: number;
  type: 'firework' | 'confetti' | 'star';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const RhythmTypingCircus: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [wpm, setWpm] = useState(0);
  const [rhythmScore, setRhythmScore] = useState(0);
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [excitement, setExcitement] = useState(0);
  
  const lastKeyTime = useRef<number>(Date.now());
  const keyIntervals = useRef<number[]>([]);
  const startTime = useRef<number | null>(null);
  const charCount = useRef<number>(0);
  const performerIdCounter = useRef(0);
  const particleIdCounter = useRef(0);

  // 리듬 점수 계산
  const calculateRhythm = useCallback(() => {
    if (keyIntervals.current.length < 3) return 0;
    
    const recent = keyIntervals.current.slice(-10);
    const avg = recent.reduce((a, b) => a + b) / recent.length;
    const variance = recent.reduce((sum, interval) => 
      sum + Math.pow(interval - avg, 2), 0) / recent.length;
    
    const rhythmScore = Math.max(0, 100 - Math.sqrt(variance) * 2);
    return Math.round(rhythmScore);
  }, []);

  // WPM 계산
  const calculateWPM = useCallback(() => {
    if (!startTime.current || charCount.current === 0) return 0;
    
    const minutes = (Date.now() - startTime.current) / 60000;
    const words = charCount.current / 5;
    return Math.round(words / minutes);
  }, []);

  // 공연자 생성
  const spawnPerformer = useCallback((type: Performer['type']) => {
    const newPerformer: Performer = {
      id: performerIdCounter.current++,
      type,
      x: Math.random() * 80 + 10,
      y: Math.random() * 40 + 30,
      animation: 'bounce',
      scale: 0.8 + Math.random() * 0.4
    };
    
    setPerformers(prev => [...prev.slice(-4), newPerformer]);
  }, []);

  // 파티클 생성
  const createParticles = useCallback((type: Particle['type'], count: number) => {
    const newParticles: Particle[] = [];
    const colors = type === 'firework' 
      ? ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
      : ['#FFD700', '#FF69B4', '#00CED1', '#FF4500', '#32CD32', '#9370DB'];
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = type === 'firework' ? 2 + Math.random() * 3 : 1 + Math.random() * 2;
      
      newParticles.push({
        id: particleIdCounter.current++,
        type,
        x: 50 + (Math.random() - 0.5) * 30,
        y: type === 'firework' ? 70 : 20 + Math.random() * 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'firework' ? 2 : 0),
        life: 100,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    setParticles(prev => [...prev, ...newParticles].slice(-100));
  }, []);

  // 타이핑 핸들러
  const handleTyping = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setInputText(newText);
    
    if (!startTime.current) {
      startTime.current = Date.now();
    }
    
    if (newText.length > inputText.length) {
      charCount.current++;
      
      const now = Date.now();
      const interval = now - lastKeyTime.current;
      lastKeyTime.current = now;
      
      if (interval < 1000) {
        keyIntervals.current.push(interval);
        if (keyIntervals.current.length > 20) {
          keyIntervals.current.shift();
        }
      }
      
      const currentWPM = calculateWPM();
      const currentRhythm = calculateRhythm();
      
      setWpm(currentWPM);
      setRhythmScore(currentRhythm);
      
      // 흥분도 계산
      const newExcitement = Math.min(100, (currentWPM / 2) + (currentRhythm / 2));
      setExcitement(newExcitement);
      
      // 퍼포먼스 트리거
      if (currentWPM > 60) {
        spawnPerformer('acrobat');
      }
      if (currentRhythm > 70) {
        spawnPerformer('juggler');
        createParticles('star', 5);
      }
      if (currentWPM > 40 && Math.random() < 0.3) {
        spawnPerformer('clown');
      }
      if (currentRhythm > 80 && currentWPM > 50) {
        createParticles('firework', 20);
        setShowSpotlight(true);
        setTimeout(() => setShowSpotlight(false), 500);
      }
      if (Math.random() < 0.1) {
        createParticles('confetti', 10);
      }
    }
  }, [inputText, calculateWPM, calculateRhythm, spawnPerformer, createParticles]);

  // 파티클 애니메이션
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.2,
          life: p.life - 2
        }))
        .filter(p => p.life > 0 && p.y < 100)
      );
    }, 50);
    
    return () => clearInterval(interval);
  }, []);

  // 리셋
  const handleReset = () => {
    setInputText('');
    setWpm(0);
    setRhythmScore(0);
    setPerformers([]);
    setParticles([]);
    setExcitement(0);
    startTime.current = null;
    charCount.current = 0;
    keyIntervals.current = [];
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
      {/* 무대 조명 효과 */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${showSpotlight ? 'opacity-30' : 'opacity-0'}`}>
        <div className="absolute top-0 left-1/4 w-32 h-full bg-yellow-300 blur-3xl transform -skew-x-12" />
        <div className="absolute top-0 right-1/4 w-32 h-full bg-yellow-300 blur-3xl transform skew-x-12" />
      </div>
      
      {/* 별 배경 */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.5
            }}
          />
        ))}
      </div>

      {/* 서커스 텐트 */}
      <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
        <div className="relative">
          <div className="w-96 h-32 bg-red-600 transform perspective-1000 rotateX-10"
               style={{
                 clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                 filter: `brightness(${0.8 + excitement / 200})`
               }}>
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 opacity-50" />
          </div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-6xl animate-bounce"
               style={{ animationDuration: `${Math.max(0.5, 2 - excitement / 50)}s` }}>
            🎪
          </div>
        </div>
      </div>

      {/* 공연자들 */}
      <div className="absolute inset-0 pointer-events-none">
        {performers.map(performer => (
          <div
            key={performer.id}
            className="absolute text-4xl transition-all duration-300"
            style={{
              left: `${performer.x}%`,
              top: `${performer.y}%`,
              transform: `scale(${performer.scale})`,
              animation: performer.animation === 'bounce' 
                ? `bounce ${1 + Math.random()}s infinite`
                : 'none'
            }}
          >
            {performer.type === 'acrobat' && '🤸'}
            {performer.type === 'juggler' && '🤹'}
            {performer.type === 'clown' && '🤡'}
            {performer.type === 'tightrope' && '🎭'}
          </div>
        ))}
      </div>

      {/* 파티클 효과 */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute transition-none"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: particle.life / 100
            }}
          >
            {particle.type === 'firework' && (
              <div 
                className="w-2 h-2 rounded-full"
                style={{ 
                  backgroundColor: particle.color,
                  boxShadow: `0 0 6px ${particle.color}`
                }}
              />
            )}
            {particle.type === 'confetti' && (
              <div 
                className="w-3 h-3"
                style={{ 
                  backgroundColor: particle.color,
                  transform: `rotate(${particle.life * 3}deg)`
                }}
              />
            )}
            {particle.type === 'star' && (
              <div className="text-yellow-300 text-xl">✨</div>
            )}
          </div>
        ))}
      </div>

      {/* 스테이터스 바 */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-white">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="text-sm opacity-80">타이핑 속도</div>
          <div className="text-2xl font-bold">{wpm} WPM</div>
        </div>
        
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="text-sm opacity-80">리듬 점수</div>
          <div className="text-2xl font-bold">{rhythmScore}%</div>
        </div>
        
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="text-sm opacity-80">흥분도</div>
          <div className="flex items-center gap-2">
            <div className="w-32 h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 transition-all duration-300"
                style={{ width: `${excitement}%` }}
              />
            </div>
            <span className="text-xl">
              {excitement > 80 ? '🔥' : excitement > 50 ? '✨' : excitement > 20 ? '⭐' : '💫'}
            </span>
          </div>
        </div>
      </div>

      {/* 타이핑 영역 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
          <div className="mb-4 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">🎭 타이핑으로 서커스를 지휘하세요! 🎭</h2>
            <p className="text-sm opacity-80">
              빠르고 리듬감 있게 타이핑하면 환상적인 공연이 펼쳐집니다
            </p>
          </div>
          
          <textarea
            value={inputText}
            onChange={handleTyping}
            placeholder="여기에 타이핑을 시작하세요... 빠르게! 리듬감 있게!"
            className="w-full h-32 px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-white/50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
            style={{
              fontSize: '18px',
              lineHeight: '1.5'
            }}
          />
          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-white/80 text-sm">
              {inputText.length} 글자 | {Math.floor(inputText.length / 5)} 단어
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              🔄 다시 시작
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-center text-white/60 text-sm">
          💡 팁: 일정한 리듬으로 타이핑하면 저글러가 나타나고, 빠르게 치면 곡예사가 등장합니다!
        </div>
      </div>
    </div>
  );
};

export { metadata };
export default RhythmTypingCircus;