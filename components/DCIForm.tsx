
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, ClipboardCheck, CheckCircle, Printer, Info, AlertCircle } from 'lucide-react';
import { DCIConfirmation, PharmacyInfo } from '../types';

interface DCIFormProps {
  existingConfirmation?: DCIConfirmation | null;
  confirmations: DCIConfirmation[];
  pharmacyInfo: PharmacyInfo | null;
  onSave: (confirmation: DCIConfirmation) => void;
  onCancel: () => void;
}

const DCIForm: React.FC<DCIFormProps> = ({ existingConfirmation, confirmations, pharmacyInfo, onSave, onCancel }) => {
  const [dci, setDci] = useState(existingConfirmation?.dci?.toUpperCase() || '');
  const [remarque, setRemarque] = useState<DCIConfirmation['remarque']>(
    existingConfirmation?.remarque || 'ORDONNANCE ORDINAIRE'
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [flashCount, setFlashCount] = useState(0);

  const stats = {
    total: confirmations.length,
    ordinaire: confirmations.filter(c => c.remarque === 'ORDONNANCE ORDINAIRE').length,
    souches: confirmations.filter(c => c.remarque === 'ORDONNANCE 03 SOUCHES').length
  };

  useEffect(() => {
    if (existingConfirmation) {
      setDci(existingConfirmation.dci.toUpperCase());
      setRemarque(existingConfirmation.remarque);
    } else {
      // Flash effect for new DCI
      const interval = setInterval(() => {
        setFlashCount(prev => {
          if (prev >= 10) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [existingConfirmation]);

  const handleDciChange = (val: string) => {
    const upperVal = val.toUpperCase();
    setDci(upperVal);
    
    if (upperVal.trim()) {
      const exists = confirmations.some(c => 
        c.dci === upperVal && c.id !== existingConfirmation?.id
      );
      if (exists) {
        setDuplicateError("Ce DCI existe déjà dans la liste.");
      } else {
        setDuplicateError(null);
      }
    } else {
      setDuplicateError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dci.trim() || duplicateError) return;

    onSave({
      id: existingConfirmation?.id || crypto.randomUUID(),
      dci: dci.trim().toUpperCase(),
      remarque
    });
    
    setShowSuccess(true);
    setTimeout(onCancel, 1500);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les pop-ups pour afficher le rapport d'impression.");
      return;
    }

    const sortedConfirmations = [...confirmations].sort((a, b) => 
      a.dci.localeCompare(b.dci)
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Liste des DCI</title>
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
          }
          .header-box {
            /* height: 5cm; Removed to fit content */
            margin: 1cm 1cm 0.5cm 1cm;
            border: 1px solid black;
            border-radius: 8px;
            box-sizing: border-box;
            padding: 10px 15px;
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
            font-family: 'Segoe UI', sans-serif;
            font-size: 8pt;
            font-weight: bold;
            line-height: 1.2;
          }
          .left-group { text-align: left; }
          .right-group { 
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
          .right-inner {
            text-align: left;
            min-width: 180px;
          }
          .title-box {
            margin: 0.5cm 1cm;
            background-color: #e5e7eb;
            border-radius: 12px;
            padding: 8px;
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
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
          }
          .col-num { 
            width: 60px; 
            text-align: center;
            font-family: 'Segoe UI', sans-serif;
            font-weight: normal;
            font-size: 7pt;
          }
          .col-dci { 
            width: 55%;
            font-family: "Times New Roman", Times, serif; 
            font-weight: bold;
            font-size: 9pt;
          }
          .col-rem { 
            width: calc(45% - 60px);
            font-family: 'Segoe UI', sans-serif;
            font-weight: normal;
            font-size: 7pt;
          }
          .footer-line {
            height: 0.5mm;
            background-color: #9ca3af;
            width: 100%;
            margin-top: 5mm;
            margin-bottom: 2mm;
          }
          .pharmacist-label {
            text-align: center;
            font-family: "Times New Roman", Times, serif;
            font-weight: bold;
            font-style: italic;
            font-size: 10pt;
            text-transform: uppercase;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="pharmacy-name">PHARMACIE ${pharmacyInfo?.name || 'NOM DE LA PHARMACIE'}</div>
          <div class="details-grid">
            <div class="details-group left-group">
              <div>ADRESSE: ${pharmacyInfo?.address || ''}</div>
              <div>N° ORDRE: ${pharmacyInfo?.nOrdre || ''}</div>
              <div>AGRÉMENT: ${pharmacyInfo?.agreement || ''}</div>
              <div>TEL: ${pharmacyInfo?.tel || ''}</div>
            </div>
            <div class="details-group right-group">
              <div class="right-inner">
                <div>NIF: ${pharmacyInfo?.nif || ''}</div>
                <div>NIS: ${pharmacyInfo?.nis || ''}</div>
                <div>RC: ${pharmacyInfo?.rc || ''}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="title-box">LISTE DES DCI</div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th class="col-num"><span class="th-inner">N°</span></th>
                <th class="col-dci"><span class="th-inner">DCI</span></th>
                <th class="col-rem"><span class="th-inner">REMARQUE</span></th>
              </tr>
            </thead>
            <tbody>
              ${sortedConfirmations.map((c, index) => `
                <tr>
                  <td class="col-num">${index + 1}</td>
                  <td class="col-dci">${c.dci}</td>
                  <td class="col-rem">${c.remarque}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer-line"></div>
          <div class="pharmacist-label">LE PHARMACIEN</div>
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
    <div className="max-w-3xl mx-auto uppercase">
      <div className="flex items-center justify-between mb-8 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {existingConfirmation ? 'Modifier le DCI' : 'Nouveau DCI'}
            </h2>
            <p className="text-slate-500 text-sm">Définissez les contraintes de prescription pour une DCI.</p>
          </div>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Imprimer Liste
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 no-print">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Total DCI</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-500 uppercase">Ordonnance Ordinaire</p>
            <p className="text-2xl font-bold text-slate-800">{stats.ordinaire}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-500 uppercase">Ordonnance 03 Souches</p>
            <p className="text-2xl font-bold text-slate-800">{stats.souches}</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-8 no-print">
        {showSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-emerald-100 p-4 rounded-full text-emerald-600">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">DCI Enregistré !</h3>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {!existingConfirmation && (
              <div className={`p-4 rounded-xl flex gap-3 transition-colors duration-300 border ${
                flashCount < 10 && flashCount % 2 === 0 
                  ? 'bg-red-100 border-red-300 text-red-700' 
                  : 'bg-blue-50 border-blue-100 text-blue-700'
              }`}>
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-bold uppercase">
                  Note : Veuillez saisir le nom DCI et sélectionner la remarque appropriée.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" /> DCI
                </label>
                <input
                  required
                  type="text"
                  value={dci}
                  onChange={(e) => handleDciChange(e.target.value)}
                  placeholder="ex: PARACETAMOL..."
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 outline-none transition-all uppercase ${
                    duplicateError 
                      ? 'border-red-300 focus:ring-red-500 text-red-700' 
                      : 'border-slate-200 focus:ring-emerald-500'
                  }`}
                />
                {duplicateError && (
                  <p className="text-red-600 text-sm font-bold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-4 h-4" /> {duplicateError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">REMARQUE</label>
                <select
                  value={remarque}
                  onChange={(e) => setRemarque(e.target.value as DCIConfirmation['remarque'])}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none uppercase"
                >
                  <option value="ORDONNANCE ORDINAIRE">ORDONNANCE ORDINAIRE</option>
                  <option value="ORDONNANCE 03 SOUCHES">ORDONNANCE 03 SOUCHES</option>
                </select>
              </div>
            </div>

            <div className="pt-8 flex gap-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Enregistrer DCI
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DCIForm;
