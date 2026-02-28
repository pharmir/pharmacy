
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Building2, MapPin, Phone, CheckCircle, Printer } from 'lucide-react';
import { Supplier, PharmacyInfo } from '../types';
import { translations } from '../utils/translations';

interface SupplierFormProps {
  existingSupplier?: Supplier | null;
  // Added pharmacyInfo to props to match usage in App.tsx
  pharmacyInfo: PharmacyInfo | null;
  onSave: (supplier: Supplier) => void;
  onCancel: () => void;
  language: 'fr' | 'ar';
}

const SupplierForm: React.FC<SupplierFormProps> = ({ existingSupplier, pharmacyInfo, onSave, onCancel, language }) => {
  const t = translations[language];
  const [name, setName] = useState(existingSupplier?.name?.toUpperCase() || '');
  const [address, setAddress] = useState(existingSupplier?.address?.toUpperCase() || '');
  const [phone, setPhone] = useState(existingSupplier?.phone?.toUpperCase() || '');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (existingSupplier) {
      setName(existingSupplier.name.toUpperCase());
      setAddress(existingSupplier.address.toUpperCase());
      setPhone(existingSupplier.phone.toUpperCase());
    }
  }, [existingSupplier]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const supplierData: Supplier = {
      id: existingSupplier?.id || crypto.randomUUID(),
      name: name.trim().toUpperCase(),
      address: address.trim().toUpperCase(),
      phone: phone.trim().toUpperCase(),
    };

    onSave(supplierData);
    setShowSuccess(true);
    setTimeout(() => {
      onCancel();
    }, 1500);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les pop-ups pour afficher le rapport d'impression.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${language}" dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>Fiche Fournisseur - ${name}</title>
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
          .pharmacy-name-header {
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
          .content-title {
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            margin: 1cm 1cm 0.5cm 1cm;
            background-color: #e5e7eb;
            border-radius: 8px;
            padding: 10px;
          }
          .supplier-info-box {
            margin: 0 1cm;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
          }
          .info-row {
            display: flex;
            margin-bottom: 15px;
            border-bottom: 1px dashed #e5e7eb;
            padding-bottom: 5px;
          }
          .info-label {
            font-weight: bold;
            width: 200px;
            color: #4b5563;
          }
          .info-value {
            font-weight: bold;
            font-size: 14pt;
            flex: 1;
          }
          .signature-section {
            margin-top: 2cm;
            text-align: center;
            font-weight: bold;
          }
          .sig-pharmacy-name {
            font-size: 12pt;
            margin-bottom: 1mm;
          }
          .sig-stamp {
            font-size: 10pt;
            font-style: italic;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="pharmacy-name-header">${t.pharmacy.pharmacy} ${pharmacyInfo?.name || ''}</div>
          <div class="details-grid">
            <div class="details-group left-group">
              <div>${t.pharmacy.address}: ${pharmacyInfo?.address || ''}</div>
              <div>${t.pharmacy.nOrdre}: ${pharmacyInfo?.nOrdre || ''}</div>
              <div>${t.pharmacy.agreement}: ${pharmacyInfo?.agreement || ''}</div>
              <div>${t.pharmacy.phone}: ${pharmacyInfo?.tel || ''}</div>
            </div>
            <div class="details-group right-group">
              <div class="right-inner">
                <div>${t.pharmacy.nif}: ${pharmacyInfo?.nif || ''}</div>
                <div>${t.pharmacy.nis}: ${pharmacyInfo?.nis || ''}</div>
                <div>${t.pharmacy.rc}: ${pharmacyInfo?.rc || ''}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="content-title">FICHE FOURNISSEUR</div>

        <div class="supplier-info-box">
          <div class="info-row">
            <div class="info-label">${t.suppliers.name}:</div>
            <div class="info-value">${name}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t.suppliers.address}:</div>
            <div class="info-value">${address}</div>
          </div>
          <div class="info-row">
            <div class="info-label">${t.suppliers.phone}:</div>
            <div class="info-value">${phone}</div>
          </div>
        </div>

        <div class="signature-section">
          <div class="sig-pharmacy-name">${pharmacyInfo?.name || ''}</div>
          <div class="sig-stamp">(${t.orders.stampAndSignature})</div>
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
              {existingSupplier ? t.suppliers.editSupplier : t.suppliers.newSupplier}
            </h2>
            <p className="text-slate-500 text-sm">{t.suppliers.title}</p>
          </div>
        </div>
        {existingSupplier && (
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            {t.common.print}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-8 print:border-none print:shadow-none">
        {showSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-emerald-100 p-4 rounded-full text-emerald-600">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">{language === 'fr' ? "Enregistrement réussi !" : "تم الحفظ بنجاح!"}</h3>
            <p className="text-slate-500">{language === 'fr' ? "Les informations ont été synchronisées avec la base de données." : "تمت مزامنة المعلومات مع قاعدة البيانات."}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 col-span-2">
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> {t.suppliers.name}
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  placeholder="ex: DISTRIBUTEUR SANTE MONDIALE"
                  className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all uppercase`}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> {t.suppliers.phone}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.toUpperCase())}
                  placeholder="ex: +33 1 23 45 67 89"
                  className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all uppercase`}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {t.suppliers.address}
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value.toUpperCase())}
                  placeholder="ex: 123 RUE DE LA PHARMACIE, 75001 PARIS"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all min-h-[120px] uppercase"
                />
              </div>
            </div>

            <div className="pt-8 flex gap-4 no-print">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {existingSupplier ? t.common.edit : t.common.save}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SupplierForm;
