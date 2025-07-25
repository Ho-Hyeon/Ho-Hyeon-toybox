import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Circle, Timer, Flame, Dumbbell, Play, Pause, RotateCcw, ChevronRight, Trophy } from 'lucide-react';

export const metadata = {
  title: '운동 루틴 생성기',
  description: '당신만의 맞춤형 운동 루틴을 생성해보세요',
  type: 'react' as const,
  tags: ['fitness', 'workout', 'exercise', 'health', '운동', '피트니스'],
};

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // seconds
  caloriesPerMinute: number;
  description: string;
  instructions: string[];
}

interface WorkoutRoutine {
  exercises: Exercise[];
  totalDuration: number;
  totalCalories: number;
  difficulty: string;
}

interface WorkoutStats {
  totalWorkouts: number;
  totalCalories: number;
  totalTime: number;
  lastWorkout?: Date;
}

const exerciseDatabase: Exercise[] = [
  // Upper Body - Beginner
  {
    id: 'pushup-regular',
    name: '푸시업',
    category: 'upper-body',
    muscleGroups: ['가슴', '어깨', '삼두근'],
    difficulty: 'beginner',
    duration: 45,
    caloriesPerMinute: 8,
    description: '상체 근력 강화를 위한 기본 맨몸 운동',
    instructions: [
      '양손을 어깨 너비로 벌려 플랭크 자세를 취합니다',
      '가슴이 바닥에 거의 닿을 때까지 몸을 낮춥니다',
      '팔을 밀어 원래 자세로 돌아옵니다',
      '운동 내내 코어에 힘을 유지합니다'
    ]
  },
  {
    id: 'plank-hold',
    name: '플랭크',
    category: 'core',
    muscleGroups: ['코어', '어깨'],
    difficulty: 'beginner',
    duration: 30,
    caloriesPerMinute: 5,
    description: '코어 강화를 위한 정적 운동',
    instructions: [
      '팔꿈치를 바닥에 대고 플랭크 자세를 취합니다',
      '머리부터 발끝까지 일직선을 유지합니다',
      '코어에 힘을 주고 자세를 유지합니다',
      '운동 중 고른 호흡을 유지합니다'
    ]
  },
  // Lower Body - Beginner
  {
    id: 'squat-bodyweight',
    name: '스쿼트',
    category: 'lower-body',
    muscleGroups: ['대퇴사두근', '엉덩이', '햄스트링'],
    difficulty: 'beginner',
    duration: 45,
    caloriesPerMinute: 7,
    description: '하체 근력의 기본이 되는 운동',
    instructions: [
      '발을 어깨 너비로 벌리고 섭니다',
      '의자에 앉듯이 엉덩이를 뒤로 빼며 내려갑니다',
      '무릎이 발끝 방향과 일치하도록 유지합니다',
      '일어서며 원래 자세로 돌아옵니다'
    ]
  },
  {
    id: 'lunges-alternating',
    name: '런지',
    category: 'lower-body',
    muscleGroups: ['대퇴사두근', '엉덩이', '햄스트링'],
    difficulty: 'beginner',
    duration: 45,
    caloriesPerMinute: 6,
    description: '하체 근력과 균형감각을 기르는 운동',
    instructions: [
      '한 발을 앞으로 크게 내딛습니다',
      '양 무릎이 90도가 될 때까지 엉덩이를 낮춥니다',
      '앞발로 밀어 원래 자세로 돌아옵니다',
      '다리를 번갈아가며 반복합니다'
    ]
  },
  // Core - Beginner
  {
    id: 'dead-bug',
    name: '데드버그',
    category: 'core',
    muscleGroups: ['코어', '복근'],
    difficulty: 'beginner',
    duration: 45,
    caloriesPerMinute: 4,
    description: '코어 안정성을 기르는 운동',
    instructions: [
      '등을 대고 누워 팔을 위로 뻗습니다',
      '무릎을 90도로 구부려 들어올립니다',
      '한쪽 팔과 반대쪽 다리를 천천히 내립니다',
      '시작 자세로 돌아와 반대쪽 실시'
    ]
  },
  {
    id: 'wall-sit',
    name: '월싯',
    category: 'lower-body',
    muscleGroups: ['대퇴사두근', '엉덩이'],
    difficulty: 'beginner',
    duration: 30,
    caloriesPerMinute: 5,
    description: '벽에 기대어 하는 정적 하체 운동',
    instructions: [
      '벽에 등을 대고 섭니다',
      '천천히 앉듯이 내려가 허벅지가 바닥과 평행이 되게 합니다',
      '이 자세를 유지합니다',
      '무릎이 발끝을 넘지 않도록 주의합니다'
    ]
  },
  // Intermediate exercises
  {
    id: 'pike-pushups',
    name: '파이크 푸시업',
    category: 'upper-body',
    muscleGroups: ['어깨', '삼두근'],
    difficulty: 'intermediate',
    duration: 45,
    caloriesPerMinute: 7,
    description: '어깨를 집중적으로 단련하는 푸시업 변형',
    instructions: [
      '엉덩이를 높이 들어 역V자 자세를 만듭니다',
      '머리를 바닥 쪽으로 내리며 팔을 굽힙니다',
      '팔을 펴며 시작 자세로 돌아옵니다',
      '어깨에 집중하여 실시합니다'
    ]
  },
  {
    id: 'bulgarian-split-squat',
    name: '불가리안 스플릿 스쿼트',
    category: 'lower-body',
    muscleGroups: ['대퇴사두근', '엉덩이', '햄스트링'],
    difficulty: 'intermediate',
    duration: 60,
    caloriesPerMinute: 8,
    description: '한 다리로 하는 고강도 하체 운동',
    instructions: [
      '뒷발을 벤치나 의자에 올립니다',
      '앞다리로 스쿼트 동작을 수행합니다',
      '무릎이 90도가 될 때까지 내려갑니다',
      '앞발로 밀어 올라옵니다'
    ]
  },
  {
    id: 'tricep-dips',
    name: '트라이셉 딥스',
    category: 'upper-body',
    muscleGroups: ['삼두근', '가슴'],
    difficulty: 'intermediate',
    duration: 45,
    caloriesPerMinute: 6,
    description: '삼두근을 집중적으로 단련하는 운동',
    instructions: [
      '의자나 벤치 끝에 손을 대고 앉습니다',
      '엉덩이를 의자 밖으로 내밉니다',
      '팔을 굽혀 몸을 내립니다',
      '삼두근의 힘으로 밀어 올립니다'
    ]
  },
  {
    id: 'bicycle-crunches',
    name: '바이시클 크런치',
    category: 'core',
    muscleGroups: ['복근', '복사근'],
    difficulty: 'intermediate',
    duration: 45,
    caloriesPerMinute: 6,
    description: '복근 전체를 자극하는 운동',
    instructions: [
      '등을 대고 누워 손을 머리 뒤에 둡니다',
      '한쪽 무릎을 가슴으로 당기며 반대쪽 팔꿈치를 맞댑니다',
      '자전거 페달을 밟듯이 교대로 실시합니다',
      '복근에 계속 긴장을 유지합니다'
    ]
  },
  {
    id: 'wide-grip-pushups',
    name: '와이드 그립 푸시업',
    category: 'upper-body',
    muscleGroups: ['가슴', '어깨'],
    difficulty: 'intermediate',
    duration: 45,
    caloriesPerMinute: 8,
    description: '가슴을 넓게 발달시키는 푸시업',
    instructions: [
      '손을 어깨 너비보다 넓게 벌립니다',
      '가슴이 바닥에 거의 닿을 때까지 내려갑니다',
      '가슴 근육을 수축하며 밀어 올립니다',
      '코어를 단단히 유지합니다'
    ]
  },
  // Advanced exercises
  {
    id: 'pistol-squats',
    name: '피스톨 스쿼트',
    category: 'lower-body',
    muscleGroups: ['대퇴사두근', '엉덩이', '코어'],
    difficulty: 'advanced',
    duration: 60,
    caloriesPerMinute: 8,
    description: '균형과 근력이 필요한 한 다리 스쿼트',
    instructions: [
      '한 다리로 서고 다른 다리는 앞으로 뻗습니다',
      '한 다리로 앉듯이 내려갑니다',
      '뻗은 다리는 바닥에 닿지 않게 유지합니다',
      '일어서며 원래 자세로 돌아옵니다'
    ]
  },
  {
    id: 'handstand-pushups',
    name: '물구나무 푸시업',
    category: 'upper-body',
    muscleGroups: ['어깨', '삼두근'],
    difficulty: 'advanced',
    duration: 60,
    caloriesPerMinute: 10,
    description: '상급자를 위한 어깨 운동',
    instructions: [
      '벽에 대고 물구나무서기를 합니다',
      '머리가 바닥에 가까워지도록 내려갑니다',
      '팔을 완전히 펴며 올라갑니다',
      '운동 내내 균형을 유지합니다'
    ]
  },
  {
    id: 'archer-pushups',
    name: '아처 푸시업',
    category: 'upper-body',
    muscleGroups: ['가슴', '삼두근', '어깨'],
    difficulty: 'advanced',
    duration: 60,
    caloriesPerMinute: 9,
    description: '한쪽 팔에 더 많은 부하를 주는 푸시업',
    instructions: [
      '팔을 평소보다 넓게 벌립니다',
      '한쪽 팔 쪽으로 체중을 싣고 내려갑니다',
      '반대쪽 팔은 거의 펴진 상태로 유지합니다',
      '양쪽을 번갈아가며 실시합니다'
    ]
  },
  {
    id: 'dragon-flag',
    name: '드래곤 플래그',
    category: 'core',
    muscleGroups: ['복근', '코어'],
    difficulty: 'advanced',
    duration: 45,
    caloriesPerMinute: 8,
    description: '브루스 리가 즐겨한 최고난도 복근 운동',
    instructions: [
      '벤치에 누워 머리 위 벤치를 잡습니다',
      '어깨만 닿은 채로 몸 전체를 들어올립니다',
      '천천히 내려가며 복근을 조절합니다',
      '허리가 아치형이 되지 않도록 주의합니다'
    ]
  },
  // Easter eggs
  {
    id: 'superhero-landing',
    name: '슈퍼히어로 랜딩',
    category: 'full-body',
    muscleGroups: ['전신', '자신감'],
    difficulty: 'intermediate',
    duration: 5,
    caloriesPerMinute: 100,
    description: '영화에서 본 그 포즈! (무릎에는 안 좋아요)',
    instructions: [
      '높이 점프합니다',
      '한쪽 무릎과 주먹을 땅에 대고 착지합니다',
      '3초간 멋진 포즈를 유지합니다',
      '실제로는 무릎에 안 좋으니 조심하세요!'
    ]
  },
  {
    id: 'saitama-pushups',
    name: '사이타마 푸시업',
    category: 'upper-body',
    muscleGroups: ['가슴', '대머리'],
    difficulty: 'advanced',
    duration: 100,
    caloriesPerMinute: 15,
    description: '원펀맨이 되기 위한 100개 푸시업',
    instructions: [
      '100개의 푸시업을 합니다',
      '중간에 쉬어도 괜찮습니다',
      '매일 하면 3년 후 대머리가 될 수도...',
      '진짜로 100개를 다 할 필요는 없어요!'
    ]
  },
  {
    id: 'kimchi-squat',
    name: '김치 스쿼트',
    category: 'lower-body',
    muscleGroups: ['대퇴사두근', '한국인의 혼'],
    difficulty: 'beginner',
    duration: 30,
    caloriesPerMinute: 7,
    description: '김치 담그듯 앉았다 일어나는 한국형 스쿼트',
    instructions: [
      '김치 담그는 자세로 쪼그려 앉습니다',
      '"아이고" 소리와 함께 일어납니다',
      '무릎이 아프면 "아이고" 두 번',
      '김치 생각하며 반복합니다'
    ]
  }
];

export default function WorkoutRoutineGenerator() {
  const [difficulty, setDifficulty] = useState<string>('beginner');
  const [targetArea, setTargetArea] = useState<string>('full-body');
  const [duration, setDuration] = useState<string>('15');
  const [routine, setRoutine] = useState<WorkoutRoutine | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseTimer, setExerciseTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);

  const generateRoutine = useCallback(() => {
    const targetDuration = parseInt(duration) * 60; // Convert to seconds
    let availableExercises = exerciseDatabase.filter(exercise => {
      const matchesDifficulty = exercise.difficulty === difficulty || 
        (difficulty === 'intermediate' && exercise.difficulty === 'beginner') ||
        (difficulty === 'advanced' && exercise.difficulty !== 'advanced');
      
      const matchesTargetArea = targetArea === 'full-body' || 
        exercise.category === targetArea ||
        exercise.muscleGroups.some(muscle => targetArea.includes(muscle));
      
      return matchesDifficulty && matchesTargetArea;
    });

    if (availableExercises.length === 0) {
      availableExercises = exerciseDatabase.filter(e => e.difficulty === difficulty);
    }

    const selectedExercises: Exercise[] = [];
    let currentDuration = 0;
    const usedCategories = new Set<string>();

    while (currentDuration < targetDuration && selectedExercises.length < 10) {
      const remainingExercises = availableExercises.filter(e => 
        !selectedExercises.includes(e) && 
        (selectedExercises.length < 3 || !usedCategories.has(e.category))
      );

      if (remainingExercises.length === 0) break;

      const randomExercise = remainingExercises[Math.floor(Math.random() * remainingExercises.length)];
      selectedExercises.push(randomExercise);
      usedCategories.add(randomExercise.category);
      currentDuration += randomExercise.duration + 15; // Add rest time
    }

    // 운동 시간이 길 경우 더 많은 운동 추가
    if (targetDuration >= 3600) { // 1시간 이상
      const additionalExercises = Math.floor(targetDuration / 600); // 10분당 1개 추가
      for (let i = 0; i < additionalExercises && selectedExercises.length < 20; i++) {
        const remainingExercises = availableExercises.filter(e => !selectedExercises.includes(e));
        if (remainingExercises.length > 0) {
          const exercise = remainingExercises[Math.floor(Math.random() * remainingExercises.length)];
          selectedExercises.push(exercise);
        }
      }
    }

    const totalCalories = selectedExercises.reduce((acc, exercise) => 
      acc + (exercise.caloriesPerMinute * (exercise.duration / 60)), 0
    );

    setRoutine({
      exercises: selectedExercises,
      totalDuration: currentDuration,
      totalCalories: Math.round(totalCalories),
      difficulty
    });
    setCurrentExerciseIndex(0);
    setExerciseTimer(0);
    setIsRunning(false);
    setCompletedExercises(new Set());
    setTotalElapsedTime(0);
  }, [difficulty, targetArea, duration]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && routine) {
      interval = setInterval(() => {
        setExerciseTimer(prev => {
          const currentExercise = routine.exercises[currentExerciseIndex];
          if (prev >= currentExercise.duration) {
            setCompletedExercises(completed => new Set(completed).add(currentExerciseIndex));
            
            if (currentExerciseIndex < routine.exercises.length - 1) {
              setCurrentExerciseIndex(currentExerciseIndex + 1);
              return 0;
            } else {
              setIsRunning(false);
              setShowCompletionAnimation(true);
              setTimeout(() => setShowCompletionAnimation(false), 5000);
              return prev;
            }
          }
          return prev + 1;
        });
        setTotalElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, currentExerciseIndex, routine]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setExerciseTimer(0);
    setIsRunning(false);
  };

  const skipExercise = () => {
    if (routine) {
      setCompletedExercises(completed => new Set(completed).add(currentExerciseIndex));
      
      if (currentExerciseIndex < routine.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setExerciseTimer(0);
      } else {
        // 마지막 운동인 경우 완료 상태로 만들기
        setIsRunning(false);
        setShowCompletionAnimation(true);
        setTimeout(() => setShowCompletionAnimation(false), 5000);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentExercise = routine?.exercises[currentExerciseIndex];
  const progressPercentage = currentExercise ? (exerciseTimer / currentExercise.duration) * 100 : 0;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {showCompletionAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-auto text-center animate-in zoom-in-95 duration-500">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">축하합니다! 🎉</h2>
              <p className="text-muted-foreground mb-4">오늘의 운동을 완료했습니다!</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>총 운동 시간:</span>
                  <span className="font-semibold">{formatTime(totalElapsedTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>소모 칼로리:</span>
                  <span className="font-semibold">{routine?.totalCalories} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span>완료한 운동:</span>
                  <span className="font-semibold">{routine?.exercises.length}개</span>
                </div>
              </div>
            </div>
            <Button onClick={() => setShowCompletionAnimation(false)} className="w-full">
              완료
            </Button>
          </div>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-6 h-6" />
            운동 루틴 생성기
          </CardTitle>
          <CardDescription>
            당신의 체력 수준과 목표에 맞는 맞춤형 운동 루틴을 만들어보세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">난이도</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">초급</SelectItem>
                  <SelectItem value="intermediate">중급</SelectItem>
                  <SelectItem value="advanced">고급</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">운동 부위</label>
              <Select value={targetArea} onValueChange={setTargetArea}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-body">전신</SelectItem>
                  <SelectItem value="upper-body">상체</SelectItem>
                  <SelectItem value="lower-body">하체</SelectItem>
                  <SelectItem value="core">코어</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">운동 시간</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15분</SelectItem>
                  <SelectItem value="30">30분</SelectItem>
                  <SelectItem value="45">45분</SelectItem>
                  <SelectItem value="60">1시간</SelectItem>
                  <SelectItem value="90">1시간 30분</SelectItem>
                  <SelectItem value="120">2시간</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={generateRoutine} className="w-full md:w-auto">
            운동 루틴 생성하기
          </Button>
        </CardContent>
      </Card>

      {routine && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>당신의 운동 루틴</span>
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  {Math.round(routine.totalDuration / 60)}분
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  {routine.totalCalories} kcal
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="workout" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="workout">운동하기</TabsTrigger>
                <TabsTrigger value="exercises">운동 목록</TabsTrigger>
              </TabsList>
              
              <TabsContent value="workout" className="space-y-4">
                {currentExercise && (
                  <div className="space-y-4">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold">{currentExercise.name}</h3>
                      <p className="text-muted-foreground">{currentExercise.description}</p>
                      <div className="flex justify-center gap-2">
                        {currentExercise.muscleGroups.map(muscle => (
                          <Badge key={muscle} variant="outline">{muscle}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>진행도</span>
                        <span>{formatTime(exerciseTimer)} / {formatTime(currentExercise.duration)}</span>
                      </div>
                      <Progress value={progressPercentage} className="h-3" />
                    </div>
                    
                    <div className="flex justify-center gap-2">
                      <Button
                        onClick={toggleTimer}
                        size="lg"
                        variant={isRunning ? "secondary" : "default"}
                      >
                        {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                        {isRunning ? '일시정지' : '시작'}
                      </Button>
                      <Button onClick={resetTimer} size="lg" variant="outline">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        다시
                      </Button>
                      <Button onClick={skipExercise} size="lg" variant="outline">
                        <ChevronRight className="w-4 h-4 mr-2" />
                        건너뛰기
                      </Button>
                    </div>
                    
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-lg">운동 방법</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ol className="space-y-2">
                          {currentExercise.instructions.map((instruction, index) => (
                            <li key={index} className="flex gap-2">
                              <span className="font-semibold">{index + 1}.</span>
                              <span>{instruction}</span>
                            </li>
                          ))}
                        </ol>
                      </CardContent>
                    </Card>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>전체 진행도</span>
                        <span>{currentExerciseIndex + 1} / {routine.exercises.length} 운동</span>
                      </div>
                      <Progress 
                        value={(currentExerciseIndex / routine.exercises.length) * 100} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="exercises" className="space-y-2">
                {routine.exercises.map((exercise, index) => (
                  <Card 
                    key={exercise.id} 
                    className={`${index === currentExerciseIndex ? 'ring-2 ring-primary' : ''}`}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        {completedExercises.has(index) ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                        <div>
                          <h4 className="font-medium">{exercise.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(exercise.duration)} • {Math.round(exercise.caloriesPerMinute * (exercise.duration / 60))} kcal
                          </p>
                        </div>
                      </div>
                      <Badge variant={exercise.difficulty === 'beginner' ? 'secondary' : exercise.difficulty === 'intermediate' ? 'default' : 'destructive'}>
                        {exercise.difficulty === 'beginner' ? '초급' : exercise.difficulty === 'intermediate' ? '중급' : '고급'}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">총 운동 시간</p>
                      <p className="text-xl font-bold">{formatTime(totalElapsedTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">소모 칼로리</p>
                      <p className="text-xl font-bold">
                        {Math.round(
                          routine.exercises.slice(0, currentExerciseIndex + 1).reduce((acc, exercise, idx) => {
                            if (idx < currentExerciseIndex || completedExercises.has(idx)) {
                              return acc + (exercise.caloriesPerMinute * (exercise.duration / 60));
                            } else if (idx === currentExerciseIndex) {
                              return acc + (exercise.caloriesPerMinute * (exerciseTimer / 60));
                            }
                            return acc;
                          }, 0)
                        )} kcal
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}