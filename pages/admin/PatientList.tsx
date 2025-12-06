import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Patient } from '../../types';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '../../components/ui/Input';

export const PatientList: React.FC = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        const fetchPatients = async () => {
            setLoading(true);
            const data = await api.patients.search(query);
            setPatients(data);
            setLoading(false);
        };
        const debounce = setTimeout(fetchPatients, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900">All Patients</h2>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder="Search..." 
                        className="pl-9 py-2 text-sm"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age/Sex</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                             <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td></tr>
                        ) : patients.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No patients found.</td></tr>
                        ) : (
                            patients.map((patient) => (
                                <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{patient.regNo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.mobile}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.age} / {patient.sex}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.firstVisitDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Link to={`/admin/patients/${patient.id}`} className="text-ayur-600 hover:text-ayur-900">View</Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};