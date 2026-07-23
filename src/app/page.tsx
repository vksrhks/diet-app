"use client";

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getDashboardData, saveDailyRecord, saveInbodyRecord, deleteDailyRecord, deleteInbodyRecord } from '@/app/actions';
import imageCompression from 'browser-image-compression';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'summary' | 'gallery'>('dashboard');
  const [viewDate, setViewDate] = useState(new Date());
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [chartFilter, setChartFilter] = useState<'day' | 'week' | 'month'>('day');
  
  // 1인 선택 모드 
  const [selectedTodayUser, setSelectedTodayUser] = useState<'A' | 'B'>('A');

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('diet_selectedTodayUser') as 'A' | 'B';
      if (savedUser) setSelectedTodayUser(savedUser);
    } catch (e) {
      console.warn("localStorage is not available");
    }
  }, []);

  const handleUserSelect = (user: 'A' | 'B') => {
    setSelectedTodayUser(user);
    try {
      localStorage.setItem('diet_selectedTodayUser', user);
    } catch (e) {
      console.warn("localStorage is not available");
    }
  };

  // 데이터 연동 상태
  const [dbData, setDbData] = useState<{ dailyRecords: any[], inbodyRecords: any[] }>({ dailyRecords: [], inbodyRecords: [] });
  const [isLoading, setIsLoading] = useState(true);

  // 모달 상태 관리
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isInbodyModalOpen, setIsInbodyModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<'A' | 'B' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 날짜 유틸
  const today = new Date();
  // 한국 시간 기준 YYYY-MM-DD 추출 보정
  const kstOffset = 9 * 60 * 60 * 1000;
  const getKSTDateString = (dateObj: Date) => new Date(dateObj.getTime() + kstOffset).toISOString().split('T')[0];
  const todayStr = getKSTDateString(today);
  
  const changeDate = (currentDate: string, days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };
  
  const changeMonth = (currentDate: string, months: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  };
  
  // UI 상태 (대시보드 날짜/이름)
  const [dateA, setDateA] = useState(todayStr);
  const [dateB, setDateB] = useState(todayStr);
  const [inbodyDateA, setInbodyDateA] = useState(todayStr);
  const [inbodyDateB, setInbodyDateB] = useState(todayStr);
  const [nameA, setNameA] = useState("정승후");
  const [nameB, setNameB] = useState("이수정");

  // 모달 입력 폼 상태 (일일 기록)
  const [weightInput, setWeightInput] = useState('');
  const [exerciseStatus, setExerciseStatus] = useState<'오운완' | '휴식' | '미완료'>('미완료');
  const [exerciseTypeInput, setExerciseTypeInput] = useState('');
  const [breakfastUrl, setBreakfastUrl] = useState('');
  const [lunchUrl, setLunchUrl] = useState('');
  const [dinnerUrl, setDinnerUrl] = useState('');

  // 모달 입력 폼 상태 (인바디)
  const [muscleMassInput, setMuscleMassInput] = useState('');
  const [fatMassInput, setFatMassInput] = useState('');
  const [fatPercentInput, setFatPercentInput] = useState('');

  // 데이터 로드
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getDashboardData();
      setDbData(data);
      
      // 데이터베이스에 저장된 진짜 이름이 있다면 불러오기
      const userA = data.dailyRecords.find(r => r.userId === 'user-a')?.user || data.inbodyRecords.find(r => r.userId === 'user-a')?.user;
      const userB = data.dailyRecords.find(r => r.userId === 'user-b')?.user || data.inbodyRecords.find(r => r.userId === 'user-b')?.user;
      
      if (userA) setNameA(userA.name);
      if (userB) setNameB(userB.name);
    } catch (e) {
      console.error("데이터 로드 실패:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isInbodyModalOpen && selectedPerson) {
      const rawDate = selectedPerson === 'A' ? inbodyDateA : inbodyDateB;
      const yyyyMM = rawDate.substring(0, 7);
      const searchDateStr = yyyyMM + '-01';
      
      const existingRecord = dbData.inbodyRecords.find(
        r => r.userId === `user-${selectedPerson.toLowerCase()}` && 
             new Date(r.date).toISOString().split('T')[0] === searchDateStr
      );
      
      setMuscleMassInput(existingRecord?.muscleMass?.toString() || '');
      setFatMassInput(existingRecord?.fatMass?.toString() || '');
      setFatPercentInput(existingRecord?.fatPercentage?.toString() || '');
    }
  }, [inbodyDateA, inbodyDateB, selectedPerson, isInbodyModalOpen, dbData]);


  // 폼 초기화 및 열기
  const openRecordModal = (person: 'A' | 'B') => {
    setSelectedPerson(person);
    const dateToSearch = person === 'A' ? dateA : dateB;
    const existingRecord = dbData.dailyRecords.find(r => r.userId === `user-${person.toLowerCase()}` && new Date(r.date).toISOString().split('T')[0] === dateToSearch);
    
    setWeightInput(existingRecord?.weight?.toString() || '');
    
    if (existingRecord?.exercised) {
      setExerciseStatus('오운완');
    } else if (existingRecord?.exerciseType === '휴식') {
      setExerciseStatus('휴식');
    } else {
      setExerciseStatus('미완료');
    }

    setExerciseTypeInput(existingRecord?.exerciseType === '휴식' ? '' : (existingRecord?.exerciseType || ''));
    setBreakfastUrl(existingRecord?.breakfastUrl || '');
    setLunchUrl(existingRecord?.lunchUrl || '');
    setDinnerUrl(existingRecord?.dinnerUrl || '');
    
    setIsRecordModalOpen(true);
  };

  const openInbodyModal = (person: 'A' | 'B') => {
    setSelectedPerson(person);
    const dateToSearch = person === 'A' ? inbodyDateA : inbodyDateB;
    const existingRecord = dbData.inbodyRecords.find(r => r.userId === `user-${person.toLowerCase()}` && new Date(r.date).toISOString().split('T')[0] === dateToSearch);
    
    setMuscleMassInput(existingRecord?.muscleMass?.toString() || '');
    setFatMassInput(existingRecord?.fatMass?.toString() || '');
    setFatPercentInput(existingRecord?.fatPercentage?.toString() || '');
    
    setIsInbodyModalOpen(true);
  };

  const closeModal = () => {
    setIsRecordModalOpen(false);
    setIsInbodyModalOpen(false);
    setSelectedPerson(null);
  };

  // 사진 첨부 핸들러 (자동 압축 후 Base64 변환)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // 이미지 압축 옵션: 최대 용량 0.5MB, 최대 너비/높이 800px
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) setter(ev.target.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error("이미지 압축 실패:", error);
        alert("사진을 처리하는 중 오류가 발생했습니다.");
      }
    }
  };

  // 실제 데이터 저장 핸들러
  const handleSaveDaily = async () => {
    setIsSaving(true);
    await saveDailyRecord({
      userId: `user-${selectedPerson?.toLowerCase()}`,
      name: selectedPerson === 'A' ? nameA : nameB,
      themeColor: selectedPerson === 'A' ? 'mint' : 'coral',
      date: selectedPerson === 'A' ? dateA : dateB,
      weight: weightInput ? parseFloat(weightInput) : undefined,
      exercised: exerciseStatus === '오운완',
      exerciseType: exerciseStatus === '휴식' ? '휴식' : exerciseTypeInput,
      breakfastUrl,
      lunchUrl,
      dinnerUrl
    });
    await loadData();
    setIsSaving(false);
    closeModal();
  };


  const handleDeleteDaily = async () => {
    if (!confirm('해당 날짜의 기록을 삭제하시겠습니까?')) return;
    setIsSaving(true);
    await deleteDailyRecord('user-' + selectedPerson?.toLowerCase(), selectedPerson === 'A' ? dateA : dateB);
    await loadData();
    setIsSaving(false);
    closeModal();
  };

  const handleDeleteInbody = async () => {
    if (!confirm('해당 월의 인바디 기록을 삭제하시겠습니까?')) return;
    setIsSaving(true);
    // 월별 저장이므로 무조건 해당 월의 1일 날짜로 삭제
    await deleteInbodyRecord('user-' + selectedPerson?.toLowerCase(), (selectedPerson === 'A' ? inbodyDateA : inbodyDateB).substring(0, 7) + '-01');
    await loadData();
    setIsSaving(false);
    closeModal();
  };

  const handleSaveInbody = async () => {
    setIsSaving(true);
    await saveInbodyRecord({
      userId: `user-${selectedPerson?.toLowerCase()}`,
      name: selectedPerson === 'A' ? nameA : nameB,
      themeColor: selectedPerson === 'A' ? 'mint' : 'coral',
      date: (selectedPerson === 'A' ? inbodyDateA : inbodyDateB).substring(0, 7) + '-01',
      muscleMass: muscleMassInput ? parseFloat(muscleMassInput) : undefined,
      fatMass: fatMassInput ? parseFloat(fatMassInput) : undefined,
      fatPercentage: fatPercentInput ? parseFloat(fatPercentInput) : undefined,
    });
    await loadData();
    setIsSaving(false);
    closeModal();
  };

  const themeColor = selectedPerson === 'A' ? 'var(--color-mint)' : 'var(--color-purple)';
  const currentName = selectedPerson === 'A' ? nameA : nameB;
  const currentDate = selectedPerson === 'A' ? dateA : dateB;

  // 특정 날짜의 카드 데이터 뽑기
  const recordA = dbData.dailyRecords.find(r => r.userId === 'user-a' && new Date(r.date).toISOString().split('T')[0] === dateA);
  const recordB = dbData.dailyRecords.find(r => r.userId === 'user-b' && new Date(r.date).toISOString().split('T')[0] === dateB);

  // 달력 계산 (현재 보고있는 월)
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth(); 
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  // 달력 및 차트용 통합 데이터 구성
  const calendarData: Record<number, any> = {};
  const chartDataMap: Record<string, any> = {}; // 날짜별 그룹핑

  for (let i = 1; i <= daysInMonth; i++) {
    const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const recA = dbData.dailyRecords.find(r => r.userId === 'user-a' && new Date(r.date).toISOString().split('T')[0] === dStr);
    const recB = dbData.dailyRecords.find(r => r.userId === 'user-b' && new Date(r.date).toISOString().split('T')[0] === dStr);
    
    // 캘린더용
    calendarData[i] = {};
    const exString = (rec: any) => rec?.exercised ? `🔥 ${rec.exerciseType || '완료'}` : (rec?.exerciseType === '휴식' ? '💤 휴식' : '❌ 미입력');
    if (recA) calendarData[i].A = { weight: recA.weight, exercise: exString(recA), photos: [recA.breakfastUrl, recA.lunchUrl, recA.dinnerUrl].filter(Boolean) };
    if (recB) calendarData[i].B = { weight: recB.weight, exercise: exString(recB), photos: [recB.breakfastUrl, recB.lunchUrl, recB.dinnerUrl].filter(Boolean) };
  }

  // 체중 차트용 데이터 (chartFilter 기반 주간/월간 평균 계산)
  const buildChartData = () => {
    const map: Record<string, { sumA: number, countA: number, sumB: number, countB: number, label: string }> = {};
    
    dbData.dailyRecords.forEach(r => {
      if (!r.weight) return;
      const d = new Date(r.date);
      let key = '';
      let label = '';
      
      if (chartFilter === 'day') {
        key = d.toISOString().split('T')[0];
        label = `${d.getMonth()+1}/${d.getDate()}`;
      } else if (chartFilter === 'week') {
        const firstDay = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear = (d.getTime() - firstDay.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
        key = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
        // 간단히 몇월 몇째주로 표기 (정확한 주차 계산보다는 직관적인 표기)
        label = `${d.getMonth()+1}월 ${Math.ceil(d.getDate()/7)}주차`;
      } else if (chartFilter === 'month') {
        key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
        label = `${d.getFullYear()}년 ${d.getMonth()+1}월`;
      }
      
      if (!map[key]) map[key] = { sumA: 0, countA: 0, sumB: 0, countB: 0, label };
      
      if (r.userId === 'user-a') {
        map[key].sumA += r.weight;
        map[key].countA++;
      } else {
        map[key].sumB += r.weight;
        map[key].countB++;
      }
    });
    
    return Object.keys(map).sort().map(key => {
      const item = map[key];
      return {
        date: item.label,
        A: item.countA > 0 ? Number((item.sumA / item.countA).toFixed(1)) : undefined,
        B: item.countB > 0 ? Number((item.sumB / item.countB).toFixed(1)) : undefined,
      };
    });
  };
  const filteredChartData = buildChartData();

  // 인바디 차트 데이터 구성
  const inbodyChartMap: Record<string, any> = {};
  dbData.inbodyRecords.forEach(r => {
    const dStr = new Date(r.date).toISOString().split('T')[0];
    const monthDay = `${new Date(r.date).getMonth()+1}/${new Date(r.date).getDate()}`;
    if (!inbodyChartMap[dStr]) inbodyChartMap[dStr] = { date: monthDay };
    
    if (r.userId === 'user-a') {
      inbodyChartMap[dStr].A_muscle = r.muscleMass;
      inbodyChartMap[dStr].A_fat_mass = r.fatMass;
      inbodyChartMap[dStr].A_fat = r.fatPercentage;
    } else {
      inbodyChartMap[dStr].B_muscle = r.muscleMass;
      inbodyChartMap[dStr].B_fat_mass = r.fatMass;
      inbodyChartMap[dStr].B_fat = r.fatPercentage;
    }
  });
  const inbodyChartData = Object.values(inbodyChartMap).sort((a:any, b:any) => a.date.localeCompare(b.date));

  // 최신 인바디 기록 추출
  const latestInbodyA = [...dbData.inbodyRecords].filter(r => r.userId === 'user-a').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const latestInbodyB = [...dbData.inbodyRecords].filter(r => r.userId === 'user-b').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const latestWeightA = [...dbData.dailyRecords].filter(r => r.userId === 'user-a' && r.weight).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.weight;
  const latestWeightB = [...dbData.dailyRecords].filter(r => r.userId === 'user-b' && r.weight).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.weight;

  return (
    <main className="container">
      <header style={{ textAlign: 'center', marginBottom: '32px', marginTop: '20px' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '24px' }}>
          정승후&이수정 Diet
        </h1>
        
        {/* 3-Tabs 네비게이션 */}
        <div className="tabs-container">
          <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            🔥 오늘의 기록
          </button>
          <button className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
            📈 요약 및 통계
          </button>
          <button className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => setActiveTab('gallery')}>
            📸 식단 갤러리
          </button>
        </div>
      </header>

      {/* 탭 1: 오늘의 기록 (대시보드) */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* --- 1. 바디 프로필 --- */}
          <section className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>📊 바디 프로필</h2>
              <button className="btn" style={{ padding: '4px 12px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.1)' }} onClick={() => setIsProfileExpanded(!isProfileExpanded)}>
                {isProfileExpanded ? '접기 ▲' : '자세히 보기 ▼'}
              </button>
            </div>

            {!isProfileExpanded ? (
              // 간략 모드 (접힘) - 항상 좌우 2분할 (모바일 대응)
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                
                {/* Person A 간략 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid var(--color-mint)' }}>
                  <div style={{ color: 'var(--color-mint)', fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '4px' }}>{nameA}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>체중: <strong style={{ color: 'var(--text-primary)' }}>{latestWeightA || '-'}</strong> kg</span> |
                    <span>골격근: <strong style={{ color: 'var(--text-primary)' }}>{latestInbodyA?.muscleMass || '-'}</strong> kg</span> |
                    <span>체지방: <strong style={{ color: 'var(--text-primary)' }}>{latestInbodyA?.fatMass || '-'}</strong> kg</span> |
                    <span>체지방률: <strong style={{ color: '#ff006e' }}>{latestInbodyA?.fatPercentage || '-'}</strong> %</span>
                  </div>
                </div>

                {/* Person B 간략 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid var(--color-purple)' }}>
                  <div style={{ color: 'var(--color-purple)', fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '4px' }}>{nameB}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>체중: <strong style={{ color: 'var(--text-primary)' }}>{latestWeightB || '-'}</strong> kg</span> |
                    <span>골격근: <strong style={{ color: 'var(--text-primary)' }}>{latestInbodyB?.muscleMass || '-'}</strong> kg</span> |
                    <span>체지방: <strong style={{ color: 'var(--text-primary)' }}>{latestInbodyB?.fatMass || '-'}</strong> kg</span> |
                    <span>체지방률: <strong style={{ color: '#ff006e' }}>{latestInbodyB?.fatPercentage || '-'}</strong> %</span>
                  </div>
                </div>

              </div>
            ) : (
              // 확장 모드 (펼침)
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Person A Stat Card */}
                <div className="glass-card" style={{ padding: '16px', borderTop: '4px solid var(--color-mint)' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--color-mint)' }}>{nameA}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>체중</p>
                      <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{latestWeightA ? `${latestWeightA} kg` : '-'}</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>골격근량</p>
                      <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{latestInbodyA?.muscleMass ? `${latestInbodyA.muscleMass} kg` : '-'}</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>체지방량</p>
                      <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{latestInbodyA?.fatMass ? `${latestInbodyA.fatMass} kg` : '-'}</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>체지방률</p>
                      <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff006e' }}>{latestInbodyA?.fatPercentage ? `${latestInbodyA.fatPercentage} %` : '-'}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '12px', textAlign: 'right' }}>
                    업데이트: {latestInbodyA?.date ? new Date(latestInbodyA.date).toISOString().split('T')[0] : '없음'}
                  </p>
                </div>
  
                {/* Person B Stat Card */}
                <div className="glass-card" style={{ padding: '16px', borderTop: '4px solid var(--color-purple)' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--color-purple)' }}>{nameB}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>체중</p>
                      <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{latestWeightB ? `${latestWeightB} kg` : '-'}</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>골격근량</p>
                      <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{latestInbodyB?.muscleMass ? `${latestInbodyB.muscleMass} kg` : '-'}</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>체지방량</p>
                      <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{latestInbodyB?.fatMass ? `${latestInbodyB.fatMass} kg` : '-'}</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>체지방률</p>
                      <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff006e' }}>{latestInbodyB?.fatPercentage ? `${latestInbodyB.fatPercentage} %` : '-'}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '12px', textAlign: 'right' }}>
                    업데이트: {latestInbodyB?.date ? new Date(latestInbodyB.date).toISOString().split('T')[0] : '없음'}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* --- 2. 오늘의 기록 --- */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>📝 오늘의 기록</h2>
              {/* 1인 선택 토글 버튼 */}
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}>
                <button 
                  className="btn"
                  style={{ padding: '6px 12px', fontSize: '0.9rem', borderRadius: '8px', background: selectedTodayUser === 'A' ? 'var(--color-mint)' : 'transparent', color: selectedTodayUser === 'A' ? '#000' : 'var(--text-secondary)', boxShadow: selectedTodayUser === 'A' ? '0 0 10px rgba(0, 245, 212, 0.3)' : 'none' }}
                  onClick={() => handleUserSelect('A')}
                >
                  {nameA}
                </button>
                <button 
                  className="btn"
                  style={{ padding: '6px 12px', fontSize: '0.9rem', borderRadius: '8px', background: selectedTodayUser === 'B' ? 'var(--color-purple)' : 'transparent', color: selectedTodayUser === 'B' ? '#fff' : 'var(--text-secondary)', boxShadow: selectedTodayUser === 'B' ? '0 0 10px rgba(213, 0, 249, 0.3)' : 'none' }}
                  onClick={() => handleUserSelect('B')}
                >
                  {nameB}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          
          {selectedTodayUser === 'A' && (
            <>
              {/* 👤 Person A Card (세로 레이아웃 적용) */}
              <section className="glass-card" style={{ flex: '1 1 300px' }}>
            
            {/* 1열: 이름 + 인바디 버튼 + 하이브리드 날짜 버튼 */}
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem', color: 'var(--color-mint)' }}>👤</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-mint)' }}>
                    {nameA}
                  </span>
                </div>
                <button className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }} onClick={() => openInbodyModal('A')}>
                  💪 인바디
                </button>
              </div>

              {/* 하이브리드 날짜 버튼 (좌우 이동 + 클릭 시 달력) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                <button className="btn" style={{ flex: 1, padding: '8px', background: 'transparent', color: 'var(--text-secondary)', borderRadius: 0, borderRight: '1px solid rgba(255,255,255,0.05)' }} onClick={() => setDateA(changeDate(dateA, -1))}>◀ 이전</button>
                <input 
                  type="date"
                  value={dateA}
                  onChange={(e) => setDateA(e.target.value)}
                  onClick={(e) => { if ('showPicker' in HTMLInputElement.prototype) (e.target as HTMLInputElement).showPicker(); }}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--text-primary)', 
                    fontWeight: 'bold', 
                    textAlign: 'center', 
                    fontSize: '0.95rem',
                    padding: '8px 4px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <button className="btn" style={{ flex: 1, padding: '8px', background: 'transparent', color: 'var(--text-secondary)', borderRadius: 0, borderLeft: '1px solid rgba(255,255,255,0.05)' }} onClick={() => setDateA(changeDate(dateA, 1))}>다음 ▶</button>
              </div>
            </div>
            
            {/* 2열: 체중 */}
            <div style={{ marginBottom: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>⚖️ 체중</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{recordA?.weight ? `${recordA.weight} kg` : '- kg'}</p>
            </div>

            {/* 3열: 운동 여부 */}
            <div style={{ marginBottom: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>🏃‍♂️ 운동 기록</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{recordA?.exercised ? `🔥 오운완 (${recordA.exerciseType || '완료'})` : (recordA?.exerciseType === '휴식' ? '💤 휴식' : '❌ 미완료')}</p>
            </div>

            {/* 4열: 식단 기록 */}
            <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px' }}>
                📸 식단 기록 ({(recordA?.breakfastUrl ? 1 : 0) + (recordA?.lunchUrl ? 1 : 0) + (recordA?.dinnerUrl ? 1 : 0)}/3)
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, height: '70px', background: recordA?.breakfastUrl ? `url(${recordA.breakfastUrl}) center/cover` : 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: '#666', textShadow: recordA?.breakfastUrl ? '0 0 4px #000' : 'none' }}>아침</div>
                <div style={{ flex: 1, height: '70px', background: recordA?.lunchUrl ? `url(${recordA.lunchUrl}) center/cover` : 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: '#666', textShadow: recordA?.lunchUrl ? '0 0 4px #000' : 'none' }}>점심</div>
                <div style={{ flex: 1, height: '70px', background: recordA?.dinnerUrl ? `url(${recordA.dinnerUrl}) center/cover` : 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: '#666', textShadow: recordA?.dinnerUrl ? '0 0 4px #000' : 'none' }}>저녁</div>
              </div>
            </div>

            {/* 5열: 기록하기 버튼 */}
            <button className="btn btn-mint" style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }} onClick={() => openRecordModal('A')}>
              기록하기 (수정)
            </button>
              </section>
            </>
          )}

          {selectedTodayUser === 'B' && (
            <>
              {/* 👤 Person B Card */}
              <section className="glass-card" style={{ flex: '1 1 300px' }}>
            
            {/* 1열: 이름 + 인바디 버튼 + 하이브리드 날짜 버튼 */}
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem', color: 'var(--color-purple)' }}>👤</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-purple)' }}>
                    {nameB}
                  </span>
                </div>
                <button className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }} onClick={() => openInbodyModal('B')}>
                  💪 인바디
                </button>
              </div>

              {/* 하이브리드 날짜 버튼 (좌우 이동 + 클릭 시 달력) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                <button className="btn" style={{ flex: 1, padding: '8px', background: 'transparent', color: 'var(--text-secondary)', borderRadius: 0, borderRight: '1px solid rgba(255,255,255,0.05)' }} onClick={() => setDateB(changeDate(dateB, -1))}>◀ 이전</button>
                <input 
                  type="date"
                  value={dateB}
                  onChange={(e) => setDateB(e.target.value)}
                  onClick={(e) => { if ('showPicker' in HTMLInputElement.prototype) (e.target as HTMLInputElement).showPicker(); }}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--text-primary)', 
                    fontWeight: 'bold', 
                    textAlign: 'center', 
                    fontSize: '0.95rem',
                    padding: '8px 4px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <button className="btn" style={{ flex: 1, padding: '8px', background: 'transparent', color: 'var(--text-secondary)', borderRadius: 0, borderLeft: '1px solid rgba(255,255,255,0.05)' }} onClick={() => setDateB(changeDate(dateB, 1))}>다음 ▶</button>
              </div>
            </div>
            
            {/* 2열: 체중 */}
            <div style={{ marginBottom: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>⚖️ 체중</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{recordB?.weight ? `${recordB.weight} kg` : '- kg'}</p>
            </div>

            {/* 3열: 운동 여부 */}
            <div style={{ marginBottom: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>🏃‍♀️ 운동 기록</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{recordB?.exercised ? `🔥 오운완 (${recordB.exerciseType || '완료'})` : (recordB?.exerciseType === '휴식' ? '💤 휴식' : '❌ 미완료')}</p>
            </div>

            {/* 4열: 식단 기록 */}
            <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px' }}>
                📸 식단 기록 ({(recordB?.breakfastUrl ? 1 : 0) + (recordB?.lunchUrl ? 1 : 0) + (recordB?.dinnerUrl ? 1 : 0)}/3)
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, height: '70px', background: recordB?.breakfastUrl ? `url(${recordB.breakfastUrl}) center/cover` : 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: '#666', textShadow: recordB?.breakfastUrl ? '0 0 4px #000' : 'none' }}>아침</div>
                <div style={{ flex: 1, height: '70px', background: recordB?.lunchUrl ? `url(${recordB.lunchUrl}) center/cover` : 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: '#666', textShadow: recordB?.lunchUrl ? '0 0 4px #000' : 'none' }}>점심</div>
                <div style={{ flex: 1, height: '70px', background: recordB?.dinnerUrl ? `url(${recordB.dinnerUrl}) center/cover` : 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: '#666', textShadow: recordB?.dinnerUrl ? '0 0 4px #000' : 'none' }}>저녁</div>
              </div>
            </div>

            {/* 5열: 기록하기 버튼 */}
            <button className="btn btn-purple" style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }} onClick={() => openRecordModal('B')}>
              기록하기 (수정)
            </button>
              </section>
            </>
          )}
            </div>
          </section>
        </div>
      )}

      {/* 탭 2: 요약 및 통계 */}
      {activeTab === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* 월간 종합 캘린더 */}
          <section className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <button className="btn" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)' }} onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))}>◀</button>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{currentYear}년 {currentMonth + 1}월</h2>
              <button className="btn" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)' }} onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))}>▶</button>
            </div>
            <div className="calendar-wrapper">
              <div className="calendar-header">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
              </div>
              <div className="summary-calendar-grid">
                {calendarDays.map((day, index) => {
                  if (day === null) return <div key={`empty-${index}`} className="summary-calendar-day empty"></div>;
                  
                  const data = calendarData[day];
                  return (
                    <div key={day} className="summary-calendar-day">
                      <div className="calendar-date">{day}</div>
                      <div className="cal-data-row">
                        {data?.A && (
                          <div className="cal-person">
                            <div className="cal-mint">{nameA.slice(0,4)}: {data.A.weight}kg</div>
                            <div className="cal-exercise">{data.A.exercise}</div>
                          </div>
                        )}
                        {data?.B && (
                          <div className="cal-person">
                            <div className="cal-purple">{nameB.slice(0,4)}: {data.B.weight}kg</div>
                            <div className="cal-exercise">{data.B.exercise}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 체중 변화 차트 */}
          <section className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ marginBottom: '4px', fontSize: '1.3rem' }}>📉 체중 변화율 비교</h2>
              </div>
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
                <button className={`btn ${chartFilter === 'day' ? 'btn-mint' : ''}`} style={{ padding: '6px 12px', fontSize: '0.85rem', background: chartFilter === 'day' ? '' : 'transparent', color: chartFilter === 'day' ? '#fff' : 'var(--text-secondary)' }} onClick={() => setChartFilter('day')}>일간</button>
                <button className={`btn ${chartFilter === 'week' ? 'btn-mint' : ''}`} style={{ padding: '6px 12px', fontSize: '0.85rem', background: chartFilter === 'week' ? '' : 'transparent', color: chartFilter === 'week' ? '#fff' : 'var(--text-secondary)' }} onClick={() => setChartFilter('week')}>주간</button>
                <button className={`btn ${chartFilter === 'month' ? 'btn-mint' : ''}`} style={{ padding: '6px 12px', fontSize: '0.85rem', background: chartFilter === 'month' ? '' : 'transparent', color: chartFilter === 'month' ? '#fff' : 'var(--text-secondary)' }} onClick={() => setChartFilter('month')}>월간</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <div style={{ height: '250px', width: '100%', background: 'rgba(255,255,255,0.02)', padding: '16px 16px 32px 16px', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '8px', textAlign: 'center', color: 'var(--color-mint)' }}>{nameA} 체중</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} axisLine={false} tickFormatter={(val: number) => val.toFixed(1)} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                    <Line connectNulls={true} type="monotone" dataKey="A" stroke="var(--color-mint)" strokeWidth={3} dot={{ r: 4 }} name="체중" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ height: '250px', width: '100%', background: 'rgba(255,255,255,0.02)', padding: '16px 16px 32px 16px', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '8px', textAlign: 'center', color: 'var(--color-purple)' }}>{nameB} 체중</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} axisLine={false} tickFormatter={(val: number) => val.toFixed(1)} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                    <Line connectNulls={true} type="monotone" dataKey="B" stroke="var(--color-purple)" strokeWidth={3} dot={{ r: 4 }} name="체중" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* 인바디 1: 골격근량 차트 */}
          <section className="glass-card">
            <h2 style={{ marginBottom: '16px', fontSize: '1.2rem', color: '#d500f9' }}>💪 골격근량 변화 (kg)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <div style={{ height: '250px', width: '100%', background: 'rgba(255,255,255,0.02)', padding: '16px 16px 32px 16px', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '8px', textAlign: 'center', color: 'var(--color-mint)' }}>{nameA} 골격근량</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={inbodyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} axisLine={false} tickFormatter={(val: number) => val.toFixed(1)} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                    <Line connectNulls={true} type="monotone" dataKey="A_muscle" stroke="var(--color-mint)" strokeWidth={3} name="골격근량" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ height: '250px', width: '100%', background: 'rgba(255,255,255,0.02)', padding: '16px 16px 32px 16px', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '8px', textAlign: 'center', color: 'var(--color-purple)' }}>{nameB} 골격근량</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={inbodyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} axisLine={false} tickFormatter={(val: number) => val.toFixed(1)} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                    <Line connectNulls={true} type="monotone" dataKey="B_muscle" stroke="var(--color-purple)" strokeWidth={3} name="골격근량" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* 인바디 2: 체지방량 차트 */}
          <section className="glass-card">
            <h2 style={{ marginBottom: '16px', fontSize: '1.2rem', color: '#fb8500' }}>🧈 체지방량 변화 (kg)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <div style={{ height: '250px', width: '100%', background: 'rgba(255,255,255,0.02)', padding: '16px 16px 32px 16px', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '8px', textAlign: 'center', color: 'var(--color-mint)' }}>{nameA} 체지방량</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={inbodyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} axisLine={false} tickFormatter={(val: number) => val.toFixed(1)} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                    <Line connectNulls={true} type="monotone" dataKey="A_fat_mass" stroke="var(--color-mint)" strokeWidth={3} name="체지방량" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ height: '250px', width: '100%', background: 'rgba(255,255,255,0.02)', padding: '16px 16px 32px 16px', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '8px', textAlign: 'center', color: 'var(--color-purple)' }}>{nameB} 체지방량</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={inbodyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} axisLine={false} tickFormatter={(val: number) => val.toFixed(1)} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                    <Line connectNulls={true} type="monotone" dataKey="B_fat_mass" stroke="var(--color-purple)" strokeWidth={3} name="체지방량" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* 인바디 3: 체지방률 차트 */}
          <section className="glass-card">
            <h2 style={{ marginBottom: '16px', fontSize: '1.2rem', color: '#ff006e' }}>🔥 체지방률 변화 (%)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <div style={{ height: '250px', width: '100%', background: 'rgba(255,255,255,0.02)', padding: '16px 16px 32px 16px', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '8px', textAlign: 'center', color: 'var(--color-mint)' }}>{nameA} 체지방률</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={inbodyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} axisLine={false} tickFormatter={(val: number) => val.toFixed(1)} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                    <Line connectNulls={true} type="monotone" dataKey="A_fat" stroke="var(--color-mint)" strokeWidth={3} strokeDasharray="5 5" name="체지방률" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ height: '250px', width: '100%', background: 'rgba(255,255,255,0.02)', padding: '16px 16px 32px 16px', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '8px', textAlign: 'center', color: 'var(--color-purple)' }}>{nameB} 체지방률</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={inbodyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} axisLine={false} tickFormatter={(val: number) => val.toFixed(1)} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                    <Line connectNulls={true} type="monotone" dataKey="B_fat" stroke="var(--color-purple)" strokeWidth={3} strokeDasharray="5 5" name="체지방률" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

        </div>
      )}

      {/* 탭 3: 식단 갤러리 */}
      {activeTab === 'gallery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <button className="btn" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)' }} onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))}>◀</button>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{currentYear}년 {currentMonth + 1}월</h2>
              <button className="btn" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)' }} onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))}>▶</button>
            </div>
            <div className="calendar-wrapper">
              <div className="calendar-header">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
              </div>
              <div className="calendar-grid">
                {calendarDays.map((day, index) => {
                  if (day === null) return <div key={`empty-${index}`} className="calendar-day empty"></div>;
                  
                  const data = calendarData[day];
                  const photosA = data?.A?.photos || [];
                  const photosB = data?.B?.photos || [];
                  const hasPhotos = photosA.length > 0 || photosB.length > 0;

                  return (
                    <div key={day} className="calendar-day">
                      <div className="calendar-date" style={{ marginBottom: '0' }}>{day}</div>
                      {hasPhotos && (
                        <div style={{ display: 'flex', width: '100%', height: 'calc(100% - 24px)', marginTop: '4px', gap: '2px' }}>
                          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr', gridAutoRows: '1fr', gap: '2px', background: 'rgba(0, 245, 212, 0.03)', borderRadius: '4px' }}>
                            {photosA.slice(0, 3).map((photoStr: string, idx: number) => (
                              <div key={`A-${idx}`} className="gallery-photo-item" style={{ background: `url(${photoStr}) center/cover` }}></div>
                            ))}
                          </div>
                          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr', gridAutoRows: '1fr', gap: '2px', background: 'rgba(213, 0, 249, 0.03)', borderRadius: '4px' }}>
                            {photosB.slice(0, 3).map((photoStr: string, idx: number) => (
                              <div key={`B-${idx}`} className="gallery-photo-item" style={{ background: `url(${photoStr}) center/cover` }}></div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 1. 식단/운동 기록 폼 모달 */}
      {isRecordModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ color: themeColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {currentName} 님의 기록
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                기록 날짜: {currentDate} (잘못 입력 시 덮어쓰기 수정 가능)
              </p>
            </div>
            
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label className="form-label">⚖️ 체중 (kg)</label>
                <input type="number" step="0.1" className="form-input" placeholder="예: 70.5" style={{ borderColor: themeColor }} value={weightInput} onChange={(e) => setWeightInput(e.target.value)} />
              </div>
              
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '12px' }}>📸 식단 사진 첨부 (클릭하여 파일 선택)</label>
                <div className="photo-grid">
                  <label className="file-upload-box" style={{ display: 'block', background: breakfastUrl ? `url(${breakfastUrl}) center/cover` : '' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handlePhotoUpload(e, setBreakfastUrl)} />
                    {!breakfastUrl && (
                      <>
                        <p style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🍳</p>
                        <p>아침 추가</p>
                      </>
                    )}
                  </label>
                  <label className="file-upload-box" style={{ display: 'block', background: lunchUrl ? `url(${lunchUrl}) center/cover` : '' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handlePhotoUpload(e, setLunchUrl)} />
                    {!lunchUrl && (
                      <>
                        <p style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🍱</p>
                        <p>점심 추가</p>
                      </>
                    )}
                  </label>
                  <label className="file-upload-box" style={{ display: 'block', background: dinnerUrl ? `url(${dinnerUrl}) center/cover` : '' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handlePhotoUpload(e, setDinnerUrl)} />
                    {!dinnerUrl && (
                      <>
                        <p style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🥩</p>
                        <p>저녁 추가</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ marginBottom: '12px' }}>💪 운동 기록 상태</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className={`btn ${exerciseStatus === '오운완' ? (selectedPerson === 'A' ? 'btn-mint' : 'btn-purple') : ''}`} style={{ flex: 1, padding: '12px', background: exerciseStatus === '오운완' ? '' : 'rgba(255,255,255,0.05)', color: exerciseStatus === '오운완' ? '#fff' : 'var(--text-secondary)' }} onClick={() => setExerciseStatus('오운완')}>🔥 오운완</button>
                  <button type="button" className={`btn ${exerciseStatus === '휴식' ? (selectedPerson === 'A' ? 'btn-mint' : 'btn-purple') : ''}`} style={{ flex: 1, padding: '12px', background: exerciseStatus === '휴식' ? '' : 'rgba(255,255,255,0.05)', color: exerciseStatus === '휴식' ? '#fff' : 'var(--text-secondary)' }} onClick={() => setExerciseStatus('휴식')}>💤 휴식</button>
                  <button type="button" className={`btn ${exerciseStatus === '미완료' ? (selectedPerson === 'A' ? 'btn-mint' : 'btn-purple') : ''}`} style={{ flex: 1, padding: '12px', background: exerciseStatus === '미완료' ? '' : 'rgba(255,255,255,0.05)', color: exerciseStatus === '미완료' ? '#fff' : 'var(--text-secondary)' }} onClick={() => setExerciseStatus('미완료')}>❌ 미완료</button>
                </div>
              </div>

              {exerciseStatus === '오운완' && (
                <div className="form-group">
                  <label className="form-label">어떤 운동을 하셨나요?</label>
                  <input type="text" className="form-input" placeholder="예: 하체, 어깨, 런닝머신 등" style={{ borderColor: themeColor }} value={exerciseTypeInput} onChange={(e) => setExerciseTypeInput(e.target.value)} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn" style={{ flex: 1, padding: '16px', background: 'rgba(255,50,50,0.1)', color: '#ff4444', fontSize: '1.1rem', fontWeight: 'bold' }} onClick={handleDeleteDaily} disabled={isSaving}>
                  🗑️ 삭제
                </button>
                <button type="button" className={`btn ${selectedPerson === 'A' ? 'btn-mint' : 'btn-purple'}`} style={{ flex: 2, padding: '16px', fontSize: '1.1rem', opacity: isSaving ? 0.7 : 1 }} onClick={handleSaveDaily} disabled={isSaving}>
                  {isSaving ? '저장 중...' : '기록 저장 (수정)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. 인바디 등록 폼 모달 */}
      {isInbodyModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ color: themeColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
                💪 {currentName} 님의 인바디
              </h2>
              
              {/* 인바디 모달 내부 하이브리드 날짜 선택기 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>측정 날짜:</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', overflow: 'hidden' }}>
                  <button type="button" className="btn" style={{ padding: '6px 10px', background: 'transparent', borderRight: '1px solid rgba(255,255,255,0.1)' }} onClick={() => selectedPerson === 'A' ? setInbodyDateA(changeMonth(inbodyDateA, -1)) : setInbodyDateB(changeMonth(inbodyDateB, -1))}>◀</button>
                  <input 
                    type="month"
                    value={selectedPerson === 'A' ? inbodyDateA.substring(0,7) : inbodyDateB.substring(0,7)}
                    onChange={(e) => selectedPerson === 'A' ? setInbodyDateA(e.target.value) : setInbodyDateB(e.target.value)}
                    onClick={(e) => { if ('showPicker' in HTMLInputElement.prototype) (e.target as HTMLInputElement).showPicker(); }}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      color: 'var(--text-primary)', 
                      fontWeight: 'bold', 
                      textAlign: 'center', 
                      fontSize: '0.9rem',
                      padding: '6px 4px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  <button type="button" className="btn" style={{ padding: '6px 10px', background: 'transparent', borderLeft: '1px solid rgba(255,255,255,0.1)' }} onClick={() => selectedPerson === 'A' ? setInbodyDateA(changeMonth(inbodyDateA, 1)) : setInbodyDateB(changeMonth(inbodyDateB, 1))}>▶</button>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px' }}>
                (잘못 입력 시 언제든 덮어쓰기 수정 가능)
              </p>
            </div>
            
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label className="form-label">골격근량 (kg)</label>
                <input type="number" step="0.1" className="form-input" placeholder="예: 32.5" style={{ borderColor: themeColor }} value={muscleMassInput} onChange={(e) => setMuscleMassInput(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">체지방량 (kg)</label>
                <input type="number" step="0.1" className="form-input" placeholder="예: 15.2" style={{ borderColor: themeColor }} value={fatMassInput} onChange={(e) => setFatMassInput(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">체지방률 (%)</label>
                <input type="number" step="0.1" className="form-input" placeholder="예: 20.5" style={{ borderColor: themeColor }} value={fatPercentInput} onChange={(e) => setFatPercentInput(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn" style={{ flex: 1, padding: '16px', background: 'rgba(255,50,50,0.1)', color: '#ff4444', fontSize: '1.1rem', fontWeight: 'bold' }} onClick={handleDeleteInbody} disabled={isSaving}>
                  🗑️ 삭제
                </button>
                <button type="button" className={`btn ${selectedPerson === 'A' ? 'btn-mint' : 'btn-purple'}`} style={{ flex: 2, padding: '16px', fontSize: '1.1rem', opacity: isSaving ? 0.7 : 1 }} onClick={handleSaveInbody} disabled={isSaving}>
                  {isSaving ? '저장 중...' : '인바디 저장 (수정)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
