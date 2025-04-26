import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const exportToExcel = (data, fileName = 'data.xlsx') => {
  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Wrap text for all columns
  const range = XLSX.utils.decode_range(ws['!ref']);  // Get the range of the data

  // Loop through all cells and set wrapText property
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = { r: row, c: col };  // Row and Column indexes
      const cell = ws[XLSX.utils.encode_cell(cellAddress)];
      
      if (cell && typeof cell.v === 'string') {
        // Wrap text for string type cells
        cell.s = { alignment: { wrapText: true } };
      }
    }
  }

  // Adjust column widths based on content length
  const columnWidths = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    let maxLength = 0;
    for (let row = range.s.r; row <= range.e.r; row++) {
      const cellAddress = { r: row, c: col };
      const cell = ws[XLSX.utils.encode_cell(cellAddress)];
      if (cell && cell.v) {
        maxLength = Math.max(maxLength, cell.v.toString().length);
      }
    }
    columnWidths.push({ width: maxLength + 2 }); // Add padding
  }
  ws['!cols'] = columnWidths;

  // Create the workbook and download the file
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1'); // You can change the sheet name here
  XLSX.writeFile(wb, fileName);
};
