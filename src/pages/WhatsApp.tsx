import React, { useState, useEffect, useRef } from 'react';
import axios from '../lib/axios'; // doğru path’e göre güncelle

import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { 
  Search, Loader2, Send, MessageSquare, Phone, User, 
  Building2, Clock, CheckCircle, AlertCircle 
} from 'lucide-react';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  phone?: string;
  company?: string;
}

interface WhatsAppMessage {
  id: number;
  direction: 'inbound' | 'outbound';
  message: string;
  created_at: string;
}

interface MessageFormData {
  message: string;
}

export const WhatsApp: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MessageFormData>();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
<<<<<<< HEAD
        const res = await axios.get('/customers');

=======
        const res = await axios.get('/api/customers');
>>>>>>> 4f1f3a6b4334dcf4a2710f241a410b5e562cbe83
        // Sadece telefon numarası olan müşterileri göster
        const customersWithPhone = res.data.filter((c: Customer) => c.phone && c.phone.trim() !== '');
        setCustomers(customersWithPhone);
        setFiltered(customersWithPhone);
      } catch (error) {
        console.error('Customers fetch error:', error);
        toast.error('Müşteriler yüklenirken hata oluştu');
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    setFiltered(
      customers.filter((c) =>
        `${c.first_name} ${c.last_name} ${c.company || ''}`.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, customers]);

  useEffect(() => {
    if (!selected) return;
    
<<<<<<< HEAD
    const fetchMessages = async (customerId: number) => {
  if (!customerId || isNaN(customerId)) {
    console.warn("Geçersiz müşteri ID:", customerId);
    return;
  }

  console.log("fetchMessages çağrıldı. Müşteri ID:", customerId);

  setLoadingMessages(true);
  try {
    const response = await axios.get(`/api/customers/${customerId}/whatsapp-messages`);
    setMessages(response.data);
  } catch (error) {
    console.error("Mesajlar çekilirken hata:", error);
    toast.error('Mesajlar yüklenirken bir hata oluştu.');
    setMessages([]);
  } finally {
    setLoadingMessages(false);
  }
};
    fetchMessages(selected.id); 
=======
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/customers/${selected.id}/whatsapp-messages`);
        setMessages(res.data);
      } catch (error) {
        console.error('Messages fetch error:', error);
        toast.error('Mesajlar yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
>>>>>>> 4f1f3a6b4334dcf4a2710f241a410b5e562cbe83
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (data: MessageFormData) => {
    if (!selected) {
      toast.error('Lütfen bir müşteri seçin');
      return;
    }
    
    if (!selected.phone) {
      toast.error('Seçilen müşterinin telefon numarası bulunamadı');
      return;
    }
    
    setSending(true);
    try {
<<<<<<< HEAD
      const response = await axios.post('/send-message', {
  to: `whatsapp:${selected.phone}`,
  body: data.message,
});
=======
      const response = await axios.post('/api/whatsapp/send', {
        customer_id: selected.id,
        message: data.message,
      });
>>>>>>> 4f1f3a6b4334dcf4a2710f241a410b5e562cbe83

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          direction: 'outbound',
          message: data.message,
          created_at: new Date().toISOString(),
        },
      ]);
<<<<<<< HEAD
const handleCustomerSelect = (customer: Customer) => {
  console.log("Seçilen müşteri:", customer); // Debug için
  setSelected(customer);
};
=======

>>>>>>> 4f1f3a6b4334dcf4a2710f241a410b5e562cbe83
      toast.success(`Mesaj ${selected.first_name} ${selected.last_name}'a gönderildi`, {
        icon: '📱',
        style: { 
          borderRadius: '16px', 
          background: '#25D366', 
          color: '#fff',
          fontFamily: 'Poppins'
        }
      });
      
      reset();
    } catch (error: any) {
      console.error('Send message error:', error);
      toast.error(error.response?.data?.error || 'Mesaj gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 font-poppins">
      {/* Header */}
      <div className="relative animate-slide-up">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl blur-3xl opacity-10"></div>
        <div className="relative modern-card p-8">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl shadow-lg animate-float">
              <MessageSquare className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                WhatsApp Yönetimi
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-2 font-medium">
                Müşterilerinizle WhatsApp üzerinden iletişim kurun
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Interface */}
      <div className="modern-card overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex h-[600px]">
      {/* Müşteriler Paneli */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                <MessageSquare className="h-6 w-6 mr-3 text-green-600" />
                Sohbetler
              </h2>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900 transition-all duration-300"
                  placeholder="Müşteri ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-y-auto h-full p-4">
              {filtered.length === 0 ? (
                <div className="text-center py-8">
                  <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    {customers.length === 0 ? 'Telefon numarası olan müşteri bulunamadı' : 'Arama sonucu bulunamadı'}
                  </p>
                </div>
              ) : (
                filtered.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`p-4 rounded-2xl cursor-pointer mb-3 transition-all duration-300 hover:scale-105 ${
                      selected?.id === c.id 
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 border-2 border-green-300 dark:border-green-600 shadow-lg' 
                        : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-transparent shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">
                          {c.first_name[0]}{c.last_name[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 dark:text-white text-base">
                          {c.first_name} {c.last_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          {c.company ? (
                            <>
                              <Building2 className="h-4 w-4 mr-1" />
                              {c.company}
                            </>
                          ) : (
                            <>
                              <User className="h-4 w-4 mr-1" />
                              Bireysel
                            </>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {c.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

      {/* Mesajlar Paneli */}
          <div className="w-2/3 flex flex-col bg-white dark:bg-gray-900">
        {selected ? (
          <>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">
                        {selected.first_name[0]}{selected.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selected.first_name} {selected.last_name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {selected.phone}
                        </span>
                        {selected.company && (
                          <span className="flex items-center">
                            <Building2 className="h-4 w-4 mr-1" />
                            {selected.company}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
            </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
              {loading ? (
                    <div className="flex flex-col justify-center items-center h-full">
                      <Loader2 className="h-12 w-12 animate-spin text-green-500 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">Mesajlar yükleniyor...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full text-center">
                  <MessageSquare className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-2">
                    Henüz mesaj yok
                  </h3>
                  <p className="text-gray-400 dark:text-gray-500">
                    {selected.first_name} ile sohbeti başlatmak için aşağıdan mesaj gönderin
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                        className={`max-w-lg p-4 rounded-3xl shadow-lg animate-slide-up ${
                      msg.direction === 'outbound'
                            ? 'ml-auto bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                            : 'mr-auto bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                        <p className="font-medium leading-relaxed">{msg.message}</p>
                        <div className="flex items-center justify-end mt-2 space-x-2">
                          <Clock className="h-3 w-3 opacity-60" />
                          <p className="text-xs opacity-60">
                            {new Date(msg.created_at).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                          </p>
                          {msg.direction === 'outbound' && (
                            <CheckCircle className="h-3 w-3 opacity-60" />
                          )}
                        </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <form onSubmit={handleSubmit(sendMessage)} className="flex space-x-4">
                    <div className="flex-1">
                      <input
                        {...register('message', { 
                          required: 'Mesaj içeriği gerekli',
                          minLength: { value: 1, message: 'Mesaj boş olamaz' }
                        })}
                        className="w-full p-4 rounded-2xl bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900 transition-all duration-300"
                        placeholder={`${selected.first_name}'a mesaj yaz...`}
                        disabled={sending}
                      />
                      {errors.message && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                          {errors.message.message}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={sending}
                      className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl font-bold transition-all duration-300 hover:scale-105 disabled:scale-100 shadow-lg flex items-center space-x-2"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Gönderiliyor...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          <span>Gönder</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
          </>
        ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-float">
                  <MessageSquare className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  WhatsApp Sohbeti Başlatın
                </h3>
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-6">
                  Müşterilerinizle iletişim kurmak için sol panelden bir müşteri seçin
                </p>
                {customers.length === 0 && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900 rounded-2xl border border-amber-200 dark:border-amber-700">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />
                      <p className="text-amber-800 dark:text-amber-200 font-medium">
                        WhatsApp kullanmak için müşterilerinizin telefon numaralarını eklemeyi unutmayın
                      </p>
                    </div>
                  </div>
                )}
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};
