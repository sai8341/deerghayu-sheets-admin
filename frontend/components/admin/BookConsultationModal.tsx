import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToastStore } from '../../store/toastStore';
import { api } from '../../services/api';
import { User, Patient } from '../../types';
import { Calendar, User as UserIcon, IndianRupee } from 'lucide-react';

interface BookConsultationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (visit: any) => void;
    patient?: Patient;
    lastVisitDate?: string;
}

export const BookConsultationModal: React.FC<BookConsultationModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    patient,
    lastVisitDate
}) => {
    const { addToast } = useToastStore();
    const [loading, setLoading] = useState(false);
    const [doctors, setDoctors] = useState<User[]>([]);
    const [isFeeWaived, setIsFeeWaived] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        doctorName: '',
        consultationFee: 500,
    });

    useEffect(() => {
        if (isOpen) {
            loadDoctors();
            checkFeeWaiver();
        }
    }, [isOpen]);

    const checkFeeWaiver = () => {
        if (!lastVisitDate) {
            setFormData(prev => ({ ...prev, consultationFee: 500 }));
            setIsFeeWaived(false);
            return;
        }

        const today = new Date();
        const last = new Date(lastVisitDate);
        const diffTime = Math.abs(today.getTime() - last.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 10) {
            setFormData(prev => ({ ...prev, consultationFee: 0 }));
            setIsFeeWaived(true);
        } else {
            setFormData(prev => ({ ...prev, consultationFee: 500 }));
            setIsFeeWaived(false);
        }
    };

    const loadDoctors = async () => {
        try {
            const users = await api.users.getAll();
            // Filter only doctors and admins
            const docs = users.filter(u => u.role === 'doctor' || u.role === 'admin');
            setDoctors(docs);

            // Auto-select first doctor if available and not already set
            if (docs.length > 0 && !formData.doctorName) {
                setFormData(prev => ({ ...prev, doctorName: docs[0].name }));
            }
        } catch (error) {
            console.error('Failed to load doctors', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!patient) return;

            // Prepare Payload
            const payload = {
                patientId: patient.id,
                date: formData.date,
                doctorName: formData.doctorName,
                consultationFee: formData.consultationFee,
                isPaid: true,
                status: 'booked',
                totalAmount: formData.consultationFee, // Initialize total amount
                amountPaid: formData.consultationFee, // Initialize amount paid
                clinicalHistory: '', // Start empty
                diagnosis: '',
                treatmentPlan: '',
                investigations: ''
            };

            await onSubmit(payload);
            const wasWaived = isFeeWaived; // Capture current state for toast message
            onClose();
            // Reset form
            setFormData({
                date: new Date().toISOString().split('T')[0],
                doctorName: doctors.length > 0 ? doctors[0].name : '',
                consultationFee: 500
            });
            setIsFeeWaived(false);

        } catch (error) {
            console.error(error);
            addToast('Failed to book consultation', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Book New Consultation">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <p className="text-sm text-gray-500 mb-2">
                        This action will create a new clinical visit record and mark the consultation fee as paid.
                    </p>
                    {isFeeWaived && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm font-medium">
                            ✓ Fee waived (Follow-up visit within 10 days)
                        </div>
                    )}
                </div>

                <Input
                    label="Date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    icon={Calendar}
                    required
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor</label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <select
                            className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-ayur-500 bg-white"
                            value={formData.doctorName}
                            onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                            required
                        >
                            {doctors.map(doc => (
                                <option key={doc.id} value={doc.name}>{doc.name} ({doc.role})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <Input
                    label="Consultation Fee (₹)"
                    type="number"
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: parseInt(e.target.value) || 0 })}
                    icon={IndianRupee}
                    min={0}
                    required
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" isLoading={loading} className="bg-ayur-600 hover:bg-ayur-700">
                        {formData.consultationFee === 0 ? 'Confirm (Free)' : 'Confirm & Pay'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
