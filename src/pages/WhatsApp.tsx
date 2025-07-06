import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { MessageSquare, Send, User, Search, Loader2 } from 'lucide-react';

// Arayüz Tanımlamaları
interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  company: string;
  avatar?: string;
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
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, reset } = useForm<MessageFormData>();

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const filtered = customers.filter(c =>
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchMessages(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
      setFilteredCustomers(response.data);
    } catch (error) {
      toast.error('Müşteriler yüklenirken bir hata oluştu.');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchMessages = async (customerId: number) => {
    setLoadingMessages(true);
    try {
      const response = await axios.get(`/api/customers/${customerId}/whatsapp-messages`);
      setMessages(response.data);
    } catch (error) {
      toast.error('Mesajlar yüklenirken bir hata oluştu.');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const onSubmit = async (data: MessageFormData) => {
    if (!selectedCustomer) return;
    setSendingMessage(true);
    try {
      await axios.post('/api/whatsapp/send', {
        customer_id: selectedCustomer.id,
        message: data.message,
      });
      // Yeni mesajı anında ekranda göster
      setMessages(prev => [...prev, {
        id: Date.now(), // Geçici ID
        direction: 'outbound',
        message: data.message,
        created_at: new Date().toISOString(),
      }]);
      reset();
    } catch (error) {
      toast.error('Mesaj gönderilirken bir hata oluştu.');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] font-poppins">
      {/* Müşteri Listesi Paneli */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sohbetler</h2>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Müşteri ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingCustomers ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : (
            filteredCustomers.map(customer => (
              <div
                key={customer.id}
                onClick={() => handleCustomerSelect(customer)}
                className={`flex items-center p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${selectedCustomer?.id === customer.id ? 'bg-purple-100 dark:bg-purple-900' : ''}`}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">
                    {customer.first_name[0]}{customer.last_name[0]}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{customer.first_name} {customer.last_name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{customer.company || 'Bireysel'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sohbet Ekranı Paneli */}
      <div className="w-2/3 flex flex-col bg-gray-50 dark:bg-gray-900">
        {selectedCustomer ? (
          <>
            {/* Sohbet Başlığı */}
            <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-md">
                  {selectedCustomer.first_name[0]}{selectedCustomer.last_name[0]}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{selectedCustomer.first_name} {selectedCustomer.last_name}</h3>
                <p className="text-sm text-green-500">Online</p>
              </div>
            </div>

            {/* Mesajlar Alanı */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md p-3 rounded-2xl ${msg.direction === 'outbound' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                      <p>{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.direction === 'outbound' ? 'text-purple-200' : 'text-gray-400 dark:text-gray-500'} text-right`}>
                        {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Mesaj Yazma Alanı */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSubmit(onSubmit)} className="flex items-center space-x-4">
                <input
                  {...register('message', { required: true })}
                  type="text"
                  placeholder="Bir mesaj yazın..."
                  autoComplete="off"
                  className="flex-1 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={sendingMessage}
                  className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                >
                  {sendingMessage ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col justify-center items-center h-full text-center">
            <MessageSquare className="h-24 w-24 text-gray-300 dark:text-gray-600" />
            <h3 className="mt-4 text-xl font-bold text-gray-800 dark:text-gray-200">Sohbet seçin</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Başlamak için sol listeden bir müşteri seçin.</p>
          </div>
        )}
      </div>
    </div>
  );
};
