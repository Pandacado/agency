import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import {
  CheckSquare, Square, Clock, AlertCircle, User,
  Building2, Calendar, Brain, Zap, Plus, X, Target, ChevronDown
} from 'lucide-react';

// Interface Tanımlamaları
interface Task {
  id: number;
  customer_id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string;
  created_by_ai: boolean;
  task_type: 'manual' | 'ai_generated';
  customer_name: string;
  company: string;
  created_at: string;
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  company: string;
}

interface TaskFormData {
  customer_id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string;
}

// Görev Şablonları (Açıklamalar Eklendi)
const taskTemplates = [
    {
      category: '🟣 Sosyal Medya Yönetimi Görevleri',
      tasks: [
        { title: 'Meta Business bilgilerini iste', description: 'Müşteriden, Meta Business Manager hesabına erişim için kullandığı e-posta adresini talep et. Eğer hesabı yoksa, kurulum için yönlendirme yap.' },
        { title: 'Instagram kullanıcı adı ve şifresini iste', description: 'İçerik paylaşımı ve hesap yönetimi için müşterinin Instagram kullanıcı adı ve şifresini güvenli bir şekilde talep et.' },
        { title: 'Meta reklam paneline erişim izni al', description: 'Müşterinin reklam hesabına, ajansın Business Manager\'ı üzerinden "Partner Erişimi" talep et. Müşteriye kabul etmesi için bildirim gidecektir.' },
        { title: 'Meta Business Manager’a admin olarak eklen', description: 'Müşterinin mevcut Business Manager hesabına, ajans yetkilisini "Yönetici" olarak eklemesini talep et.' },
        { title: 'İçerik onayı için örnek gönderi talep et', description: 'Müşterinin marka dilini ve beklentilerini anlamak için daha önce paylaştığı veya beğendiği örnek gönderileri iste.' },
        { title: 'Paylaşım günleri ve saatlerini belirle', description: 'Müşteri ile hedef kitle analizine dayalı olarak haftalık içerik paylaşım takvimini (günler ve saatler) oluştur ve onaya sun.' },
        { title: 'Rakip analiz raporunu hazırla', description: 'Sektördeki 3 ana rakibin sosyal medya stratejilerini, güçlü ve zayıf yönlerini içeren bir analiz raporu hazırla.' },
        { title: 'Reels formatında video iste', description: 'Sosyal medya paylaşımlarında kullanılmak üzere, müşteriden ürün/hizmetlerini tanıtan kısa, dikey formatta videolar talep et.' },
        { title: 'Marka renk ve logo bilgilerini al', description: 'Tüm tasarımlarda kullanılmak üzere müşterinin kurumsal kimlik kılavuzunu veya en azından logo (vektörel formatta) ve marka renk kodlarını (HEX/RGB) iste.' },
        { title: 'Kullanılacak hashtag listesini oluştur', description: 'Marka, sektör ve hedef kitleye uygun, etkileşimi artıracak 15-20 adetlik bir hashtag listesi oluştur ve müşteri onayına sun.' },
      ],
    },
    {
      category: '🔵 Reklam Yönetimi (Meta & Google Ads)',
      tasks: [
        { title: 'Meta reklam yetkilendirmesi talep et', description: 'Müşterinin reklam hesabına, ajansın Business Manager ID\'si üzerinden "Partner Erişimi" ile yetki talep et.' },
        { title: 'Hedef kitle ve bölge bilgilerini al', description: 'Reklamların gösterileceği demografik (yaş, cinsiyet), coğrafi (şehir, bölge) ve ilgi alanı bazlı hedef kitle bilgilerini müşteriden öğren.' },
        { title: 'Google Ads yöneticisi olarak erişim al', description: 'Müşterinin Google Ads hesap numarasını (XXX-XXX-XXXX) talep et ve ajansın MCC (Yönetici Hesabı) üzerinden erişim isteği gönder.' },
        { title: 'Web sitesine dönüşüm kodu eklenmesini iste', description: 'Reklam performansını ölçmek için Meta Pixel ve Google Ads Dönüşüm İzleme kodlarının web sitesinin tüm sayfalarına eklenmesini sağla.' },
        { title: 'Ürün veya hizmet fotoğraflarını iste', description: 'Reklam görsellerinde kullanılmak üzere yüksek çözünürlüklü ve dikkat çekici ürün/hizmet fotoğraflarını müşteriden talep et.' },
        { title: 'Reklam bütçesini ve süresini belirle', description: 'Müşteri ile görüşerek aylık veya kampanya bazlı toplam reklam bütçesini ve reklamların ne kadar süre yayında kalacağını netleştir.' },
        { title: 'Reklam metni onayı al', description: 'Hazırlanan reklam başlıkları ve metinlerini, yayınlanmadan önce müşteri onayına sun.' },
        { title: 'Dönüşüm takibi için form/WhatsApp linki al', description: 'Reklamlardan gelen potansiyel müşterilerin yönlendirileceği iletişim formu, WhatsApp hattı veya landing page linkini müşteriden al.' },
      ],
    },
    {
      category: '🟢 Web Sitesi / E-Ticaret',
      tasks: [
        { title: 'Alan adı ve hosting bilgilerini al', description: 'Web sitesinin yayınlanacağı alan adı (domain) ve hosting paneli (cPanel, Plesk vb.) erişim bilgilerini müşteriden talep et.' },
        { title: 'Web sitesi istek formunu doldurt', description: 'Müşterinin beklentilerini, hedeflerini ve proje detaylarını anlamak için hazırlanan detaylı web sitesi istek formunu müşteriye gönder ve doldurmasını sağla.' },
        { title: 'Gerekli sayfalar: Hakkımızda, İletişim, Hizmetler, Blog, Galeri', description: 'Web sitesinde yer alması gereken temel sayfaların listesini müşteri ile teyit et ve bu sayfaların içeriklerini talep et.' },
        { title: 'Logo, renkler ve font tercihlerini iste', description: 'Web sitesi tasarımında kullanılacak kurumsal kimlik elemanlarını (logo, renk kodları, font isimleri) müşteriden al.' },
        { title: 'Referans beğendiği siteleri öğren', description: 'Müşterinin estetik anlayışını ve beklentilerini kavramak için beğendiği 3 adet referans web sitesi linkini iste.' },
        { title: 'Ürün/hizmet detaylarını al', description: 'Sitede sergilenecek tüm ürün veya hizmetlerin detaylı açıklamalarını, özelliklerini ve fiyat bilgilerini içeren bir doküman talep et.' },
        { title: 'Ödeme altyapısı tercihini öğren (iyzico, stripe, etc.)', description: 'E-ticaret sitesi için kullanılacak sanal POS veya ödeme kuruluşu (Iyzico, PayTR, Stripe vb.) tercihini müşteriden öğren.' },
        { title: 'Kargo ve iade politikası iste', description: 'Sitede yayınlanmak üzere, yasal zorunlulukları karşılayan kargo, iade ve gizlilik politikası metinlerini müşteriden talep et.' },
        { title: 'Google Analytics / Search Console erişimi al', description: 'Sitenin performans takibi için müşterinin mevcut Google Analytics ve Search Console hesaplarına yönetici erişimi talep et.' },
        { title: 'İçerik ve görsel yükleme klasörü oluştur', description: 'Müşterinin site için göndereceği tüm metin ve görselleri toplayacağı bir paylaşımlı bulut klasörü (Google Drive, Dropbox vb.) oluştur ve linkini paylaş.' },
      ],
    },
];

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [taskTypeFilter, setTaskTypeFilter] = useState<'all' | 'manual' | 'ai_generated'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TaskFormData>();

  useEffect(() => {
    fetchTasks();
    fetchCustomers();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/tasks');
      setTasks(response.data);
    } catch (error) { toast.error('Görevler yüklenirken hata oluştu'); } finally { setLoading(false); }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
    } catch (error) { console.error('Customers fetch error:', error); }
  };

  const openModal = (title = '', description = '') => {
    reset({ title, description, priority: 'medium' });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); reset(); };

  const handleTemplateClick = (title: string, description: string) => {
    openModal(title, description);
    setIsMenuOpen(false);
  };

  const onSubmit = async (data: TaskFormData) => {
    try {
      const taskData = { ...data, task_type: 'manual' };
      await axios.post('/api/tasks', taskData);
      toast.success('Görev eklendi', { icon: '✅' });
      closeModal();
      fetchTasks();
    } catch (error: any) { toast.error(error.response?.data?.error || 'Görev eklenirken hata oluştu'); }
  };

  const updateTaskStatus = async (taskId: number, status: Task['status']) => {
    try {
      const response = await axios.put(`/api/tasks/${taskId}`, { status });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: response.data.status } : t));
      toast.success('Görev durumu güncellendi');
    } catch (error) { toast.error('Durum güncellenirken hata oluştu'); }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return priority;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'in_progress': return 'Devam Ediyor';
      case 'completed': return 'Tamamlandı';
      default: return status;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filter === 'all' || task.status === filter;
    const typeMatch = taskTypeFilter === 'all' || task.task_type === taskTypeFilter;
    return statusMatch && typeMatch;
  });

  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const manualTasks = tasks.filter(t => t.task_type === 'manual').length;
  const aiTasks = tasks.filter(t => t.task_type === 'ai_generated').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-poppins">
      <div className="relative animate-slide-up">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-10"></div>
        <div className="relative modern-card p-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-3xl shadow-lg animate-float">
                <CheckSquare className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Görevler
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-2 font-medium">
                  AI ve manuel görevlerinizi takip edin
                </p>
              </div>
            </div>
            <div className="mt-6 sm:mt-0">
              <div className="relative inline-block text-left">
                <div>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="modern-button-primary inline-flex items-center"
                  >
                    <Plus className="h-5 w-5 mr-3" />
                    Yeni Görev Ekle
                    <ChevronDown className="w-5 h-5 ml-2 -mr-1" />
                  </button>
                </div>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 origin-top-right divide-y divide-gray-100 dark:divide-gray-700 rounded-2xl bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 animate-fade-in">
                    <div className="px-1 py-1">
                      <button
                        onClick={() => { openModal(); setIsMenuOpen(false); }}
                        className="text-gray-900 dark:text-gray-200 hover:bg-purple-500 hover:text-white group flex w-full items-center rounded-md px-2 py-3 text-sm font-semibold"
                      >
                        <Plus className="mr-3 h-5 w-5" />
                        Boş Görev Oluştur
                      </button>
                    </div>
                    {taskTemplates.map((group) => (
                      <div key={group.category} className="px-1 py-1">
                        <div className="px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {group.category}
                        </div>
                        {group.tasks.map((task) => (
                          <button
                            key={task.title}
                            onClick={() => handleTemplateClick(task.title, task.description)}
                            className="text-gray-900 dark:text-gray-200 hover:bg-purple-500 hover:text-white group flex w-full items-center rounded-md px-3 py-2 text-sm text-left"
                          >
                            {task.title}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="modern-card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center">
            <div className="flex-shrink-0"><Clock className="h-10 w-10 text-yellow-500" /></div>
            <div className="ml-5 w-0 flex-1"><dl><dt className="text-sm font-bold text-gray-500 dark:text-gray-400 truncate">Bekleyen</dt><dd className="text-2xl font-bold text-gray-900 dark:text-white">{pendingTasks}</dd></dl></div>
          </div>
        </div>
        <div className="modern-card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center">
            <div className="flex-shrink-0"><Zap className="h-10 w-10 text-blue-500" /></div>
            <div className="ml-5 w-0 flex-1"><dl><dt className="text-sm font-bold text-gray-500 dark:text-gray-400 truncate">Devam Eden</dt><dd className="text-2xl font-bold text-gray-900 dark:text-white">{inProgressTasks}</dd></dl></div>
          </div>
        </div>
        <div className="modern-card p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center">
            <div className="flex-shrink-0"><CheckSquare className="h-10 w-10 text-green-500" /></div>
            <div className="ml-5 w-0 flex-1"><dl><dt className="text-sm font-bold text-gray-500 dark:text-gray-400 truncate">Tamamlanan</dt><dd className="text-2xl font-bold text-gray-900 dark:text-white">{completedTasks}</dd></dl></div>
          </div>
        </div>
        <div className="modern-card p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center">
            <div className="flex-shrink-0"><Target className="h-10 w-10 text-purple-500" /></div>
            <div className="ml-5 w-0 flex-1"><dl><dt className="text-sm font-bold text-gray-500 dark:text-gray-400 truncate">Manuel</dt><dd className="text-2xl font-bold text-gray-900 dark:text-white">{manualTasks}</dd></dl></div>
          </div>
        </div>
        <div className="modern-card p-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center">
            <div className="flex-shrink-0"><Brain className="h-10 w-10 text-indigo-500" /></div>
            <div className="ml-5 w-0 flex-1"><dl><dt className="text-sm font-bold text-gray-500 dark:text-gray-400 truncate">AI Önerisi</dt><dd className="text-2xl font-bold text-gray-900 dark:text-white">{aiTasks}</dd></dl></div>
          </div>
        </div>
      </div>
      
      <div className="modern-card animate-slide-up" style={{ animationDelay: '600ms' }}>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 px-8 py-6">
            <div className="flex space-x-2">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 py-2">Durum:</span>
              {[
                { key: 'all', label: 'Tümü', count: tasks.length },
                { key: 'pending', label: 'Bekleyen', count: pendingTasks },
                { key: 'in_progress', label: 'Devam Eden', count: inProgressTasks },
                { key: 'completed', label: 'Tamamlanan', count: completedTasks }
              ].map((tab) => (
                <button key={tab.key} onClick={() => setFilter(tab.key as any)} className={`${filter === tab.key ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'} px-4 py-2 rounded-2xl font-semibold text-sm flex items-center transition-all duration-300 hover:scale-105`}>
                  {tab.label}
                  <span className={`${filter === tab.key ? 'bg-white bg-opacity-20 text-white' : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-300'} ml-2 py-1 px-2 rounded-full text-xs font-bold`}>{tab.count}</span>
                </button>
              ))}
            </div>
            <div className="flex space-x-2">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 py-2">Tür:</span>
              {[
                { key: 'all', label: 'Tümü', count: tasks.length },
                { key: 'manual', label: 'Manuel', count: manualTasks },
                { key: 'ai_generated', label: 'AI Önerisi', count: aiTasks }
              ].map((tab) => (
                <button key={tab.key} onClick={() => setTaskTypeFilter(tab.key as any)} className={`${taskTypeFilter === tab.key ? 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'} px-4 py-2 rounded-2xl font-semibold text-sm flex items-center transition-all duration-300 hover:scale-105`}>
                  {tab.label}
                  <span className={`${taskTypeFilter === tab.key ? 'bg-white bg-opacity-20 text-white' : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-300'} ml-2 py-1 px-2 rounded-full text-xs font-bold`}>{tab.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-float"><CheckSquare className="h-12 w-12 text-white" /></div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{filter === 'all' && taskTypeFilter === 'all' ? 'Henüz görev yok' : 'Filtreye uygun görev bulunamadı'}</h3>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">AI analiziyle otomatik görevler oluşturulacak veya manuel görev ekleyebilirsiniz</p>
            <button onClick={() => openModal()} className="modern-button-primary"><Plus className="h-5 w-5 mr-3" />Yeni Görev</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTasks.map((task, index) => (
              <div key={task.id} className="p-8 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <button onClick={() => { const newStatus = task.status === 'completed' ? 'pending' : task.status === 'pending' ? 'in_progress' : 'completed'; updateTaskStatus(task.id, newStatus); }} className="mt-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-110">
                      {task.status === 'completed' ? <CheckSquare className="h-6 w-6 text-green-600 dark:text-green-400" /> : <Square className="h-6 w-6" />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className={`text-xl font-bold ${task.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>{task.title}</h3>
                        {task.task_type === 'ai_generated' && (<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 dark:from-purple-900 dark:to-indigo-900 dark:text-purple-200"><Brain className="h-4 w-4 mr-2" />AI Önerisi</span>)}
                        {task.task_type === 'manual' && (<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-emerald-100 to-blue-100 text-emerald-800 dark:from-emerald-900 dark:to-blue-900 dark:text-emerald-200"><Target className="h-4 w-4 mr-2" />Manuel</span>)}
                        <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${getPriorityColor(task.priority)}`}>{getPriorityText(task.priority)}</span>
                      </div>
                      {task.description && (<p className="text-base text-gray-600 dark:text-gray-300 mb-4 font-medium">{task.description}</p>)}
                      <div className="flex items-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center font-semibold"><User className="h-4 w-4 mr-2" />{task.customer_name}</div>
                        {task.company && (<div className="flex items-center font-semibold"><Building2 className="h-4 w-4 mr-2" />{task.company}</div>)}
                        {task.due_date && (<div className="flex items-center font-semibold"><Calendar className="h-4 w-4 mr-2" />{new Date(task.due_date).toLocaleDateString('tr-TR')}</div>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-3">
                    <div className={`px-4 py-2 rounded-full text-sm font-bold ${task.status === 'completed' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900 dark:to-emerald-900 dark:text-green-200' : task.status === 'in_progress' ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900 dark:to-indigo-900 dark:text-blue-200' : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 dark:from-gray-900 dark:to-slate-900 dark:text-gray-200'}`}>{getStatusText(task.status)}</div>
                    {task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' && (<div className="flex items-center text-red-600 dark:text-red-400 font-bold"><AlertCircle className="h-4 w-4 mr-2" /><span className="text-sm">Gecikmiş</span></div>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white dark:bg-gray-800 p-8 text-left align-middle shadow-xl transition-all animate-bounce-in">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold leading-6 text-gray-900 dark:text-white">
                    Yeni Görev Oluştur
                </h3>
                <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-6 h-6 text-gray-500" /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Görev Başlığı *</label>
                      <input type="text" {...register('title', { required: 'Başlık zorunludur' })} className="modern-input" />
                      {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Açıklama</label>
                      <textarea {...register('description')} rows={4} className="modern-textarea"></textarea>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Müşteri *</label>
                          <select {...register('customer_id', { required: 'Müşteri seçimi zorunludur' })} className="modern-select">
                              <option value="">Müşteri Seçin</option>
                              {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                          </select>
                          {errors.customer_id && <p className="text-red-500 text-xs mt-1">{errors.customer_id.message}</p>}
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Bitiş Tarihi</label>
                          <input type="date" {...register('due_date')} className="modern-input" />
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Öncelik</label>
                          <select {...register('priority')} defaultValue="medium" className="modern-select">
                              <option value="low">Düşük</option>
                              <option value="medium">Orta</option>
                              <option value="high">Yüksek</option>
                          </select>
                      </div>
                  </div>
                  <div className="pt-6 flex justify-end space-x-4">
                      <button type="button" onClick={closeModal} className="modern-button-secondary">İptal</button>
                      <button type="submit" className="modern-button-primary">Görevi Oluştur</button>
                  </div>
              </form>
          </div>
        </div>
      )}
    </div>
  );
};
