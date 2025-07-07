import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Search, Loader2, Send, MessageSquare } from 'lucide-react';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
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
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, reset } = useForm<MessageFormData>();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get('/api/customers');
        setCustomers(res.data);
        setFiltered(res.data);
      } catch {
        toast.error('Müşteriler alınamadı');
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
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/customers/${selected.id}/whatsapp-messages`);
        setMessages(res.data);
      } catch {
        toast.error('Mesajlar alınamadı');
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (data: MessageFormData) => {
    if (!selected) return;
    setSending(true);
    try {
      await axios.post('/api/whatsapp/send', {
        customer_id: selected.id,
        message: data.message,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          direction: 'outbound',
          message: data.message,
          created_at: new Date().toISOString(),
        },
      ]);

      reset();
    } catch {
      toast.error('Mesaj gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen font-poppins">
      {/* Müşteriler Paneli */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Sohbetler</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
            placeholder="Müşteri ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {filtered.map((c) => (
          <div
            key={c.id}
            onClick={() => setSelected(c)}
            className={`p-3 rounded-lg cursor-pointer mb-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
              selected?.id === c.id ? 'bg-purple-100 dark:bg-purple-800' : ''
            }`}
          >
            <div className="font-bold text-gray-900 dark:text-white">
              {c.first_name} {c.last_name}
            </div>
            <div className="text-sm text-gray-500">{c.company || 'Bireysel'}</div>
          </div>
        ))}
      </div>

      {/* Mesajlar Paneli */}
      <div className="w-2/3 flex flex-col">
        {selected ? (
          <>
            <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selected.first_name} {selected.last_name}
              </h3>
              <p className="text-sm text-gray-500">{selected.company || 'Bireysel'}</p>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-2 bg-gray-50 dark:bg-gray-900">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-lg p-3 rounded-xl ${
                      msg.direction === 'outbound'
                        ? 'ml-auto bg-purple-600 text-white'
                        : 'mr-auto bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <p>{msg.message}</p>
                    <p className="text-xs mt-1 text-right opacity-60">
                      {new Date(msg.created_at).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSubmit(sendMessage)} className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex space-x-2">
              <input
                {...register('message', { required: true })}
                className="flex-1 p-3 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
                placeholder="Mesaj yaz..."
              />
              <button
                type="submit"
                disabled={sending}
                className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full"
              >
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <MessageSquare className="h-16 w-16 mb-4" />
            <p className="text-lg">Sohbet başlatmak için bir müşteri seçin</p>
          </div>
        )}
      </div>
    </div>
  );
};
