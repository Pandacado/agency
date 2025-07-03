import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import jsPDF from 'jspdf';
import { 
  Plus, FileText, DollarSign, Calendar, User, Building2, 
  X, Check, AlertCircle, Download, Send, Trash2, Edit,
  Package, Calculator, Star, Sparkles, Target, Zap
} from 'lucide-react';

interface Proposal {
  id: number;
  customer_id: number;
  title: string;
  description: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  valid_until: string;
  customer_name: string;
  company: string;
  user_name: string;
  created_at: string;
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  company: string;
}

interface Service {
  id: number;
  name: string;
  default_price: number;
}

interface ProposalFormData {
  customer_id: number;
  title: string;
  description: string;
  valid_until: string;
  items: Array<{
    service_id: number;
    description: string;
    quantity: number;
    unit_price: number;
  }>;
}

export const Proposals: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, control, watch } = useForm<ProposalFormData>({
    defaultValues: {
      items: [{ service_id: 0, description: '', quantity: 1, unit_price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');

  useEffect(() => {
    fetchProposals();
    fetchCustomers();
    fetchServices();
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await axios.get('/api/proposals');
      setProposals(response.data);
    } catch (error) {
      toast.error('Teklifler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Customers fetch error:', error);
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

  const openModal = () => {
    reset({
      items: [{ service_id: 0, description: '', quantity: 1, unit_price: 0 }]
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const onSubmit = async (data: ProposalFormData) => {
    try {
      const response = await axios.post('/api/proposals', data);
      setProposals(prev => [response.data, ...prev]);
      toast.success('Teklif oluşturuldu', {
        icon: '🎉',
        style: { borderRadius: '16px', background: '#10B981', color: '#fff', fontFamily: 'Poppins' }
      });
      closeModal();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Teklif oluşturulurken hata oluştu');
    }
  };

  const updateProposalStatus = async (proposalId: number, status: Proposal['status']) => {
    try {
      await axios.put(`/api/proposals/${proposalId}/status`, { status });
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status } : p));
      
      const statusText = status === 'approved' ? 'onaylandı' : status === 'rejected' ? 'reddedildi' : 'beklemeye alındı';
      toast.success(`Teklif ${statusText}`, {
        icon: status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '⏳',
        style: { fontFamily: 'Poppins' }
      });
    } catch (error) {
      toast.error('Durum güncellenirken hata oluştu');
    }
  };

  const generatePDF = async (proposal: Proposal) => {
    try {
      const pdf = new jsPDF();
      
      // Set font
      pdf.setFont('helvetica');
      
      // Header
      pdf.setFontSize(24);
      pdf.setTextColor(59, 130, 246); // Blue color
      pdf.text('TEKLIF FORMU', 20, 30);
      
      // Company info
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Agency CRM Ultimate', 20, 45);
      pdf.text('Dijital Ajans Hizmetleri', 20, 55);
      pdf.text('info@agency.com | +90 555 123 45 67', 20, 65);
      
      // Line separator
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(59, 130, 246);
      pdf.line(20, 75, 190, 75);
      
      // Proposal details
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Teklif No: #${proposal.id}`, 20, 90);
      pdf.text(`Müşteri: ${proposal.customer_name}`, 20, 105);
      if (proposal.company) {
        pdf.text(`Şirket: ${proposal.company}`, 20, 120);
      }
      pdf.text(`Tarih: ${new Date(proposal.created_at).toLocaleDateString('tr-TR')}`, 20, 135);
      
      // Proposal title
      pdf.setFontSize(16);
      pdf.setTextColor(59, 130, 246);
      pdf.text(proposal.title, 20, 155);
      
      // Description
      if (proposal.description) {
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        const splitDescription = pdf.splitTextToSize(proposal.description, 170);
        pdf.text(splitDescription, 20, 170);
      }
      
      // Total amount
      pdf.setFontSize(18);
      pdf.setTextColor(16, 185, 129); // Green color
      pdf.text(`Toplam Tutar: ₺${proposal.total_amount.toLocaleString('tr-TR')}`, 20, 220);
      
      // Valid until
      if (proposal.valid_until) {
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Geçerlilik Tarihi: ${new Date(proposal.valid_until).toLocaleDateString('tr-TR')}`, 20, 240);
      }
      
      // Footer
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Bu teklif Agency CRM Ultimate tarafından oluşturulmuştur.', 20, 270);
      
      // Save PDF
      pdf.save(`Teklif-${proposal.id}-${proposal.customer_name}.pdf`);
      
      toast.success('PDF başarıyla indirildi!', {
        icon: '📄',
        style: { borderRadius: '16px', background: '#3B82F6', color: '#fff', fontFamily: 'Poppins' }
      });
    } catch (error) {
      toast.error('PDF oluşturulurken hata oluştu');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'from-emerald-500 to-emerald-600 text-white';
      case 'rejected': return 'from-red-500 to-red-600 text-white';
      case 'pending': return 'from-amber-500 to-amber-600 text-white';
      default: return 'from-gray-500 to-gray-600 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Onaylandı';
      case 'rejected': return 'Reddedildi';
      case 'pending': return 'Bekliyor';
      default: return status;
    }
  };

  const calculateTotal = () => {
    return watchedItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const handleServiceChange = (index: number, serviceId: number) => {
    const service = services.find(s => s.id === parseInt(serviceId.toString()));
    if (service) {
      const currentItems = watchedItems;
      currentItems[index].unit_price = service.default_price;
      currentItems[index].description = service.name;
    }
  };

  const getServiceExamples = () => {
    return [
      { name: 'Web Tasarım', count: '1 Adet', price: '₺5,000' },
      { name: 'SEO Optimizasyonu', count: '3 Ay', price: '₺3,000' },
      { name: 'Sosyal Medya Yönetimi', count: '6 Ay', price: '₺12,000' },
      { name: 'Logo Tasarım', count: '1 Adet', price: '₺1,000' }
    ];
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
                <FileText className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Teklifler
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-2 font-medium">
                  Müşteri tekliflerinizi oluşturun ve takip edin
                </p>
              </div>
            </div>
            <div className="mt-6 sm:mt-0">
              <button
                onClick={openModal}
                className="modern-button-primary"
              >
                <Plus className="h-5 w-5 mr-3" />
                Yeni Teklif
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <div className="text-center py-20 modern-card animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-float">
            <FileText className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Henüz teklif yok</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg">
            İlk teklifinizi oluşturarak başlayın
          </p>
          <button
            onClick={openModal}
            className="modern-button-primary"
          >
            <Plus className="h-5 w-5 mr-3" />
            Yeni Teklif
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {proposals.map((proposal, index) => (
            <div
              key={proposal.id}
              className="group relative modern-card overflow-hidden animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative p-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {proposal.title}
                      </h3>
                      <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full bg-gradient-to-r ${getStatusColor(proposal.status)} shadow-lg`}>
                        {getStatusText(proposal.status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-8 text-base text-gray-500 dark:text-gray-400 mb-6">
                      <div className="flex items-center font-semibold">
                        <User className="h-5 w-5 mr-2" />
                        {proposal.customer_name}
                      </div>
                      {proposal.company && (
                        <div className="flex items-center font-semibold">
                          <Building2 className="h-5 w-5 mr-2" />
                          {proposal.company}
                        </div>
                      )}
                      <div className="flex items-center font-semibold">
                        <Calendar className="h-5 w-5 mr-2" />
                        {new Date(proposal.created_at).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                    
                    {proposal.description && (
                      <p className="text-base text-gray-600 dark:text-gray-300 mb-6 font-medium">
                        {proposal.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mr-2" />
                        <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                          ₺{proposal.total_amount.toLocaleString('tr-TR')}
                        </span>
                      </div>
                      
                      {proposal.valid_until && (
                        <div className="text-base text-gray-500 dark:text-gray-400 font-semibold">
                          Geçerlilik: {new Date(proposal.valid_until).toLocaleDateString('tr-TR')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-3 ml-8">
                    {proposal.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateProposalStatus(proposal.id, 'approved')}
                          className="inline-flex items-center px-5 py-3 text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-800 transition-all duration-300 hover:scale-105 shadow-sm"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Onayla
                        </button>
                        <button
                          onClick={() => updateProposalStatus(proposal.id, 'rejected')}
                          className="inline-flex items-center px-5 py-3 text-sm font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900 rounded-2xl hover:bg-red-100 dark:hover:bg-red-800 transition-all duration-300 hover:scale-105 shadow-sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reddet
                        </button>
                      </>
                    )}
                    
                    <button 
                      onClick={() => generatePDF(proposal)}
                      className="inline-flex items-center px-5 py-3 text-sm font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-800 transition-all duration-300 hover:scale-105 shadow-sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF İndir
                    </button>
                    
                    <button className="inline-flex items-center px-5 py-3 text-sm font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900 rounded-2xl hover:bg-purple-100 dark:hover:bg-purple-800 transition-all duration-300 hover:scale-105 shadow-sm">
                      <Send className="h-4 w-4 mr-2" />
                      E-posta Gönder
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm animate-fade-in" 
              onClick={closeModal}
            ></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-3xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full sm:p-8 border border-gray-100 dark:border-gray-700 animate-bounce-in">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mr-4">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Yeni Teklif Oluştur
                    </h3>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">
                      Müşteriniz için profesyonel bir teklif hazırlayın
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all duration-200"
                >
                  <X className="h-8 w-8" />
                </button>
              </div>

              {/* Service Examples */}
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-3xl">
                <div className="flex items-center mb-4">
                  <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                    Örnek Hizmetler ve Fiyatlar
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {getServiceExamples().map((example, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600">
                      <h5 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                        {example.name}
                      </h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {example.count}
                      </p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {example.price}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Müşteri *
                    </label>
                    <select
                      {...register('customer_id', { required: 'Müşteri seçimi gerekli' })}
                      className="modern-select"
                    >
                      <option value="">Müşteri seçin</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.first_name} {customer.last_name} {customer.company && `- ${customer.company}`}
                        </option>
                      ))}
                    </select>
                    {errors.customer_id && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{errors.customer_id.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Geçerlilik Tarihi
                    </label>
                    <input
                      type="date"
                      {...register('valid_until')}
                      className="modern-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Teklif Başlığı *
                  </label>
                  <input
                    {...register('title', { required: 'Başlık gerekli' })}
                    className="modern-input"
                    placeholder="Örn: Kurumsal Web Sitesi ve Dijital Pazarlama Paketi"
                  />
                  {errors.title && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Teklif Açıklaması
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="modern-textarea"
                    placeholder="Teklif detaylarını ve kapsamını açıklayın..."
                  />
                </div>

                {/* Proposal Items */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <Package className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
                      <label className="block text-xl font-bold text-gray-700 dark:text-gray-300">
                        Hizmetler ve Fiyatlandırma *
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => append({ service_id: 0, description: '', quantity: 1, unit_price: 0 })}
                      className="inline-flex items-center px-5 py-3 text-sm font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-800 transition-all duration-300 hover:scale-105 shadow-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Hizmet Ekle
                    </button>
                  </div>

                  <div className="space-y-6">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="modern-card p-6 animate-slide-up border-l-4 border-blue-500"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                          <div className="lg:col-span-4">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                              Hizmet Türü
                            </label>
                            <select
                              {...register(`items.${index}.service_id` as const, { required: 'Hizmet seçimi gerekli' })}
                              onChange={(e) => handleServiceChange(index, parseInt(e.target.value))}
                              className="modern-select"
                            >
                              <option value="">Hizmet seçin</option>
                              {services.map(service => (
                                <option key={service.id} value={service.id}>
                                  {service.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="lg:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                              Miktar/Adet
                            </label>
                            <input
                              type="number"
                              min="1"
                              {...register(`items.${index}.quantity` as const, { required: 'Miktar gerekli', min: 1 })}
                              placeholder="1"
                              className="modern-input text-center"
                            />
                          </div>

                          <div className="lg:col-span-3">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                              Birim Fiyat (₺)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              {...register(`items.${index}.unit_price` as const, { required: 'Fiyat gerekli', min: 0 })}
                              placeholder="0.00"
                              className="modern-input"
                            />
                          </div>

                          <div className="lg:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                              Toplam
                            </label>
                            <div className="modern-input bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                              <Calculator className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-2" />
                              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                ₺{((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unit_price || 0)).toLocaleString('tr-TR')}
                              </span>
                            </div>
                          </div>

                          <div className="lg:col-span-1 flex justify-center">
                            {fields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-2xl transition-all duration-300 hover:scale-110 shadow-sm"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-6">
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                            Hizmet Açıklaması
                          </label>
                          <textarea
                            {...register(`items.${index}.description` as const)}
                            rows={2}
                            className="modern-textarea"
                            placeholder="Bu hizmetin detaylarını açıklayın..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Summary */}
                  <div className="mt-8 p-8 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-3xl border-2 border-emerald-200 dark:border-emerald-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Target className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mr-4" />
                        <div>
                          <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Toplam Teklif Tutarı
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            KDV dahil toplam fiyat
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                          ₺{calculateTotal().toLocaleString('tr-TR')}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {fields.length} hizmet kalemi
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 dark:border-gray-700">
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
                    <Zap className="h-5 w-5 mr-3" />
                    Teklif Oluştur
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