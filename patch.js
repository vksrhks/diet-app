const fs = require('fs');
const file = 'c:/PROJECT/privit/Diet/src/app/page.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Update imports
data = data.replace(
  `import { getDashboardData, saveDailyRecord, saveInbodyRecord } from '@/app/actions';`,
  `import { getDashboardData, saveDailyRecord, saveInbodyRecord, deleteDailyRecord, deleteInbodyRecord } from '@/app/actions';`
);

// 2. Add Delete Handlers & Inbody Month Save Logic
const deleteHandlers = `
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
    await deleteInbodyRecord('user-' + selectedPerson?.toLowerCase(), (selectedPerson === 'A' ? inbodyDateA : inbodyDateB) + '-01');
    await loadData();
    setIsSaving(false);
    closeModal();
  };
`;
data = data.replace(
  `  const handleSaveInbody = async () => {`,
  deleteHandlers + `\n  const handleSaveInbody = async () => {`
);

// 2.1 Update handleSaveInbody to append '-01'
data = data.replace(
  `date: selectedPerson === 'A' ? inbodyDateA : inbodyDateB,`,
  `date: (selectedPerson === 'A' ? inbodyDateA : inbodyDateB) + '-01',`
);

// 3. Add Delete buttons to Modals
// Replace the first '취소' button (Daily Modal)
data = data.replace(
  `<button type="button" className="btn" onClick={closeModal} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>취소</button>`,
  `<button type="button" className="btn" onClick={handleDeleteDaily} style={{ flex: 1, padding: '12px', background: 'rgba(255,50,50,0.1)', color: '#ff4444' }}>🗑️ 삭제</button>\n                <button type="button" className="btn" onClick={closeModal} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>취소</button>`
);
// Replace the second '취소' button (Inbody Modal)
data = data.replace(
  `<button type="button" className="btn" onClick={closeModal} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>취소</button>`,
  `<button type="button" className="btn" onClick={handleDeleteInbody} style={{ flex: 1, padding: '12px', background: 'rgba(255,50,50,0.1)', color: '#ff4444' }}>🗑️ 삭제</button>\n                <button type="button" className="btn" onClick={closeModal} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>취소</button>`
);

// 4. Change InBody Date Picker to Month Picker
// The InBody input is the one where type="date" and value uses inbodyDateA or inbodyDateB
data = data.replace(
  `type="date"\n                    value={selectedPerson === 'A' ? inbodyDateA : inbodyDateB}`,
  `type="month"\n                    value={selectedPerson === 'A' ? inbodyDateA.substring(0,7) : inbodyDateB.substring(0,7)}`
);

// Fix setInbodyDate functions for Month picker
data = data.replace(
  `onChange={(e) => selectedPerson === 'A' ? setInbodyDateA(e.target.value) : setInbodyDateB(e.target.value)}`,
  `onChange={(e) => selectedPerson === 'A' ? setInbodyDateA(e.target.value) : setInbodyDateB(e.target.value)}`
); // The value from type="month" is YYYY-MM, which is perfect because we append '-01' in the save handler!

// Wait, the state `inbodyDateA` is initially initialized to YYYY-MM-DD. 
// It's defined as `const [inbodyDateA, setInbodyDateA] = useState(todayStr);` where todayStr is YYYY-MM-DD.
// We must ensure the initial value for the month picker is sliced to YYYY-MM, which we just did in `value={...}`!

// 5. Connect Nulls
data = data.replace(/<Line type="monotone"/g, '<Line connectNulls={true} type="monotone"');

fs.writeFileSync(file, data, 'utf8');
console.log('OK');
