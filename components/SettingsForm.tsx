
import React, { useState } from 'react';
import { Save, Download, Upload, Volume2, Bell, Palette, Globe, AlertTriangle } from 'lucide-react';
import { dbService } from '../services/db';
import { Language, translations } from '../src/translations';

interface SettingsFormProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: 'light' | 'dark' | 'emerald';
  onThemeChange: (theme: 'light' | 'dark' | 'emerald') => void;
  soundsEnabled: boolean;
  onSoundsToggle: (enabled: boolean) => void;
  remindersEnabled: boolean;
  onRemindersToggle: (enabled: boolean) => void;
  onExport: () => void;
  onImport: () => void;
}

const SettingsForm: React.FC<SettingsFormProps> = ({
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  soundsEnabled,
  onSoundsToggle,
  remindersEnabled,
  onRemindersToggle,
  onExport,
  onImport
}) => {
  const t = translations[language];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight uppercase">{t.settings}</h2>
          <p className="text-slate-500 mt-1 lowercase">{(t as any).settingsDesc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appearance & Language */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-slate-800 font-bold border-b border-slate-100 pb-4">
            <Palette className="w-5 h-5 text-emerald-500" />
            <h3 className="uppercase tracking-wider">{(t as any).appearance}</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">{t.theme}</label>
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'emerald'] as const).map((tName) => (
                  <button
                    key={tName}
                    onClick={() => onThemeChange(tName)}
                    className={`px-4 py-3 rounded-xl border-2 transition-all font-bold text-sm uppercase ${
                      theme === tName 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                        : 'border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    {(t as any)[tName]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">{t.language}</label>
              <div className="grid grid-cols-3 gap-3">
                {(['fr', 'ar', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => onLanguageChange(lang)}
                    className={`px-4 py-3 rounded-xl border-2 transition-all font-bold text-sm uppercase ${
                      language === lang 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                        : 'border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    {lang === 'fr' ? 'Français' : lang === 'ar' ? 'العربية' : 'English'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications & Sounds */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-slate-800 font-bold border-b border-slate-100 pb-4">
            <Volume2 className="w-5 h-5 text-emerald-500" />
            <h3 className="uppercase tracking-wider">{(t as any).notifSounds}</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="font-bold text-slate-700 text-sm uppercase">{t.sounds}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{t.clickSound} & {t.saveSound}</div>
                </div>
              </div>
              <button
                onClick={() => onSoundsToggle(!soundsEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${soundsEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${language === 'ar' ? (soundsEnabled ? 'left-1' : 'right-1') : (soundsEnabled ? 'right-1' : 'left-1')}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="font-bold text-slate-700 text-sm uppercase">{t.reminders}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{t.inventoryReminder}</div>
                </div>
              </div>
              <button
                onClick={() => onRemindersToggle(!remindersEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${remindersEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${language === 'ar' ? (remindersEnabled ? 'left-1' : 'right-1') : (remindersEnabled ? 'right-1' : 'left-1')}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Database Management */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 space-y-6">
          <div className="flex items-center gap-3 text-slate-800 font-bold border-b border-slate-100 pb-4">
            <Download className="w-5 h-5 text-emerald-500" />
            <h3 className="uppercase tracking-wider">{(t as any).dbManagement}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-emerald-100 bg-emerald-50/30 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm uppercase">
                <Download className="w-4 h-4" />
                {t.exportDb}
              </div>
              <p className="text-xs text-slate-600 lowercase">{(t as any).exportDesc}</p>
              <button
                onClick={onExport}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-sm flex items-center justify-center gap-2 uppercase"
              >
                <Download className="w-4 h-4" />
                {t.exportDb}
              </button>
            </div>

            <div className="p-4 border border-rose-100 bg-rose-50/30 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm uppercase">
                <Upload className="w-4 h-4" />
                {t.importDb}
              </div>
              <p className="text-xs text-slate-600 lowercase">{(t as any).importDesc}</p>
              <button
                onClick={onImport}
                className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 transition-all shadow-sm flex items-center justify-center gap-2 uppercase"
              >
                <Upload className="w-4 h-4" />
                {t.importDb}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <span className="font-bold uppercase block mb-1">{t.insightWarning}</span>
              {(t as any).importWarning}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsForm;
