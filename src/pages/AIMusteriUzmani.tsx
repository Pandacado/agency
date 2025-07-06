// src/pages/AIMusteriUzmani.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Brain, Search, Sparkles, User, Target, CheckCircle, Send, Loader2 } from 'lucide-react';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  company: string;
}

interface AnalysisResult {
  analysis: string;
  roadmap: Array<{
    step: number;
    action: string;
    reason: string;
  }>;
}

export const AIMusteriUzmani: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
    } catch (error) {
      toast.error('Müşteriler yüklenirken bir hata oluştu.');
    }
  };

  const handleAnalysis = async () => {
    if (!selectedCustomerId) {
      toast.error('Lütfen analiz için bir müşteri seçin.');
      return;
    }
    setLoading(true);
    setAnalysisResult(null);
    try {
      const response = await axios.post('/api/ai/customer-expert-analysis', { customerId: selectedCustomerId });
      setAnalysisResult(response.data);
      toast.success('AI Uzman analizi başarıyla tamamlandı!');
    } catch (error) {
      toast.error('Analiz sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find(c => c.id === parseInt(selectedCustomerId));

  return (
    <div className="space-y-8 font-poppins">
      {/* Header */}
      <div className="relative animate-slide-up">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-3xl blur-3xl opacity-10"></div>
        <div className="relative modern-card p-8">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl shadow-lg animate-float">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Müşteri Uzmanı
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-2 font-medium">
                Müşteri verilerinizi derinlemesine analiz edin ve stratejik yol haritaları oluşturun.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Kontrol Paneli */}
      <div className="modern-card p-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
              Analiz Edilecek Müşteri
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="modern-select"
            >
              <option value="">-- Müşteri Seçin --</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.first_name} {customer.last_name} {customer.company && `- ${customer.company}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              onClick={handleAnalysis}
              disabled={loading || !selectedCustomerId}
              className="w-full modern-button-primary"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              ) : (
                <Brain className="h-5 w-5 mr-3" />
              )}
              Uzmana Yorumlat
            </button>
          </div>
        </div>
      </div>

      {/* Analiz Sonuçları */}
      {loading && (
        <div className="flex flex-col items-center justify-center text-center p-12 modern-card">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Uzmanınız Düşünüyor...</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Müşteri verileri analiz ediliyor ve stratejik bir yol haritası oluşturuluyor. Lütfen bekleyin.</p>
        </div>
      )}

      {analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          {/* Detaylı Analiz */}
          <div className="modern-card p-8">
              <div className="flex items-center mb-6">
                  <User className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Detaylı Müşteri Analizi</h3>
              </div>
              <p className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                {analysisResult.analysis}
              </p>
          </div>

          {/* Yol Haritası */}
          <div className="modern-card p-8">
              <div className="flex items-center mb-6">
                  <Target className="h-8 w-8 text-pink-600 dark:text-pink-400 mr-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Stratejik Yol Haritası</h3>
              </div>
              <div className="space-y-4">
                {(analysisResult?.roadmap || []).map((item) => (

                  <div key={item.step} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex items-center">
                          <CheckCircle className="h-6 w-6 text-pink-500 mr-3" />
                          <h4 className="font-bold text-gray-900 dark:text-white">{item.step}. Adım: {item.action}</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 pl-9">
                          {item.reason}
                      </p>
                  </div>
                ))}
              </div>
          </div>
        </div>
      )}
    </div>
  );
};