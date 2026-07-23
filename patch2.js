const fs = require('fs');
const file = 'c:/PROJECT/privit/Diet/src/app/page.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Add changeMonth right after changeDate
data = data.replace(
  `  const changeDate = (currentDate: string, days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };`,
  `  const changeDate = (currentDate: string, days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };
  
  const changeMonth = (currentDate: string, months: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  };`
);

// 2. Change `changeDate` to `changeMonth` in the Inbody Date Picker
data = data.replace(/changeDate\(inbodyDateA, -1\)/g, 'changeMonth(inbodyDateA, -1)');
data = data.replace(/changeDate\(inbodyDateB, -1\)/g, 'changeMonth(inbodyDateB, -1)');
data = data.replace(/changeDate\(inbodyDateA, 1\)/g, 'changeMonth(inbodyDateA, 1)');
data = data.replace(/changeDate\(inbodyDateB, 1\)/g, 'changeMonth(inbodyDateB, 1)');

// 3. Change "어제" to "이전", "내일" to "다음" in the UI
data = data.replace(/어제/g, '이전');
data = data.replace(/내일/g, '다음');

fs.writeFileSync(file, data, 'utf8');
console.log('OK');
