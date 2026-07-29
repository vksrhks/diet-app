import OptimizeClient from './OptimizeClient';

export default function AdminOptimizePage() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h1>DB 다이어트 (사진 일괄 압축 도구)</h1>
      <p style={{ color: '#aaa', marginBottom: '30px' }}>
        이전에 업로드된 거대한 원본 사진들을 검색하여 브라우저에서 100KB 이하의 JPEG로 자동 압축한 뒤 DB에 다시 저장합니다.
        스마트폰이나 웹 브라우저를 켠 상태로 유지해 주세요.
      </p>
      
      <OptimizeClient />
    </div>
  );
}
