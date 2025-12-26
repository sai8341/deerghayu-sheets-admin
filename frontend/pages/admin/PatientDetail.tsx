import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Patient, Visit } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Download, Clock, Plus, Paperclip, FileText, Printer } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { VisitTimeline } from '../../components/admin/VisitTimeline';
import { BookConsultationModal } from '../../components/admin/BookConsultationModal';
import { ConsultationModal } from '../../components/admin/ConsultationModal';
import { AttachmentViewerModal } from '../../components/ui/AttachmentViewerModal';

export const PatientDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuthStore();
    const { addToast } = useToastStore();

    const [patient, setPatient] = useState<Patient | undefined>(undefined);
    const [visits, setVisits] = useState<Visit[]>([]);

    // Modal States
    const [isBookConsultationOpen, setIsBookConsultationOpen] = useState(false);

    // Doctor Consultation State
    const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
    const [activeConsultationVisit, setActiveConsultationVisit] = useState<Visit | null>(null);

    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
    const [attachmentViewer, setAttachmentViewer] = useState<{ isOpen: boolean, url: string, name: string }>({
        isOpen: false, url: '', name: ''
    });

    useEffect(() => {
        if (id) {
            api.patients.getById(id).then(setPatient);
            api.visits.getByPatientId(id).then(setVisits);
        }
    }, [id]);

    const printBookingBill = (visit: Visit) => {
        if (!patient) return;

        const fee = Number(visit.consultationFee || 0);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Invoice - ${patient.name} - Consultation</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1f2937; max-width: 800px; margin: 0 auto; }
                        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; }
                        .h-title { font-size: 24px; font-weight: 800; color: #166534; margin: 0; }
                        .h-subtitle { font-size: 14px; color: #6b7280; margin-top: 5px; }
                        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
                        .label { font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
                        .value { font-size: 15px; font-weight: 500; color: #111827; margin-top: 2px; }
                        .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        .table th { text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
                        .table td { padding: 12px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
                        .total-row td { border-top: 2px solid #e5e7eb; font-weight: 700; padding-top: 15px; font-size: 16px; }
                        .amount { text-align: right; font-family: 'Courier New', monospace; }
                        .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #9ca3af; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1 class="h-title">Sri Deerghayu Ayurvedic Hospital</h1>
                        <p class="h-subtitle">Consultation Invoice</p>
                    </div>

                    <div class="grid">
                        <div>
                            <div style="margin-bottom: 15px;">
                                <div class="label">Billed To</div>
                                <div class="value" style="font-size: 18px; font-weight: 700;">${patient.name}</div>
                                <div class="value">${patient.address}</div>
                                <div class="value">Ph: ${patient.mobile}</div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                             <div style="margin-bottom: 10px;">
                                <div class="label">Date</div>
                                <div class="value">${visit.date}</div>
                            </div>
                            <div>
                                <div class="label">Doctor</div>
                                <div class="value">Dr. ${visit.doctorName}</div>
                            </div>
                        </div>
                    </div>

                    <table class="table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th style="text-align: center;">Qty</th>
                                <th class="amount">Rate</th>
                                <th class="amount">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Consultation Fee</td>
                                <td style="text-align: center;">1</td>
                                <td class="amount">${fee.toFixed(2)}</td>
                                <td class="amount">${fee.toFixed(2)}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                             <tr>
                                <td colspan="2"></td>
                                <td style="text-align: right; padding-top: 20px; color: #6b7280;">Subtotal</td>
                                <td class="amount" style="padding-top: 20px;">${fee.toFixed(2)}</td>
                            </tr>
                            <tr class="total-row">
                                <td colspan="2"></td>
                                <td style="text-align: right;">Grand Total</td>
                                <td class="amount">₹${fee.toFixed(2)}</td>
                            </tr>
                             <tr>
                                <td colspan="2"></td>
                                <td style="text-align: right; color: #6b7280;">Amount Paid</td>
                                <td class="amount" style="color: #15803d;">₹${fee.toFixed(2)}</td>
                            </tr>
                             <tr>
                                <td colspan="2"></td>
                                <td style="text-align: right; color: #6b7280;">Balance Due</td>
                                <td class="amount" style="color: #15803d">₹0.00</td>
                            </tr>
                        </tfoot>
                    </table>

                     <div class="footer">
                        <p>Thank you for choosing Sri Deerghayu Ayurvedic Hospital.</p>
                    </div>
                     <script>window.onload = function() { window.print(); window.close(); }</script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const handleBookConsultation = async (visitData: any) => {
        if (!id || !patient) return;

        try {
            const newVisit = await api.visits.create(visitData);
            setVisits([newVisit, ...visits]);
            addToast('Consultation booked successfully!', 'success');

            // Print invoice if paid
            if (newVisit.amountPaid > 0) {
                printBookingBill(newVisit);
            }
        } catch (error) {
            console.error(error);
            addToast('Failed to book consultation.', 'error');
            throw error;
        }
    };

    const handleViewVisit = (visit: Visit) => {
        // If status is Booked and User is Doctor/Admin, open Consultation Pad
        if (visit.status === 'booked' && (user?.role === 'doctor' || user?.role === 'admin')) {
            setActiveConsultationVisit(visit);
            setIsConsultationModalOpen(true);
        } else {
            setSelectedVisit(visit);
        }
    };

    const handleConsultationUpdate = (updatedVisit: Visit) => {
        setVisits(visits.map(v => v.id === updatedVisit.id ? updatedVisit : v));
    };

    const handleOpenAttachment = (url: string, name: string) => {
        setAttachmentViewer({
            isOpen: true,
            url: url,
            name: name
        });
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
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
                        .header { border-bottom: 3px solid #81ad2b; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                        .h-title { font-size: 28px; font-weight: bold; color: #4e6921; margin: 0; }
                        .h-subtitle { font-size: 14px; color: #666; margin-top: 5px; }
                        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; background: #fcfdf5; padding: 20px; border-radius: 8px; border: 1px solid #eaf4c8; }
                        .label { font-weight: bold; font-size: 11px; color: #81ad2b; text-transform: uppercase; letter-spacing: 0.5px; }
                        .value { font-size: 16px; margin-top: 2px; font-weight: 500; }
                        .visit { break-inside: avoid; border: 1px solid #eee; border-radius: 8px; margin-bottom: 20px; padding: 0; overflow: hidden; }
                        .visit-header { background: #f9fafb; padding: 12px 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
                        .visit-date { font-weight: bold; color: #374151; }
                        .visit-doc { font-size: 13px; color: #6b7280; }
                        .visit-body { padding: 20px; }
                        .section { margin-bottom: 15px; }
                        .section:last-child { margin-bottom: 0; }
                        .sec-title { font-size: 12px; font-weight: bold; color: #9ca3af; text-transform: uppercase; margin-bottom: 4px; }
                        .sec-content { font-size: 14px; line-height: 1.5; }
                        .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #eee; padding-top: 20px; }
                        @media print { body { padding: 20px; } .visit { break-inside: avoid; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1 class="h-title">Sri Deerghayu Ayurvedic Hospital</h1>
                            <p class="h-subtitle">Patient Medical Record & History</p>
                        </div>
                        <div style="text-align: right; font-size: 12px; color: #666;">
                            Generated: ${new Date().toLocaleDateString()}
                        </div>
                    </div>
                    
                    <div class="meta-grid">
                        <div>
                            <div class="label">Patient Name</div>
                            <div class="value">${patient.name}</div>
                        </div>
                        <div>
                            <div class="label">Registration No</div>
                            <div class="value" style="font-family: monospace;">${patient.regNo}</div>
                        </div>
                        <div>
                            <div class="label">Age / Sex</div>
                            <div class="value">${patient.age} Y / ${patient.sex}</div>
                        </div>
                        <div>
                            <div class="label">Contact</div>
                            <div class="value">${patient.mobile}</div>
                        </div>
                        <div style="grid-column: span 2;">
                            <div class="label">Address</div>
                            <div class="value">${patient.address}</div>
                        </div>
                    </div>

                    <h2 style="font-size: 18px; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 25px;">Clinical Visit History</h2>

                    ${visits.map(v => `
                        <div class="visit">
                            <div class="visit-header">
                                <span class="visit-date">${v.date}</span>
                                <span class="visit-doc">${v.doctorName}</span>
                            </div>
                            <div class="visit-body">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                    <div class="section">
                                        <div class="sec-title">Diagnosis</div>
                                        <div class="sec-content" style="font-weight: 500;">${v.diagnosis || '-'}</div>
                                    </div>
                                    <div class="section">
                                        <div class="sec-title">Treatment Plan</div>
                                        <div class="sec-content">${v.treatmentPlan || '-'}</div>
                                    </div>
                                </div>
                                ${v.clinicalHistory ? `
                                <div class="section" style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #eee;">
                                    <div class="sec-title">Clinical Notes / History</div>
                                    <div class="sec-content" style="color: #4b5563;">${v.clinicalHistory}</div>
                                </div>` : ''}
                            </div>
                        </div>
                    `).join('')}

                    <div class="footer">
                        This is a computer-generated document. No signature required.<br/>
                        Sri Deerghayu Ayurvedic Hospital | +91 98765 43210
                    </div>
                    <script>window.onload = function() { window.print(); window.close(); }</script>
                </body>
                </html>
            `);
            printWindow.document.close();
        } else {
            addToast('Pop-up blocked. Please allow pop-ups to download PDF.', 'error');
        }
    };



    const handleGenerateBill = (visit: Visit) => {
        if (!patient) return;

        const consultationFee = Number(visit.consultationFee || 0);
        const treatmentTotal = visit.treatments?.reduce((acc, t) => acc + (Number(t.cost_per_sitting) * t.sittings), 0) || 0;

        // "Next only treatment things" -> We exclude consultation fee from this bill logic
        const dbGrandTotal = Number(visit.totalAmount); // This is usually (Treatments + Consul - Discount)

        // We want Treatment Grand Total = dbGrandTotal - consultationFee
        let visualGrandTotal = dbGrandTotal - consultationFee;

        // Fallback if DB total is missing/bad or if simplified
        if (isNaN(dbGrandTotal) || dbGrandTotal === 0) {
            visualGrandTotal = treatmentTotal; // Assuming no discount if calc on fly
        }

        const dbPaid = Number(visit.amountPaid || 0);
        // Visual Paid = dbPaid - consultationFee (assuming consul fee was paid first)
        const visualPaid = Math.max(0, dbPaid - consultationFee);

        const balance = visualGrandTotal - visualPaid;

        // Discount
        // Subtotal (Treatments only) - Visual Grand Total
        const subTotal = treatmentTotal;
        const discount = subTotal - visualGrandTotal;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Invoice - ${patient.name}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1f2937; max-width: 800px; margin: 0 auto; }
                        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; }
                        .h-title { font-size: 24px; font-weight: 800; color: #166534; margin: 0; }
                        .h-subtitle { font-size: 14px; color: #6b7280; margin-top: 5px; }
                        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
                        .label { font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
                        .value { font-size: 15px; font-weight: 500; color: #111827; margin-top: 2px; }
                        .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        .table th { text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
                        .table td { padding: 12px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
                        .total-row td { border-top: 2px solid #e5e7eb; font-weight: 700; padding-top: 15px; font-size: 16px; }
                        .amount { text-align: right; font-family: 'Courier New', monospace; }
                        .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #9ca3af; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1 class="h-title">Sri Deerghayu Ayurvedic Hospital</h1>
                        <p class="h-subtitle">Official Medical Invoice</p>
                    </div>

                    <div class="grid">
                        <div>
                            <div style="margin-bottom: 15px;">
                                <div class="label">Billed To</div>
                                <div class="value" style="font-size: 18px; font-weight: 700;">${patient.name}</div>
                                <div class="value">${patient.address}</div>
                                <div class="value">Ph: ${patient.mobile}</div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                             <div style="margin-bottom: 10px;">
                                <div class="label">Invoice Date</div>
                                <div class="value">${visit.date}</div>
                            </div>
                            <div>
                                <div class="label">Doctor</div>
                                <div class="value">Dr. ${visit.doctorName}</div>
                            </div>
                        </div>
                    </div>

                    <table class="table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th style="text-align: center;">Qty / Sittings</th>
                                <th class="amount">Rate</th>
                                <th class="amount">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${visit.treatments?.map(t => `
                                <tr>
                                    <td>${t.treatment?.title || 'Treatment'}</td>
                                    <td style="text-align: center;">${t.sittings}</td>
                                    <td class="amount">${Number(t.cost_per_sitting).toFixed(2)}</td>
                                    <td class="amount">${(Number(t.cost_per_sitting) * t.sittings).toFixed(2)}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="4" style="text-align:center; padding:20px; color:#999;">No treatments added.</td></tr>'}
                        </tbody>
                        <tfoot>
                             <tr>
                                <td colspan="2"></td>
                                <td style="text-align: right; padding-top: 20px; color: #6b7280;">Subtotal</td>
                                <td class="amount" style="padding-top: 20px;">${subTotal.toFixed(2)}</td>
                            </tr>
                             ${discount > 0.01 ? `
                                <tr>
                                    <td colspan="2"></td>
                                    <td style="text-align: right; color: #6b7280;">Discount</td>
                                    <td class="amount" style="color: #ef4444;">-${discount.toFixed(2)}</td>
                                </tr>
                             ` : ''}
                            <tr class="total-row">
                                <td colspan="2"></td>
                                <td style="text-align: right;">Grand Total</td>
                                <td class="amount">₹${visualGrandTotal.toFixed(2)}</td>
                            </tr>
                             <tr>
                                <td colspan="2"></td>
                                <td style="text-align: right; color: #6b7280;">Amount Paid</td>
                                <td class="amount" style="color: #15803d;">₹${visualPaid.toFixed(2)}</td>
                            </tr>
                             <tr>
                                <td colspan="2"></td>
                                <td style="text-align: right; color: #6b7280;">Balance Due</td>
                                <td class="amount" style="color: ${balance > 0 ? '#ef4444' : '#15803d'}">₹${balance.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>

                     <div class="footer">
                        <p>Thank you for choosing Sri Deerghayu Ayurvedic Hospital.</p>
                        <p>For any queries, please contact support.</p>
                    </div>
                     <script>window.onload = function() { window.print(); window.close(); }</script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    if (!patient) return <div className="p-12 text-center text-gray-500 flex flex-col items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ayur-600 mb-4"></div>Loading Patient Data...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left Col: Patient Info */}
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="h-16 w-16 bg-gradient-to-br from-ayur-100 to-ayur-200 rounded-full flex items-center justify-center text-ayur-800 text-2xl font-bold font-serif shadow-inner border-2 border-white">
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{patient.name}</h2>
                            <p className="text-sm text-gray-500 font-mono bg-gray-50 px-2 py-0.5 rounded inline-block mt-1">{patient.regNo}</p>
                        </div>
                    </div>

                    <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Age / Sex</p>
                                <p className="font-medium text-gray-900 mt-0.5">{patient.age} Y / {patient.sex}</p>
                            </div>
                            {patient.bloodGroup && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Blood Group</p>
                                    <p className="font-medium text-gray-900 mt-0.5">{patient.bloodGroup}</p>
                                </div>
                            )}
                            <div className="col-span-2">
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Mobile</p>
                                <p className="font-medium text-gray-900 mt-0.5 tracking-wide">{patient.mobile}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Address</p>
                            <p className="font-medium text-gray-900 leading-relaxed mt-0.5">{patient.address}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">First Visit</p>
                            <p className="font-medium text-gray-900 mt-0.5">{patient.firstVisitDate}</p>
                        </div>
                        {patient.registration_document && (
                            <div className="pt-2 border-t border-gray-50 mt-2">
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Documents</p>
                                <a
                                    href={patient.registration_document}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-ayur-600 hover:text-ayur-800 text-sm flex items-center gap-1 font-medium group/link"
                                >
                                    <Paperclip size={14} className="group-hover/link:scale-110 transition-transform" /> Registration Doc
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <Button className="w-full justify-center group" variant="outline" onClick={handleDownloadPDF}>
                            <Download size={16} className="mr-2 group-hover:text-ayur-700" /> Download History PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right Col: Timeline */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 rounded-t-xl backdrop-blur-sm sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <Clock className="text-ayur-600" size={20} />
                            <h3 className="text-lg font-bold text-gray-900">Clinical Timeline</h3>
                        </div>
                        {(user?.role === 'doctor' || user?.role === 'admin' || user?.role === 'reception') && (
                            <Button onClick={() => setIsBookConsultationOpen(true)} className="shadow-sm hover:shadow-md transition-shadow">
                                <Plus size={16} className="mr-1.5" /> Book Consultation
                            </Button>
                        )}
                    </div>

                    <VisitTimeline
                        visits={visits}
                        onViewVisit={handleViewVisit}
                        onViewAttachment={handleOpenAttachment}
                    />
                </div>
            </div>

            {/* BookConsultationModal */}
            <BookConsultationModal
                isOpen={isBookConsultationOpen}
                onClose={() => setIsBookConsultationOpen(false)}
                onSubmit={handleBookConsultation}
                patient={patient}
                lastVisitDate={visits.length > 0 ? visits[0].date : undefined}
            />

            {/* Start Consultation Modal (Doctor) */}
            {activeConsultationVisit && (
                <ConsultationModal
                    isOpen={isConsultationModalOpen}
                    onClose={() => setIsConsultationModalOpen(false)}
                    visit={activeConsultationVisit}
                    onUpdate={handleConsultationUpdate}
                />
            )}

            {/* View Details Modal */}
            <Modal isOpen={!!selectedVisit} onClose={() => setSelectedVisit(null)} title="Consultation Details">
                {selectedVisit && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-ayur-700">{selectedVisit.date}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                    <span>Dr. {selectedVisit.doctorName}</span>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedVisit.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {selectedVisit.status === 'booked' ? 'Booked' : selectedVisit.status === 'in_progress' ? 'In Progress' : 'Completed'}
                                    </span>
                                </div>
                            </div>
                            {selectedVisit.attachments && selectedVisit.attachments.length > 0 && (
                                <button
                                    onClick={() => handleOpenAttachment(selectedVisit.attachments![0], selectedVisit.attachments![0])}
                                    className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-3 py-1.5 rounded-full"
                                >
                                    <Paperclip size={16} className="mr-1.5" /> View Attachment
                                </button>
                            )}
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Clinical History</h4>
                            <p className="text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-100 leading-relaxed text-sm">
                                {selectedVisit.clinicalHistory || <span className="text-gray-400 italic">No notes added.</span>}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Diagnosis</h4>
                                <p className="text-gray-900 font-medium">{selectedVisit.diagnosis || '-'}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Treatment</h4>
                                <p className="text-gray-900 font-medium">{selectedVisit.treatmentPlan || '-'}</p>
                            </div>
                        </div>

                        {selectedVisit.treatments && selectedVisit.treatments.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Treatments (Billable)</h4>
                                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                    {selectedVisit.treatments.map((t: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span>{t.treatment?.title || `Treatment #${t.treatmentId}`} x {t.sittings}</span>
                                            <span className="font-mono">₹{t.cost_per_sitting * t.sittings}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedVisit.investigations && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Investigations</h4>
                                <p className="text-gray-900 text-sm">{selectedVisit.investigations}</p>
                            </div>
                        )}

                        {selectedVisit.notes && (
                            <div className="border-t border-gray-100 pt-4 mt-2">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Doctor's Notes</h4>
                                <p className="text-gray-700 italic text-sm">{selectedVisit.notes}</p>
                            </div>
                        )}

                        <div className="flex justify-between pt-2">
                            <div className="flex gap-2">
                                {selectedVisit.status === 'completed' && (
                                    <Button size="sm" variant="outline" onClick={() => handleGenerateBill(selectedVisit)}>
                                        <Printer size={16} className="mr-2" /> Print Bill / Invoice
                                    </Button>
                                )}
                                {(user?.role === 'doctor' || user?.role === 'admin') && (
                                    <Button size="sm" variant="outline" className="text-ayur-700 border-ayur-200 hover:bg-ayur-50" onClick={() => {
                                        setActiveConsultationVisit(selectedVisit);
                                        setIsConsultationModalOpen(true);
                                        setSelectedVisit(null);
                                    }}>
                                        <FileText size={16} className="mr-2" /> Edit Details
                                    </Button>
                                )}
                            </div>
                            <Button variant="secondary" onClick={() => setSelectedVisit(null)}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>

            <AttachmentViewerModal
                isOpen={attachmentViewer.isOpen}
                onClose={() => setAttachmentViewer({ ...attachmentViewer, isOpen: false })}
                attachmentName={attachmentViewer.name}
                attachmentUrl={attachmentViewer.url}
            />
        </div>
    );
};