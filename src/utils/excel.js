import * as XLSX from "xlsx";

/**
 * Trigger download of an array of objects as an Excel file.
 * @param {Array} data Array of objects to export
 * @param {string} filename Name of the file (without extension)
 */
export const exportToExcel = (data, filename) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  
  // Let the library handle browser download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Parse an Excel file and return its first sheet as an array of JSON objects.
 * @param {File} file The selected Excel file
 * @returns {Promise<Array>} A promise that resolves to an array of objects
 */
export const importFromExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };
    
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
