import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { 
  Plus, Receipt, DollarSign, Calendar, User, Building2, 
  X, TrendingDown, TrendingUp, BarChart3
} from 'lucide-react';

interface Expense {
  id: number;
  customer_id?: number;
  proposal_id?: number;
  title: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  customer_name?: string;
  proposal_title?: string;
  created_at: string;
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  company: string;
}

interface Proposal {
  id: number;
  title: string;
  customer_name: string;
}

interface ExpenseFormData {
  customer_id?: number;
  proposal_id?: number;
  title: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
}

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ExpenseFormData>();

  const categories = [
    'Freelance Ücret',
    'Reklam Bütçesi',
    'Yazılım Lisansı',
    'Hosting',
    'Domain',
    'Tasarım Araçları',
    'Diğer'
  ];

  useEffect(() => {
    fetchExpenses();
    fetchCustomers();
    fetchProposals();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get('/api/expenses');
      setExpenses(response.data);
    } catch (error) {
      toast.error('Giderler yüklenirken hata oluştu');
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

  const fetchProposals = async () => {
    try {
      const response = await axios.get('/api/proposals');
      setProposals(response.data.filter((p: any) => p.status === 'approved'));
    } catch (error) {
      console.error('Proposals fetch error:', error);
    }
  };

  const openModal = () => {
    reset();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      const response = await axios.post('/api/expenses', data);
      setExpenses(prev => [response.data, ...prev]);
      toast.success('Gider eklendi', {
        icon: '💰',
        style: { borderRadius: '12px', background: '#10B981', color: '#fff' }
      });
      closeModal();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gider eklenirken hata oluştu');
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.expense_date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  }).reduce((sum, expense) => sum + expense.amount, 0);

  const expensesByCategory = categories.map(category => ({
    category,
    amount: expenses.filter(e => e.category === category).reduce((sum, e) => sum + e.amount, 0)
  })).filter(item => item.amount > 0);

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
      <div className="relative animate-slide-up">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 rounded-3xl blur-3xl opacity-10"></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-red-500 to-orange-600 rounded-2xl shadow-lg">
                <Receipt className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Giderler
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">
                  Proje giderlerinizi takip edin ve kar/zarar analizi yapın
                </p>
              </div>
            </div>
            <div className="mt-6 sm:mt-0">
              <button
                onClick={openModal}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-2xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Yeni Gider
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Toplam Gider
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₺{totalExpenses.toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Bu Ay
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₺{monthlyExpenses.toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Kategori Sayısı
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {expensesByCategory.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {expensesByCategory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Kategori Bazında Giderler
          </h3>
          <div className="space-y-3">
            {expensesByCategory.map((item, index) => (
              <div key={item.category} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.category}
                </span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">
                  ₺{item.amount.toLocaleString('tr-TR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Receipt className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Henüz gider yok</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            İlk giderinizi ekleyerek başlayın
          </p>
          <button
            onClick={openModal}
            className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-medium rounded-2xl text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            Yeni Gider
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {expenses.map((expense, index) => (
            <div
              key={expense.id}
              className="group relative bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 via-orange-600/5 to-yellow-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {expense.title}
                      </h3>
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg">
                        {expense.category}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {expense.customer_name && (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {expense.customer_name}
                        </div>
                      )}
                      {expense.proposal_title && (
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-1" />
                          {expense.proposal_title}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(expense.expense_date).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                    
                    {expense.description && (
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {expense.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center ml-4">
                    <DollarSign className="h-5 w-5 text-red-600 dark:text-red-400 mr-1" />
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                      ₺{expense.amount.toLocaleString('tr-TR')}
                    </span>
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
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-gray-100 dark:border-gray-700 animate-bounce-in">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl mr-3">
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Yeni Gider Ekle
                  </h3>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gider Başlığı *
                  </label>
                  <input
                    {...register('title', { required: 'Başlık gerekli' })}
                    className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 transition-all duration-200"
                    placeholder="Gider başlığı"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kategori *
                    </label>
                    <select
                      {...register('category', { required: 'Kategori seçimi gerekli' })}
                      className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 transition-all duration-200"
                    >
                      <option value="">Kategori seçin</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tutar *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      {...register('amount', { required: 'Tutar gerekli', min: 0 })}
                      className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 transition-all duration-200"
                      placeholder="0.00"
                    />
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tarih *
                  </label>
                  <input
                    type="date"
                    {...register('expense_date', { required: 'Tarih gerekli' })}
                    className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 transition-all duration-200"
                  />
                  {errors.expense_date && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.expense_date.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Müşteri (Opsiyonel)
                    </label>
                    <select
                      {...register('customer_id')}
                      className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 transition-all duration-200"
                    >
                      <option value="">Müşteri seçin</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.first_name} {customer.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teklif (Opsiyonel)
                    </label>
                    <select
                      {...register('proposal_id')}
                      className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 transition-all duration-200"
                    >
                      <option value="">Teklif seçin</option>
                      {proposals.map(proposal => (
                        <option key={proposal.id} value={proposal.id}>
                          {proposal.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 transition-all duration-200"
                    placeholder="Gider açıklaması (opsiyonel)"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 hover:scale-105"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-orange-600 border border-transparent rounded-xl hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    Gider Ekle
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