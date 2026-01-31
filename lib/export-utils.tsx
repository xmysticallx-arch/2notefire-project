'use client'

// Excel Export (CSV-based for browser compatibility)
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  // Determine columns from data if not provided
  const cols = columns || Object.keys(data[0]).map((key) => ({
    key: key as keyof T,
    label: key.toString().replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }))

  // Create CSV content
  const headers = cols.map((col) => `"${col.label}"`).join(',')
  const rows = data.map((row) =>
    cols
      .map((col) => {
        const value = row[col.key]
        if (value === null || value === undefined) return '""'
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`
        if (value instanceof Date) return `"${value.toISOString()}"`
        return `"${String(value)}"`
      })
      .join(',')
  )

  const csvContent = [headers, ...rows].join('\n')

  // Add BOM for Excel UTF-8 compatibility
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })

  downloadBlob(blob, `${filename}.csv`)
}

// XLSX Export using native approach
export async function exportToXLSX<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  // Determine columns from data if not provided
  const cols = columns || Object.keys(data[0]).map((key) => ({
    key: key as keyof T,
    label: key.toString().replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }))

  // Create simple XML-based Excel file
  const headers = cols.map((col) => col.label)
  const rows = data.map((row) =>
    cols.map((col) => {
      const value = row[col.key]
      if (value === null || value === undefined) return ''
      if (value instanceof Date) return value.toISOString()
      return String(value)
    })
  )

  // Create XML spreadsheet
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Sheet1">
  <Table>
   <Row>
    ${headers.map((h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('')}
   </Row>
   ${rows
     .map(
       (row) => `<Row>
    ${row.map((cell) => `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`).join('')}
   </Row>`
     )
     .join('\n')}
  </Table>
 </Worksheet>
</Workbook>`

  const blob = new Blob([xmlContent], {
    type: 'application/vnd.ms-excel',
  })

  downloadBlob(blob, `${filename}.xls`)
}

// DOCX Export (Word document)
export function exportToDocx<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  title: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  // Determine columns from data if not provided
  const cols = columns || Object.keys(data[0]).map((key) => ({
    key: key as keyof T,
    label: key.toString().replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }))

  // Create HTML table for Word
  const tableHeaders = cols.map((col) => `<th style="border:1px solid #000;padding:8px;background:#f0f0f0;">${col.label}</th>`).join('')
  const tableRows = data
    .map(
      (row) =>
        `<tr>${cols
          .map((col) => {
            const value = row[col.key]
            const displayValue = value === null || value === undefined ? '' : String(value)
            return `<td style="border:1px solid #000;padding:8px;">${displayValue}</td>`
          })
          .join('')}</tr>`
    )
    .join('')

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; }
  h1 { color: #333; margin-bottom: 20px; }
  table { border-collapse: collapse; width: 100%; margin-top: 20px; }
  th, td { text-align: left; }
  .footer { margin-top: 30px; font-size: 12px; color: #666; }
</style>
</head>
<body>
<h1>${title}</h1>
<p>Generated on: ${new Date().toLocaleString()}</p>
<p>Total records: ${data.length}</p>
<table>
<thead><tr>${tableHeaders}</tr></thead>
<tbody>${tableRows}</tbody>
</table>
<div class="footer">
  <p>2NoteFireRecord - Music Label Management System</p>
</div>
</body>
</html>`

  // Create Word document using HTML
  const blob = new Blob([htmlContent], {
    type: 'application/vnd.ms-word',
  })

  downloadBlob(blob, `${filename}.doc`)
}

// PDF Export (uses print dialog)
export function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  title: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  // Determine columns from data if not provided
  const cols = columns || Object.keys(data[0]).map((key) => ({
    key: key as keyof T,
    label: key.toString().replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }))

  // Create print-friendly HTML
  const tableHeaders = cols.map((col) => `<th>${col.label}</th>`).join('')
  const tableRows = data
    .map(
      (row) =>
        `<tr>${cols
          .map((col) => {
            const value = row[col.key]
            const displayValue = value === null || value === undefined ? '' : String(value)
            return `<td>${displayValue}</td>`
          })
          .join('')}</tr>`
    )
    .join('')

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to export PDF')
    return
  }

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  @media print {
    body { margin: 0; padding: 20px; }
    @page { margin: 1cm; }
  }
  body { font-family: Arial, sans-serif; }
  h1 { font-size: 24px; margin-bottom: 10px; }
  .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background: #f5f5f5; font-weight: bold; }
  tr:nth-child(even) { background: #fafafa; }
  .footer { margin-top: 20px; font-size: 10px; color: #999; text-align: center; }
</style>
</head>
<body>
<h1>${title}</h1>
<div class="meta">
  <p>Generated: ${new Date().toLocaleString()} | Total: ${data.length} records</p>
</div>
<table>
<thead><tr>${tableHeaders}</tr></thead>
<tbody>${tableRows}</tbody>
</table>
<div class="footer">2NoteFireRecord - Music Label Management System</div>
<script>window.onload = function() { window.print(); }</script>
</body>
</html>`)
  printWindow.document.close()
}

// Print function
export function printData<T extends Record<string, unknown>>(
  data: T[],
  title: string,
  columns?: { key: keyof T; label: string }[]
) {
  exportToPDF(data, title, columns)
}

// Helper functions
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
