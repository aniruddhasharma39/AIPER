import React, { useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { Download } from 'lucide-react';

export default function ReportViewer({ report, onBack }) {
  const reportRef = useRef();

  const downloadPDF = () => {
    const element = reportRef.current;
    html2pdf().from(element).set({
      margin: 10,
      filename: `Report_${report.testCode}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).save();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button onClick={onBack} className="btn" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>&larr; Back to Log</button>
        <button onClick={downloadPDF} className="btn btn-success"><Download size={18} style={{ marginRight: '0.5rem' }}/> Download official PDF</button>
      </div>

      <div ref={reportRef} className="card" style={{ padding: '3rem', backgroundColor: '#fff', color: '#000', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', borderBottom: '2px solid #ccc', paddingBottom: '1rem', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '24px' }}>FoodLab Technologies</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '14px' }}>Official Scientific Analytical Report</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', fontSize: '14px' }}>
          <div style={{ lineHeight: '1.6' }}>
            <strong>Client Entity:</strong> {report.clientName}<br/>
            <strong>Test Code:</strong> {report.testCode}<br/>
            <strong>Schema/Method:</strong> {report.blueprintId?.name}
          </div>
          <div style={{ textAlign: 'right', lineHeight: '1.6' }}>
            <strong>Issue Date:</strong> {new Date(report.completedAt).toLocaleString()}<br/>
            <strong>Analyst:</strong> {report.assignedTo?.name}<br/>
            <strong>Status:</strong> <span style={{ color: '#27ae60', fontWeight: 'bold' }}>FINALIZED (COMPLETED)</span>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: '14px' }}>
          <thead style={{ backgroundColor: '#f8f9fa' }}>
            <tr style={{ borderTop: '2px solid #333', borderBottom: '2px solid #333', textAlign: 'left' }}>
              <th style={{ padding: '0.8rem 0.5rem' }}>Analytical Parameter</th>
              <th style={{ padding: '0.8rem 0.5rem' }}>Observed Result</th>
              <th style={{ padding: '0.8rem 0.5rem' }}>Unit</th>
              <th style={{ padding: '0.8rem 0.5rem' }}>Reference Range</th>
            </tr>
          </thead>
          <tbody>
            {report.results.map((r, i) => {
              // Optional: rudimentary logic to flag out-of-bounds (assumes numeric ranges like "6.5-7.5" and numeric values)
              let isOutlier = false;
              if (r.referenceRange.includes('-') && !isNaN(parseFloat(r.value))) {
                const [min, max] = r.referenceRange.split('-').map(str => parseFloat(str));
                const val = parseFloat(r.value);
                if (!isNaN(min) && !isNaN(max) && (val < min || val > max)) {
                  isOutlier = true;
                }
              }

              return (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.8rem 0.5rem' }}>{r.name}</td>
                  <td style={{ padding: '0.8rem 0.5rem', fontWeight: 'bold', color: isOutlier ? '#e74c3c' : '#2c3e50' }}>
                    {r.value} {isOutlier && <span style={{fontSize:'10px', color:'#e74c3c'}}>(FLAG)</span>}
                  </td>
                  <td style={{ padding: '0.8rem 0.5rem' }}>{r.unit}</td>
                  <td style={{ padding: '0.8rem 0.5rem', color: '#7f8c8d' }}>{r.referenceRange}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        <div style={{ marginTop: '5rem', display: 'flex', justifyContent: 'space-between', color: '#333', fontSize: '14px' }}>
          <div style={{ borderTop: '1px solid #333', paddingTop: '0.5rem', width: '200px', textAlign: 'center' }}>
            Authorized Signatory
          </div>
          <div style={{ borderTop: '1px solid #333', paddingTop: '0.5rem', width: '200px', textAlign: 'center' }}>
            Quality Assurance Stamp
          </div>
        </div>
      </div>
    </div>
  );
}
