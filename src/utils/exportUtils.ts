import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], filename: string, sheetName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}_${new Date().toLocaleDateString('ru-RU')}.xlsx`);
};

export const printTable = () => {
  window.print();
};
