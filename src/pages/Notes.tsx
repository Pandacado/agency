import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { 
  Plus, ArrowLeft, Phone, Users, Mail, MessageSquare, 
  FileText, Mic, MicOff, Download, Send, Brain,
  Clock, User, Lightbulb, TrendingUp, AlertCircle,
  Upload, Play, Pause, Volume2, Sparkles, Star,
  CheckCircle, XCircle, Target, Zap
} from 'lucide-react';

interface Note {
  id: number;
  content: string;
  type: 'phone' | 'meeting' | 'email' | 'whatsapp' | 'general' | 'audio';
  created_at: string;
  author_name: string;
  is_transcribed: boolean;
  audio_file_path?: string;
  sentiment?: string;
  priority?: string;
  suggestions?: string;
  next_actions?: string;
  confidence_score?: number;
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  company: string;
  email: string;
  phone: string;
}

interface NoteFormData {
  content: string;
  type: 'phone' | 'meeting' | 'email' | 'whatsapp' | 'general';
}

interface WhatsAppTemplate {
  id: number;
  name: string;
  template_type: string;
  content: string;
}

export const Notes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiMessageType, setAiMessageType] = useState('first_contact');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<NoteFormData>({
    defaultValues: { type: 'general' }
  });

  const contentValue = watch('content');

  useEffect(() => {
    if (id) {
      fetchCustomer();
      fetchNotes();
      fetchWhatsAppTemplates();
    }
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const response = await axios.get(`/api/customers`);
      const customers = response.data;
      const foundCustomer = customers.find((c: Customer) => c.id === parseInt(id!));
      if (foundCustomer) {
        setCustomer(foundCustomer);
      }
    } catch (error) {
      toast.error('Müşteri bilgileri yüklenirken hata oluştu');
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`/api/customers/${id}/notes`);
      setNotes(response.data);
    } catch (error) {
      toast.error('Notlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchWhatsAppTemplates = async () => {
    try {
      const response = await axios.get('/api/whatsapp/templates');
      setWhatsappTemplates(response.data);
    } catch (error) {
      console.error('WhatsApp templates fetch error:', error);
    }
  };

  const onSubmit = async (data: NoteFormData) => {
    try {
      const response = await axios.post(`/api/customers/${id}/notes`, data);
      setNotes(prev => [response.data, ...prev]);
      reset();
      toast.success('Not eklendi', {
        icon: '📝',
        style: { borderRadius: '16px', background: '#10B981', color: '#fff', fontFamily: 'Poppins' }
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Not eklenirken hata oluştu');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks(chunks);
    } catch (error) {
      toast.error('Mikrofon erişimi sağlanamadı');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    try {
      const response = await axios.post('/api/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const currentContent = contentValue || '';
      const transcribedText = response.data.text;
      setValue('content', currentContent + (currentContent ? '\n\n' : '') + transcribedText);
      toast.success('Ses kaydı yazıya dönüştürüldü', {
        icon: '🎤',
        style: { borderRadius: '16px', background: '#8B5CF6', color: '#fff', fontFamily: 'Poppins' }
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Transkript oluşturulamadı');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Lütfen ses dosyası seçin');
      return;
    }

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await axios.post(`/api/customers/${id}/upload-audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setNotes(prev => [response.data, ...prev]);
      toast.success('Ses dosyası yüklendi ve transkript oluşturuldu', {
        icon: '🎵',
        style: { borderRadius: '16px', background: '#8B5CF6', color: '#fff', fontFamily: 'Poppins' }
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ses dosyası yüklenirken hata oluştu');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendWhatsApp = async () => {
    if (!whatsappMessage.trim()) {
      toast.error('Mesaj içeriği boş olamaz');
      return;
    }

    try {
      await axios.post('/api/whatsapp/send', {
        customer_id: id,
        message: whatsappMessage
      });
      
      toast.success('WhatsApp mesajı gönderildi', {
        icon: '📱',
        style: { borderRadius: '16px', background: '#25D366', color: '#fff', fontFamily: 'Poppins' }
      });
      
      setIsWhatsAppModalOpen(false);
      setWhatsappMessage('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'WhatsApp mesajı gönderilemedi');
    }
  };

  const generateAIMessage = async () => {
    try {
      const response = await axios.post('/api/ai/generate-message', {
        customer_id: id,
        message_type: aiMessageType
      });
      
      setGeneratedMessage(response.data.message);
      toast.success('AI mesajı oluşturuldu', {
        icon: '🤖',
        style: { borderRadius: '16px', background: '#8B5CF6', color: '#fff', fontFamily: 'Poppins' }
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'AI mesajı oluşturulamadı');
    }
  };

  const useTemplate = (templateContent: string) => {
    const personalizedContent = templateContent.replace(
      '{customer_name}',
      customer ? `${customer.first_name} ${customer.last_name}` : 'Değerli Müşterimiz'
    );
    setWhatsappMessage(personalizedContent);
  };

  const generatePDF = async () => {
    toast.success('PDF oluşturuldu (demo)', {
      icon: '📄',
      style: { borderRadius: '16px', background: '#3B82F6', color: '#fff', fontFamily: 'Poppins' }
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'phone': return <Phone className="h-5 w-5" />;
      case 'meeting': return <Users className="h-5 w-5" />;
      case 'email': return <Mail className="h-5 w-5" />;
      case 'whatsapp': return <MessageSquare className="h-5 w-5" />;
      case 'audio': return <Volume2 className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'phone': return 'Telefon';
      case 'meeting': return 'Toplantı';
      case 'email': return 'E-posta';
      case 'whatsapp': return 'WhatsApp';
      case 'audio': return 'Ses Kaydı';
      default: return 'Genel';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'phone': return 'from-green-500 to-emerald-600';
      case 'meeting': return 'from-blue-500 to-indigo-600';
      case 'email': return 'from-purple-500 to-violet-600';
      case 'whatsapp': return 'from-emerald-500 to-teal-600';
      case 'audio': return 'from-pink-500 to-rose-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'pozitif': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'negatif': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSentimentText = (sentiment?: string) => {
    switch (sentiment) {
      case 'pozitif': return 'Pozitif';
      case 'negatif': return 'Negatif';
      default: return 'Nötr';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'yüksek': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'orta': return <Target className="h-5 w-5 text-yellow-500" />;
      case 'düşük': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityText = (priority?: string) => {
    switch (priority) {
      case 'yüksek': return 'Yüksek';
      case 'orta': return 'Orta';
      case 'düşük': return 'Düşük';
      default: return 'Belirsiz';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-poppins">
      {/* Header */}
      <div className="relative animate-slide-up">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl blur-3xl opacity-10"></div>
        <div className="relative modern-card p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link
                to="/customers"
                className="inline-flex items-center text-base font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Müşteriler
              </Link>
              <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg animate-float">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {customer?.first_name} {customer?.last_name}
                  </h1>
                  {customer?.company && (
                    <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">{customer.company}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setIsAIModalOpen(true)}
                className="inline-flex items-center px-5 py-3 border border-purple-300 dark:border-purple-600 shadow-sm text-sm font-bold rounded-2xl text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900 hover:bg-purple-100 dark:hover:bg-purple-800 transition-all duration-300 hover:scale-105"
              >
                <Brain className="h-5 w-5 mr-2" />
                AI Asistan
              </button>
              
              <button
                onClick={() => setIsWhatsAppModalOpen(true)}
                className="inline-flex items-center px-5 py-3 border border-green-300 dark:border-green-600 shadow-sm text-sm font-bold rounded-2xl text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 transition-all duration-300 hover:scale-105"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                WhatsApp
              </button>
              
              <button
                onClick={generatePDF}
                className="inline-flex items-center px-5 py-3 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-bold rounded-2xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 hover:scale-105"
              >
                <Download className="h-5 w-5 mr-2" />
                PDF İndir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Note Form */}
      <div className="modern-card p-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center mb-8">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mr-4">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Yeni Not Ekle</h3>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
              Not Türü
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { value: 'general', label: 'Genel', icon: FileText },
                { value: 'phone', label: 'Telefon', icon: Phone },
                { value: 'meeting', label: 'Toplantı', icon: Users },
                { value: 'email', label: 'E-posta', icon: Mail },
                { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare }
              ].map((type) => (
                <label
                  key={type.value}
                  className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer group border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                >
                  <input
                    type="radio"
                    {...register('type')}
                    value={type.value}
                    className="modern-checkbox mr-3"
                  />
                  <type.icon className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 mr-2" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                Not İçeriği *
              </label>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`inline-flex items-center px-4 py-2 text-sm font-bold rounded-2xl transition-all duration-300 hover:scale-105 ${
                    isRecording 
                      ? 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800'
                      : 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-4 w-4 mr-2" />
                      Kaydı Durdur
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Ses Kaydı
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 text-sm font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900 rounded-2xl hover:bg-purple-200 dark:hover:bg-purple-800 transition-all duration-300 hover:scale-105"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Ses Yükle
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
            
            <textarea
              {...register('content', { required: 'Not içeriği gerekli' })}
              rows={6}
              className="modern-textarea"
              placeholder="Not içeriğini yazın, sesli kayıt yapın veya ses dosyası yükleyin..."
            />
            {errors.content && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{errors.content.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="modern-button-primary"
            >
              <Plus className="h-5 w-5 mr-3" />
              Not Ekle
            </button>
          </div>
        </form>
      </div>

      {/* Notes List */}
      <div className="space-y-6">
        {notes.length === 0 ? (
          <div className="text-center py-20 modern-card animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-float">
              <FileText className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Henüz not yok</h3>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Bu müşteri için ilk notunuzu ekleyin
            </p>
          </div>
        ) : (
          notes.map((note, index) => (
            <div 
              key={note.id} 
              className="modern-card p-8 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 bg-gradient-to-r ${getTypeColor(note.type)} rounded-2xl shadow-lg`}>
                    {getTypeIcon(note.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {getTypeText(note.type)}
                      </span>
                      {note.is_transcribed && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 dark:from-purple-900 dark:to-indigo-900 dark:text-purple-200">
                          <Mic className="h-4 w-4 mr-2" />
                          Transkript
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mt-2">
                      <span className="flex items-center font-semibold">
                        <User className="h-4 w-4 mr-2" />
                        {note.author_name}
                      </span>
                      <span className="flex items-center font-semibold">
                        <Clock className="h-4 w-4 mr-2" />
                        {new Date(note.created_at).toLocaleString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>
                
                {note.type === 'whatsapp' && customer?.phone && (
                  <button
                    onClick={() => {
                      setWhatsappMessage(note.content);
                      setIsWhatsAppModalOpen(true);
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900 rounded-2xl hover:bg-green-100 dark:hover:bg-green-800 transition-all duration-300 hover:scale-105"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    WhatsApp'ta Gönder
                  </button>
                )}
              </div>

              <div className="mb-6">
                <p className="text-base text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
              </div>

              {/* AI Analysis */}
              {(note.sentiment || note.priority || note.suggestions || note.next_actions) && (
                <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900 dark:to-indigo-900 rounded-3xl border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center mb-6">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl mr-3">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">AI Analizi</h4>
                    {note.confidence_score && (
                      <span className="ml-3 text-sm text-gray-500 dark:text-gray-400 font-semibold">
                        ({Math.round(note.confidence_score * 100)}% güven)
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {note.sentiment && (
                      <div className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                        {getSentimentIcon(note.sentiment)}
                        <div className="ml-3">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Duygu Durumu:</span>
                          <p className="text-base font-bold text-gray-900 dark:text-white">
                            {getSentimentText(note.sentiment)}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {note.priority && (
                      <div className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                        {getPriorityIcon(note.priority)}
                        <div className="ml-3">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Öncelik:</span>
                          <p className="text-base font-bold text-gray-900 dark:text-white">
                            {getPriorityText(note.priority)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {note.suggestions && (
                    <div className="mb-6">
                      <div className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                        <Lightbulb className="h-5 w-5 text-yellow-500 mr-3 mt-1 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Öneriler:</span>
                          <p className="text-base text-gray-900 dark:text-white mt-1 leading-relaxed">{note.suggestions}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {note.next_actions && (
                    <div>
                      <div className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                        <TrendingUp className="h-5 w-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Sonraki Adımlar:</span>
                          <p className="text-base text-gray-900 dark:text-white mt-1 leading-relaxed">{note.next_actions}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* WhatsApp Modal */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm animate-fade-in" onClick={() => setIsWhatsAppModalOpen(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-3xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-8 border border-gray-100 dark:border-gray-700 animate-bounce-in">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mr-4">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    WhatsApp Mesajı Gönder
                  </h3>
                </div>
                <button
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all duration-200"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>

              {/* Templates */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Mesaj Şablonları
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {whatsappTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => useTemplate(template.content)}
                      className="p-4 text-sm text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 font-semibold"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Mesaj İçeriği
                </label>
                <textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  rows={6}
                  className="modern-textarea"
                  placeholder="WhatsApp mesajınızı yazın..."
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="modern-button-secondary"
                >
                  İptal
                </button>
                <button
                  onClick={sendWhatsApp}
                  className="inline-flex items-center px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-700 border border-transparent rounded-2xl hover:from-green-700 hover:to-emerald-800 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <Send className="h-5 w-5 mr-3" />
                  Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Modal */}
      {isAIModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm animate-fade-in" onClick={() => setIsAIModalOpen(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-3xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-8 border border-gray-100 dark:border-gray-700 animate-bounce-in">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl mr-4">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    AI Satış Asistanı
                  </h3>
                </div>
                <button
                  onClick={() => setIsAIModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all duration-200"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Mesaj Türü
                </label>
                <select
                  value={aiMessageType}
                  onChange={(e) => setAiMessageType(e.target.value)}
                  className="modern-select"
                >
                  <option value="first_contact">İlk Temas</option>
                  <option value="proposal_response">Teklif Yanıtı</option>
                  <option value="thank_you">Teşekkür Mesajı</option>
                  <option value="follow_up">Takip Mesajı</option>
                </select>
              </div>

              <button
                onClick={generateAIMessage}
                className="w-full mb-6 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-700 border border-transparent rounded-2xl hover:from-purple-700 hover:to-indigo-800 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Sparkles className="h-5 w-5 mr-3 inline" />
                AI Mesajı Oluştur
              </button>

              {generatedMessage && (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Oluşturulan Mesaj
                  </label>
                  <textarea
                    value={generatedMessage}
                    onChange={(e) => setGeneratedMessage(e.target.value)}
                    rows={6}
                    className="modern-textarea"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setIsAIModalOpen(false)}
                  className="modern-button-secondary"
                >
                  Kapat
                </button>
                {generatedMessage && (
                  <button
                    onClick={() => {
                      setWhatsappMessage(generatedMessage);
                      setIsAIModalOpen(false);
                      setIsWhatsAppModalOpen(true);
                    }}
                    className="inline-flex items-center px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-700 border border-transparent rounded-2xl hover:from-green-700 hover:to-emerald-800 transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <Zap className="h-5 w-5 mr-3" />
                    WhatsApp'ta Kullan
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};