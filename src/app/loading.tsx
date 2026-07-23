export default function Loading() {
  return (
    <main className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '16px', textAlign: 'center' }}>
      <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
        정승후&이수정 Diet
      </h1>
      <div style={{ fontSize: '3rem', animation: 'spin 1.5s linear infinite' }}>⏳</div>
      <div style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 'bold', marginTop: '16px' }}>
        다이어트 기록을 불러오는 중입니다...
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        서버에서 데이터를 가져오고 있습니다.
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
