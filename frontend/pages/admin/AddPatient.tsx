import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Input, TextArea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToastStore } from '../../store/toastStore';
import { AlertCircle, UserCheck } from 'lucide-react';

export const AddPatient: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToastStore();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        age: '',
        sex: 'Male',
        address: '',
        regNo: `SD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        firstVisitDate: new Date().toISOString().split('T')[0],
        registration_document: null as File | null
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = 'Patient name is required';
        if (!formData.mobile.match(/^[0-9]{10}$/)) newErrors.mobile = 'Enter a valid 10-digit mobile number';
        if (!formData.age || parseInt(formData.age) < 0 || parseInt(formData.age) > 120) newErrors.age = 'Enter a valid age (0-120)';
        if (!formData.address.trim()) newErrors.address = 'Address is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

            if (!allowedTypes.includes(file.type)) {
                addToast('Invalid file type. Only PDF, JPG, PNG allowed.', 'error');
                e.target.value = ''; // Reset input
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                addToast('File too large. Max 5MB.', 'error');
                e.target.value = ''; // Reset input
                return;
            }

            setFormData({ ...formData, registration_document: file });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            addToast('Please fix the errors in the form.', 'error');
            return;
        }

        setLoading(true);

        try {
            // Check for duplicate mobile
            const existingPatients = await api.patients.search(formData.mobile);
            const exactMatch = existingPatients.find(p => p.mobile === formData.mobile);

            if (exactMatch) {
                addToast('Patient with this mobile number already exists.', 'warning');

                // Show inline warning or toast action (simulated here with confirm)
                // In a real app, a modal or a nicer UI element would be better
                if (window.confirm(`Found existing patient: ${exactMatch.name} (${exactMatch.regNo}). Open their profile instead?`)) {
                    navigate(`/admin/patients/${exactMatch.id}`);
                    return;
                }

                // If they choose to proceed anyway (rare case for shared phones)
                // We'll require a confirmation or just block it. For now, block.
                setLoading(false);
                return;
            }

            const newP = await api.patients.create({
                ...formData,
                age: parseInt(formData.age),
                sex: formData.sex as any,
            });

            addToast('Patient registered successfully!', 'success');
            navigate(`/admin/patients/${newP.id}`);
        } catch (error: any) {
            console.error('Registration Error:', error);

            // Extract detailed error
            if (error.response?.data) {
                const apiErrors = error.response.data;

                if (typeof apiErrors === 'string') {
                    // Display the full error message from the backend
                    // If it's really long (likely HTML), we might truncate it slightly for UI sanity but keep enough to read
                    const msg = apiErrors.length > 500 ? apiErrors.substring(0, 500) + '...' : apiErrors;
                    addToast(`Error: ${msg}`, 'error');
                } else if (typeof apiErrors === 'object') {
                    const messages: string[] = [];
                    Object.keys(apiErrors).forEach(key => {
                        const val = apiErrors[key];
                        const msg = Array.isArray(val) ? val[0] : String(val);
                        const beautifiedKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                        messages.push(`${beautifiedKey}: ${msg}`);
                    });

                    if (messages.length > 0) {
                        addToast(messages[0], 'error');

                        const newFormErrors: Record<string, string> = {};
                        if (apiErrors.mobile) newFormErrors.mobile = Array.isArray(apiErrors.mobile) ? apiErrors.mobile[0] : String(apiErrors.mobile);
                        if (apiErrors.name) newFormErrors.name = Array.isArray(apiErrors.name) ? apiErrors.name[0] : String(apiErrors.name);
                        if (Object.keys(newFormErrors).length > 0) setErrors(prev => ({ ...prev, ...newFormErrors }));
                    } else {
                        addToast('Failed to register patient. Unknown error format.', 'error');
                    }
                } else {
                    addToast('Failed to register patient. Server reported an error.', 'error');
                }
            } else {
                addToast('Failed to register patient. Please check your connection.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="border-b border-gray-100 pb-6 mb-6 flex items-start gap-4">
                    <div className="p-3 bg-ayur-50 rounded-full text-ayur-600">
                        <UserCheck size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">New Patient Registration</h2>
                        <p className="text-gray-500 mt-1">Enter patient details to create a new medical record.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Registration No"
                            value={formData.regNo}
                            onChange={(e) => setFormData({ ...formData, regNo: e.target.value })}
                            readOnly
                            className="bg-gray-50 text-gray-500 cursor-not-allowed font-mono"
                        />
                        <Input
                            label="First Visit Date"
                            type="date"
                            value={formData.firstVisitDate}
                            onChange={(e) => setFormData({ ...formData, firstVisitDate: e.target.value })}
                        />
                    </div>

                    <Input
                        label="Full Name *"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        error={errors.name}
                        placeholder="e.g. Rajesh Kumar"
                        required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Mobile Number *"
                            type="tel"
                            maxLength={10}
                            value={formData.mobile}
                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                            error={errors.mobile}
                            placeholder="10-digit number"
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Age *"
                                type="number"
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                error={errors.age}
                                required
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
                                <select
                                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ayur-500 bg-white"
                                    value={formData.sex}
                                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                                >
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <TextArea
                        label="Address *"
                        rows={3}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        error={errors.address}
                        placeholder="Complete postal address"
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Registration Document (Optional)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-ayur-50 file:text-ayur-700 hover:file:bg-ayur-100 transition-colors"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Upload receipt up to 5 MB (PNG, JPG, JPEG, PDF).</p>
                    </div>

                    {Object.keys(errors).length > 0 && (
                        <div className="flex items-center p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                            <span>Please correct the errors highlighted above.</span>
                        </div>
                    )}

                    <div className="flex justify-end pt-6 border-t border-gray-100 gap-3">
                        <Button type="button" variant="secondary" onClick={() => navigate('/admin/dashboard')}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={loading}>
                            Register Patient
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};