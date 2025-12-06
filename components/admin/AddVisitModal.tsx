import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input, TextArea } from '../ui/Input';
import { Button } from '../ui/Button';
import { Sparkles } from 'lucide-react';
import { generateDiagnosisSuggestion } from '../../services/geminiService';
import { useToastStore } from '../../store/toastStore';
import { Patient } from '../../types';

interface AddVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (visitData: any) => Promise<void>;
  patient: Patient;
  doctorName: string;
}

export const AddVisitModal: React.FC<AddVisitModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  patient, 
  doctorName 
}) => {
  const { addToast } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
      date: new Date().toISOString().split('T')[0],
      clinicalHistory: '',
      diagnosis: '',
      treatmentPlan: '',
      investigations: '',
      notes: '',
      followUpDate: '',
      attachmentName: '',
      attachmentFile: null as File | null
  });

  const [followUpNeeded, setFollowUpNeeded] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            clinicalHistory: '',
            diagnosis: '',
            treatmentPlan: '',
            investigations: '',
            notes: '',
            followUpDate: '',
            attachmentName: '',
            attachmentFile: null
        });
        setFollowUpNeeded(true);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        
        if (!allowedTypes.includes(file.type)) {
            addToast('Invalid file type. Only PDF, JPG, PNG allowed.', 'error');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            addToast('File too large. Max 5MB.', 'error');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        
        setFormData(prev => ({ 
            ...prev, 
            attachmentName: file.name,
            attachmentFile: file 
        }));
    }
  };

  const handleAiSuggest = async () => {
    if (!formData.clinicalHistory) {
        addToast("Please enter Clinical History first.", 'warning');
        return;
    }
    setAiThinking(true);
    try {
        const suggestion = await generateDiagnosisSuggestion(formData.clinicalHistory, patient.age, patient.sex);
        
        setFormData(prev => ({
            ...prev,
            diagnosis: suggestion.diagnosis,
            treatmentPlan: suggestion.treatmentPlan,
            notes: prev.notes + (prev.notes ? '\n\n' : '') + '(AI Suggestion Applied)'
        }));
        addToast('AI Suggestions applied!', 'success');
    } catch (error) {
        addToast("Failed to generate suggestion.", 'error');
    } finally {
        setAiThinking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clinicalHistory || !formData.diagnosis || !formData.treatmentPlan) {
        addToast('Please fill all required fields marked *', 'error');
        return;
    }

    setSubmitting(true);
    try {
        await onSubmit({
            ...formData,
            doctorName, // Force current user
            followUpDate: followUpNeeded ? formData.followUpDate : null
        });
        onClose();
    } catch (error) {
        // Error handling done in parent or toast
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Clinical Visit">
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <Input 
                    label="Doctor Name" 
                    value={doctorName}
                    readOnly
                    className="bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                 <Input 
                    label="Visit Date" 
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    required
                />
            </div>

            <div className="relative">
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Clinical History / Symptoms <span className="text-red-500">*</span></label>
                     <button 
                        type="button"
                        onClick={handleAiSuggest}
                        disabled={aiThinking || !formData.clinicalHistory}
                        className="text-xs bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 px-3 py-1 rounded-full flex items-center hover:shadow-sm border border-purple-200 transition-all disabled:opacity-50"
                    >
                        <Sparkles size={12} className={`mr-1 ${aiThinking ? 'animate-spin' : ''}`} /> 
                        {aiThinking ? 'Analyzing...' : 'AI Suggest Diagnosis'}
                    </button>
                </div>
                <TextArea 
                    rows={3}
                    value={formData.clinicalHistory}
                    onChange={e => setFormData({...formData, clinicalHistory: e.target.value})}
                    placeholder="Patient complaints, duration, severity..."
                    className="resize-none"
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <TextArea 
                    label="Diagnosis (Nidana) *" 
                    rows={2}
                    value={formData.diagnosis}
                    onChange={e => setFormData({...formData, diagnosis: e.target.value})}
                    placeholder="Ayurvedic Diagnosis"
                    required
                    className="bg-white"
                />
                <TextArea 
                    label="Treatment Plan (Chikitsa) *" 
                    rows={2}
                    value={formData.treatmentPlan}
                    onChange={e => setFormData({...formData, treatmentPlan: e.target.value})}
                    placeholder="Medicines, Therapies..."
                    required
                    className="bg-white"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <Input 
                    label="Investigations / Labs" 
                    value={formData.investigations}
                    onChange={e => setFormData({...formData, investigations: e.target.value})}
                    placeholder="e.g. CBC, X-Ray"
                />
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up</label>
                     <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm text-gray-600">
                             <input 
                                type="checkbox" 
                                checked={!followUpNeeded} 
                                onChange={(e) => setFollowUpNeeded(!e.target.checked)}
                                className="rounded text-ayur-600 focus:ring-ayur-500"
                            />
                             <span>No follow-up needed</span>
                        </label>
                        <input 
                            type="date"
                            className={`w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-ayur-500 sm:text-sm ${!followUpNeeded ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                            value={formData.followUpDate}
                            onChange={e => setFormData({...formData, followUpDate: e.target.value})}
                            disabled={!followUpNeeded}
                        />
                     </div>
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (Report/Scan)</label>
                <div className="flex items-center gap-3">
                     <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-ayur-50 file:text-ayur-700 hover:file:bg-ayur-100 transition-colors"
                    />
                </div>
                 {formData.attachmentName && (
                     <div className="mt-2 text-xs text-green-600 font-medium">
                         Selected: {formData.attachmentName}
                     </div>
                 )}
                 <p className="text-xs text-gray-400 mt-1">Allowed: PDF, JPG, PNG (Max 5MB)</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit" isLoading={submitting}>Save Visit Record</Button>
            </div>
        </form>
    </Modal>
  );
};