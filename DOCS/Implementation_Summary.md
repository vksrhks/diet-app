## 2026-07-29: 무한 로딩 및 동기화 최적화
- **원인**: 과거 저장된 Base64 방식의 거대한 사진 데이터(PNG 등)를 서버 측(`getDashboardData`)에서 한 번에 14일치나 긁어오면서 Next.js Server Action 응답이 지연되거나 타임아웃 됨.
- **해결 1**: `actions.ts`에서 초기 로딩용 사진 쿼리를 최근 14일치에서 3일치로 대폭 줄여 페이로드 크기 최적화.
- **해결 2**: `DashboardClient.tsx`에서 수동으로 호출되던 `loadData()`(전체 화면을 덮는 강제 대기 모달 포함)를 완전히 삭제. 저장 후엔 Next.js의 `revalidatePath`와 `useEffect` 훅을 통한 자동 캐시 갱신을 이용하여 비동기적으로(백그라운드에서) UI가 업데이트되도록 변경.
- **해결 3**: 새 사진 업로드 시 `browser-image-compression` 옵션을 `fileType: 'image/jpeg'` 및 `maxSizeMB: 0.1`로 엄격하게 제한하여 DB 용량 최적화.
