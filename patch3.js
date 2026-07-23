const fs = require('fs');
const file = 'c:/PROJECT/privit/Diet/src/app/page.tsx';
let data = fs.readFileSync(file, 'utf8');

const useEffectHook = `
  useEffect(() => {
    if (isInbodyModalOpen && selectedPerson) {
      const rawDate = selectedPerson === 'A' ? inbodyDateA : inbodyDateB;
      const yyyyMM = rawDate.substring(0, 7);
      const searchDateStr = yyyyMM + '-01';
      
      const existingRecord = dbData.inbodyRecords.find(
        r => r.userId === \`user-\${selectedPerson.toLowerCase()}\` && 
             new Date(r.date).toISOString().split('T')[0] === searchDateStr
      );
      
      setMuscleMassInput(existingRecord?.muscleMass?.toString() || '');
      setFatMassInput(existingRecord?.fatMass?.toString() || '');
      setFatPercentInput(existingRecord?.fatPercentage?.toString() || '');
    }
  }, [inbodyDateA, inbodyDateB, selectedPerson, isInbodyModalOpen, dbData]);
`;

// Insert the useEffect right after the existing useEffect(() => { loadData(); }, []);
data = data.replace(
  `  useEffect(() => {
    loadData();
  }, []);`,
  `  useEffect(() => {
    loadData();
  }, []);
` + useEffectHook
);

// We should also fix the save handler because rawDate.substring(0,7) + '-01' is safer
data = data.replace(
  `date: (selectedPerson === 'A' ? inbodyDateA : inbodyDateB) + '-01',`,
  `date: (selectedPerson === 'A' ? inbodyDateA : inbodyDateB).substring(0, 7) + '-01',`
);

// We should also fix the delete handler
data = data.replace(
  `await deleteInbodyRecord('user-' + selectedPerson?.toLowerCase(), (selectedPerson === 'A' ? inbodyDateA : inbodyDateB) + '-01');`,
  `await deleteInbodyRecord('user-' + selectedPerson?.toLowerCase(), (selectedPerson === 'A' ? inbodyDateA : inbodyDateB).substring(0, 7) + '-01');`
);


fs.writeFileSync(file, data, 'utf8');
console.log('OK');
