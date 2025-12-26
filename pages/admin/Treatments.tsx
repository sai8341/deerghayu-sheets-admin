import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Treatment } from '../../types';
import { Plus, Trash, Edit2, X, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToastStore } from '../../store/toastStore';

export const Treatments: React.FC = () => {
    const [treatments, setTreatments] = useState<Treatment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
    const { addToast } = useToastStore();

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image: ''
    });

    useEffect(() => {
        fetchTreatments();
    }, []);

    const fetchTreatments = async () => {
        setLoading(true);
        try {
            const data = await api.treatments.getAll();
            setTreatments(data);
        } catch (error) {
            console.error("Failed to fetch treatments");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (treatment?: Treatment) => {
        if (treatment) {
            setEditingTreatment(treatment);
            setFormData({
                title: treatment.title,
                description: treatment.description,
                image: treatment.image || ''
            });
        } else {
            setEditingTreatment(null);
            setFormData({ title: '', description: '', image: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTreatment) {
                await api.treatments.update(editingTreatment.id, formData);
                addToast('Treatment updated successfully', 'success');
            } else {
                await api.treatments.create(formData);
                addToast('Treatment added successfully', 'success');
            }
            fetchTreatments();
            setIsModalOpen(false);
        } catch (error) {
            addToast('Failed to save treatment', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.treatments.delete(id);
            addToast('Treatment deleted', 'success');
            fetchTreatments();
        } catch (error) {
            addToast('Failed to delete', 'error');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 font-serif">Treatments & Services</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage Ayurvedic treatment offerings</p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus size={18} className="mr-2" /> Add Treatment
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-20 text-gray-500">Loading treatments...</div>
                ) : treatments.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No treatments found. Add one to get started.</p>
                    </div>
                ) : (
                    treatments.map(t => (
                        <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                            <div className="h-40 bg-gray-100 relative">
                                {t.image ? (
                                    <img src={t.image} alt={t.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-serif text-3xl font-bold bg-ayur-50">
                                        {t.title.charAt(0)}
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(t)} className="p-2 bg-white rounded-full shadow-sm hover:bg-ayur-50 text-gray-600">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(t.id)} className="p-2 bg-white rounded-full shadow-sm hover:bg-red-50 text-red-500">
                                        <Trash size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-lg text-gray-900 mb-2">{t.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{t.description}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTreatment ? "Edit Treatment" : "New Treatment"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Title</label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            placeholder="e.g. Panchakarma"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ayur-200"
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            placeholder="Describe the treatment..."
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                        <Input
                            value={formData.image}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit"><Save size={16} className="mr-2" /> Save Treatment</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
