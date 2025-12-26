import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { User } from '../../types';
import { Plus, Trash, Edit2, Shield, User as UserIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

export const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const { addToast } = useToastStore();
    const { user: currentUser } = useAuthStore();

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'doctor', // Default
        avatar: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await api.users.getAll();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users");
            addToast('Failed to load users. Are you an admin?', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.name,
                email: user.email,
                password: '', // Don't show password
                role: user.role,
                avatar: user.avatar || ''
            });
        } else {
            setEditingUser(null);
            setFormData({ username: '', email: '', password: '', role: 'doctor', avatar: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                // For update, exclude password if empty
                const payload: any = { ...formData };
                if (!payload.password) delete payload.password;

                await api.users.update(editingUser.id, payload);
                addToast('User updated successfully', 'success');
            } else {
                await api.users.create(formData);
                addToast('User created successfully', 'success');
            }
            fetchUsers();
            setIsModalOpen(false);
        } catch (error) {
            addToast('Failed to save user', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (id === currentUser?.id) {
            addToast("You cannot delete yourself!", 'error');
            return;
        }
        if (!window.confirm("Are you sure? This action cannot be undone.")) return;
        try {
            await api.users.delete(id);
            addToast('User deleted', 'success');
            fetchUsers();
        } catch (error) {
            addToast('Failed to delete user', 'error');
        }
    };

    if (currentUser?.role !== 'admin') {
        return (
            <div className="p-10 text-center text-gray-500">
                <Shield size={48} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
                <p>Only Super Admins can access this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 font-serif">User Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage platform access and roles</p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus size={18} className="mr-2" /> Add New User
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Loading users...</td></tr>
                        ) : users.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            {u.avatar ? (
                                                <img className="h-10 w-10 rounded-full object-cover" src={u.avatar} alt="" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-ayur-100 flex items-center justify-center text-ayur-700 font-bold">
                                                    {u.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                            {u.id === currentUser?.id && <span className="text-xs text-green-600 font-medium">(You)</span>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                            u.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                                    <button onClick={() => handleOpenModal(u)} className="text-blue-600 hover:text-blue-900 group relative">
                                        <Edit2 size={16} />
                                    </button>
                                    {u.id !== currentUser?.id && (
                                        <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-900 ml-2">
                                            <Trash size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "Edit User" : "Add New User"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name / Username</label>
                        <Input
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                            placeholder="e.g. Dr. Sharma"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address (Login ID)</label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            placeholder="email@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password {editingUser && '(Leave blank to keep unchanged)'}</label>
                        <Input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required={!editingUser}
                            placeholder="********"
                            minLength={6}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ayur-200"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="doctor">Doctor</option>
                            <option value="reception">Receptionist</option>
                            <option value="admin">Super Admin</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL (Optional)</label>
                        <Input
                            value={formData.avatar}
                            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Save User</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
