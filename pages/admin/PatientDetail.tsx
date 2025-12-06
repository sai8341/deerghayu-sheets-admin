import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Patient, Visit } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, TextArea } from '../../components/ui/Input';
import { Plus, Download, FileText, Calendar, User, Sparkles } from 'lucide-react';
import { generateDiagnosisSuggestion } from '../../services/geminiService';
import { useAuthStore } from '../../store/authStore';

export const PatientDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuthStore();
    const [patient, setPatient] = useState<Patient | undefined>(undefined);
    const [visits, setVisits] = useState<Visit[]>([]);
    const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);
    
    // Add Visit Form State
    const [newVisit, setNewVisit] = useState({
        doctorName: user?.name || 'Dr. Ayurveda',
        clinicalHistory: '',
        diagnosis: '',
        treatmentPlan: '',
        investigations: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [aiThinking, setAiThinking] = useState(false);

    useEffect(() => {
        if (id) {
            api.patients.getById(id).then(setPatient);
            api.visits.getByPatientId(id).then(setVisits);
        }
    }, [id]);

    const handleAddVisit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !patient) return;
        setSubmitting(true);
        const visit = await api.visits.create({
            patientId: id,
            date: new Date().toISOString().split('T')[0],
            ...newVisit
        });
        setVisits([visit, ...visits]);
        setSubmitting(false);
        setIsAddVisitOpen(false);
        setNewVisit({ doctorName: user?.name || '', clinicalHistory: '', diagnosis: '', treatmentPlan: '', investigations: '', notes: '' });
    };

    const handleAiSuggest = async () => {
        if (!newVisit.clinicalHistory) {
            alert("Please enter Clinical History first.");
            return;
        }
        setAiThinking(true);
        try {
            const suggestion = await generateDiagnosisSuggestion(newVisit.clinicalHistory, patient!.age, patient!.sex);
            
            setNewVisit(prev => ({
                ...prev,
                diagnosis: suggestion.diagnosis,
                treatmentPlan: suggestion.treatmentPlan,
                notes: prev.notes + (prev.notes ? '\n\n' : '') + '(AI Assisted Recommendation)'
            }));
        } catch (error) {
            console.error("AI Error", error);
            alert("Failed to generate suggestion");
        }
        setAiThinking(false);
    };

    const handleDownloadPDF = () => {
        if (!patient) return;
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Patient History - ${patient.name}</title>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
                        .header { border-bottom: 2px solid #81ad2b; padding-bottom: 20px; margin-bottom: 30px; }
                        .h-title { font-size: 24px; font-weight: bold; color: #4e6921; margin: 0; }
                        .h-subtitle { font-size: 14px; color: #666; margin-top: 5px; }
                        .section { margin-bottom: 20px; }
                        .label { font-weight: bold; font-size: 12px; color: #888; text-transform: uppercase; }
                        .value { font-size: 16px; margin-top: 2px; margin-bottom: 10px; }
                        .visit { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; page-break-inside: avoid; }
                        .visit-header { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; }
                        .visit-date { font-weight: bold; color: #81ad2b; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1 class="h-title">Sri Deerghayu Ayurvedic Hospital</h1>
                        <p class="h-subtitle">Patient Medical Record</p>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
                        <div>
                            <div class="label">Patient Name</div>
                            <div class="value">${patient.name}</div>
                            <div class="label">Registration No</div>
                            <div class="value">${patient.regNo}</div>
                        </div>
                         <div>
                            <div class="label">Age / Sex</div>
                            <div class="value">${patient.age} / ${patient.sex}</div>
                            <div class="label">Mobile</div>
                            <div class="value">${patient.mobile}</div>
                        </div>
                    </div>

                    <h2 style="font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px;">Clinical Visit History</h2>

                    ${visits.map(v => `
                        <div class="visit">
                            <div class="visit-header">
                                <span class="visit-date">${v.date}</span>
                                <span style="font-size: 14px; color: #666;">${v.doctorName}</span>
                            </div>
                            <div class="section">
                                <div class="label">Diagnosis</div>
                                <div class="value">${v.diagnosis}</div>
                            </div>
                            <div class="section">
                                <div class="label">Treatment Plan</div>
                                <div class="value">${v.treatmentPlan}</div>
                            </div>
                            ${v.clinicalHistory ? `
                            <div class="section">
                                <div class="label">Clinical History</div>
                                <div class="value" style="font-size: 14px;">${v.clinicalHistory}</div>
                            </div>` : ''}
                        </div>
                    `).join('')}

                    <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #999;">
                        Generated on ${new Date().toLocaleDateString()}
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    if (!patient) return <div>Loading...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Patient Info */}
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="h-16 w-16 bg-ayur-100 rounded-full flex items-center justify-center text-ayur-700 text-2xl font-bold font-serif">
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{patient.name}</h2>
                            <p className="text-sm text-gray-500">{patient.regNo}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-500">Age / Sex</p>
                                <p className="font-medium">{patient.age} Y / {patient.sex}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Blood Group</p>
                                <p className="font-medium">{patient.bloodGroup || '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Mobile</p>
                                <p className="font-medium">{patient.mobile}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">First Visit</p>
                                <p className="font-medium">{patient.firstVisitDate}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-500">Address</p>
                            <p className="font-medium">{patient.address}</p>
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <Button className="w-full justify-center" variant="outline" onClick={handleDownloadPDF}>
                            <Download size={16} className="mr-2" /> Download History PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right Col: Timeline */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900">Clinical History</h3>
                        {user?.role === 'doctor' || user?.role === 'admin' ? (
                             <Button onClick={() => setIsAddVisitOpen(true)}>
                                <Plus size={16} className="mr-2" /> Add Visit
                            </Button>
                        ) : null}
                    </div>
                    
                    <div className="p-6 flex-1 overflow-y-auto">
                        <div className="relative">
                            {/* Vertical line */}
                            <div className="absolute top-0 bottom-0 left-4 w-px bg-gray-200"></div>
                            
                            <div className="space-y-8">
                                {visits.map((visit) => (
                                    <div key={visit.id} className="relative pl-10">
                                        <div className="absolute left-2 top-2 h-4 w-4 rounded-full bg-ayur-500 border-4 border-white shadow-sm transform -translate-x-1/2"></div>
                                        <div className="bg-gray-50 rounded-lg p-5 border border-gray-100 hover:border-ayur-200 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{visit.date}</p>
                                                    <p className="text-xs text-gray-500">{visit.doctorName}</p>
                                                </div>
                                                <span className="px-2 py-1 bg-white rounded text-xs font-medium text-ayur-700 border border-ayur-100">
                                                    Visit
                                                </span>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                <div>
                                                    <span className="text-xs font-semibold text-gray-500 uppercase">Diagnosis</span>
                                                    <p className="text-sm text-gray-900">{visit.diagnosis}</p>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-semibold text-gray-500 uppercase">Treatment</span>
                                                    <p className="text-sm text-gray-800">{visit.treatmentPlan}</p>
                                                </div>
                                                 {visit.notes && (
                                                    <div className="bg-white p-3 rounded border border-gray-200 text-xs text-gray-600 italic">
                                                        Note: {visit.notes}
                                                    </div>
                                                )}
                                                {visit.attachments && (
                                                    <div className="flex gap-2 mt-2">
                                                        <span className="text-xs bg-gray-200 px-2 py-1 rounded flex items-center">
                                                            <FileText size={12} className="mr-1"/> Report.pdf
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Visit Modal */}
            <Modal isOpen={isAddVisitOpen} onClose={() => setIsAddVisitOpen(false)} title="Add New Clinical Visit">
                <form onSubmit={handleAddVisit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Doctor Name" 
                            value={newVisit.doctorName}
                            onChange={e => setNewVisit({...newVisit, doctorName: e.target.value})}
                            required
                        />
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Report</label>
                            <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-ayur-50 file:text-ayur-700 hover:file:bg-ayur-100"/>
                        </div>
                    </div>

                    <div className="relative">
                        <TextArea 
                            label="Clinical History / Symptoms" 
                            rows={3}
                            value={newVisit.clinicalHistory}
                            onChange={e => setNewVisit({...newVisit, clinicalHistory: e.target.value})}
                            required
                        />
                         <button 
                            type="button"
                            onClick={handleAiSuggest}
                            disabled={aiThinking}
                            className="absolute right-2 top-8 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded flex items-center hover:bg-purple-200 transition-colors"
                        >
                            <Sparkles size={12} className="mr-1" /> 
                            {aiThinking ? 'Thinking...' : 'AI Suggest'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextArea 
                            label="Diagnosis (Nidana)" 
                            rows={2}
                            value={newVisit.diagnosis}
                            onChange={e => setNewVisit({...newVisit, diagnosis: e.target.value})}
                            required
                        />
                        <TextArea 
                            label="Treatment Plan (Chikitsa)" 
                            rows={2}
                            value={newVisit.treatmentPlan}
                            onChange={e => setNewVisit({...newVisit, treatmentPlan: e.target.value})}
                            required
                        />
                    </div>

                    <TextArea 
                        label="Investigations / Labs" 
                        rows={1}
                        value={newVisit.investigations}
                        onChange={e => setNewVisit({...newVisit, investigations: e.target.value})}
                    />

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsAddVisitOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={submitting}>Save Visit</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};