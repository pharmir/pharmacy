
import React, { useState } from 'react';
import { Search, Printer, Package, TrendingUp, TrendingDown, ClipboardList, Filter, Edit, Trash2, Calendar, History, Check, ArrowDownLeft, FileText, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { InventoryExit, InventoryEntry, Medication, PharmacyInfo, StockInitial } from '../types';

interface InventoryDashboardProps {
  entrees: InventoryEntry[];
  sorties: InventoryExit[];
  stocksInitial: StockInitial[];
  medications: Medication[];
  pharmacyInfo: PharmacyInfo | null;
  onEditEntree: (id: string) => void;
  onDeleteEntree: (id: string) => void;
  onEditSortie: (id: string) => void;
  onDeleteSortie: (id: string) => void;
}

const MONTHS = [
  "JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN",
  "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"
];

const SEASONS = [
  { name: "1ER TRIMESTRE", months: ["JANVIER", "FÉVRIER", "MARS"] },
  { name: "2ÈME TRIMESTRE", months: ["AVRIL", "MAI", "JUIN"] },
  { name: "3ÈME TRIMESTRE", months: ["JUILLET", "AOÛT", "SEPTEMBRE"] },
  { name: "4ÈME TRIMESTRE", months: ["OCTOBRE", "NOVEMBRE", "DÉCEMBRE"] }
];

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ 
  entrees, sorties, stocksInitial, medications, pharmacyInfo,
  onEditEntree, onDeleteEntree, onEditSortie, onDeleteSortie
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'stock'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [showInventoryOptions, setShowInventoryOptions] = useState(false);
  
  // Initialize with current season months
  const getCurrentSeasonMonths = () => {
    const monthIndex = new Date().getMonth();
    if (monthIndex < 3) return SEASONS[0].months;
    if (monthIndex < 6) return SEASONS[1].months;
    if (monthIndex < 9) return SEASONS[2].months;
    return SEASONS[3].months;
  };

  const [selectedMonths, setSelectedMonths] = useState<string[]>(getCurrentSeasonMonths());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const toggleSeason = (seasonMonths: string[]) => {
    // Check if this season is fully selected
    const isFullySelected = seasonMonths.every(m => selectedMonths.includes(m));
    
    if (isFullySelected) {
      // Deselect these months
      setSelectedMonths(prev => prev.filter(m => !seasonMonths.includes(m)));
    } else {
      // Select these months (add unique)
      const newSelection = new Set([...selectedMonths, ...seasonMonths]);
      setSelectedMonths(Array.from(newSelection));
    }
  };

  const selectAllMonths = () => setSelectedMonths([...MONTHS]);
  const clearMonths = () => setSelectedMonths([]);

  // Determine the start date string of the selected period for filtering previous movements
  // Find the earliest month index among selected months
  const sortedSelectedMonthsIndices = selectedMonths.map(m => MONTHS.indexOf(m)).sort((a, b) => a - b);
  const earliestMonthIndex = sortedSelectedMonthsIndices.length > 0 ? sortedSelectedMonthsIndices[0] : 0;
  
  // Construct ISO date string for start of period (e.g., "2024-04-01")
  const periodStartString = `${selectedYear}-${(earliestMonthIndex + 1).toString().padStart(2, '0')}-01`;

  const filteredEntrees = entrees.filter(e => 
    e.year === selectedYear && selectedMonths.includes(e.month)
  );
  const filteredSorties = sorties.filter(s => 
    s.year === selectedYear && selectedMonths.includes(s.month)
  );

  // Initial stock aggregation (Base stock from SI documents FOR THE SELECTED YEAR)
  const initialStockPerDrug: Record<string, number> = {};
  stocksInitial.filter(s => s.date.startsWith(selectedYear)).forEach(doc => {
    doc.items.forEach(item => {
      const name = item.name.toUpperCase();
      initialStockPerDrug[name] = (initialStockPerDrug[name] || 0) + item.quantity;
    });
  });

  const inventorySummary = medications.map(med => {
    const medKey = med.fullNom.toUpperCase();
    const yearStartStock = initialStockPerDrug[medKey] || 0;

    // Calculate movements BEFORE the selected period within the same year
    const previousIn = entrees
      .filter(e => e.drugName.toUpperCase() === medKey && e.year === selectedYear && e.date < periodStartString)
      .reduce((acc, curr) => acc + curr.quantity, 0);

    const previousOut = sorties
      .filter(s => s.drugName.toUpperCase() === medKey && s.year === selectedYear && s.date < periodStartString)
      .reduce((acc, curr) => acc + curr.quantity, 0);

    // Stock at the beginning of the selected period
    const startStock = yearStartStock + previousIn - previousOut;
    
    // Movements during the selected period
    const totalIn = filteredEntrees
      .filter(e => e.drugName.toUpperCase() === medKey)
      .reduce((acc, curr) => acc + curr.quantity, 0);

    const totalOut = filteredSorties
      .filter(s => s.drugName.toUpperCase() === medKey)
      .reduce((acc, curr) => acc + curr.quantity, 0);
    
    return {
      ...med,
      startStock,
      totalIn,
      totalOut,
      currentStock: (startStock + totalIn) - totalOut
    };
  }).filter(item => 
    item.fullNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.dci.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSort = (field: 'name' | 'stock') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedInventory = [...inventorySummary].sort((a, b) => {
    if (sortField === 'name') {
        const aValue = a.fullNom.toLowerCase();
        const bValue = b.fullNom.toLowerCase();
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else {
        return sortDirection === 'asc' ? a.currentStock - b.currentStock : b.currentStock - a.currentStock;
    }
  });

  // Function to print the detailed seasonal table (landscape)
  const handlePrintInventory = (mode: 'all' | 'active') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // 1. Sort months chronologically
    const sortedMonths = [...selectedMonths].sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));
    
    // 2. Determine labels
    let periodLabel = `${sortedMonths.join(', ')} ${selectedYear}`;
    const selectedSeason = SEASONS.find(s => 
      s.months.length === sortedMonths.length && 
      s.months.every(m => sortedMonths.includes(m))
    );
    if (selectedSeason) {
      periodLabel = `${selectedSeason.name} ${selectedYear}`;
    }

    // 4. Detailed Calculation
    let reportData = medications.map(med => {
      const medName = med.fullNom.toUpperCase();
      
      // A. Calculate Stock at the beginning of the period
      // Base Initial for Year
      let runningStock = initialStockPerDrug[medName] || 0;
      const initialStockAtStartOfYear = runningStock;
      
      // Plus entries before start date (within selected year)
      const entriesBefore = entrees.filter(e => 
        e.drugName.toUpperCase() === medName && 
        e.year === selectedYear && 
        e.date < periodStartString
      );
      runningStock += entriesBefore.reduce((sum, e) => sum + e.quantity, 0);
      
      // Minus exits before start date (within selected year)
      const exitsBefore = sorties.filter(s => 
        s.drugName.toUpperCase() === medName && 
        s.year === selectedYear && 
        s.date < periodStartString
      );
      runningStock -= exitsBefore.reduce((sum, s) => sum + s.quantity, 0);
      
      const startStock = runningStock;

      // B. Calculate for each month in period
      let hasMovementInPeriod = false;
      const monthlyDetails = sortedMonths.map(month => {
        const monthEntrees = entrees
          .filter(e => e.drugName.toUpperCase() === medName && e.month === month && e.year === selectedYear)
          .reduce((sum, e) => sum + e.quantity, 0);
          
        const monthSorties = sorties
          .filter(s => s.drugName.toUpperCase() === medName && s.month === month && s.year === selectedYear)
          .reduce((sum, s) => sum + s.quantity, 0);
          
        if (monthEntrees > 0 || monthSorties > 0) {
          hasMovementInPeriod = true;
        }

        runningStock = runningStock + monthEntrees - monthSorties;
        
        return {
          entree: monthEntrees,
          sortie: monthSorties,
          reste: runningStock
        };
      });

      return {
        name: med.fullNom,
        initialStockAtStartOfYear,
        startStock,
        months: monthlyDetails,
        finalStock: runningStock,
        hasMovementInPeriod
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    if (mode === 'active') {
      reportData = reportData.filter(item => item.initialStockAtStartOfYear > 0 || item.hasMovementInPeriod);
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>INVENTAIRE DÉTAILLÉ - ${periodLabel}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { 
            size: A4 landscape; 
            margin: 0.5cm;
          }
          body { 
            font-family: "Times New Roman", Times, serif; 
            text-transform: uppercase; 
            background: white; 
            color: black; 
            margin: 0; 
            padding: 0; 
          }
          .header-box {
            margin: 0 1cm 0 1cm;
            border: 1px solid black;
            border-radius: 8px;
            box-sizing: border-box;
            padding: 10px 25px;
            display: flex;
            flex-direction: column;
          }
          .pharmacy-name-header {
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 10px;
            font-family: "Times New Roman", Times, serif;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
            flex: 1;
          }
          .details-group {
            font-size: 8pt;
            font-family: "Segoe UI", sans-serif;
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
          
          .title-container {
            margin: 0.2cm 1cm 0.2cm 1cm;
            text-align: center;
          }
          .content-title-box {
            background-color: #e5e7eb;
            border-radius: 12px;
            padding: 5px 20px;
            display: block;
            width: 100%;
            box-sizing: border-box;
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 2px;
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
            vertical-align: middle;
          }
          
          .th-inner {
            background-color: #e5e7eb;
            border-radius: 8px;
            padding: 2px 2px;
            margin: 0 0.5mm;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            font-size: 7pt;
            font-weight: bold;
            text-align: center;
            color: black;
            font-family: "Times New Roman", Times, serif;
          }
          
          td { 
            border: none; 
            border-bottom: 0.5mm solid #e5e7eb;
            padding: 1px 2px;
            text-align: center; 
            font-size: 7pt;
            font-family: "Segoe UI", sans-serif; 
            font-weight: normal; 
          }
          
          .col-name { text-align: left; padding-left: 5px; }
          
          .signature-section {
            margin-top: 0.5cm;
            text-align: center;
            font-weight: bold;
            font-size: 12pt;
          }
          
          @media print {
            body { -webkit-print-color-adjust: exact; }
            @page {
              margin: 0.5cm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="pharmacy-name-header">PHARMACIE ${pharmacyInfo?.name || 'NOM DE LA PHARMACIE'}</div>
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

        <div class="title-container">
          <div class="content-title-box">
            INVENTAIRE DÉTAILLÉ - ${periodLabel}
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th rowspan="2" style="width: 3%"><div class="th-inner">N°</div></th>
                <th rowspan="2" style="width: 25%"><div class="th-inner">DÉSIGNATION</div></th>
                <th rowspan="2" style="width: 7%"><div class="th-inner">RESTE<br/>PV<br/>PRÉCÉDENT</div></th>
                ${sortedMonths.map(m => `<th colspan="3"><div class="th-inner">${m}</div></th>`).join('')}
                <th rowspan="2" style="width: 8%"><div class="th-inner">STOCK<br/>FINAL</div></th>
              </tr>
              <tr>
                ${sortedMonths.map(() => `
                  <th style="width: 5%"><div class="th-inner" style="font-size: 6pt;">ENTRÉE</div></th>
                  <th style="width: 5%"><div class="th-inner" style="font-size: 6pt;">SORTIE</div></th>
                  <th style="width: 5%"><div class="th-inner" style="font-size: 6pt;">RESTE</div></th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${reportData.map((item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td class="col-name">${item.name}</td>
                  <td>${item.startStock.toLocaleString('fr-FR')}</td>
                  ${item.months.map(m => `
                    <td>${m.entree > 0 ? m.entree.toLocaleString('fr-FR') : '-'}</td>
                    <td>${m.sortie > 0 ? m.sortie.toLocaleString('fr-FR') : '-'}</td>
                    <td style="background-color: #f8fafc;">${m.reste.toLocaleString('fr-FR')}</td>
                  `).join('')}
                  <td style="font-weight: bold;">${item.finalStock.toLocaleString('fr-FR')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="page-break-inside: avoid;">
          <div class="signature-section">
            <div>LE PHARMACIEN</div>
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

  // Function to print the PV Inventaire (Portrait, Order Form style)
  const handlePrintPV = (mode: 'all' | 'active') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Determine the last month of the selection for the title
    const sortedMonths = [...selectedMonths].sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));
    const lastMonth = sortedMonths.length > 0 ? sortedMonths[sortedMonths.length - 1] : "";
    
    // Determine Quarter Name
    const selectedSeason = SEASONS.find(s => 
      s.months.length === sortedMonths.length && 
      s.months.every(m => sortedMonths.includes(m))
    );
    const quarterName = selectedSeason ? selectedSeason.name : "";
    
    const lastDayMap: Record<string, string> = {
      "JANVIER": "31", "FÉVRIER": "28/29", "MARS": "31", "AVRIL": "30",
      "MAI": "31", "JUIN": "30", "JUILLET": "31", "AOÛT": "31",
      "SEPTEMBRE": "30", "OCTOBRE": "31", "NOVEMBRE": "30", "DÉCEMBRE": "31"
    };
    const lastDay = lastDayMap[lastMonth] || "";
    const reportDate = lastMonth ? `ARRÊTÉ AU ${lastDay} ${lastMonth} ${selectedYear}` : selectedYear;

    // Filter data based on mode
    let dataToPrint = inventorySummary;
    if (mode === 'active') {
      dataToPrint = inventorySummary.filter(item => {
        // Check if initial stock > 0
        const hasInitialStock = (initialStockPerDrug[item.fullNom.toUpperCase()] || 0) > 0;
        // Check if there are movements in the selected period
        const hasEntrees = filteredEntrees.some(e => e.drugName.toUpperCase() === item.fullNom.toUpperCase());
        const hasSorties = filteredSorties.some(s => s.drugName.toUpperCase() === item.fullNom.toUpperCase());
        
        return hasInitialStock || hasEntrees || hasSorties;
      });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>PV INVENTAIRE - ${reportDate}</title>
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
            font-family: "Times New Roman", Times, serif;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
            flex: 1;
          }
          .details-group {
            font-size: 8pt;
            font-family: "Segoe UI", sans-serif;
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
          .title-container {
            margin: 0.5cm 1cm 0.2cm 1cm;
            text-align: center;
          }
          .content-title-box {
            background-color: #e5e7eb;
            border-radius: 12px;
            padding: 10px 20px;
            display: block;
            width: 100%;
            box-sizing: border-box;
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .report-date {
            font-size: 12pt;
            font-weight: bold;
            margin-top: 5px;
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
            padding: 4px 4px;
            margin: 0 0.5mm;
            display: block;
            font-weight: bold;
            font-size: 10pt;
            color: black;
            font-family: "Times New Roman", Times, serif;
          }
          td {
            border: none;
            padding: 2px 5px; /* Further reduced spacing */
            text-align: left;
            font-size: 8pt; /* Reduced font size */
            font-family: "Segoe UI", sans-serif; /* Changed font */
            font-weight: normal; /* Normal weight */
          }
          .col-num { width: 60px; text-align: center; }
          .col-med { width: 70%; }
          .col-qty { 
            width: calc(30% - 60px); 
            text-align: center; 
            font-family: "Times New Roman", Times, serif; /* Keep original font for quantity */
            font-weight: bold; /* Keep bold for quantity */
            font-size: 10pt; /* Keep original size for quantity */
          }
          
          .separator-container {
            margin: 5px 1cm 0 1cm;
          }
          .gray-line-rounded {
            height: 1mm;
            background-color: #e5e7eb;
            width: 100%;
            border-radius: 6px;
          }
          .summary-container {
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
          .signature-section {
            margin-top: 1.5cm;
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
          <div class="pharmacy-name-header">PHARMACIE ${pharmacyInfo?.name || 'NOM DE LA PHARMACIE'}</div>
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

        <div class="title-container">
          <div class="content-title-box">
            PROCES VERBAL D'INVENTAIRE ${quarterName} ${selectedYear}
          </div>
          <div class="report-date">${reportDate}</div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th class="col-num"><span class="th-inner">N°</span></th>
                <th class="col-med"><span class="th-inner">MEDICAMENT</span></th>
                <th class="col-qty"><span class="th-inner">QUANTITE</span></th>
              </tr>
            </thead>
            <tbody>
              ${dataToPrint.map((item, index) => `
                <tr>
                  <td class="col-num">${index + 1}</td>
                  <td class="col-med">${item.fullNom}</td>
                  <td class="col-qty">${item.currentStock.toLocaleString('fr-FR')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="page-break-inside: avoid;">
          <div class="separator-container">
            <div class="gray-line-rounded"></div>
          </div>

          <div class="summary-container">
            <div class="count-box">${dataToPrint.length}</div>
            <div style="margin-left: 10px;">PRODUIT(S) EN STOCK</div>
          </div>

          <div class="signature-section">
            <div class="sig-pharmacy-name">${pharmacyInfo?.name || 'NOM DE LA PHARMACIE'}</div>
            <div class="sig-stamp">(Cachet et signature)</div>
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

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

  return (
    <div className="space-y-6 uppercase pb-20">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 no-print">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight uppercase">Inventaire & Rapports</h2>
          <p className="text-slate-500 mt-1 lowercase">Visualisez et imprimez vos états saisonniers.</p>
        </div>

        <div className="flex flex-col gap-4 items-end">
          <div className="flex items-center gap-3">
             <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="relative">
              <button 
                onClick={() => setShowPrintOptions(!showPrintOptions)} 
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 shadow-sm transition-all"
              >
                <FileText className="w-5 h-5 text-emerald-600" />
                PV INVENTAIRE
                <ChevronDown className={`w-4 h-4 transition-transform ${showPrintOptions ? 'rotate-180' : ''}`} />
              </button>
              
              {showPrintOptions && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  <button 
                    onClick={() => { handlePrintPV('active'); setShowPrintOptions(false); }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 text-xs font-bold text-slate-700 border-b border-slate-50 flex items-center gap-2"
                  >
                    <Check className="w-3 h-3 text-emerald-500" />
                    IMPRIMER ACTIFS
                  </button>
                  <button 
                    onClick={() => { handlePrintPV('all'); setShowPrintOptions(false); }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2"
                  >
                    <ClipboardList className="w-3 h-3 text-slate-400" />
                    IMPRIMER TOUT
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowInventoryOptions(!showInventoryOptions)} 
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg transition-all"
              >
                <Printer className="w-5 h-5 text-emerald-400" />
                INVENTAIRE
                <ChevronDown className={`w-4 h-4 transition-transform ${showInventoryOptions ? 'rotate-180' : ''}`} />
              </button>
              
              {showInventoryOptions && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  <button 
                    onClick={() => { handlePrintInventory('active'); setShowInventoryOptions(false); }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 text-xs font-bold text-slate-700 border-b border-slate-50 flex items-center gap-2"
                  >
                    <Check className="w-3 h-3 text-emerald-500" />
                    IMPRIMER ACTIFS
                  </button>
                  <button 
                    onClick={() => { handlePrintInventory('all'); setShowInventoryOptions(false); }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2"
                  >
                    <ClipboardList className="w-3 h-3 text-slate-400" />
                    IMPRIMER TOUT
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Season Selection Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 tracking-widest"><Calendar className="w-4 h-4 text-emerald-500" /> SÉLECTION PAR TRIMESTRE</h3>
          <div className="flex gap-4">
            <button onClick={selectAllMonths} className="text-[10px] font-bold text-emerald-600 hover:underline">TOUTE L'ANNÉE</button>
            <button onClick={clearMonths} className="text-[10px] font-bold text-rose-600 hover:underline">EFFACER</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SEASONS.map((season, idx) => {
            const isSelected = season.months.every(m => selectedMonths.includes(m));
            const isPartial = !isSelected && season.months.some(m => selectedMonths.includes(m));
            
            return (
              <button
                key={idx}
                onClick={() => toggleSeason(season.months)}
                className={`py-4 px-4 rounded-xl text-sm font-black transition-all border-2 flex flex-col items-center justify-center gap-2 ${
                  isSelected 
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200 transform scale-[1.02]' 
                    : isPartial 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200 hover:text-emerald-600'
                }`}
              >
                <span className="uppercase tracking-wider">{season.name}</span>
                <span className={`text-[10px] uppercase font-bold ${isSelected ? 'text-emerald-200' : 'text-slate-300'}`}>
                  {season.months[0].substring(0,3)} - {season.months[2].substring(0,3)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-slate-100 p-3 rounded-xl text-slate-600"><History className="w-6 h-6" /></div>
          <div><p className="text-[10px] text-slate-500 uppercase">Stock Initial</p><p className="text-xl font-black text-slate-800">{inventorySummary.reduce((a, b) => a + b.startStock, 0)}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><TrendingUp className="w-6 h-6" /></div>
          <div><p className="text-[10px] text-slate-500 uppercase">Entrées</p><p className="text-xl font-black text-slate-800">{filteredEntrees.reduce((a, b) => a + b.quantity, 0)}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-rose-100 p-3 rounded-xl text-rose-600"><TrendingDown className="w-6 h-6" /></div>
          <div><p className="text-[10px] text-slate-500 uppercase">Sorties</p><p className="text-xl font-black text-slate-800">{filteredSorties.reduce((a, b) => a + b.quantity, 0)}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 border-b-4 border-b-blue-500">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><ClipboardList className="w-6 h-6" /></div>
          <div><p className="text-[10px] text-slate-500 uppercase">Reste Global</p><p className="text-xl font-black text-slate-800">{inventorySummary.reduce((a, b) => a + b.currentStock, 0)}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
           <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase"><Package className="w-4 h-4 text-emerald-500" /> État des Stocks</h3>
           <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Chercher médicament..."
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 uppercase text-[10px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-2">
                  MÉDICAMENT
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-center">INITIAL</th>
              <th className="px-6 py-3 text-center">ENTRÉES</th>
              <th className="px-6 py-3 text-center">SORTIES</th>
              <th className="px-6 py-3 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('stock')}>
                <div className="flex items-center justify-center gap-2">
                  RESTE
                  {sortField === 'stock' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedInventory.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800 text-sm">{item.fullNom}</td>
                <td className="px-6 py-4 text-center text-slate-500 font-bold">{item.startStock}</td>
                <td className="px-6 py-4 text-center text-emerald-600 font-bold">+{item.totalIn}</td>
                <td className="px-6 py-4 text-center text-rose-600 font-bold">-{item.totalOut}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-4 py-1 rounded-lg font-black text-base ${item.currentStock > 5 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                    {item.currentStock}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 space-y-6">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight"><Calendar className="w-5 h-5 text-emerald-500" /> Journal des Opérations</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Historical Entrees */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <h4 className="text-xs font-black text-emerald-700 uppercase flex items-center gap-2"><ArrowDownLeft className="w-4 h-4" /> Entrées Détaillées</h4>
              <span className="text-[10px] font-bold text-emerald-600">{filteredEntrees.length} Records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/30 border-b border-slate-100 font-bold text-slate-400 uppercase">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Fournisseur</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredEntrees.sort((a,b) => b.createdAt - a.createdAt).map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/50 group">
                      <td className="px-4 py-3 text-slate-500 font-mono">{e.date.split('-').reverse().join('/')}</td>
                      <td className="px-4 py-3 font-bold text-slate-800 truncate max-w-[100px]">{e.supplier}</td>
                      <td className="px-4 py-3 text-center text-emerald-600 font-black">+{e.quantity}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => onEditEntree(e.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDeleteEntree(e.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical Sorties */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <h4 className="text-xs font-black text-rose-700 uppercase flex items-center gap-2"><TrendingDown className="w-4 h-4" /> Sorties Détaillées</h4>
              <span className="text-[10px] font-bold text-rose-600">{filteredSorties.length} Records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/30 border-b border-slate-100 font-bold text-slate-400 uppercase">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Motif</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSorties.sort((a,b) => b.createdAt - a.createdAt).map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50 group">
                      <td className="px-4 py-3 text-slate-500 font-mono">{s.date.split('-').reverse().join('/')}</td>
                      <td className="px-4 py-3 font-bold text-slate-800 truncate max-w-[100px]">{s.reason}</td>
                      <td className="px-4 py-3 text-center text-rose-600 font-black">-{s.quantity}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => onEditSortie(s.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDeleteSortie(s.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;
