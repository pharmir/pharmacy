import React from 'react';
import { Smartphone, User, ShieldCheck, Award, MapPin, MessageCircle, Phone } from 'lucide-react';

const AboutDashboard: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white/20 p-5 rounded-2xl backdrop-blur-md mb-6 shadow-xl ring-1 ring-white/30">
              <ShieldCheck className="w-20 h-20 text-white" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter mb-3 drop-shadow-sm">PHARMAPSY</h1>
            <div className="inline-flex items-center gap-2 bg-emerald-500/30 backdrop-blur-md border border-emerald-400/30 px-5 py-1.5 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
              <span className="text-sm font-bold tracking-wide text-emerald-50">VERSION 1.0.1</span>
            </div>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-10 space-y-10">
          
          {/* Developer Info */}
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-emerald-600 mb-2">
              <Award className="w-5 h-5" />
              <h2 className="text-sm font-bold uppercase tracking-widest">Développé par</h2>
            </div>
            
            <div className="relative p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white p-2 rounded-full shadow-sm border border-slate-100">
                <User className="w-8 h-8 text-slate-600" />
              </div>
              
              <div className="mt-4 space-y-2">
                <p className="text-2xl font-black text-slate-800 tracking-tight">DR DERRI SAMIR</p>
                <div className="flex items-center justify-center gap-2 text-slate-500 font-medium bg-white px-4 py-1.5 rounded-lg inline-flex shadow-sm border border-slate-100">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span>PHARMACIEN D'OFFICINE M'SILA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border-t border-slate-100 pt-8">
            <h2 className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Contact & Support</h2>
            <div className="flex flex-col items-center gap-4">
              <div className="group flex items-center gap-5 bg-white border-2 border-slate-100 p-5 rounded-2xl hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 cursor-default w-full max-w-md">
                <div className="bg-emerald-100 p-3 rounded-xl group-hover:bg-emerald-500 transition-colors duration-300">
                  <Smartphone className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-1 tracking-wide">Tél / WhatsApp / Viber</p>
                  <p className="text-2xl font-black text-slate-800 tracking-wider font-mono">0661.22.26.49</p>
                </div>
              </div>
              
              <div className="flex gap-3 w-full max-w-md">
                <a 
                  href="https://wa.me/213661222649" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#20bd5a] transition-all shadow-sm hover:shadow-md"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>WhatsApp</span>
                </a>
                <a 
                  href="viber://chat?number=%2B213661222649" 
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#7360f2] text-white rounded-xl font-bold hover:bg-[#6655d8] transition-all shadow-sm hover:shadow-md"
                >
                  <Phone className="w-5 h-5" />
                  <span>Viber</span>
                </a>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="text-center pt-6 border-t border-slate-50">
            <p className="text-xs text-slate-400 font-medium">
              © {new Date().getFullYear()} PHARMAPSY. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutDashboard;
