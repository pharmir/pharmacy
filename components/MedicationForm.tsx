
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Pill, CheckCircle, Printer, AlertCircle } from 'lucide-react';
import { Medication, DCIConfirmation, PharmacyInfo } from '../types';
import { translations } from '../utils/translations';

interface MedicationFormProps {
  existingMedication?: Medication | null;
  medications: Medication[]; // Full list for report
  confirmations: DCIConfirmation[];
  pharmacyInfo: PharmacyInfo | null;
  onSave: (medication: Medication) => void;
  onCancel: () => void;
  language: 'fr' | 'ar';
}

const MedicationForm: React.FC<MedicationFormProps> = ({ existingMedication, medications, confirmations, pharmacyInfo, onSave, onCancel, language }) => {
  const t = translations[language];
  const [med, setMed] = useState<Omit<Medication, 'id' | 'fullNom'>>({
    dci: existingMedication?.dci?.toUpperCase() || '',
    commercialNom: existingMedication?.commercialNom?.toUpperCase() || '',
    forme: existingMedication?.forme?.toUpperCase() || '',
    dosage: existingMedication?.dosage?.toUpperCase() || '',
    conditionnement: existingMedication?.conditionnement?.toUpperCase() || '',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDciRemarque = React.useMemo(() => {
    if (!med.dci) return '';
    const conf = confirmations.find(c => c.dci.toUpperCase() === med.dci.toUpperCase());
    return conf?.remarque || '';
  }, [med.dci, confirmations]);

  const dciOptions = React.useMemo(() => {
    const list: string[] = Array.from(new Set(confirmations.map(c => c.dci.toUpperCase())));
    return list.sort((a, b) => a.localeCompare(b));
  }, [confirmations]);

  const formeOptions = ['CP', 'GLE', 'GOUTTES', 'INJ', 'SAC', 'SUPP'];

  useEffect(() => {
    if (existingMedication) {
      setMed({
        dci: existingMedication.dci.toUpperCase(),
        commercialNom: existingMedication.commercialNom.toUpperCase(),
        forme: existingMedication.forme.toUpperCase(),
        dosage: existingMedication.dosage.toUpperCase(),
        conditionnement: existingMedication.conditionnement.toUpperCase(),
      });
    }
  }, [existingMedication]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!med.commercialNom.trim()) return;

    const fullNom = `${med.commercialNom.trim()} ${med.forme.trim()} ${med.dosage.trim()} ${med.conditionnement.trim()}`.trim().toUpperCase();

    // Check for duplicates (robust check on individual fields)
    const duplicate = medications.find(m => 
      m.commercialNom.trim().toUpperCase() === med.commercialNom.trim().toUpperCase() &&
      m.forme.trim().toUpperCase() === med.forme.trim().toUpperCase() &&
      m.dosage.trim().toUpperCase() === med.dosage.trim().toUpperCase() &&
      m.conditionnement.trim().toUpperCase() === med.conditionnement.trim().toUpperCase() &&
      m.id !== existingMedication?.id
    );

    if (duplicate) {
      const msg = language === 'fr' 
        ? `Le médicament "${fullNom}" existe déjà.` 
        : `الدواء "${fullNom}" موجود بالفعل.`;
      setError(msg);
      alert(msg);
      return;
    }

    setError(null);

    const medicationData: Medication = {
      id: existingMedication?.id || crypto.randomUUID(),
      ...med,
      dci: med.dci.toUpperCase(),
      commercialNom: med.commercialNom.toUpperCase(),
      forme: med.forme.toUpperCase(),
      dosage: med.dosage.toUpperCase(),
      conditionnement: med.conditionnement.toUpperCase(),
      fullNom
    };

    onSave(medicationData);
    setShowSuccess(true);
    setTimeout(() => {
      onCancel();
    }, 1500);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert(language === 'fr' ? "Veuillez autoriser les pop-ups pour afficher le rapport d'impression." : "يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.");
      return;
    }

    const sortedMeds = [...medications].sort((a, b) => 
      a.commercialNom.localeCompare(b.commercialNom)
    );

    const now = new Date();
    const displayDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${language}" dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>${t.medications.medicationList}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { size: A4; margin: 0.5cm; }
          body { 
            font-family: "Times New Roman", Times, serif; 
            text-transform: uppercase; 
            background: white; 
            color: black; 
            margin: 0; 
            padding: 0; 
          }
          .header-box {
            height: 5cm;
            margin: 1cm 1cm 0 1cm;
            border: 1px solid black;
            border-radius: 8px;
            box-sizing: border-box;
            padding: 15px 25px;
            display: flex;
            flex-direction: column;
          }
          .pharmacy-name {
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
            flex: 1;
          }
          .details-group {
            font-size: 12pt;
            font-weight: bold;
            line-height: 1.2;
          }
          .left-group { text-align: ${language === 'ar' ? 'right' : 'left'}; }
          .right-group { 
            display: flex;
            flex-direction: column;
            align-items: ${language === 'ar' ? 'flex-start' : 'flex-end'};
          }
          .right-inner {
            text-align: ${language === 'ar' ? 'right' : 'left'};
            min-width: 180px;
          }
          .content-title {
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            margin-top: 1cm;
            margin-bottom: 1cm;
          }
          .report-info {
             margin: 0 1cm 0.5cm 1cm;
             font-size: 10pt;
             text-align: ${language === 'ar' ? 'left' : 'right'};
          }
          .table-container { margin: 0 1cm; }
          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0 0;
            border: none;
          }
          th {
            padding: 0;
            border: none;
            text-align: center;
          }
          .th-inner {
            background-color: #e5e7eb;
            border-radius: 12px;
            padding: 8px 4px;
            margin: 0 0.5mm;
            display: block;
            font-weight: bold;
            font-size: 10pt;
            color: black;
          }
          td {
            border: none;
            padding: 6px 10px;
            text-align: left;
            font-size: 9pt;
            font-weight: bold;
          }
          .col-num { width: 60px; text-align: center; }
          .col-dci { width: 25%; }
          .col-name { width: 35%; }
          .col-forme { width: 60px; text-align: center; }
          .col-dosage { width: 80px; text-align: center; }
          .col-cond { width: 80px; text-align: center; }
          
          .separator-line {
            height: 2mm;
            background-color: #e5e7eb;
            margin: 5px 1cm 0 1cm;
          }
          .summary-row {
            margin: 10px 1cm 0 1cm;
            display: flex;
            align-items: center;
            font-weight: bold;
            font-size: 11pt;
          }
          .count-box {
            width: 60px;
            text-align: center;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="pharmacy-name">${t.pharmacy} ${pharmacyInfo?.name || 'NOM DE LA PHARMACIE'}</div>
          <div class="details-grid">
            <div class="details-group left-group">
              <div>${t.address}: ${pharmacyInfo?.address || ''}</div>
              <div>${t.orderNum}: ${pharmacyInfo?.nOrdre || ''}</div>
              <div>${t.agreement}: ${pharmacyInfo?.agreement || ''}</div>
              <div>${t.phone}: ${pharmacyInfo?.tel || ''}</div>
            </div>
            <div class="details-group right-group">
              <div class="right-inner">
                <div>${t.nif}: ${pharmacyInfo?.nif || ''}</div>
                <div>${t.nis}: ${pharmacyInfo?.nis || ''}</div>
                <div>${t.rc}: ${pharmacyInfo?.rc || ''}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="content-title">${t.medications.medicationList}</div>
        
        <div class="report-info" dir="rtl">
           ${language === 'fr' ? 'GÉNÉRÉ LE' : 'تم الإنشاء في'} <span dir="ltr">${displayDate}</span>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th class="col-num"><span class="th-inner">N°</span></th>
                <th class="col-dci"><span class="th-inner">${t.medications.dci}</span></th>
                <th class="col-name"><span class="th-inner">${t.medications.commercialName}</span></th>
                <th class="col-forme"><span class="th-inner">${t.medications.form}</span></th>
                <th class="col-dosage"><span class="th-inner">${t.medications.dosage}</span></th>
                <th class="col-cond"><span class="th-inner">${t.medications.packaging}</span></th>
              </tr>
            </thead>
            <tbody>
              ${sortedMeds.map((m, index) => `
                <tr>
                  <td class="col-num">${index + 1}</td>
                  <td class="col-dci">${m.dci}</td>
                  <td class="col-name">${m.commercialNom}</td>
                  <td class="col-forme">${m.forme}</td>
                  <td class="col-dosage">${m.dosage}</td>
                  <td class="col-cond">${m.conditionnement}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="separator-line"></div>

        <div class="summary-row">
          <div class="count-box">${sortedMeds.length}</div>
          <div style="margin-left: 10px;">${t.medications.productsToOrder}</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="max-w-3xl mx-auto uppercase" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-8 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft className={`w-5 h-5 text-slate-600 ${language === 'ar' ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {existingMedication ? t.medications.editMed : t.medications.newMed}
            </h2>
            <p className="text-slate-500 text-sm">{t.medications.title}</p>
          </div>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" />
          {t.print}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-8 no-print">
        {showSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-emerald-100 p-4 rounded-full text-emerald-600">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">{language === 'fr' ? "Médicament Enregistré !" : "تم حفظ الدواء!"}</h3>
            <p className="text-slate-500">{language === 'fr' ? "Le produit est maintenant disponible dans le catalogue." : "المنتج متاح الآن في الكتالوج."}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="font-bold text-sm">{error}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">{t.medications.dci} ({t.select})</label>
                <select
                  required
                  value={med.dci}
                  onChange={(e) => setMed({ ...med, dci: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase"
                >
                  <option value="">{t.select}...</option>
                  {dciOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">TYPE ORD</label>
                <input
                  readOnly
                  type="text"
                  value={selectedDciRemarque}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 outline-none transition-all uppercase font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">{t.medications.commercialName}</label>
                <input
                  required
                  type="text"
                  value={med.commercialNom}
                  onChange={(e) => setMed({ ...med, commercialNom: e.target.value.toUpperCase() })}
                  placeholder="ex: DOLIPRANE"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">{t.medications.form}</label>
                <select
                  required
                  value={med.forme}
                  onChange={(e) => setMed({ ...med, forme: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase"
                >
                  <option value="">{t.select}...</option>
                  {formeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">{t.medications.dosage}</label>
                <input
                  type="text"
                  value={med.dosage}
                  onChange={(e) => setMed({ ...med, dosage: e.target.value.toUpperCase() })}
                  placeholder="ex: 500MG"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">{t.medications.packaging}</label>
                <input
                  type="text"
                  value={med.conditionnement}
                  onChange={(e) => setMed({ ...med, conditionnement: e.target.value.toUpperCase() })}
                  placeholder="ex: B/16"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase"
                />
              </div>
            </div>

            <div className="pt-8 flex gap-4 no-print">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {existingMedication ? t.edit : t.save}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default MedicationForm;
