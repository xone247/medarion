import * as XLSX from 'xlsx';

/**
 * Export data to Excel format
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 * @param sheetName Name of the Excel sheet
 */
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  try {
    // Convert array of objects to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate Excel file
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Failed to export to Excel. Please try again.');
  }
};

/**
 * Export data to CSV format
 * @param rows Array of arrays representing rows
 * @param filename Name of the file (without extension)
 */
export const exportToCSV = (rows: string[][], filename: string) => {
  try {
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    alert('Failed to export to CSV. Please try again.');
  }
};

/**
 * Export data to JSON format
 * @param data Data object to export
 * @param filename Name of the file (without extension)
 */
export const exportToJSON = (data: any, filename: string) => {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    alert('Failed to export to JSON. Please try again.');
  }
};







