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
        firstVisitDate: new Date().toISOString().split('T')[0]
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
        } catch (error) {
            console.error(error);
            addToast('Failed to register patient. Please try again.', 'error');
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
                            onChange={(e) => setFormData({...formData, regNo: e.target.value})}
                            readOnly
                            className="bg-gray-50 text-gray-500 cursor-not-allowed font-mono"
                        />
                         <Input 
                            label="First Visit Date" 
                            type="date"
                            value={formData.firstVisitDate}
                            onChange={(e) => setFormData({...formData, firstVisitDate: e.target.value})}
                        />
                    </div>

                    <Input 
                        label="Full Name *" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                            onChange={(e) => setFormData({...formData, mobile: e.target.value.replace(/\D/g,'')})}
                            error={errors.mobile}
                            placeholder="10-digit number"
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input 
                                label="Age *" 
                                type="number"
                                value={formData.age}
                                onChange={(e) => setFormData({...formData, age: e.target.value})}
                                error={errors.age}
                                required
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
                                <select 
                                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ayur-500 bg-white"
                                    value={formData.sex}
                                    onChange={(e) => setFormData({...formData, sex: e.target.value})}
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
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        error={errors.address}
                        placeholder="Complete postal address"
                        required
                    />

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