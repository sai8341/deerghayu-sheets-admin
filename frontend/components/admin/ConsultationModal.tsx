import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, TextArea } from '../ui/Input';
import { api } from '../../services/api';
import { Visit, Treatment, VisitTreatment } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { Plus, Trash, FileText, Pill, Stethoscope, Save, Calculator } from 'lucide-react';

interface ConsultationModalProps {
    isOpen: boolean;
    onClose: () => void;
    visit: Visit;
    onUpdate: (updatedVisit: Visit) => void;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
    isOpen,
    onClose,
    visit,
    onUpdate
}) => {
    const { addToast } = useToastStore();
    const [loading, setLoading] = useState(false);

    // Medical Data
    const [clinicalHistory, setClinicalHistory] = useState(visit.clinicalHistory || '');
    const [diagnosis, setDiagnosis] = useState(visit.diagnosis || '');
    const [investigations, setInvestigations] = useState(visit.investigations || '');
    const [notes, setNotes] = useState(visit.notes || '');
    const [attachment, setAttachment] = useState<File | null>(null);

    // Billing State
    const [discount, setDiscount] = useState(0);
    const [amountPaidInput, setAmountPaidInput] = useState(0);

    // Treatment Plan Data
    const [availableTreatments, setAvailableTreatments] = useState<Treatment[]>([]);
    const [selectedTreatments, setSelectedTreatments] = useState<any[]>(
        visit.treatments?.map(t => ({
            treatmentId: t.treatment?.id || t.treatmentId, // Handle both populated and raw
            treatmentTitle: t.treatment?.title, // Store title for display if available
            price: t.cost_per_sitting,
            sittings: t.sittings
        })) || []
    );

    // Load available treatments on open
    useEffect(() => {
        if (isOpen) {
            loadTreatments();
            // Reset state to current visit data incase it changed
            setClinicalHistory(visit.clinicalHistory || '');
            setDiagnosis(visit.diagnosis || '');
            setInvestigations(visit.investigations || '');
            setNotes(visit.notes || '');
            setDiscount(0);
            // Hide consultation fee from input
            setAmountPaidInput(Math.max(0, (Number(visit.amountPaid) || 0) - (Number(visit.consultationFee) || 0)));
            setAttachment(null);

            setSelectedTreatments(visit.treatments?.map(t => ({
                treatmentId: t.treatment?.id || t.treatmentId,
                treatmentTitle: t.treatment?.title || 'Unknown Treatment',
                price: t.cost_per_sitting,
                sittings: t.sittings
            })) || []);
        }
    }, [isOpen, visit]);

    const loadTreatments = async () => {
        try {
            const data = await api.treatments.getAll();
            setAvailableTreatments(data);
        } catch (e) {
            console.error("Failed to load treatments");
        }
    };

    const addTreatmentRow = () => {
        if (availableTreatments.length === 0) return;
        // Default to first treatment
        const defaultT = availableTreatments[0];
        setSelectedTreatments([
            ...selectedTreatments,
            { treatmentId: defaultT.id, treatmentTitle: defaultT.title, price: defaultT.price, sittings: 7 }
        ]);
    };

    const updateTreatmentRow = (index: number, field: string, value: any) => {
        const newRows = [...selectedTreatments];

        if (field === 'treatmentId') {
            const t = availableTreatments.find(at => at.id == value);
            if (t) {
                newRows[index] = { ...newRows[index], treatmentId: t.id, treatmentTitle: t.title, price: t.price };
            }
        } else {
            newRows[index] = { ...newRows[index], [field]: value };
        }

        setSelectedTreatments(newRows);
    };

    const removeTreatmentRow = (index: number) => {
        const newRows = [...selectedTreatments];
        newRows.splice(index, 1);
        setSelectedTreatments(newRows);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                addToast('File too large. Max 5MB.', 'error');
                e.target.value = '';
                return;
            }
            setAttachment(file);
        }
    };

    const calculateTotal = () => {
        return selectedTreatments.reduce((acc, curr) => acc + (Number(curr.price) * Number(curr.sittings)), 0);
    };

    // Billing Calculations
    const treatmentTotal = calculateTotal();
    // Visual totals (excluding consultation fee per user request)
    const visualGrandTotal = treatmentTotal - discount;
    const balanceDue = visualGrandTotal - amountPaidInput;

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                clinicalHistory,
                diagnosis,
                treatmentPlan: selectedTreatments.map(t => `${t.treatmentTitle} (${t.sittings} sittings)`).join(', '),
                investigations,
                notes,
                status: 'completed',
                visit_treatments: selectedTreatments.map(t => ({
                    treatmentId: t.treatmentId,
                    sittings: t.sittings
                })),
                // Add consultation fee back for backend record
                totalAmount: visualGrandTotal + Number(visit.consultationFee || 0),
                amountPaid: amountPaidInput + Number(visit.consultationFee || 0)
            };

            const updated = await api.visits.update(visit.id, payload);

            if (attachment) {
                await api.visits.uploadAttachment(visit.id, attachment);
            }

            addToast('Consultation finalized & Bill generated', 'success');
            onUpdate(updated);
            onClose();
        } catch (error) {
            console.error(error);
            addToast('Failed to save consultation', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Doctor's Consultation & Billing" maxWidth="max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[75vh]">
                {/* Left Column: Clinical Notes */}
                <div className="lg:col-span-2 space-y-4 overflow-y-auto pr-2">
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-full shadow-sm">
                                <Stethoscope size={20} className="text-ayur-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Clinical Record</h3>
                                <p className="text-xs text-gray-500">Dr. {visit.doctorName} • {visit.date}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</span>
                            <p className="text-sm font-bold text-amber-600">In Progress</p>
                        </div>
                    </div>

                    <TextArea
                        label="Clinical History & Symptoms"
                        placeholder="Patient complaints, history of present illness..."
                        rows={3}
                        value={clinicalHistory}
                        onChange={e => setClinicalHistory(e.target.value)}
                    />

                    <TextArea
                        label="Diagnosis / Provisional Diagnosis"
                        placeholder="e.g. Ama Vata (Rheumatoid Arthritis)"
                        rows={2}
                        className="font-medium text-gray-900"
                        value={diagnosis}
                        onChange={e => setDiagnosis(e.target.value)}
                    />

                    <TextArea
                        label="Investigations / Lab Reports"
                        placeholder="Any advised tests..."
                        rows={2}
                        value={investigations}
                        onChange={e => setInvestigations(e.target.value)}
                    />

                    <TextArea
                        label="Private Notes"
                        placeholder="Internal doctor notes..."
                        rows={2}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Case Sheet / Report (Optional)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-ayur-50 file:text-ayur-700 hover:file:bg-ayur-100 transition-colors"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Upload file up to 5 MB (PNG, JPG, PDF).</p>
                    </div>
                </div>

                {/* Right Column: Prescribe Treatments */}
                <div className="lg:col-span-1 bg-gray-50 border-l border-gray-100 flex flex-col h-full -m-6">
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Pill size={18} className="text-ayur-600" /> Treatments</h3>
                            <Button size="sm" variant="outline" onClick={addTreatmentRow} className="h-7 w-7 p-0 rounded-full">
                                <Plus size={16} />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {selectedTreatments.length === 0 && (
                            <div className="text-center py-10 text-gray-400 text-sm italic">
                                No treatments prescribed.
                            </div>
                        )}
                        {selectedTreatments.map((row, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 text-sm group">
                                <div className="flex justify-between mb-2">
                                    <select
                                        className="w-full font-medium text-gray-800 border-none bg-transparent focus:ring-0 p-0 cursor-pointer hover:text-ayur-700 text-sm"
                                        value={row.treatmentId}
                                        onChange={(e) => updateTreatmentRow(idx, 'treatmentId', e.target.value)}
                                    >
                                        {availableTreatments.map(t => (
                                            <option key={t.id} value={t.id}>{t.title}</option>
                                        ))}
                                    </select>
                                    <button onClick={() => removeTreatmentRow(idx)} className="text-gray-300 hover:text-red-500">
                                        <Trash size={14} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <label className="text-[10px] uppercase text-gray-400 font-bold">Sittings</label>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-mono"
                                            value={row.sittings}
                                            onChange={(e) => updateTreatmentRow(idx, 'sittings', parseInt(e.target.value) || 1)}
                                            min={1}
                                        />
                                    </div>
                                    <div className="flex-1 text-right">
                                        <label className="text-[10px] uppercase text-gray-400 font-bold">Est. Cost</label>
                                        <p className="font-mono font-medium text-gray-700">₹{row.price * row.sittings}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                        <div className="space-y-1 mb-4 text-sm">
                            <div className="flex justify-between text-gray-500">
                                <span>Treatments Total</span>
                                <span>₹{treatmentTotal}</span>
                            </div>
                            <div className="flex justify-between items-center text-ayur-700">
                                <span>Discount</span>
                                <div className="flex items-center w-24">
                                    <span className="text-gray-400 mr-1">- ₹</span>
                                    <input
                                        type="number"
                                        className="w-full border-b border-ayur-200 py-0 px-0 text-right focus:ring-0 focus:border-ayur-500 text-sm"
                                        value={discount}
                                        onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between font-bold text-lg text-gray-900 border-t border-gray-100 pt-2 mt-2">
                                <span>Grand Total</span>
                                <span>₹{visualGrandTotal}</span>
                            </div>
                            <div className="flex justify-between items-center text-blue-700 bg-blue-50 p-2 rounded mt-2">
                                <span className="text-xs font-bold uppercase">Amount Paid</span>
                                <div className="flex items-center w-28">
                                    <span className="text-blue-400 mr-1">₹</span>
                                    <input
                                        type="number"
                                        className="w-full bg-transparent border-b border-blue-200 py-0 px-0 text-right focus:ring-0 focus:border-blue-500 font-bold"
                                        value={amountPaidInput}
                                        onChange={e => setAmountPaidInput(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-gray-400 mt-1 px-2">
                                <span>Balance Due</span>
                                <span className={balanceDue > 0 ? "text-red-500" : "text-green-500"}>₹{balanceDue}</span>
                            </div>
                        </div>

                        <Button
                            className="w-full justify-center bg-ayur-700 hover:bg-ayur-800 text-white"
                            size="lg"
                            onClick={handleSave}
                            isLoading={loading}
                        >
                            <Save size={18} className="mr-2" /> Finish & Generate Bill
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
