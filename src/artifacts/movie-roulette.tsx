import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Moon, Sun, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const metadata = {
  title: "영화 추천 룰렛",
  description: "실제 룰렛 휠이 돌아가는 멋진 애니메이션과 함께 영화를 추천받아보세요! 신비한 이스터에그들이 잔뜩 숨어있어요 🎡🎬",
  type: "react" as const,
  tags: ["entertainment", "movies", "random", "interactive", "animation"]
};

interface Movie {
  id: number;
  title: string;
  genre: string[];
  year: number;
  rating: number;
  director: string;
  plot: string;
  isEasterEgg?: boolean;
  easterEggType?: 'konami' | 'time' | 'click' | 'secret';
}

const EASTER_EGG_MOVIES: Movie[] = [
  {
    id: 9999,
    title: "클로드의 비밀일기",
    genre: ["AI", "로맨스"],
    year: 2024,
    rating: 9.9,
    director: "Anthropic Studios",
    plot: "한 AI가 인간과 사랑에 빠지는 감동적인 이야기... 근데 사실 이건 제가 지어낸 거예요 😅",
    isEasterEgg: true,
    easterEggType: 'konami'
  },
  {
    id: 9998,
    title: "새벽 3시의 영화관",
    genre: ["호러", "미스터리"],
    year: 2023,
    rating: 8.8,
    director: "시계 귀신",
    plot: "새벽 3시에만 나타나는 신비한 영화관의 이야기... 지금이 바로 그 시간이군요! 👻",
    isEasterEgg: true,
    easterEggType: 'time'
  },
  {
    id: 9997,
    title: "100번째 클릭의 기적",
    genre: ["판타지", "코미디"],
    year: 2022,
    rating: 7.7,
    director: "마우스 마법사",
    plot: "100번째 클릭에 숨겨진 마법의 힘! 당신이 바로 그 주인공입니다! ✨",
    isEasterEgg: true,
    easterEggType: 'click'
  }
];

const MOVIES: Movie[] = [
  { id: 1, title: "인셉션", genre: ["SF", "액션"], year: 2010, rating: 8.8, director: "크리스토퍼 놀란", plot: "꿈 속의 꿈, 현실과 환상의 경계를 탐험하는 마인드 벤딩 스릴러" },
  { id: 2, title: "타이타닉", genre: ["로맨스", "드라마"], year: 1997, rating: 7.8, director: "제임스 카메론", plot: "거대한 여객선에서 펼쳐지는 불멸의 사랑 이야기" },
  { id: 3, title: "어벤져스: 엔드게임", genre: ["액션", "SF"], year: 2019, rating: 8.4, director: "루소 형제", plot: "마블 슈퍼히어로들의 최후의 전투를 그린 대서사시" },
  { id: 4, title: "기생충", genre: ["드라마", "스릴러"], year: 2019, rating: 8.6, director: "봉준호", plot: "계층 갈등을 날카롭게 다룬 한국 영화의 걸작" },
  { id: 5, title: "라라랜드", genre: ["뮤지컬", "로맨스"], year: 2016, rating: 8.0, director: "데이미언 차젤레", plot: "로스앤젤레스를 배경으로 한 현대적 뮤지컬 로맨스" },
  { id: 6, title: "조커", genre: ["드라마", "크라임"], year: 2019, rating: 8.4, director: "토드 필립스", plot: "고담시 최고의 악역 조커의 탄생 이야기" },
  { id: 7, title: "겨울왕국 2", genre: ["애니메이션", "가족"], year: 2019, rating: 6.8, director: "크리스 벅", plot: "엘사와 안나 자매의 새로운 모험과 성장 이야기" },
  { id: 8, title: "블랙 위도우", genre: ["액션", "어드벤처"], year: 2021, rating: 6.7, director: "케이트 쇼틀랜드", plot: "나타샤 로마노프의 과거를 다룬 마블 영화" },
  { id: 9, title: "덩케르크", genre: ["전쟁", "드라마"], year: 2017, rating: 7.8, director: "크리스토퍼 놀란", plot: "제2차 세계대전 덩케르크 철수작전을 그린 전쟁 영화" },
  { id: 10, title: "위대한 개츠비", genre: ["드라마", "로맨스"], year: 2013, rating: 7.2, director: "바즈 루어만", plot: "1920년대 미국을 배경으로 한 사랑과 욕망의 이야기" },
  { id: 11, title: "매드 맥스: 분노의 도로", genre: ["액션", "SF"], year: 2015, rating: 8.1, director: "조지 밀러", plot: "포스트 아포칼립스 세계에서 벌어지는 추격전" },
  { id: 12, title: "인터스텔라", genre: ["SF", "드라마"], year: 2014, rating: 8.6, director: "크리스토퍼 놀란", plot: "인류를 구하기 위한 우주 여행을 그린 SF 대작" },
  { id: 13, title: "원스 어폰 어 타임 인 할리우드", genre: ["코미디", "드라마"], year: 2019, rating: 7.6, director: "쿠엔틴 타란티노", plot: "1969년 할리우드를 배경으로 한 타란티노의 작품" },
  { id: 14, title: "토이 스토리 4", genre: ["애니메이션", "가족"], year: 2019, rating: 7.7, director: "조시 쿨리", plot: "우디와 장난감 친구들의 마지막 모험" },
  { id: 15, title: "존 윅", genre: ["액션", "스릴러"], year: 2014, rating: 7.4, director: "채드 스타헬스키", plot: "은퇴한 킬러의 복수를 그린 액션 영화" },
  { id: 16, title: "월-E", genre: ["애니메이션", "SF"], year: 2008, rating: 8.4, director: "앤드류 스탠턴", plot: "로봇 월-E가 지구를 구하는 디즈니 픽사 애니메이션" },
  { id: 17, title: "스파이더맨: 뉴 유니버스", genre: ["애니메이션", "액션"], year: 2018, rating: 8.4, director: "피터 램지", plot: "여러 차원의 스파이더맨들이 만나는 애니메이션" },
  { id: 18, title: "쇼생크 탈출", genre: ["드라마"], year: 1994, rating: 9.3, director: "프랭크 다라본트", plot: "희망을 잃지 않는 한 남자의 감동적인 이야기" },
  { id: 19, title: "펄프 픽션", genre: ["크라임", "드라마"], year: 1994, rating: 8.9, director: "쿠엔틴 타란티노", plot: "비선형적 구조로 이루어진 타란티노의 걸작" },
  { id: 20, title: "포레스트 검프", genre: ["드라마", "로맨스"], year: 1994, rating: 8.8, director: "로버트 저메키스", plot: "순수한 마음을 가진 한 남자의 인생 여정" }
];

const GENRES = ["액션", "드라마", "코미디", "로맨스", "SF", "스릴러", "호러", "애니메이션", "가족", "전쟁", "크라임", "뮤지컬", "어드벤처", "판타지", "미스터리"];

export default function MovieRoulette() {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [yearRange, setYearRange] = useState<number[]>([1990, 2024]);
  const [minRating, setMinRating] = useState<number[]>([6.0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [spinCount, setSpinCount] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [konamiCode, setKonamiCode] = useState<string[]>([]);
  const [secretMode, setSecretMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('movie-roulette-dark-mode') === 'true';
    }
    return false;
  });
  const [rouletteRotation, setRouletteRotation] = useState(0);
  const [showRoulette, setShowRoulette] = useState(false);
  const [currentFilteredMovies, setCurrentFilteredMovies] = useState<Movie[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const KONAMI_SEQUENCE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('movie-roulette-dark-mode', isDarkMode.toString());
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const newSequence = [...konamiCode, event.code].slice(-10);
      setKonamiCode(newSequence);
      
      if (newSequence.join(',') === KONAMI_SEQUENCE.join(',')) {
        setSecretMode(true);
        setKonamiCode([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [konamiCode]);

  const getFilteredMovies = useCallback(() => {
    let movies = [...MOVIES];
    
    if (secretMode) {
      movies = [...movies, ...EASTER_EGG_MOVIES];
    }

    const hour = currentTime.getHours();
    if (hour >= 3 && hour < 4) {
      const timeEasterEgg = EASTER_EGG_MOVIES.find(m => m.easterEggType === 'time');
      if (timeEasterEgg && !movies.some(m => m.id === timeEasterEgg.id)) {
        movies.push(timeEasterEgg);
      }
    }

    if (clickCount >= 100) {
      const clickEasterEgg = EASTER_EGG_MOVIES.find(m => m.easterEggType === 'click');
      if (clickEasterEgg && !movies.some(m => m.id === clickEasterEgg.id)) {
        movies.push(clickEasterEgg);
      }
    }

    return movies.filter(movie => {
      const genreMatch = selectedGenres.length === 0 || 
        movie.genre.some(g => selectedGenres.includes(g));
      const yearMatch = movie.year >= yearRange[0] && movie.year <= yearRange[1];
      const ratingMatch = movie.rating >= minRating[0];
      
      return genreMatch && yearMatch && ratingMatch;
    });
  }, [selectedGenres, yearRange, minRating, secretMode, currentTime, clickCount]);

  const spinRoulette = () => {
    setIsSpinning(true);
    setClickCount(prev => prev + 1);
    setSpinCount(prev => prev + 1);
    setShowRoulette(true);
    
    const filteredMovies = getFilteredMovies();
    setCurrentFilteredMovies(filteredMovies);
    
    if (filteredMovies.length === 0) {
      setTimeout(() => {
        setSelectedMovie({
          id: 0,
          title: "조건에 맞는 영화가 없어요!",
          genre: ["없음"],
          year: 0,
          rating: 0,
          director: "필터 조정해주세요",
          plot: "선택한 조건을 조금 완화해보시는 건 어떨까요? 🤔"
        });
        setIsSpinning(false);
        setShowRoulette(false);
      }, 2000);
      return;
    }

    let spinDuration = 3000;
    let spinRotations = 5;
    
    if (spinCount === 7) {
      spinDuration = 8000;
      spinRotations = 12;
    } else if (spinCount === 13) {
      spinDuration = 500;
      spinRotations = 1;
    } else if (spinCount % 10 === 0) {
      spinDuration = 5000;
      spinRotations = 8;
    }

    const selectedIndex = Math.floor(Math.random() * filteredMovies.length);
    const anglePerSlice = 360 / filteredMovies.length;
    // 선택된 영화의 중심 각도 계산
    const selectedMovieAngle = selectedIndex * anglePerSlice + anglePerSlice / 2;
    
    // 현재 룰렛의 회전 상태를 고려한 계산
    const currentRotation = rouletteRotation % 360;
    const currentMovieAtTop = (270 - currentRotation + 360) % 360;
    
    // 선택된 영화를 270도(화살표 위치)로 이동시키기 위한 회전량
    const rotationNeeded = (270 - selectedMovieAngle - currentRotation + 720) % 360;
    const finalRotation = spinRotations * 360 + rotationNeeded;
    
    // 디버깅을 위한 로그
    console.log('🎬 룰렛 디버깅 정보:');
    console.log(`- 전체 영화 개수: ${filteredMovies.length}개`);
    console.log(`- 영화별 각도: ${anglePerSlice}도`);
    console.log('');
    console.log('🔄 현재 회전 상태:');
    console.log(`- 누적 회전 각도: ${rouletteRotation}도`);
    console.log(`- 현재 회전 각도 (0-360): ${currentRotation}도`);
    console.log(`- 현재 맨 위(270도)에 있는 각도: ${currentMovieAtTop}도`);
    console.log('');
    console.log('📐 룰렛의 모든 영화 배치:');
    filteredMovies.forEach((movie, index) => {
      const startAngle = index * anglePerSlice;
      const endAngle = (index + 1) * anglePerSlice;
      const centerAngle = startAngle + anglePerSlice / 2;
      const isCurrentlyAtTop = currentMovieAtTop >= startAngle && currentMovieAtTop < endAngle;
      console.log(`  [${index}] "${movie.title}" ${isCurrentlyAtTop ? '👈 현재 맨 위' : ''}`);
      console.log(`      범위: ${startAngle}° ~ ${endAngle}° (중심: ${centerAngle}°)`);
    });
    console.log('');
    console.log(`🎯 선택된 정보:`);
    console.log(`- 선택된 인덱스: ${selectedIndex}`);
    console.log(`- 선택된 영화: "${filteredMovies[selectedIndex].title}"`);
    console.log(`- 선택된 영화의 중심 각도: ${selectedMovieAngle}도`);
    console.log(`- 필요한 회전량: ${rotationNeeded}도`);
    console.log(`- 최종 회전량 (스핀 포함): ${finalRotation}도`);
    console.log(`- 화살표 위치: 270도 (12시 방향)`);
    console.log('---');
    
    setRouletteRotation(prev => prev + finalRotation);

    setTimeout(() => {
      let selectedMovie = filteredMovies[selectedIndex];
      
      if (spinCount === 42) {
        selectedMovie = {
          id: 42,
          title: "생명, 우주 그리고 모든 것",
          genre: ["SF", "철학"],
          year: 1979,
          rating: 4.2,
          director: "더글러스 애덤스",
          plot: "42... 모든 것의 답이죠! 당신도 이제 우주의 비밀을 알았네요! 🌌",
          isEasterEgg: true
        };
      }
      
      console.log(`✅ 최종적으로 표시될 영화: "${selectedMovie.title}"`);
      console.log('================================');
      
      setSelectedMovie(selectedMovie);
      setIsSpinning(false);
      
      setTimeout(() => {
        setShowRoulette(false);
      }, 1000);
    }, spinDuration);
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const resetFilters = () => {
    setSelectedGenres([]);
    setYearRange([1990, 2024]);
    setMinRating([6.0]);
    setClickCount(prev => prev + 1);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    setClickCount(prev => prev + 1);
  };

  const getSpinButtonText = () => {
    if (isSpinning) {
      if (spinCount === 7) return "행운의 7번째... 🍀";
      if (spinCount === 13) return "13번째는 번개처럼! ⚡";
      return "룰렛이 돌고 있어요...";
    }
    
    if (spinCount === 0) return "🎬 영화 추천받기!";
    if (spinCount >= 100) return "🔥 100번 달성! 영화 마스터!";
    if (spinCount >= 50) return "🌟 영화 중독자시군요!";
    if (spinCount >= 20) return "🎯 또 다른 추천!";
    if (spinCount === 42) return "🌌 우주의 답을 찾아서...";
    
    return "🎲 다시 돌리기!";
  };

  const getSpecialMessage = () => {
    const messages = [];
    
    if (secretMode) messages.push("🎉 시크릿 모드 활성화! 숨겨진 영화들이 나타났어요!");
    if (clickCount >= 100) messages.push("🏆 클릭 100번 달성! 당신은 진정한 영화광이군요!");
    if (spinCount === 42) messages.push("🤖 42번째 스핀... 은하수를 여행하는 히치하이커를 위한 안내서를 읽으셨나요?");
    if (spinCount >= 77) messages.push("🎰 라스베가스도 울고 갈 운!");
    if (isDarkMode && spinCount === 0) messages.push("🦇 다크모드에서 더 몰입감 있는 영화 체험을!");
    
    const hour = currentTime.getHours();
    if (hour >= 3 && hour < 4) messages.push("🌙 새벽 3시... 무서운 영화가 더 잘 나올 시간이에요!");
    if (isDarkMode && hour >= 22) messages.push("🌃 밤에는 다크모드가 최고죠!");
    
    return messages;
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900' 
        : 'bg-gradient-to-br from-purple-50 to-pink-50'
    }`}>
      <Card className={`mb-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1"></div>
            <CardTitle className={`text-3xl text-center bg-gradient-to-r ${
              isDarkMode 
                ? 'from-purple-400 to-pink-400' 
                : 'from-purple-600 to-pink-600'
            } bg-clip-text text-transparent`}>
              🎬 영화 추천 룰렛
            </CardTitle>
            <div className="flex-1 flex justify-end">
              <Button
                onClick={toggleDarkMode}
                variant="ghost"
                size="sm"
                className={`p-2 ${isDarkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                title={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </Button>
            </div>
          </div>
          <p className={`text-center mt-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            당신만을 위한 완벽한 영화를 찾아드립니다!
            {secretMode && " ✨ 시크릿 모드 ON!"}
          </p>
        </CardHeader>
      </Card>

      {getSpecialMessage().map((message, index) => (
        <Card key={index} className={`mb-4 ${
          isDarkMode 
            ? 'border-yellow-600 bg-yellow-900/20 backdrop-blur-sm' 
            : 'border-yellow-300 bg-yellow-50'
        }`}>
          <CardContent className="pt-4">
            <p className={`text-center font-medium ${
              isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
            }`}>{message}</p>
          </CardContent>
        </Card>
      ))}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <CardHeader>
            <CardTitle className={isDarkMode ? 'text-gray-100' : ''}>🎭 장르 선택</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {GENRES.map(genre => (
                <div key={genre} className="flex items-center space-x-2">
                  <Checkbox
                    id={genre}
                    checked={selectedGenres.includes(genre)}
                    onCheckedChange={() => handleGenreToggle(genre)}
                  />
                  <label htmlFor={genre} className={`text-sm cursor-pointer ${
                    isDarkMode ? 'text-gray-300' : ''
                  }`}>
                    {genre}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <CardHeader>
            <CardTitle className={isDarkMode ? 'text-gray-100' : ''}>⚙️ 상세 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className={`text-sm font-medium mb-2 block ${
                isDarkMode ? 'text-gray-300' : ''
              }`}>
                📅 개봉년도: {yearRange[0]}년 - {yearRange[1]}년
              </label>
              <Slider
                value={yearRange}
                onValueChange={setYearRange}
                min={1990}
                max={2024}
                step={1}
                className="w-full"
              />
            </div>
            
            <div>
              <label className={`text-sm font-medium mb-2 block ${
                isDarkMode ? 'text-gray-300' : ''
              }`}>
                ⭐ 최소 평점: {minRating[0].toFixed(1)}점 이상
              </label>
              <Slider
                value={minRating}
                onValueChange={setMinRating}
                min={1.0}
                max={10.0}
                step={0.1}
                className="w-full"
              />
            </div>

            <Button onClick={resetFilters} variant="outline" className="w-full">
              🔄 필터 초기화
            </Button>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {showRoulette && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="relative">
              <RouletteWheel 
                movies={currentFilteredMovies}
                rotation={rouletteRotation}
                isSpinning={isSpinning}
                isDarkMode={isDarkMode}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className={`mb-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
        <CardContent className="pt-6">
          <div className="text-center">
            <Button
              onClick={spinRoulette}
              disabled={isSpinning}
              size="lg"
              className={`text-xl px-8 py-4 ${
                isSpinning 
                  ? 'animate-pulse bg-gradient-to-r from-purple-400 to-pink-400' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
              }`}
            >
              <Play className="mr-2" size={20} />
              {getSpinButtonText()}
            </Button>
            
            {(spinCount > 0 || clickCount > 0) && (
              <div className={`mt-4 flex justify-center space-x-4 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <span>🎲 스핀: {spinCount}번</span>
                <span>👆 클릭: {clickCount}번</span>
                {secretMode && <span>🔓 시크릿 모드</span>}
                {isDarkMode && <span>🌙 다크모드</span>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedMovie && (
        <Card className={`mb-6 shadow-lg ${
          selectedMovie.isEasterEgg 
            ? isDarkMode 
              ? 'border-yellow-600 bg-gradient-to-br from-yellow-900/30 to-orange-900/30 backdrop-blur-sm'
              : 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50'
            : isDarkMode 
              ? 'bg-gray-800 border-gray-700'
              : ''
        }`}>
          <CardHeader>
            <CardTitle className={`text-2xl text-center flex items-center justify-center gap-2 ${
              isDarkMode ? 'text-gray-100' : ''
            }`}>
              {selectedMovie.isEasterEgg && "🎊 "}
              {selectedMovie.title}
              {selectedMovie.isEasterEgg && " 🎊"}
            </CardTitle>
            {selectedMovie.director !== "필터 조정해주세요" && (
              <div className="flex justify-center space-x-2 flex-wrap">
                {selectedMovie.genre.map(g => (
                  <Badge key={g} variant="secondary">{g}</Badge>
                ))}
              </div>
            )}
          </CardHeader>
          
          {selectedMovie.director !== "필터 조정해주세요" && (
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <p className={isDarkMode ? 'text-gray-300' : ''}><strong>🎬 감독:</strong> {selectedMovie.director}</p>
                  <p className={isDarkMode ? 'text-gray-300' : ''}><strong>📅 개봉년도:</strong> {selectedMovie.year}년</p>
                  <p className={isDarkMode ? 'text-gray-300' : ''}><strong>⭐ 평점:</strong> {selectedMovie.rating}/10</p>
                </div>
              </div>
              
              <div className={`border-t pt-4 ${
                isDarkMode ? 'border-gray-600' : ''
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  isDarkMode ? 'text-gray-200' : ''
                }`}>📖 줄거리:</h4>
                <p className={`leading-relaxed ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>{selectedMovie.plot}</p>
              </div>
              
              {selectedMovie.isEasterEgg && (
                <div className={`mt-4 p-3 border rounded-lg ${
                  isDarkMode 
                    ? 'bg-yellow-900/30 border-yellow-600' 
                    : 'bg-yellow-100 border-yellow-300'
                }`}>
                  <p className={`text-center font-medium ${
                    isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                  }`}>
                    🎉 축하합니다! 숨겨진 영화를 발견했어요! 
                    {selectedMovie.easterEggType === 'konami' && " (코나미 코드 사용)"}
                    {selectedMovie.easterEggType === 'time' && " (새벽 3시 보너스)"}
                    {selectedMovie.easterEggType === 'click' && " (100클릭 달성)"}
                  </p>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      <Card className={`text-center text-sm ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700 text-gray-400' 
          : 'text-gray-500'
      }`}>
        <CardContent className="pt-4">
          <p>💡 팁: ↑↑↓↓←→←→BA 를 입력해보세요!</p>
          <p>🕒 현재 시간: {currentTime.toLocaleTimeString()}</p>
          <p>{isDarkMode ? "🌙" : "☀️"} {isDarkMode ? "다크" : "라이트"} 모드</p>
          {clickCount >= 80 && clickCount < 100 && (
            <p className={`font-medium ${
              isDarkMode ? 'text-orange-400' : 'text-orange-600'
            }`}>
              🔥 {100 - clickCount}번만 더 클릭하면 특별한 일이...!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface RouletteWheelProps {
  movies: Movie[];
  rotation: number;
  isSpinning: boolean;
  isDarkMode: boolean;
}

function RouletteWheel({ movies, rotation, isSpinning, isDarkMode }: RouletteWheelProps) {
  const wheelSize = 400;
  const centerX = wheelSize / 2;
  const centerY = wheelSize / 2;
  const radius = wheelSize / 2 - 40;
  
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ];
  
  const darkColors = [
    '#E74C3C', '#16A085', '#2980B9', '#27AE60', '#F39C12',
    '#8E44AD', '#2C3E50', '#D35400', '#C0392B', '#7F8C8D',
    '#E67E22', '#1ABC9C', '#3498DB', '#9B59B6', '#34495E'
  ];
  
  const currentColors = isDarkMode ? darkColors : colors;
  
  if (movies.length === 0) {
    return (
      <div className="flex items-center justify-center w-96 h-96 rounded-full bg-gray-200 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">영화가 없습니다</p>
      </div>
    );
  }
  
  const anglePerSlice = 360 / movies.length;
  
  return (
    <div className="relative flex items-center justify-center">
      <motion.svg
        width={wheelSize}
        height={wheelSize}
        className="drop-shadow-2xl"
        animate={{ 
          rotate: rotation,
        }}
        transition={{ 
          duration: isSpinning ? 3 : 0,
          ease: isSpinning ? [0.23, 1, 0.32, 1] : "linear",
        }}
      >
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.3"/>
          </filter>
        </defs>
        
        <g filter="url(#shadow)">
          {movies.map((movie, index) => {
            const startAngle = (index * anglePerSlice) * (Math.PI / 180);
            const endAngle = ((index + 1) * anglePerSlice) * (Math.PI / 180);
            
            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);
            
            const largeArcFlag = anglePerSlice > 180 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            const textAngle = (index * anglePerSlice + anglePerSlice / 2);
            const textRadius = radius * 0.75;
            const textX = centerX + textRadius * Math.cos(textAngle * (Math.PI / 180));
            const textY = centerY + textRadius * Math.sin(textAngle * (Math.PI / 180));
            
            return (
              <g key={movie.id}>
                <path
                  d={pathData}
                  fill={currentColors[index % currentColors.length]}
                  stroke={isDarkMode ? '#374151' : '#ffffff'}
                  strokeWidth="2"
                />
                <text
                  x={textX}
                  y={textY}
                  fill={isDarkMode ? '#ffffff' : '#000000'}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                >
                  {movie.title.length > 8 ? movie.title.substring(0, 8) + '...' : movie.title}
                </text>
              </g>
            );
          })}
        </g>
        
        <circle
          cx={centerX}
          cy={centerY}
          r="20"
          fill={isDarkMode ? '#1F2937' : '#ffffff'}
          stroke={isDarkMode ? '#4B5563' : '#000000'}
          strokeWidth="2"
          filter="url(#shadow)"
        />
      </motion.svg>
      
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <motion.div
          className={`w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] ${
            isDarkMode 
              ? 'border-l-transparent border-r-transparent border-t-yellow-400'
              : 'border-l-transparent border-r-transparent border-t-red-500'
          }`}
          animate={isSpinning ? { 
            y: [0, -5, 0],
            scale: [1, 1.1, 1]
          } : {}}
          transition={{
            duration: 0.3,
            repeat: isSpinning ? Infinity : 0,
            ease: "easeInOut"
          }}
          style={{
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
          }}
        />
      </div>
      
      {isSpinning && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 0 rgba(255, 255, 255, 0)',
              '0 0 30px rgba(255, 255, 255, 0.5)',
              '0 0 0 rgba(255, 255, 255, 0)'
            ]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  );
}