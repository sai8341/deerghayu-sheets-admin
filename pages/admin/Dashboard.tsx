import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Stat, Patient } from '../../types';
import { Search, UserPlus, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    api.dashboard.getStats().then(setStats);
  }, []);

  // Debounced search effect would go here in prod, simplified for demo
  useEffect(() => {
    const doSearch = async () => {
        if (!searchQuery) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        const res = await api.patients.search(searchQuery);
        setSearchResults(res);
        setIsSearching(false);
    };
    const timeout = setTimeout(doSearch, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

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
          <div key={item.name} className="relative overflow-hidden rounded-xl bg-white p-5 shadow-sm border border-gray-100">
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
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Patient Search</h3>
            <div className="relative mb-6">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input 
                    placeholder="Search by Name, Mobile, or Reg No..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {searchQuery && (
                <div className="bg-gray-50 rounded-lg p-2 max-h-60 overflow-y-auto">
                    {isSearching ? (
                        <p className="text-sm text-gray-500 p-2">Searching...</p>
                    ) : searchResults.length > 0 ? (
                        <div className="space-y-2">
                            {searchResults.map(p => (
                                <Link 
                                    key={p.id} 
                                    to={`/admin/patients/${p.id}`}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-ayur-300 hover:shadow-sm transition-all"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">{p.name}</p>
                                        <p className="text-xs text-gray-500">{p.mobile} • {p.regNo}</p>
                                    </div>
                                    <div className="text-ayur-600">
                                        <ArrowUpRight size={18} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 p-2">No patients found.</p>
                    )}
                </div>
            )}
            
            {!searchQuery && (
                <div className="grid grid-cols-2 gap-4 mt-8">
                    <Link to="/admin/patients/new" className="flex flex-col items-center justify-center p-6 bg-ayur-50 rounded-xl border border-dashed border-ayur-200 hover:bg-ayur-100 transition-colors cursor-pointer group">
                        <UserPlus className="h-8 w-8 text-ayur-600 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="font-medium text-ayur-800">New Registration</span>
                    </Link>
                    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer group">
                        <Clock className="h-8 w-8 text-gray-500 mb-2" />
                        <span className="font-medium text-gray-700">Today's Schedule</span>
                    </div>
                </div>
            )}
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Patient Visits Trend</h3>
            <div className="flex-1 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                        <Tooltip 
                            cursor={{fill: '#f3f4f6'}}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="visits" fill="#81ad2b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};