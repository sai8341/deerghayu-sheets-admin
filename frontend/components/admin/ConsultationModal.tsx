import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, TextArea } from '../ui/Input';
import { api } from '../../services/api';
import { Visit, Treatment, VisitTreatment, Bill, Payment } from '../../types';
import { useToastStore } from '../../store/toastStore';
import { Plus, Trash, FileText, Pill, Stethoscope, Save, Calculator, CreditCard, Banknote, Landmark } from 'lucide-react';

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

    // Payment Form State
    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card' | 'online'>('cash');
    const [isAddingPayment, setIsAddingPayment] = useState(false);

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

    // Local copy of visit to handle updates within modal without closing
    const [currentVisit, setCurrentVisit] = useState<Visit>(visit);

    // Load available treatments on open
    useEffect(() => {
        if (isOpen) {
            setCurrentVisit(visit);
            loadTreatments();
            // Reset state to current visit data incase it changed
            setClinicalHistory(visit.clinicalHistory || '');
            setDiagnosis(visit.diagnosis || '');
            setInvestigations(visit.investigations || '');
            setNotes(visit.notes || '');
            setDiscount(0);
            setAttachment(null);
            setPaymentAmount('');
            setPaymentMode('cash');

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
    const visualGrandTotal = treatmentTotal - discount;
    // Balance logic: Use Bill if exists, else match Grand Total
    const bill = currentVisit.bill;
    const totalPaid = bill ? bill.totalPaid : 0;
    const balanceDue = bill ? bill.balance : visualGrandTotal; // If no bill, full amount is due (virtually)

    const handleSaveAndGenerateBill = async () => {
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
                // Add consultation fee back for backend record logic
                totalAmount: visualGrandTotal + Number(currentVisit.consultationFee || 0),
            };

            const updated = await api.visits.update(currentVisit.id, payload);

            if (attachment) {
                await api.visits.uploadAttachment(currentVisit.id, attachment);
            }

            addToast('Bill Generated & Saved', 'success');
            setCurrentVisit(updated); // Update local state to show Billing UI
            onUpdate(updated); // Update parent
        } catch (error) {
            console.error(error);
            addToast('Failed to save', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPayment = async () => {
        if (!paymentAmount || Number(paymentAmount) <= 0) {
            addToast('Enter a valid amount', 'error');
            return;
        }
        setIsAddingPayment(true);
        try {
            await api.visits.addPayment(currentVisit.id, Number(paymentAmount), paymentMode);
            addToast('Payment added successfully', 'success');

            // Refresh visit to get updated bill
            // Ideally backend returns updated visit or payment, but api.visits.addPayment returns payment info
            // We should re-fetch the visit or optimistically update. 
            // Let's re-fetch for safety or ask parents to refresh. 
            // Quickest: re-fetch visit logic not exposed here easily? 
            // We can manually update local bill state if we knew structure. 
            // Safer: Just call onUpdate with a fresh fetch?
            // Actually, `handleSaveAndGenerateBill` updates `currentVisit`.
            // Let's just create a quick refresh:
            // But we don't have `getById` handy? We do in `api.patients` but not `visits` directly?
            // Actually `api.visits.getById`? `api.visits` has `getByPatientId`.
            // Let's rely on parent update? No, we need it here.
            // Let's just update local state optimistically or re-fetch whole patient visits?
            // Re-fetch is expensive. Optimistic update:
            const newPayment: Payment = {
                id: 'temp-' + Date.now(),
                amount: Number(paymentAmount),
                date: new Date().toISOString(),
                mode: paymentMode,
                // receivedBy...
            };

            // Deep clone to update
            const updatedBill = currentVisit.bill ? { ...currentVisit.bill } : undefined;
            if (updatedBill) {
                updatedBill.payments = [...updatedBill.payments, newPayment];
                updatedBill.totalPaid += Number(paymentAmount);
                updatedBill.balance -= Number(paymentAmount);
                updatedBill.status = updatedBill.balance <= 0 ? 'paid' : 'partially_paid';

                const updatedVisit = { ...currentVisit, bill: updatedBill };
                setCurrentVisit(updatedVisit);
                onUpdate(updatedVisit);
            }

            setPaymentAmount('');
        } catch (e) {
            addToast('Failed to add payment', 'error');
            console.error(e);
        } finally {
            setIsAddingPayment(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Doctor's Consultation & Billing" maxWidth="max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[75vh]">
                {/* Left Column: Clinical Notes */}
                <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2">
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-full shadow-sm">
                                <Stethoscope size={20} className="text-ayur-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Clinical Record</h3>
                                <p className="text-xs text-gray-500">Dr. {currentVisit.doctorName} • {currentVisit.date}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</span>
                            <p className="text-sm font-bold text-amber-600">{currentVisit.status === 'completed' ? 'Completed' : 'In Progress'}</p>
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
                    </div>
                </div>

                {/* Right Column: Treatments & Billing */}
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
                        {/* Summary */}
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
                        </div>

                        {/* Payments Section */}
                        {currentVisit.bill ? (
                            <div className="mt-4 border-t border-gray-100 pt-3">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payments</h4>
                                <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                                    {currentVisit.bill.payments.length === 0 && <p className="text-xs text-gray-400 italic">No payments yet.</p>}
                                    {currentVisit.bill.payments.map((p, i) => (
                                        <div key={i} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                            <span>
                                                <span className="font-bold text-gray-700 mr-2">₹{p.amount}</span>
                                                <span className="text-xs text-gray-500 uppercase">{p.mode}</span>
                                            </span>
                                            <span className="text-xs text-gray-400">{new Date(p.date).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center text-sm font-bold border-t border-gray-100 pt-2 mb-3">
                                    <span className="text-gray-500">Total Paid</span>
                                    <span className="text-green-600">₹{totalPaid}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold mb-4">
                                    <span className="text-gray-500">Balance Due</span>
                                    <span className={balanceDue > 0 ? "text-red-500" : "text-green-500"}>₹{balanceDue}</span>
                                </div>

                                {balanceDue > 0 && (
                                    <div className="flex gap-2 mb-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-2 top-2 text-gray-400 text-xs">₹</span>
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-ayur-500"
                                                value={paymentAmount}
                                                onChange={e => setPaymentAmount(e.target.value)}
                                            />
                                        </div>
                                        <select
                                            className="text-sm border border-gray-300 rounded px-2 py-1.5"
                                            value={paymentMode}
                                            onChange={e => setPaymentMode(e.target.value as any)}
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="upi">UPI</option>
                                            <option value="card">Card</option>
                                            <option value="online">Online</option>
                                        </select>
                                        <Button size="sm" onClick={handleAddPayment} disabled={isAddingPayment}>Add</Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mt-4 p-3 bg-amber-50 text-amber-800 text-sm rounded border border-amber-100 text-center">
                                Save treatments to enable billing.
                            </div>
                        )}

                        <div className="mt-4 flex gap-3">
                            {!currentVisit.bill ? (
                                <Button
                                    className="w-full justify-center bg-ayur-700 hover:bg-ayur-800 text-white"
                                    size="lg"
                                    onClick={handleSaveAndGenerateBill}
                                    isLoading={loading}
                                >
                                    <Save size={18} className="mr-2" /> Save & Generate Bill
                                </Button>
                            ) : (
                                <div className="flex w-full gap-2">
                                    <Button
                                        className="flex-1 justify-center bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                        onClick={onClose}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        className="flex-1 justify-center bg-ayur-700 hover:bg-ayur-800 text-white"
                                        onClick={handleSaveAndGenerateBill}
                                        isLoading={loading}
                                    >
                                        Update Details
                                    </Button>
                                    {/* Print Button could go here too */}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
