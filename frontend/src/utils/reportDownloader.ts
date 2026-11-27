import { StudyAnalysisResponse } from '../types';

/**
 * Downloads full plain-text clinical report and prescription draft.
 */
export const downloadReportText = (data: StudyAnalysisResponse, signedOffBy?: string | null) => {
  const patient = data.patient_info;
  const report = data.radiology_report;
  const cds = data.clinical_decision_support;
  const guidance = data.patient_guidance;
  const signer = signedOffBy || data.signed_off_by;

  let content = `================================================================================
                    MEDIVISTA AI — CLINICAL STUDY REPORT
                    Multimodal Medical Imaging AI Copilot
================================================================================

STUDY INFORMATION:
------------------
Study ID        : ${data.study_id}
Modality        : ${data.modality}
Processing Time : ${(data.processing_time_ms || 0).toFixed(1)} ms
Triage Urgency  : ${report.urgency_level}
Timestamp       : ${new Date().toLocaleString()}
${signer ? `Verified By     : ${signer}\n` : ''}
PATIENT DEMOGRAPHICS & CLINICAL HISTORY:
----------------------------------------
Patient ID       : ${patient.patient_id}
Age              : ${patient.age ? `${patient.age} Years` : 'Not provided'}
Biological Sex   : ${patient.gender || 'Unknown'}
Presenting Signs : ${patient.symptoms || 'None recorded'}
Clinical History : ${patient.clinical_history || 'No prior history'}

================================================================================
                         STRUCTURED RADIOLOGY REPORT
================================================================================

EXAMINATION:
${report.examination}

TECHNIQUE:
${report.technique}

COMPARISON:
${report.comparison}

FINDINGS:
${report.findings}

DIAGNOSTIC IMPRESSION:
${report.impression}

================================================================================
                    CLINICAL DECISION SUPPORT (CDS)
================================================================================

TRIAGE STRATIFICATION:
${cds.urgency_stratification}

PRIORITIZED DIFFERENTIAL DIAGNOSES:
${cds.differentials.map((d, i) => `${i + 1}. ${d.diagnosis} (${Math.round(d.probability * 100)}% Probability)\n   Evidence: ${d.evidence}`).join('\n\n')}

RECOMMENDED CONFIRMATORY DIAGNOSTIC WORKUP:
${cds.suggested_confirmatory_tests.map((t) => `• ${t}`).join('\n')}

ACCREDITED GUIDELINES CITED:
${cds.guidelines_referenced.map((g) => `• ${g}`).join('\n')}
`;

  if (guidance) {
    content += `
================================================================================
                      PHYSICIAN PRESCRIPTION DRAFT (Rx)
================================================================================
${guidance.prescriptions_draft.map((rx, idx) => `
[Rx #${idx + 1}] ${rx.medication_name} — ${rx.dosage} (${rx.route})
Schedule : ${rx.frequency}
Duration : ${rx.duration}
Directions: ${rx.instructions}
Precaution: ${rx.precaution || 'Standard medication precautions apply'}
--------------------------------------------------------------------------------`).join('')}

================================================================================
                   WHAT PATIENT MUST STRICTLY AVOID
================================================================================
${guidance.things_to_avoid.map((item) => `• ${item}`).join('\n')}

================================================================================
                 SEQUENTIAL RECOVERY & CARE PLAN (PHASES)
================================================================================
${guidance.sequential_care_plan.map((step) => `
[${step.phase}] — Timeline: ${step.timeframe}
${step.actions.map((act) => `  → ${act}`).join('\n')}`).join('\n')}

================================================================================
               EMERGENCY WARNING SIGNS (RED FLAGS TO SEEK ER)
================================================================================
${guidance.red_flag_warning_symptoms.map((rf) => `• ${rf}`).join('\n')}

LIFESTYLE & SUPPORTIVE RECOMMENDATIONS:
${guidance.lifestyle_and_diet_recommendations.map((ls) => `• ${ls}`).join('\n')}
`;
  }

  content += `
================================================================================
MANDATORY CLINICAL DISCLAIMER:
${report.disclaimer}
All AI-generated recommendations require mandatory validation and sign-off by a
licensed physician before administration or clinical action.
================================================================================
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.study_id}_Medical_Report.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Opens a hospital-grade printable report with print dialog
 * (allowing user to print or "Save as PDF").
 */
export const printClinicalReport = (data: StudyAnalysisResponse, signedOffBy?: string | null) => {
  const patient = data.patient_info;
  const report = data.radiology_report;
  const cds = data.clinical_decision_support;
  const guidance = data.patient_guidance;
  const signer = signedOffBy || data.signed_off_by;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup blocked. Please allow popups for this site to generate the PDF report.');
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Clinical Study Report — ${data.study_id}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1a202c;
      line-height: 1.5;
      font-size: 11pt;
      margin: 0;
      padding: 10px;
    }
    .header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo { font-size: 20pt; font-weight: 800; color: #0369a1; letter-spacing: -0.5px; }
    .badge { display: inline-block; padding: 3px 8px; font-size: 9pt; font-weight: 700; border-radius: 4px; text-transform: uppercase; }
    .badge-urgent { background: #fee2e2; color: #b91c1c; border: 1px solid #f87171; }
    .badge-intermediate { background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; }
    .badge-routine { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; background: #f8fafc; border: 1px solid #e2e8f0; }
    .meta-table td { padding: 6px 10px; font-size: 9.5pt; border: 1px solid #e2e8f0; }
    .meta-label { font-weight: bold; color: #475569; width: 18%; }
    .meta-val { color: #0f172a; width: 32%; font-weight: 500; }
    h2 { font-size: 13pt; color: #0369a1; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 18px; margin-bottom: 8px; }
    h3 { font-size: 11pt; color: #334155; margin-top: 12px; margin-bottom: 4px; }
    .findings-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; font-family: ui-monospace, monospace; font-size: 9.5pt; white-space: pre-wrap; margin-bottom: 12px; }
    .impression-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 10px 14px; font-size: 10.5pt; font-weight: 600; color: #78350f; white-space: pre-wrap; margin-bottom: 16px; }
    table.data-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 14px; font-size: 9.5pt; }
    table.data-table th, table.data-table td { border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; }
    table.data-table th { background: #f1f5f9; color: #334155; }
    .avoid-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; }
    .avoid-item { color: #991b1b; font-size: 9.5pt; margin-bottom: 4px; }
    .red-flag-box { background: #fff1f2; border: 1px solid #fda4af; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; }
    .red-flag-item { color: #be123c; font-size: 9.5pt; margin-bottom: 4px; font-weight: 600; }
    .phase-card { border: 1px solid #e2e8f0; border-left: 4px solid #0284c7; background: #f8fafc; padding: 8px 12px; margin-bottom: 8px; border-radius: 4px; }
    .phase-title { font-weight: bold; color: #0369a1; font-size: 10pt; }
    .phase-time { font-size: 8.5pt; color: #64748b; font-weight: normal; margin-left: 8px; }
    .phase-action { font-size: 9pt; color: #334155; margin-top: 3px; }
    .footer-disclaimer { margin-top: 24px; padding-top: 12px; border-top: 1px dashed #94a3b8; font-size: 8pt; color: #64748b; line-height: 1.4; }
    .sign-off { margin-top: 24px; display: flex; justify-content: space-between; font-size: 9pt; color: #475569; }
    .sign-line { width: 240px; border-top: 1px solid #334155; margin-top: 32px; text-align: center; padding-top: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">MEDIVISTA AI <span style="font-size: 11pt; color: #64748b; font-weight: normal;">| Multimodal Medical Imaging Copilot</span></div>
      <div style="font-size: 9pt; color: #64748b;">Microsoft BioViL-T &amp; BiomedCLIP Evidence-Grounded Diagnostic Support</div>
    </div>
    <div>
      <span class="badge ${
        report.urgency_level === 'URGENT'
          ? 'badge-urgent'
          : report.urgency_level === 'INTERMEDIATE'
          ? 'badge-intermediate'
          : 'badge-routine'
      }">Triage: ${report.urgency_level}</span>
    </div>
  </div>

  <table class="meta-table">
    <tr>
      <td class="meta-label">Study ID:</td>
      <td class="meta-val">${data.study_id}</td>
      <td class="meta-label">Date &amp; Time:</td>
      <td class="meta-val">${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</td>
    </tr>
    <tr>
      <td class="meta-label">Patient ID:</td>
      <td class="meta-val">${patient.patient_id}</td>
      <td class="meta-label">Age / Sex:</td>
      <td class="meta-val">${patient.age ? `${patient.age} Y` : 'N/A'} / ${patient.gender || 'Unknown'}</td>
    </tr>
    <tr>
      <td class="meta-label">Modality:</td>
      <td class="meta-val">${data.modality}</td>
      <td class="meta-label">Pipeline Latency:</td>
      <td class="meta-val">${(data.processing_time_ms || 0).toFixed(1)} ms</td>
    </tr>
    <tr>
      <td class="meta-label">Symptoms:</td>
      <td class="meta-val" colspan="3">${patient.symptoms || 'None recorded'}</td>
    </tr>
  </table>

  <h2>1. Structured Radiology Report</h2>
  <div style="font-size: 9pt; color: #475569; margin-bottom: 6px;">
    <strong>Examination:</strong> ${report.examination} | <strong>Technique:</strong> ${report.technique}
  </div>

  <h3>Findings (Organ-by-Organ Narrative)</h3>
  <div class="findings-box">${report.findings}</div>

  <h3>Diagnostic Impression</h3>
  <div class="impression-box">${report.impression}</div>

  <h2>2. Clinical Decision Support &amp; Differentials</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 35%;">Differential Diagnosis</th>
        <th style="width: 15%;">Probability</th>
        <th>Clinical Evidence Reasoning</th>
      </tr>
    </thead>
    <tbody>
      ${cds.differentials.map((d) => `
        <tr>
          <td><strong>${d.diagnosis}</strong></td>
          <td>${Math.round(d.probability * 100)}%</td>
          <td style="color: #475569; font-size: 8.5pt;">${d.evidence}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${guidance ? `
  <h2>3. Physician-Reviewable Prescription Regimen (Rx)</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th>Medication</th>
        <th>Dosage &amp; Route</th>
        <th>Frequency</th>
        <th>Duration</th>
        <th>Instructions</th>
      </tr>
    </thead>
    <tbody>
      ${guidance.prescriptions_draft.map((rx) => `
        <tr>
          <td><strong>${rx.medication_name}</strong></td>
          <td>${rx.dosage} (${rx.route})</td>
          <td>${rx.frequency}</td>
          <td>${rx.duration}</td>
          <td style="font-size: 8.5pt;">${rx.instructions}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>4. Critical Avoidance Guidelines (What Patient Must Avoid)</h2>
  <div class="avoid-box">
    ${guidance.things_to_avoid.map((item) => `<div class="avoid-item">${item}</div>`).join('')}
  </div>

  <h2>5. Sequential Recovery &amp; Care Milestones</h2>
  <div>
    ${guidance.sequential_care_plan.map((step) => `
      <div class="phase-card">
        <div class="phase-title">${step.phase} <span class="phase-time">(${step.timeframe})</span></div>
        ${step.actions.map((act) => `<div class="phase-action">• ${act}</div>`).join('')}
      </div>
    `).join('')}
  </div>

  <h2>6. Emergency Red Flags (Seek Immediate Hospital Care)</h2>
  <div class="red-flag-box">
    ${guidance.red_flag_warning_symptoms.map((rf) => `<div class="red-flag-item">${rf}</div>`).join('')}
  </div>
  ` : ''}

  <div class="sign-off">
    <div>
      <div>Clinical Guidelines: ${cds.guidelines_referenced.slice(0, 2).join('; ')}</div>
      <div>${signer ? `Digitally Verified by: <strong>${signer}</strong>` : 'Pending Attending Clinician Sign-Off'}</div>
    </div>
    <div>
      <div class="sign-line">${signer ? `${signer} (Digital Sign-Off)` : 'Physician Signature &amp; Stamp'}</div>
    </div>
  </div>

  <div class="footer-disclaimer">
    <strong>Mandatory Medical Legal Disclaimer:</strong> ${report.disclaimer}
    This document constitutes an AI-assisted diagnostic draft. It does not replace independent clinical judgment by a qualified medical professional.
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
