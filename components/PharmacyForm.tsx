
import React, { useState } from 'react';
import { Store, Save, ArrowLeft, CheckCircle, Info, AlertCircle, Printer, CreditCard } from 'lucide-react';
import { PharmacyInfo } from '../types';
import { translations, Language } from '../src/translations';

interface PharmacyFormProps {
  existingInfo: PharmacyInfo | null;
  onSave: (info: PharmacyInfo) => void;
  onCancel: () => void;
  language: Language;
}

const PharmacyForm: React.FC<PharmacyFormProps> = ({ existingInfo, onSave, onCancel, language }) => {
  const t = translations[language];
  const [info, setInfo] = useState<PharmacyInfo>(
    existingInfo || {
      name: '',
      address: '',
      nOrdre: '',
      agreement: '',
      nif: '',
      nis: '',
      rc: '',
      tel: ''
    }
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormComplete = Object.values(info).every(value => value && (value as string).trim() !== '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const fields: (keyof PharmacyInfo)[] = ['name', 'address', 'nOrdre', 'agreement', 'nif', 'nis', 'rc', 'tel'];
    const missingFields = fields.filter(f => !(info[f] as string).trim());
    
    if (missingFields.length > 0) {
      setError(t.errorRequired);
      return;
    }

    setError(null);
    onSave(info);
    setShowSuccess(true);
  };

  const handlePrintCard = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les pop-ups pour imprimer.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <title>Carte de Visite - ${info.name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { size: 85mm 55mm; margin: 0; }
          body { 
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .card {
            width: 85mm;
            height: 55mm;
            position: relative;
            overflow: hidden;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            padding: 4mm;
            box-sizing: border-box;
            font-family: 'Helvetica Neue', Arial, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .accent-circle {
            position: absolute;
            top: -10mm;
            right: -10mm;
            width: 40mm;
            height: 40mm;
            background: rgba(16, 185, 129, 0.2);
            border-radius: 50%;
            z-index: 0;
          }
          .accent-line {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 2mm;
            background: #10b981;
          }
          .content {
            position: relative;
            z-index: 10;
          }
          .pharmacy-name {
            font-size: 14pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #10b981;
            margin-bottom: 2px;
          }
          .subtitle {
            font-size: 6pt;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #94a3b8;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2mm;
            margin-top: 4mm;
          }
          .info-item {
            font-size: 7pt;
          }
          .info-label {
            color: #64748b;
            font-size: 5pt;
            text-transform: uppercase;
            font-weight: bold;
          }
          .contact-info {
            font-size: 7pt;
            text-align: right;
            color: #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="accent-circle"></div>
          <div class="accent-line"></div>
          
          <div class="content">
            <div class="pharmacy-name">${info.name}</div>
            <div class="subtitle">Pharmacie Officinale</div>
            
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Agrément</div>
                <div>${info.agreement}</div>
              </div>
              <div class="info-item">
                <div class="info-label">N° Ordre</div>
                <div>${info.nOrdre}</div>
              </div>
              <div class="info-item">
                <div class="info-label">NIF</div>
                <div>${info.nif}</div>
              </div>
              <div class="info-item">
                <div class="info-label">RC</div>
                <div>${info.rc}</div>
              </div>
            </div>
          </div>

          <div class="content" style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="font-size: 6pt; color: #64748b;">
              ${info.address}
            </div>
            <div class="contact-info">
              <div>${info.tel}</div>
            </div>
          </div>
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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les pop-ups pour imprimer le rapport.");
      return;
    }

    const now = new Date();
    const displayDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    const displayTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${language}" dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>Identification Pharmacie - ${info.name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { size: A4; margin: 0; }
          body { 
            font-family: "Times New Roman", Times, serif; 
            text-transform: uppercase; 
            background: white; 
            color: black; 
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
          .container {
            width: 18cm;
            border: 2px solid black;
            border-radius: 15px;
            padding: 1cm;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 0.5cm;
            margin-bottom: 1cm;
          }
          .pharmacy-name {
            font-size: 24pt;
            font-weight: bold;
            margin-bottom: 0.2cm;
          }
          .subtitle {
            font-size: 14pt;
            color: #4b5563;
            font-weight: bold;
            letter-spacing: 0.1em;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.8cm;
            font-size: 14pt;
            font-weight: bold;
            border-bottom: 1px dashed #e5e7eb;
            padding-bottom: 0.2cm;
          }
          .info-label {
            color: #4b5563;
          }
          .info-value {
            text-align: right;
          }
          .footer {
            margin-top: 1cm;
            text-align: center;
            font-size: 10pt;
            color: #9ca3af;
            font-style: italic;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; height: auto; display: block; padding-top: 2cm; }
            .container { margin: 0 auto; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="pharmacy-name">${info.name}</div>
            <div class="subtitle">${t.pharmacyIdentity}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">${t.address}</div>
            <div class="info-value" style="max-width: 60%; text-align: right;">${info.address}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">${t.phone}</div>
            <div class="info-value">${info.tel}</div>
          </div>

          <div class="info-row">
            <div class="info-label">${t.orderNum}</div>
            <div class="info-value">${info.nOrdre}</div>
          </div>

          <div class="info-row">
            <div class="info-label">${t.agreement}</div>
            <div class="info-value">${info.agreement}</div>
          </div>

          <div class="info-row">
            <div class="info-label">${t.nif}</div>
            <div class="info-value">${info.nif}</div>
          </div>

          <div class="info-row">
            <div class="info-label">${t.nis}</div>
            <div class="info-value">${info.nis}</div>
          </div>

          <div class="info-row" style="border-bottom: none;">
            <div class="info-label">${t.rc}</div>
            <div class="info-value">${info.rc}</div>
          </div>

          <div class="footer">
            ${t.generatedBy} - ${displayDate} ${displayTime}
          </div>
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

  const updateField = (field: keyof PharmacyInfo, value: string) => {
    setInfo({ ...info, [field]: value.toUpperCase() });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 uppercase">
      <div className="flex items-center justify-between mb-8 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">{t.pharmacyConfig}</h2>
            <p className="text-slate-500 text-sm lowercase">{t.pharmacyIdentity}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {isFormComplete && (
            <>
              <button 
                onClick={handlePrintCard} 
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg animate-in fade-in slide-in-from-right-4 duration-500"
              >
                <CreditCard className="w-4 h-4 text-white" />
                <span className="font-bold">{t.printCard}</span>
              </button>
              <button 
                onClick={handlePrint} 
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-black transition-all shadow-lg animate-in fade-in slide-in-from-right-4 duration-500"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">{t.print}</span>
              </button>
            </>
          )}
          <button 
            onClick={handleSubmit} 
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md"
          >
            <Save className="w-4 h-4" />
            <span className="font-bold">{t.save}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3 no-print animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-bold text-sm uppercase">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-8 no-print">
        {showSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-emerald-100 p-4 rounded-full text-emerald-600">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 uppercase">{t.successUpdate}</h3>
            <p className="text-slate-500 uppercase">{t.successSync}</p>
            {!isFormComplete && (
              <p className="text-amber-600 text-xs font-bold bg-amber-50 px-3 py-1 rounded-full mt-2">
                {t.noteRequired}
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <label className="block text-sm font-bold text-slate-700 uppercase">{t.pharmacyName}</label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="text"
                    value={info.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="PHARMACIE DE LA PAIX"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase font-bold"
                  />
                </div>
              </div>

              <div className="col-span-2 space-y-2">
                <label className="block text-sm font-bold text-slate-700 uppercase">{t.address}</label>
                <textarea
                  required
                  value={info.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="123 RUE DE LA SANTE, VILLE, PAYS"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[80px] uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 uppercase">{t.phone}</label>
                <input
                  type="text"
                  required
                  value={info.tel}
                  onChange={(e) => updateField('tel', e.target.value)}
                  placeholder="021 00 00 00"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 uppercase">{t.orderNum}</label>
                <input
                  type="text"
                  required
                  value={info.nOrdre}
                  onChange={(e) => updateField('nOrdre', e.target.value)}
                  placeholder="NUMÉRO D'ORDRE"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 uppercase">{t.agreement}</label>
                <input
                  type="text"
                  required
                  value={info.agreement}
                  onChange={(e) => updateField('agreement', e.target.value)}
                  placeholder="AGR-0000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 uppercase">{t.nif}</label>
                <input
                  type="text"
                  required
                  value={info.nif}
                  onChange={(e) => updateField('nif', e.target.value)}
                  placeholder="000.000.000.000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 uppercase">{t.nis}</label>
                <input
                  type="text"
                  required
                  value={info.nis}
                  onChange={(e) => updateField('nis', e.target.value)}
                  placeholder="000.000.000.000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 uppercase">{t.rc}</label>
                <input
                  type="text"
                  required
                  value={info.rc}
                  onChange={(e) => updateField('rc', e.target.value)}
                  placeholder="RC-000000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase"
                />
              </div>
            </div>

            {!isFormComplete && (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 uppercase leading-relaxed font-bold">
                  {t.noteRequired}
                </p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default PharmacyForm;
