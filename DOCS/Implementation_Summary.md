## 2026-07-29: 7일 단위 지연 로딩(Pagination) 및 DB 다이어트 도구 개발
- **기능 1**: `DashboardClient.tsx`에 페이징 로직 구현. 초기 로딩 시 7일 치 사진만 가져오고, '이전' 버튼 클릭 시 아직 로딩되지 않은 날짜 구간이면 백엔드(`getPhotosForDateRange`)에 7일 단위로 사진을 추가 요청하여 병합.
- **기능 2**: `/admin/optimize` 페이지 신설. 기존에 DB에 뚱뚱한 원본 상태로 저장된 Base64 사진들을 불러와 클라이언트(`browser-image-compression`)에서 100KB 이하로 일괄 압축 후 DB에 다시 덮어씌우는 최적화 도구.
