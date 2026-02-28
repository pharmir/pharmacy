
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 no-print"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center">
          <div className="mx-auto bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-rose-600" />
          </div>
          <h3 className="mt-6 text-xl font-black text-slate-800 uppercase tracking-tight">{title}</h3>
          <p className="mt-2 text-sm text-slate-500 font-medium normal-case">{message}</p>
        </div>
        <div className="p-6 bg-slate-50 grid grid-cols-2 gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors uppercase"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 uppercase"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
