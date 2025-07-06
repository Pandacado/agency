import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { 
  Plus, Search, Filter, Grid, List, Edit, Trash2, 
  MessageSquare, Phone, Mail, Globe, Instagram,
  X, User, Building2, Sparkles, Star, TrendingUp, Brain,
  Zap, Target, AlertCircle, CheckCircle
} from 'lucide-react';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  instagram: string;
  website: string;
  status: 'active' | 'inactive' | 'potential';
  avatar?: string;
  last_interaction?: string;
  customer_type?: 'cold' | 'warm' | 'hot';
  potential_budget?: number;
  sales_difficulty_score?: number;
  interested_services?: string;
  ai_analysis_date?: string;
  services?: string;
  created_at: string;
  updated_at: string;
}

interface Service {
  id: number;
  name: string;
}

interface CustomerFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  instagram: string;
  website: string;
  status: 'active' | 'inactive' | 'potential';
  services: number[];
}

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [analyzingCustomer, setAnalyzingCustomer] = useState<number | null>(null);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<CustomerFormData>();

  useEffect(() => {
    fetchCustomers();
    fetchServices();
  }, [searchTerm, statusFilter]);

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await axios.get(`/api/customers?${params.toString()}`);
      setCustomers(response.data);
    } catch (error) {
      toast.error('Müşteriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/services');
      setServices(response.data);
    } catch (error) {
      console.error('Services fetch error:', error);
    }
  };

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      Object.keys(customer).forEach(key => {
        if (key === 'services') {
          // Parse services for multi-select
          const customerServices = customer.services ? customer.services.split(',') : [];
          const serviceIds = services.filter(s => customerServices.includes(s.name)).map(s => s.id);
          setSelectedServices(serviceIds);
        } else {
          setValue(key as keyof CustomerFormData, customer[key as keyof Customer] as any);
        }
      });
    } else {
      setEditingCustomer(null);
      setSelectedServices([]);
      reset();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setSelectedServices([]);
    reset();
  };

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const onSubmit = async (data: CustomerFormData) => {
    try {
      const submitData = { ...data, services: selectedServices };
      
      if (editingCustomer) {
        const response = await axios.put(`/api/customers/${editingCustomer.id}`, submitData);
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? response.data : c));
        toast.success('Müşteri güncellendi', {
          icon: '✅',
          style: { borderRadius: '16px', background: '#10B981', color: '#fff', fontFamily: 'Poppins' }
        });
      } else {
        const response = await axios.post('/api/customers', submitData);
        setCustomers(prev => [response.data, ...prev]);
        toast.success('Müşteri eklendi', {
          icon: '🎉',
          style: { borderRadius: '16px', background: '#10B981', color: '#fff', fontFamily: 'Poppins' }
        });
      }
      closeModal();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Bir hata oluştu');
    }
  };

  const deleteCustomer = async (id: number) => {
    if (!confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return;
    
    try {
      await axios.delete(`/api/customers/${id}`);
      setCustomers(prev => prev.filter(c => c.id !== id));
      toast.success('Müşteri silindi', {
        icon: '🗑️',
        style: { borderRadius: '16px', background: '#EF4444', color: '#fff', fontFamily: 'Poppins' }
      });
    } catch (error) {
      toast.error('Müşteri silinirken hata oluştu');
    }
  };

  const analyzeCustomer = async (customerId: number) => {
    setAnalyzingCustomer(customerId);
    try {
      const response = await axios.post(`/api/customers/${customerId}/analyze`);
      
      // Update customer in state
      setCustomers(prev => prev.map(c => 
        c.id === customerId 
          ? { 
              ...c, 
              customer_type: response.data.customer_type,
              interested_services: response.data.interested_services,
              potential_budget: response.data.potential_budget,
              sales_difficulty_score: response.data.sales_difficulty_score,
              ai_analysis_date: new Date().toISOString()
            }
          : c
      ));

      toast.success('AI analizi tamamlandı!', {
        icon: '🧠',
        style: { borderRadius: '16px', background: '#8B5CF6', color: '#fff', fontFamily: 'Poppins' }
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'AI analizi başarısız');
    } finally {
      setAnalyzingCustomer(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'from-emerald-500 to-emerald-600 text-white';
      case 'inactive': return 'from-red-500 to-red-600 text-white';
      case 'potential': return 'from-amber-500 to-amber-600 text-white';
      default: return 'from-gray-500 to-gray-600 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'inactive': return 'Pasif';
      case 'potential': return 'Potansiyel';
      default: return status;
    }
  };

  const getCustomerTypeColor = (type?: string) => {
    switch (type) {
      case 'hot': return 'from-red-500 to-red-600 text-white';
      case 'warm': return 'from-orange-500 to-orange-600 text-white';
      case 'cold': return 'from-blue-500 to-blue-600 text-white';
      default: return 'from-gray-500 to-gray-600 text-white';
    }
  };

  const getCustomerTypeText = (type?: string) => {
    switch (type) {
      case 'hot': return 'Sıcak';
      case 'warm': return 'Ilık';
      case 'cold': return 'Soğuk';
      default: return 'Belirsiz';
    }
  };

  const formatInstagramHandle = (instagram: string) => {
    if (!instagram) return '';
    return instagram.startsWith('@') ? instagram : `@${instagram}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-poppins">
      {/* Header */}
      <div className="relative animate-slide-up">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 rounded-3xl blur-3xl opacity-10"></div>
        <div className="relative modern-card p-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl shadow-lg animate-float">
                <User className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Müşteriler
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-2 font-medium">
                  Tüm müşterilerinizi yönetin ve AI ile analiz edin
                </p>
              </div>
            </div>
            <div className="mt-6 sm:mt-0">
              <button
                onClick={() => openModal()}
                className="modern-button-primary"
              >
                <Plus className="h-5 w-5 mr-3" />
                Yeni Müşteri
              </button>
            </div>
          </div>
        </div>
      </div>

  {/* Filters and Search */}
<div className="modern-card p-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
  <div className="flex flex-col lg:flex-row gap-6">
    <div className="flex-1">
      <div className="relative">
        <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        
        <input
          type="text"
          placeholder="Ad, soyad, e-posta veya şirket ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          // 1. Adım: pl-14 sınıfını buradan kaldırıyoruz
          className="modern-input" 
          // 2. Adım: Doğrudan style özelliğini ekliyoruz
          style={{ paddingLeft: '3.5rem' }} 
        />
      </div>
    </div>
    
          
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="modern-select min-w-[180px]"
            >
              <option value="">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="potential">Potansiyel</option>
              <option value="inactive">Pasif</option>
            </select>

            <div className="flex border-2 border-gray-200 dark:border-gray-600 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-4 transition-all duration-300 ${viewMode === 'grid' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-4 transition-all duration-300 ${viewMode === 'list' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer List */}
      {customers.length === 0 ? (
        <div className="text-center py-20 modern-card animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-float">
            <User className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Müşteri bulunamadı</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg">
            {searchTerm || statusFilter ? 'Arama kriterlerinize uygun müşteri bulunamadı.' : 'İlk müşterinizi ekleyerek başlayın.'}
          </p>
          {!searchTerm && !statusFilter && (
            <button
              onClick={() => openModal()}
              className="modern-button-primary"
            >
              <Plus className="h-5 w-5 mr-3" />
              Yeni Müşteri
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'
          : 'space-y-6'
        }>
          {customers.map((customer, index) => (
            <div 
              key={customer.id} 
              className={`group relative modern-card overflow-hidden animate-slide-up ${
                viewMode === 'list' ? 'p-8' : 'p-8'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {viewMode === 'grid' ? (
                // Grid Card View
                <div className="relative text-center">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-bold text-2xl">
                      {customer.first_name[0]}{customer.last_name[0]}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {customer.first_name} {customer.last_name}
                  </h3>
                  
                  {customer.company && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center justify-center font-medium">
                      <Building2 className="h-4 w-4 mr-2" />
                      {customer.company}
                    </p>
                  )}
                  
                  <div className="flex justify-center space-x-3 mb-6">
                    <span className={`inline-flex px-4 py-2 text-xs font-bold rounded-full bg-gradient-to-r ${getStatusColor(customer.status)} shadow-lg`}>
                      {getStatusText(customer.status)}
                    </span>
                    
                    {customer.customer_type && (
                      <span className={`inline-flex px-4 py-2 text-xs font-bold rounded-full bg-gradient-to-r ${getCustomerTypeColor(customer.customer_type)} shadow-lg`}>
                        {getCustomerTypeText(customer.customer_type)}
                      </span>
                    )}
                  </div>
                  
                  {/* Instagram Handle */}
                  {customer.instagram && (
                    <div className="mb-6">
                      <span className="inline-flex items-center px-4 py-2 text-sm font-semibold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900 rounded-full shadow-sm">
                        <Instagram className="h-4 w-4 mr-2" />
                        {formatInstagramHandle(customer.instagram)}
                      </span>
                    </div>
                  )}

                  {/* AI Analysis Info */}
                  {customer.ai_analysis_date && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 rounded-2xl">
                      <div className="flex items-center justify-center mb-3">
                        <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">AI Analizi</span>
                      </div>
                      {customer.potential_budget && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                          <strong>Bütçe:</strong> ₺{customer.potential_budget.toLocaleString('tr-TR')}
                        </p>
                      )}
                      {customer.sales_difficulty_score && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <strong>Zorluk:</strong> {customer.sales_difficulty_score}/10
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-center space-x-3 mb-6">
                    {customer.email && (
                      <a href={`mailto:${customer.email}`} className="p-3 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900 transition-all duration-300 hover:scale-110 shadow-sm">
                        <Mail className="h-5 w-5" />
                      </a>
                    )}
                    {customer.phone && (
                      <a href={`tel:${customer.phone}`} className="p-3 text-gray-400 hover:text-green-600 dark:hover:text-green-400 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-green-50 dark:hover:bg-green-900 transition-all duration-300 hover:scale-110 shadow-sm">
                        <Phone className="h-5 w-5" />
                      </a>
                    )}
                    {customer.website && (
                      <a href={customer.website} target="_blank" rel="noopener noreferrer" className="p-3 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-900 transition-all duration-300 hover:scale-110 shadow-sm">
                        <Globe className="h-5 w-5" />
                      </a>
                    )}
                    {customer.instagram && (
                      <a href={`https://instagram.com/${customer.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-3 text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-pink-50 dark:hover:bg-pink-900 transition-all duration-300 hover:scale-110 shadow-sm">
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                  
                  <div className="flex justify-center space-x-3 mb-4">
                    <Link
                      to={`/customers/${customer.id}/notes`}
                      className="inline-flex items-center px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-800 transition-all duration-300 hover:scale-105 shadow-sm"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Notlar
                    </Link>
                    
                    <button
                      onClick={() => openModal(customer)}
                      className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 hover:scale-105 shadow-sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Düzenle
                    </button>
                  </div>

                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => analyzeCustomer(customer.id)}
                      disabled={analyzingCustomer === customer.id}
                      className="inline-flex items-center px-4 py-2 text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900 rounded-2xl hover:bg-purple-100 dark:hover:bg-purple-800 transition-all duration-300 hover:scale-105 disabled:opacity-50 shadow-sm"
                    >
                      {analyzingCustomer === customer.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                      ) : (
                        <Brain className="h-4 w-4 mr-2" />
                      )}
                      AI Analiz
                    </button>
                    
                    <button
                      onClick={() => deleteCustomer(customer.id)}
                      className="inline-flex items-center px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900 rounded-2xl hover:bg-red-100 dark:hover:bg-red-800 transition-all duration-300 hover:scale-105 shadow-sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Sil
                    </button>
                  </div>
                </div>
              ) : (
                // List View
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mr-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white font-bold text-xl">
                        {customer.first_name[0]}{customer.last_name[0]}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {customer.first_name} {customer.last_name}
                      </h3>
                      <div className="flex items-center space-x-6 text-base text-gray-500 dark:text-gray-400 mt-2">
                        {customer.email && <span className="font-medium">{customer.email}</span>}
                        {customer.company && (
                          <span className="flex items-center font-medium">
                            <Building2 className="h-4 w-4 mr-2" />
                            {customer.company}
                          </span>
                        )}
                        {customer.instagram && (
                          <span className="flex items-center text-pink-600 dark:text-pink-400 font-semibold">
                            <Instagram className="h-4 w-4 mr-2" />
                            {formatInstagramHandle(customer.instagram)}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center space-x-3">
                        <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full bg-gradient-to-r ${getStatusColor(customer.status)} shadow-sm`}>
                          {getStatusText(customer.status)}
                        </span>
                        {customer.customer_type && (
                          <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full bg-gradient-to-r ${getCustomerTypeColor(customer.customer_type)} shadow-sm`}>
                            {getCustomerTypeText(customer.customer_type)}
                          </span>
                        )}
                        {customer.ai_analysis_date && (
                          <span className="inline-flex items-center px-3 py-1 text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900 rounded-full">
                            <Brain className="h-4 w-4 mr-2" />
                            AI Analizi Yapıldı
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Link
                      to={`/customers/${customer.id}/notes`}
                      className="inline-flex items-center px-5 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-800 transition-all duration-300 hover:scale-105 shadow-sm"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Notlar
                    </Link>
                    
                    <button
                      onClick={() => analyzeCustomer(customer.id)}
                      disabled={analyzingCustomer === customer.id}
                      className="inline-flex items-center px-5 py-3 text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900 rounded-2xl hover:bg-purple-100 dark:hover:bg-purple-800 transition-all duration-300 hover:scale-105 disabled:opacity-50 shadow-sm"
                    >
                      {analyzingCustomer === customer.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                      ) : (
                        <Brain className="h-4 w-4 mr-2" />
                      )}
                      AI Analiz
                    </button>
                    
                    <button
                      onClick={() => openModal(customer)}
                      className="inline-flex items-center px-5 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 hover:scale-105 shadow-sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Düzenle
                    </button>
                    
                    <button
                      onClick={() => deleteCustomer(customer.id)}
                      className="inline-flex items-center px-5 py-3 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900 rounded-2xl hover:bg-red-100 dark:hover:bg-red-800 transition-all duration-300 hover:scale-105 shadow-sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Sil
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm animate-fade-in" onClick={closeModal}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-3xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-8 border border-gray-100 dark:border-gray-700 animate-bounce-in">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mr-4">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {editingCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri'}
                  </h3>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Ad *
                    </label>
                    <input
                      {...register('first_name', { required: 'Ad gerekli' })}
                      className="modern-input"
                      placeholder="Adınızı girin"
                    />
                    {errors.first_name && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{errors.first_name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Soyad *
                    </label>
                    <input
                      {...register('last_name', { required: 'Soyad gerekli' })}
                      className="modern-input"
                      placeholder="Soyadınızı girin"
                    />
                    {errors.last_name && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    E-posta
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="modern-input"
                    placeholder="ornek@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Telefon
                  </label>
                  <input
                    {...register('phone')}
                    className="modern-input"
                    placeholder="+90 555 123 45 67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Şirket
                  </label>
                  <input
                    {...register('company')}
                    className="modern-input"
                    placeholder="Şirket adı"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">
                    İlgilendiği Hizmetler
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {services.map((service) => (
                      <label
                        key={service.id}
                        className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.id)}
                          onChange={() => handleServiceToggle(service.id)}
                          className="modern-checkbox mr-3"
                        />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {service.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Instagram
                    </label>
                    <input
                      {...register('instagram')}
                      placeholder="@username"
                      className="modern-input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Web Sitesi
                    </label>
                    <input
                      {...register('website')}
                      placeholder="https://example.com"
                      className="modern-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Durum
                  </label>
                  <select
                    {...register('status')}
                    className="modern-select"
                  >
                    <option value="potential">Potansiyel</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-8">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="modern-button-secondary"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="modern-button-primary"
                  >
                    {editingCustomer ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};