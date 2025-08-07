import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const metadata = {
  title: "마크다운 라이브 에디터 📝",
  description: "실시간 미리보기가 가능한 마크다운 에디터",
  type: "react" as const,
  author: "Claude",
  tags: ["markdown", "editor", "preview", "writing", "documentation"],
  dateCreated: new Date().toISOString().split('T')[0]
};

const templates = {
  empty: '',
  readme: `# 프로젝트 제목

## 📋 개요
프로젝트에 대한 간단한 설명을 작성하세요.

## 🚀 시작하기

### 필수 조건
- Node.js 18.0 이상
- npm 또는 yarn

### 설치
\`\`\`bash
npm install
\`\`\`

### 실행
\`\`\`bash
npm run dev
\`\`\`

## 📝 사용법
주요 기능과 사용 방법을 설명하세요.

## 🤝 기여하기
기여 방법에 대해 설명하세요.

## 📄 라이선스
MIT License`,
  
  blog: `# 블로그 포스트 제목

> 2024년 1월 1일 | 작성자: 홍길동

## 서론
오늘은 흥미로운 주제에 대해 이야기해보려고 합니다.

## 본문

### 첫 번째 섹션
**중요한 내용**은 이렇게 강조할 수 있습니다.

*이탤릭체*로 부드럽게 표현할 수도 있죠.

### 두 번째 섹션
목록을 만들어볼까요?

1. 첫 번째 항목
2. 두 번째 항목
   - 하위 항목 A
   - 하위 항목 B
3. 세 번째 항목

### 코드 예제
\`\`\`javascript
// 사용자에게 인사하는 함수
function hello(name) {
  console.log(\`Hello, \${name}!\`); // 콘솔에 출력
  /* 
   * 여러 줄 주석 예제
   * 이 함수는 간단한 인사를 출력합니다
   */
  return name;
}
\`\`\`

## 결론
오늘 배운 내용을 정리하면...

---
*태그: #개발 #프로그래밍 #튜토리얼*`,

  documentation: `# API 문서

## 개요
이 문서는 REST API의 엔드포인트를 설명합니다.

## 인증
모든 요청에는 Bearer 토큰이 필요합니다.

\`\`\`
Authorization: Bearer YOUR_TOKEN
\`\`\`

## 엔드포인트

### GET /api/users
사용자 목록을 가져옵니다.

**요청 예시:**
\`\`\`bash
curl -X GET https://api.example.com/users \\
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

**응답 예시:**
\`\`\`json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
\`\`\`

### POST /api/users
새 사용자를 생성합니다.

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| name | string | ✅ | 사용자 이름 |
| email | string | ✅ | 이메일 주소 |
| role | string | ❌ | 사용자 역할 |

## 에러 코드

| 코드 | 설명 |
|------|------|
| 400 | 잘못된 요청 |
| 401 | 인증 실패 |
| 404 | 리소스를 찾을 수 없음 |
| 500 | 서버 오류 |

## 코드 예제

### JavaScript
\`\`\`javascript
// 피보나치 수열 생성
function fibonacci(n) {
  // 기본 케이스
  if (n <= 1) return n;
  
  /* 재귀적으로 계산
   * F(n) = F(n-1) + F(n-2)
   */
  return fibonacci(n - 1) + fibonacci(n - 2);
}
\`\`\`

### Python
\`\`\`python
# 리스트 정렬 함수
def bubble_sort(arr):
    n = len(arr)
    # 모든 배열 요소를 순회
    for i in range(n):
        # 마지막 i 요소는 이미 정렬됨
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]  # 스왑
    return arr
\`\`\`

### SQL
\`\`\`sql
-- 사용자 테이블에서 활성 사용자 조회
SELECT * FROM users
WHERE status = 'active'
  /* 최근 30일 이내 로그인한 사용자만
     관리자는 제외 */
  AND last_login > NOW() - INTERVAL 30 DAY
  AND role != 'admin';  -- 일반 사용자만
\`\`\``,

  todo: `# 📋 할 일 목록

## 🔥 긴급
- [ ] 버그 수정: 로그인 페이지 오류
- [ ] 보안 패치 적용

## 📅 오늘
- [x] 아침 회의 참석
- [ ] PR 리뷰
- [ ] 테스트 코드 작성
- [ ] 문서 업데이트

## 🎯 이번 주
- [ ] 새 기능 개발
  - [ ] UI 디자인
  - [ ] 백엔드 API
  - [ ] 테스트
- [ ] 성능 최적화
- [ ] 배포 준비

## 💡 아이디어
- 다크 모드 지원
- 키보드 단축키 추가
- 모바일 앱 개발

---
> **노트:** 완료된 항목은 ~~취소선~~으로 표시됩니다.`
};

// 언어별 주석 패턴 정의
const commentPatterns: Record<string, { single?: string, multi?: { start: string, end: string } }> = {
  javascript: { single: '//', multi: { start: '/*', end: '*/' } },
  typescript: { single: '//', multi: { start: '/*', end: '*/' } },
  js: { single: '//', multi: { start: '/*', end: '*/' } },
  ts: { single: '//', multi: { start: '/*', end: '*/' } },
  jsx: { single: '//', multi: { start: '/*', end: '*/' } },
  tsx: { single: '//', multi: { start: '/*', end: '*/' } },
  java: { single: '//', multi: { start: '/*', end: '*/' } },
  c: { single: '//', multi: { start: '/*', end: '*/' } },
  cpp: { single: '//', multi: { start: '/*', end: '*/' } },
  csharp: { single: '//', multi: { start: '/*', end: '*/' } },
  python: { single: '#' },
  py: { single: '#' },
  ruby: { single: '#' },
  rb: { single: '#' },
  bash: { single: '#' },
  sh: { single: '#' },
  shell: { single: '#' },
  yaml: { single: '#' },
  yml: { single: '#' },
  sql: { single: '--', multi: { start: '/*', end: '*/' } },
  html: { multi: { start: '<!--', end: '-->' } },
  xml: { multi: { start: '<!--', end: '-->' } },
  css: { multi: { start: '/*', end: '*/' } },
  scss: { single: '//', multi: { start: '/*', end: '*/' } },
  sass: { single: '//', multi: { start: '/*', end: '*/' } },
  go: { single: '//', multi: { start: '/*', end: '*/' } },
  rust: { single: '//', multi: { start: '/*', end: '*/' } },
  swift: { single: '//', multi: { start: '/*', end: '*/' } },
  kotlin: { single: '//', multi: { start: '/*', end: '*/' } },
  php: { single: '//', multi: { start: '/*', end: '*/' } },
  lua: { single: '--' },
  r: { single: '#' },
  matlab: { single: '%' },
  perl: { single: '#' },
  vb: { single: "'" },
  vbnet: { single: "'" },
};

// 코드에서 주석 부분을 스타일링하는 함수
const styleCodeWithComments = (code: string, language?: string): React.ReactNode => {
  if (!language || !commentPatterns[language]) {
    return code;
  }

  const pattern = commentPatterns[language];
  const lines = code.split('\n');
  let inMultiComment = false;
  
  return lines.map((line, lineIndex) => {
    const elements: React.ReactNode[] = [];
    let currentLine = line;
    let processed = false;

    // 멀티라인 주석 처리
    if (pattern.multi) {
      const { start, end } = pattern.multi;
      
      // 멀티라인 주석이 진행 중인 경우
      if (inMultiComment) {
        const endIndex = currentLine.indexOf(end);
        if (endIndex !== -1) {
          // 주석 종료
          elements.push(
            <span key={`multi-end-${lineIndex}`} style={{ fontStyle: 'italic', color: '#9ca3af' }}>
              {currentLine.substring(0, endIndex + end.length)}
            </span>
          );
          elements.push(currentLine.substring(endIndex + end.length));
          inMultiComment = false;
          processed = true;
        } else {
          // 전체 라인이 주석
          return (
            <React.Fragment key={lineIndex}>
              <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>{line}</span>
              {lineIndex < lines.length - 1 && '\n'}
            </React.Fragment>
          );
        }
      }
      
      // 새로운 멀티라인 주석 찾기 (이미 처리된 경우 스킵)
      if (!processed) {
        let lastIdx = 0;
        let searchIdx = 0;
        
        while (searchIdx < currentLine.length) {
          const startIdx = currentLine.indexOf(start, searchIdx);
          if (startIdx === -1) {
            // 더 이상 멀티라인 주석이 없음
            if (lastIdx < currentLine.length) {
              const remaining = currentLine.substring(lastIdx);
              // 싱글라인 주석 체크
              if (pattern.single && !inMultiComment) {
                const singleIdx = remaining.indexOf(pattern.single);
                if (singleIdx !== -1) {
                  elements.push(remaining.substring(0, singleIdx));
                  elements.push(
                    <span key={`single-${lineIndex}`} style={{ fontStyle: 'italic', color: '#9ca3af' }}>
                      {remaining.substring(singleIdx)}
                    </span>
                  );
                  processed = true;
                } else {
                  elements.push(remaining);
                }
              } else {
                elements.push(remaining);
              }
            }
            break;
          }
          
          // 멀티라인 주석 시작 전 텍스트
          if (startIdx > lastIdx) {
            elements.push(currentLine.substring(lastIdx, startIdx));
          }
          
          const endIdx = currentLine.indexOf(end, startIdx + start.length);
          
          if (endIdx !== -1) {
            // 같은 라인에서 주석이 끝남
            elements.push(
              <span key={`multi-${lineIndex}-${startIdx}`} style={{ fontStyle: 'italic', color: '#9ca3af' }}>
                {currentLine.substring(startIdx, endIdx + end.length)}
              </span>
            );
            lastIdx = endIdx + end.length;
            searchIdx = lastIdx;
          } else {
            // 멀티라인 주석 시작
            elements.push(
              <span key={`multi-start-${lineIndex}`} style={{ fontStyle: 'italic', color: '#9ca3af' }}>
                {currentLine.substring(startIdx)}
              </span>
            );
            inMultiComment = true;
            processed = true;
            break;
          }
        }
      }
    } else if (pattern.single && !inMultiComment && !processed) {
      // 싱글라인 주석만 처리
      const singleIdx = currentLine.indexOf(pattern.single);
      if (singleIdx !== -1) {
        if (singleIdx > 0) {
          elements.push(currentLine.substring(0, singleIdx));
        }
        elements.push(
          <span key={`single-${lineIndex}`} style={{ fontStyle: 'italic', color: '#9ca3af' }}>
            {currentLine.substring(singleIdx)}
          </span>
        );
        processed = true;
      }
    }

    // 처리되지 않은 경우 전체 라인 추가
    if (!processed && elements.length === 0) {
      elements.push(currentLine);
    }

    return (
      <React.Fragment key={lineIndex}>
        {elements}
        {lineIndex < lines.length - 1 && '\n'}
      </React.Fragment>
    );
  });
};

const MarkdownLiveEditor: React.FC = () => {
  const [markdown, setMarkdown] = useState(templates.documentation);
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState(true);
  const [scrollSync, setScrollSync] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('documentation');
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // 스크롤 동기화
  const handleEditorScroll = useCallback(() => {
    if (!scrollSync || !editorRef.current || !previewRef.current) return;
    
    const editor = editorRef.current;
    const preview = previewRef.current;
    const percentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
    preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);
  }, [scrollSync]);

  const handlePreviewScroll = useCallback(() => {
    if (!scrollSync || !editorRef.current || !previewRef.current) return;
    
    const editor = editorRef.current;
    const preview = previewRef.current;
    const percentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
    editor.scrollTop = percentage * (editor.scrollHeight - editor.clientHeight);
  }, [scrollSync]);

  // 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setViewMode('editor');
            break;
          case '2':
            e.preventDefault();
            setViewMode('split');
            break;
          case '3':
            e.preventDefault();
            setViewMode('preview');
            break;
          case 'b':
            e.preventDefault();
            insertText('**', '**');
            break;
          case 'i':
            e.preventDefault();
            insertText('*', '*');
            break;
          case 'k':
            e.preventDefault();
            insertText('[', '](url)');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 텍스트 삽입 헬퍼
  const insertText = (before: string, after: string) => {
    if (!editorRef.current) return;
    
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.substring(start, end);
    const newText = markdown.substring(0, start) + before + selectedText + after + markdown.substring(end);
    
    setMarkdown(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 도구 버튼들
  const insertHeading = (level: number) => {
    const prefix = '#'.repeat(level) + ' ';
    insertText('\n' + prefix, '');
  };

  const insertList = (ordered: boolean) => {
    const prefix = ordered ? '\n1. ' : '\n- ';
    insertText(prefix, '');
  };

  const insertCode = () => {
    insertText('\n```\n', '\n```');
  };

  const insertTable = () => {
    const table = '\n| 헤더1 | 헤더2 | 헤더3 |\n|-------|-------|-------|\n| 셀1   | 셀2   | 셀3   |\n';
    insertText(table, '');
  };

  const insertCheckbox = () => {
    insertText('\n- [ ] ', '');
  };

  const insertQuote = () => {
    insertText('\n> ', '');
  };

  const insertHorizontalRule = () => {
    insertText('\n\n---\n\n', '');
  };

  const handleTemplateChange = (template: keyof typeof templates) => {
    setSelectedTemplate(template);
    setMarkdown(templates[template]);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      alert('마크다운이 클립보드에 복사되었습니다!');
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* 툴바 */}
      <div className="bg-gray-800 border-b border-gray-700 p-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* 도구 버튼 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => insertHeading(1)}
              className="px-3 py-1 text-gray-300 hover:bg-gray-700 rounded transition-colors"
              title="제목 1 (H1)"
            >
              H1
            </button>
            <button
              onClick={() => insertHeading(2)}
              className="px-3 py-1 text-gray-300 hover:bg-gray-700 rounded transition-colors"
              title="제목 2 (H2)"
            >
              H2
            </button>
            <button
              onClick={() => insertHeading(3)}
              className="px-3 py-1 text-gray-300 hover:bg-gray-700 rounded transition-colors"
              title="제목 3 (H3)"
            >
              H3
            </button>
            <div className="w-px h-6 bg-gray-600" />
            <button
              onClick={() => insertText('**', '**')}
              className="px-3 py-1 text-gray-300 hover:bg-gray-700 rounded font-bold transition-colors"
              title="굵게 (Ctrl+B)"
            >
              B
            </button>
            <button
              onClick={() => insertText('*', '*')}
              className="px-3 py-1 text-gray-300 hover:bg-gray-700 rounded italic transition-colors"
              title="기울임 (Ctrl+I)"
            >
              I
            </button>
            <button
              onClick={() => insertText('~~', '~~')}
              className="px-3 py-1 text-gray-300 hover:bg-gray-700 rounded line-through transition-colors"
              title="취소선"
            >
              S
            </button>
            <div className="w-px h-6 bg-gray-600" />
            <button
              onClick={() => insertText('[', '](url)')}
              className="px-3 py-1 text-gray-300 hover:bg-gray-700 rounded transition-colors"
              title="링크 (Ctrl+K)"
            >
              🔗
            </button>
            <button
              onClick={() => insertText('![alt text](', ')')}
              className="px-3 py-1 text-gray-300 hover:bg-gray-700 rounded transition-colors"
              title="이미지"
            >
              🖼️
            </button>
            <button
              onClick={insertCode}
              className="px-3 py-1 text-gray-300 hover:bg-gray-700 rounded transition-colors"
              title="코드 블록"
            >
              {'</>'}
            </button>
            <button
              onClick={insertQuote}
              className="px-3 py-1 text-gray-300 hover:bg-gray-700 rounded transition-colors"
              title="인용"
            >
              "
            </button>
            <div className="w-px h-6 bg-gray-600" />
            <button
              onClick={() => insertList(false)}
              className="px-3 py-1 text-gray-300 hover:bg-gray-700 rounded transition-colors"
              title="목록"
            >
              •
            </button>
            <button
              onClick={() => insertList(true)}
              className="px-3 py-1 text-gray-300 hover:bg-gray-700 rounded transition-colors"
              title="번호 목록"
            >
              1.
            </button>
            <button
              onClick={insertCheckbox}
              className="px-3 py-1 text-gray-300 hover:bg-gray-700 rounded transition-colors"
              title="체크박스"
            >
              ☐
            </button>
            <button
              onClick={insertTable}
              className="px-3 py-1 text-gray-300 hover:bg-gray-700 rounded transition-colors"
              title="표"
            >
              ⊞
            </button>
            <button
              onClick={insertHorizontalRule}
              className="px-3 py-1 text-gray-300 hover:bg-gray-700 rounded transition-colors"
              title="구분선"
            >
              ―
            </button>
          </div>

          {/* 설정 및 액션 */}
          <div className="flex items-center gap-2">
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value as keyof typeof templates)}
              className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm"
            >
              <option value="empty">빈 문서</option>
              <option value="readme">README</option>
              <option value="blog">블로그 포스트</option>
              <option value="documentation">API 문서</option>
              <option value="todo">할 일 목록</option>
            </select>
            
            <div className="flex items-center gap-1 bg-gray-700 rounded px-1">
              <button
                onClick={() => setViewMode('editor')}
                className={`px-2 py-1 text-sm rounded transition-colors ${
                  viewMode === 'editor' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'
                }`}
                title="에디터만 (Ctrl+1)"
              >
                에디터
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-2 py-1 text-sm rounded transition-colors ${
                  viewMode === 'split' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'
                }`}
                title="분할 화면 (Ctrl+2)"
              >
                분할
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-2 py-1 text-sm rounded transition-colors ${
                  viewMode === 'preview' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'
                }`}
                title="미리보기만 (Ctrl+3)"
              >
                미리보기
              </button>
            </div>

            <button
              onClick={copyToClipboard}
              className="px-3 py-1 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded text-sm transition-colors"
              title="클립보드에 복사"
            >
              📋
            </button>
            
            <button
              onClick={downloadMarkdown}
              className="px-3 py-1 bg-green-600 text-white hover:bg-green-700 rounded text-sm transition-colors"
              title="마크다운 다운로드"
            >
              💾
            </button>
          </div>
        </div>

        {/* 추가 설정 */}
        <div className="flex items-center gap-4 mt-2 text-sm">
          <label className="flex items-center gap-2 text-gray-400">
            <input
              type="checkbox"
              checked={wordWrap}
              onChange={(e) => setWordWrap(e.target.checked)}
              className="rounded"
            />
            자동 줄바꿈
          </label>
          <label className="flex items-center gap-2 text-gray-400">
            <input
              type="checkbox"
              checked={scrollSync}
              onChange={(e) => setScrollSync(e.target.checked)}
              className="rounded"
            />
            스크롤 동기화
          </label>
          <label className="flex items-center gap-2 text-gray-400">
            글자 크기:
            <input
              type="range"
              min="12"
              max="20"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-20"
            />
            {fontSize}px
          </label>
        </div>
      </div>

      {/* 메인 에디터 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 에디터 */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
            <div className="bg-gray-800 px-4 py-2 text-gray-400 text-sm border-b border-gray-700">
              📝 마크다운 에디터
            </div>
            <textarea
              ref={editorRef}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              onScroll={handleEditorScroll}
              className="flex-1 p-4 bg-gray-900 text-gray-100 font-mono resize-none focus:outline-none"
              style={{ 
                fontSize: `${fontSize}px`,
                whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
                wordWrap: wordWrap ? 'break-word' : 'normal'
              }}
              placeholder="마크다운을 입력하세요..."
            />
          </div>
        )}

        {/* 구분선 */}
        {viewMode === 'split' && (
          <div className="w-px bg-gray-700" />
        )}

        {/* 미리보기 */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
            <div className="bg-gray-800 px-4 py-2 text-gray-400 text-sm border-b border-gray-700">
              👁️ 미리보기
            </div>
            <div
              ref={previewRef}
              onScroll={handlePreviewScroll}
              className="flex-1 overflow-auto p-6 bg-white"
            >
              <div 
                className="prose prose-lg prose-slate max-w-none
                  prose-headings:font-bold prose-headings:text-gray-900
                  prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                  prose-p:text-gray-700 prose-p:leading-relaxed
                  prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800
                  prose-strong:font-bold prose-strong:text-gray-900
                  prose-em:italic
                  prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic
                  prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-red-600 prose-code:before:content-[''] prose-code:after:content-['']
                  prose-pre:bg-gray-900 prose-pre:text-green-400 prose-pre:overflow-x-auto prose-pre:whitespace-pre
                  prose-ol:list-decimal prose-ol:list-inside
                  prose-ul:list-disc prose-ul:list-inside
                  prose-li:text-gray-700
                  prose-table:border-collapse prose-table:w-full
                  prose-th:border prose-th:border-gray-300 prose-th:px-4 prose-th:py-2 prose-th:bg-gray-100
                  prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2
                  prose-img:rounded-lg prose-img:shadow-md
                  prose-hr:border-gray-300"
                style={{ fontSize: `${fontSize}px` }}
              >
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({children}) => <h1 className="text-3xl font-bold mb-4 text-gray-900">{children}</h1>,
                    h2: ({children}) => <h2 className="text-2xl font-bold mb-3 text-gray-900">{children}</h2>,
                    h3: ({children}) => <h3 className="text-xl font-bold mb-2 text-gray-900">{children}</h3>,
                    p: ({children}) => <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>,
                    ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
                    li: ({children}) => <li className="text-gray-700">{children}</li>,
                    blockquote: ({children}) => (
                      <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600">
                        {children}
                      </blockquote>
                    ),
                    code: ({inline, className, children, ...props}) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const language = match ? match[1] : undefined;
                      
                      return inline ? (
                        <code className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                          {children}
                        </code>
                      ) : (
                        <code 
                          className="!text-green-400 font-mono text-sm" 
                          style={{ 
                            color: '#4ade80',
                            whiteSpace: 'pre',
                            display: 'block',
                            overflowX: 'auto',
                            wordWrap: 'normal',
                            wordBreak: 'normal'
                          }} 
                          {...props}
                        >
                          {language && typeof children === 'string' 
                            ? styleCodeWithComments(children, language)
                            : children}
                        </code>
                      );
                    },
                    pre: ({children, ...props}) => (
                      <pre 
                        className="!bg-gray-900 p-4 rounded-lg mb-4" 
                        style={{ 
                          backgroundColor: '#111827',
                          whiteSpace: 'pre',
                          overflowX: 'auto',
                          overflowY: 'hidden',
                          wordWrap: 'normal',
                          wordBreak: 'normal'
                        }} 
                        {...props}
                      >
                        {children}
                      </pre>
                    ),
                    table: ({children}) => (
                      <div className="overflow-x-auto mb-4">
                        <table className="min-w-full border-collapse border border-gray-300">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({children}) => <thead className="bg-gray-100">{children}</thead>,
                    tbody: ({children}) => <tbody>{children}</tbody>,
                    tr: ({children}) => <tr className="border-b border-gray-300">{children}</tr>,
                    th: ({children}) => <th className="border border-gray-300 px-4 py-2 text-left font-semibold">{children}</th>,
                    td: ({children}) => <td className="border border-gray-300 px-4 py-2">{children}</td>,
                    a: ({href, children}) => (
                      <a href={href} className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                    hr: () => <hr className="my-6 border-gray-300" />,
                    strong: ({children}) => <strong className="font-bold text-gray-900">{children}</strong>,
                    em: ({children}) => <em className="italic">{children}</em>,
                    del: ({children}) => <del className="line-through text-gray-500">{children}</del>,
                    img: ({src, alt}) => (
                      <img src={src} alt={alt} className="max-w-full rounded-lg shadow-md my-4" />
                    ),
                    input: ({type, checked, disabled}) => {
                      if (type === 'checkbox') {
                        return (
                          <input 
                            type="checkbox" 
                            checked={checked} 
                            disabled={disabled}
                            readOnly
                            className="mr-2"
                          />
                        );
                      }
                      return null;
                    }
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 상태 바 */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-1 flex items-center justify-between text-xs text-gray-400">
        <div>
          글자 수: {markdown.length} | 단어 수: {markdown.split(/\s+/).filter(w => w).length} | 줄 수: {markdown.split('\n').length}
        </div>
        <div>
          마크다운 라이브 에디터 v1.0
        </div>
      </div>
    </div>
  );
};

export { metadata };
export default MarkdownLiveEditor;