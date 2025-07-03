import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Users, Calendar, FileText, CheckSquare, TrendingUp, 
  Clock, Star, Activity, ArrowUpRight, ArrowDownRight,
  Target, Zap, Brain, MessageSquare, DollarSign
} from 'lucide-react';

interface DashboardStats {
  activeCustomers: number;
  weeklyMeetings: number;
  recentNotes: number;
  pendingTasks: number;
  totalProposals: number;
  wonProposals: number;
  lostProposals: number;
  monthlyCustomers: Array<{
    month: string;
    count: number;
  }>;
  topCustomers: Array<{
    id: number;
    name: string;
    company: string;
    note_count: number;
  }>;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Dashboard stats fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Aktif Müşteriler',
      value: stats?.activeCustomers || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Haftalık Toplantılar',
      value: stats?.weeklyMeetings || 0,
      icon: Calendar,
      color: 'from-emerald-500 to-emerald-600',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'Son Notlar',
      value: stats?.recentNotes || 0,
      icon: FileText,
      color: 'from-amber-500 to-amber-600',
      change: '+15%',
      changeType: 'increase'
    },
    {
      title: 'Bekleyen Görevler',
      value: stats?.pendingTasks || 0,
      icon: CheckSquare,
      color: 'from-rose-500 to-rose-600',
      change: '-5%',
      changeType: 'decrease'
    },
    {
      title: 'Toplam Teklif Tutarı',
      value: `₺${(stats?.totalProposals || 0).toLocaleString('tr-TR')}`,
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      change: '+25%',
      changeType: 'increase'
    },
    {
      title: 'Kazanılan Teklifler',
      value: `₺${(stats?.wonProposals || 0).toLocaleString('tr-TR')}`,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      change: '+18%',
      changeType: 'increase'
    }
  ];

  const mockChartData = [
    { name: 'Pzt', value: 12, customers: 8 },
    { name: 'Sal', value: 19, customers: 12 },
    { name: 'Çar', value: 8, customers: 6 },
    { name: 'Per', value: 15, customers: 10 },
    { name: 'Cum', value: 22, customers: 16 },
    { name: 'Cmt', value: 5, customers: 3 },
    { name: 'Paz', value: 3, customers: 2 }
  ];

  const proposalStatusData = [
    { name: 'Onaylanan', value: stats?.wonProposals || 0, color: '#10B981' },
    { name: 'Bekleyen', value: (stats?.totalProposals || 0) - (stats?.wonProposals || 0) - (stats?.lostProposals || 0), color: '#F59E0B' },
    { name: 'Reddedilen', value: stats?.lostProposals || 0, color: '#EF4444' }
  ];

  const monthlyGrowthData = stats?.monthlyCustomers?.map(item => ({
    name: item.month,
    customers: item.count
  })) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between animate-slide-up">
        <div className="flex-1 min-w-0">
          <h2 className="text-3xl font-bold leading-7 text-gray-900 dark:text-white sm:text-4xl sm:truncate bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h2>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Ajansınızın performansını takip edin ve analiz edin
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Activity className="h-4 w-4" />
            <span>Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, index) => (
          <div 
            key={index} 
            className="relative group animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:scale-105">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {card.value}
                  </p>
                  <div className={`flex items-center mt-2 text-sm font-medium ${
                    card.changeType === 'increase' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {card.changeType === 'increase' ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    <span>{card.change}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-r ${card.color} shadow-lg`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '600ms' }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Haftalık Aktivite Trendi
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Son 7 günün performans analizi
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Notlar</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Müşteriler</span>
                </div>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData}>
                  <defs>
                    <linearGradient id="colorNotes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" className="text-gray-600 dark:text-gray-400" />
                  <YAxis className="text-gray-600 dark:text-gray-400" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgb(31 41 55)', 
                      border: 'none', 
                      borderRadius: '12px',
                      color: 'white',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    fillOpacity={1} 
                    fill="url(#colorNotes)"
                    strokeWidth={3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="customers" 
                    stroke="#10B981" 
                    fillOpacity={1} 
                    fill="url(#colorCustomers)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Proposal Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 animate-slide-up" style={{ animationDelay: '700ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Teklif Durumu
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Teklif başarı oranı
              </p>
            </div>
            <DollarSign className="h-6 w-6 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={proposalStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {proposalStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgb(31 41 55)', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: 'white'
                  }}
                  formatter={(value) => [`₺${value.toLocaleString('tr-TR')}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {proposalStatusData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  ₺{item.value.toLocaleString('tr-TR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Growth */}
      {monthlyGrowthData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 animate-slide-up" style={{ animationDelay: '800ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Aylık Müşteri Büyümesi
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Son 6 ayın müşteri kazanım trendi
              </p>
            </div>
            <TrendingUp className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyGrowthData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" className="text-gray-600 dark:text-gray-400" />
                <YAxis className="text-gray-600 dark:text-gray-400" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgb(31 41 55)', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: 'white',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="customers" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Customers */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 animate-slide-up" style={{ animationDelay: '900ms' }}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                En Aktif Müşteriler
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Son 30 günün etkileşim liderleri
              </p>
            </div>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4 mr-1" />
              Son 30 gün
            </div>
          </div>
        </div>
        <div className="p-6">
          {stats?.topCustomers && stats.topCustomers.length > 0 ? (
            <div className="space-y-4">
              {stats.topCustomers.map((customer, index) => (
                <div key={customer.id} className="group">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 cursor-pointer hover:scale-105">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-sm">
                            {customer.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {customer.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.company}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {customer.note_count}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          etkileşim
                        </div>
                      </div>
                      <Star className="h-5 w-5 text-amber-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Henüz etkileşim verisi yok
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Müşterilerle etkileşime geçmeye başlayın
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};