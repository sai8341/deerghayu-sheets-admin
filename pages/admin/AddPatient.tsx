import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Input, TextArea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const AddPatient: React.FC = () => {
    const navigate = useNavigate();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const newP = await api.patients.create({
            ...formData,
            age: parseInt(formData.age),
            sex: formData.sex as any,
        });
        setLoading(false);
        navigate(`/admin/patients/${newP.id}`);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">New Patient Registration</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input 
                            label="Registration No" 
                            value={formData.regNo} 
                            onChange={(e) => setFormData({...formData, regNo: e.target.value})}
                            readOnly
                            className="bg-gray-50"
                        />
                         <Input 
                            label="First Visit Date" 
                            type="date"
                            value={formData.firstVisitDate}
                            onChange={(e) => setFormData({...formData, firstVisitDate: e.target.value})}
                        />
                    </div>

                    <Input 
                        label="Full Name" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input 
                            label="Mobile Number" 
                            value={formData.mobile}
                            onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input 
                                label="Age" 
                                type="number"
                                value={formData.age}
                                onChange={(e) => setFormData({...formData, age: e.target.value})}
                                required
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                                <select 
                                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ayur-500"
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
                        label="Address" 
                        rows={3}
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        required
                    />

                    <div className="flex justify-end pt-4">
                        <Button type="button" variant="secondary" className="mr-3" onClick={() => navigate('/admin/dashboard')}>
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