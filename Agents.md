# PDFService — Agent Guide (현 코드 기준)

마지막 업데이트: 2025-12-28  
목적: 현재 구현된 코드를 빠르게 파악하고, 동일한 품질 기준으로 이어받아 작업하기 위한 에이전트용 요약 가이드입니다.

---

## 1) 필수 원칙
- **클라이언트 사이드만**: PDF는 브라우저 메모리 내에서만 처리. 서버 업로드/저장은 금지.
- **빌드·린트 무결성**: 모든 Phase 종료 시 `npm run lint`, `npm run build`가 통과해야 함.
- **메모리 정리**: Object URL은 사용 후 `URL.revokeObjectURL`; PDF.js 문서는 `destroy`; 대용량 처리 후 참조 해제.
- **사용자 메시지 제공**: 오류/경고는 UI로 노출(무응답 금지). 50MB 이상 업로드 시 경고 유지.
- **접근성 기본**: 포커스 이동/Enter·Space 작동, 핵심 버튼/토글에 ARIA 라벨 유지·보강.

---

## 2) 환경 & 실행
- 스택: Next.js 16(App Router, `use client`), React 19, TypeScript strict, Tailwind 4 inline theme, pdf-lib, pdfjs-dist, react-dropzone, JSZip, lucide-react.
- 기본 색상: 현재 CSS 변수 `--primary`는 파란색 `#2563eb`(PRD 지정색 #EF4444와 다름).
- 명령어: `npm run dev --webpack`, `npm run lint`, `npm run build --webpack`.
- PDF.js 에셋: `public/pdfjs/*`(cmaps/standard_fonts/iccs/wasm + pdf.worker.mjs). 동기화 스크립트 `npm run setup:pdfjs` (`postinstall`에도 포함).
- 경로 단축: `@/*` → `src/*`.

---

## 3) 주요 파일 구조
- `src/app/page.tsx`: 단일 페이지 앱, 모드(`merge`/`split`/`compress`) 상태 및 공통 에러/경고 관리.
- `src/components/PdfDropzone.tsx`: react-dropzone 기반 업로드. PDF만 허용, 클릭 선택 버튼 포함.
- `src/features/merge/mergePdf.ts`: pdf-lib로 파일 순서대로 병합.
- `src/features/split/*`: 범위/페이지 선택/크기 기반 분할 UI와 로직, 썸네일 그리드, 출력/ZIP 다운로드.
- `src/features/compress/*`: 압축 레벨별 전략과 진행 상태 관리.
- `src/lib/download.ts`: Blob/Object URL 다운로드(+ revoke).  
  `src/lib/pdfjs.ts`: PDF.js worker/asset 경로 설정.  
  `src/lib/files.ts`: 파일 타입 검증, 용량 포맷.

---

## 4) 현재 구현 상태 (모드별)
- **업로드/경고**
  - Dropzone: PDF MIME/확장자만 수락, 거부 시 에러 메시지 콜백. 멀티 업로드는 merge 모드만.
  - 선택 파일 목록에서 원본 파일 즉시 다운로드 가능. 50MB 이상이면 경고 배너 표시.
- **Merge**
  - 최소 2개 필요. 이름 중복 시 UI 경고만(자동 rename 없음), 표시용 중복 카운터 제공.
  - 위/아래 버튼으로 순서 변경. 결과 파일명 기본 `merged_YYYY-MM-DD.pdf`, 확장자 자동 보정.
- **Split**
  - 페이지 수는 pdf-lib(`getPdfPageCount`)로 로드. 초기 범위는 1~총 페이지.
  - 범위 모드: 숫자 유효성·1이상·end≤pageCount·겹침 금지. 출력 `split_{i}of{N}_{date}.pdf`.
  - 페이지 선택 모드: PDF.js 썸네일 그리드(IntersectionObserver로 지연 로딩, toBlob→ObjectURL, 언마운트 시 revoke/destroy). 선택 페이지만 한 개 파일 `split_selected_{date}.pdf`.
  - 크기 기준 모드: 목표 MB로 페이지 수 추정(단순 비율) 후 순차 청크 분할. 출력 파일명은 범위 모드와 동일. 결과가 여러 개면 `split_{date}.zip`으로 JSZip 묶음 제공.
- **Compress**
  - Low: 메타데이터 비우고 object stream on/off 중 더 작은 쪽 사용(무손실).
  - Medium/High: PDF.js로 페이지 래스터라이즈 → JPEG 임베드(스케일/품질만 다름), 진행률 표시. 실패 시/효과 없을 때 무손실 결과로 대체하며 안내 메시지 저장.
  - 기본 파일명 `compressed_<원본이름>_<date>.pdf`, 입력값 확장자 자동 보정. High/Medium은 텍스트 검색 불가 가능성 있으므로 경고 UI 있음.

---

## 5) 알려진 문제/주의 사항
- 한글 카피가 곳곳에 깨져 있음(모지바케) → UI/메타데이터 문구 교정 필요.
- 브랜드 색상(PRD #EF4444) 미적용: globals.css의 `--primary`가 #2563eb로 설정됨.
- README는 기본 Next 템플릿 그대로임.
- 에러/경고는 모두 인라인 알림으로 처리 중(토스트/다이얼로그 미구현).

---

## 6) 작업 시 체크리스트
- 새 다운로드/썸네일/미리보기 추가 시 Object URL 생성·해제 루틴을 반드시 포함.
- pdfjs-dist 버전 변경 또는 `node_modules` 초기화 후에는 `npm run setup:pdfjs`로 `/public/pdfjs`를 갱신.
- 대용량/암호화 PDF 실패 시 사용자 메시지 제공(콘솔 로그만 남기지 말 것).
- 기능 추가 후 `npm run lint`와 `npm run build` 실행. 주요 플로우 수동 점검: Merge 2개 이상 → 다운로드, Split 범위/선택/크기 → 다운로드/ZIP, Compress 3레벨 → 전/후 용량 표기 및 다운로드.
