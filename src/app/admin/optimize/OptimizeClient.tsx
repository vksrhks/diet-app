'use client';

import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { getHeavyPhotos, updateDailyRecordUrls } from '@/app/actions';

export default function OptimizeClient() {
  const [status, setStatus] = useState<string>('대기 중...');
  const [heavyRecords, setHeavyRecords] = useState<any[]>([]);
  const [progress, setProgress] = useState<{ total: number; current: number } | null>(null);

  const fetchHeavyPhotos = async () => {
    setStatus('과거 기록 검색 중...');
    try {
      const records = await getHeavyPhotos();
      setHeavyRecords(records);
      setStatus(`압축이 필요한 기록 ${records.length}개 발견됨.`);
    } catch (e) {
      console.error(e);
      setStatus('검색 실패!');
    }
  };

  const compressBase64 = async (base64Str: string) => {
    if (!base64Str || base64Str.length < 200000) return base64Str; // 이미 작거나 없으면 그대로 반환
    try {
      // base64를 파일로 변환
      const res = await fetch(base64Str);
      const blob = await res.blob();
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

      // 압축
      const options = {
        maxSizeMB: 0.1, // 100KB
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/jpeg' as const
      };
      
      const compressedFile = await imageCompression(file, options);
      
      // 다시 base64로 변환
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
      });
    } catch (e) {
      console.error("압축 중 오류 발생", e);
      return base64Str; // 오류 발생 시 원본 유지
    }
  };

  const startOptimization = async () => {
    if (heavyRecords.length === 0) return;
    
    setProgress({ total: heavyRecords.length, current: 0 });
    setStatus('압축 시작... (도중에 브라우저를 끄지 마세요!)');
    
    let successCount = 0;
    
    for (let i = 0; i < heavyRecords.length; i++) {
      const record = heavyRecords[i];
      try {
        const newBreakfast = await compressBase64(record.breakfastUrl);
        const newLunch = await compressBase64(record.lunchUrl);
        const newDinner = await compressBase64(record.dinnerUrl);
        
        await updateDailyRecordUrls(record.id, newBreakfast, newLunch, newDinner);
        successCount++;
      } catch(e) {
        console.error(`Record ${record.id} 처리 실패`, e);
      }
      
      setProgress(prev => prev ? { ...prev, current: i + 1 } : null);
    }
    
    setStatus(`최적화 완료! 총 ${heavyRecords.length}개 중 ${successCount}개 성공.`);
    setHeavyRecords([]);
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px' }}>
      <div style={{ marginBottom: '20px' }}>
        <strong>상태: </strong> <span style={{ color: 'var(--color-mint)' }}>{status}</span>
      </div>
      
      {progress && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ width: '100%', background: '#333', height: '20px', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${(progress.current / progress.total) * 100}%`, height: '100%', background: 'var(--color-mint)', transition: 'width 0.3s' }}></div>
          </div>
          <p style={{ textAlign: 'center', marginTop: '5px' }}>{progress.current} / {progress.total}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={fetchHeavyPhotos} 
          className="btn"
          style={{ background: '#444', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', border: 'none' }}
        >
          1. 뚱뚱한 사진 검색하기
        </button>
        
        <button 
          onClick={startOptimization}
          disabled={heavyRecords.length === 0}
          className="btn"
          style={{ 
            background: heavyRecords.length > 0 ? 'var(--color-purple)' : '#333', 
            color: '#fff', 
            padding: '10px 20px', 
            borderRadius: '8px', 
            cursor: heavyRecords.length > 0 ? 'pointer' : 'not-allowed', 
            border: 'none' 
          }}
        >
          2. 압축 및 DB 덮어쓰기 시작
        </button>
      </div>
    </div>
  );
}
