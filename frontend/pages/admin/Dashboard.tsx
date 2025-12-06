import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../services/api';
import { Stat, Patient } from '../../types';
import { Search, UserPlus, Clock, ArrowUpRight, ArrowDownRight, Loader2, X, ChevronRight } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.dashboard.getStats().then(setStats);
  }, []);

  // Handle Search Debounce
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await api.patients.search(searchQuery);
            setSearchResults(res);
        } catch (error) {
            console.error(error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, 400); // 400ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
              setSearchResults([]); // Close dropdown
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const chartData = [
    { name: 'Mon', visits: 12 },
    { name: 'Tue', visits: 19 },
    { name: 'Wed', visits: 15 },
    { name: 'Thu', visits: 22 },
    { name: 'Fri', visits: 28 },
    { name: 'Sat', visits: 35 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="relative overflow-hidden rounded-xl bg-white p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <dt>
              <p className="truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="flex items-baseline pb-1 sm:pb-2">
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
              {item.change && (
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${item.changeType === 'positive' ? 'text-green-600' : item.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'}`}>
                  {item.changeType === 'positive' ? <ArrowUpRight className="h-4 w-4 shrink-0" /> : item.changeType === 'negative' ? <ArrowDownRight className="h-4 w-4 shrink-0" /> : null}
                  {item.change}
                </p>
              )}
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Search & Actions */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative min-h-[300px] flex flex-col" ref={searchContainerRef}>
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Quick Patient Search</h3>
                <p className="text-sm text-gray-500">Find patients by Name, Mobile Number, or Registration ID</p>
            </div>
            
            <div className="relative mb-8">
                <div className="relative">
                    <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Start typing to search..." 
                        className="w-full pl-12 pr-12 py-3 rounded-lg border border-gray-300 focus:border-ayur-500 focus:ring-2 focus:ring-ayur-200 focus:outline-none transition-all shadow-sm text-gray-900"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                            className="absolute right-4 top-3 text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Results Dropdown */}
                {searchQuery && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-80 overflow-y-auto z-50 animate-fade-in-down divide-y divide-gray-50">
                        {isSearching ? (
                            <div className="flex items-center justify-center p-8 text-gray-500">
                                <Loader2 className="h-6 w-6 animate-spin mr-3 text-ayur-600" />
                                <span>Searching database...</span>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <>
                                <div className="p-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Found {searchResults.length} results
                                </div>
                                {searchResults.map(p => (
                                    <Link 
                                        key={p.id} 
                                        to={`/admin/patients/${p.id}`}
                                        className="flex items-center justify-between p-4 hover:bg-ayur-50 transition-colors group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-ayur-100 text-ayur-700 rounded-full flex items-center justify-center font-bold text-lg border border-ayur-200">
                                                {p.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 group-hover:text-ayur-700">{p.name}</p>
                                                <p className="text-xs text-gray-500 font-mono">
                                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{p.regNo}</span> • {p.mobile}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-300 group-hover:text-ayur-600" />
                                    </Link>
                                ))}
                            </>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-gray-900 font-medium">No patients found</p>
                                <p className="text-sm text-gray-500 mb-4">No records match "{searchQuery}"</p>
                                <button 
                                    onClick={() => navigate('/admin/patients/new')}
                                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-ayur-600 hover:bg-ayur-700 shadow-sm"
                                >
                                    <UserPlus className="mr-2 h-4 w-4" /> Register New Patient
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="mt-auto grid grid-cols-2 gap-4">
                <Link to="/admin/patients/new" className="flex flex-col items-center justify-center p-6 bg-ayur-50 rounded-xl border border-dashed border-ayur-200 hover:bg-ayur-100 hover:border-ayur-300 transition-all cursor-pointer group shadow-sm hover:shadow">
                    <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <UserPlus className="h-6 w-6 text-ayur-600" />
                    </div>
                    <span className="font-semibold text-ayur-900">New Registration</span>
                </Link>
                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all cursor-pointer group shadow-sm hover:shadow">
                    <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Clock className="h-6 w-6 text-gray-500" />
                    </div>
                    <span className="font-semibold text-gray-700">Today's Schedule</span>
                </div>
            </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-[300px]">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Patient Visits Trend</h3>
            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                        <Tooltip 
                            cursor={{fill: '#f9fafb'}}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="visits" fill="#81ad2b" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};