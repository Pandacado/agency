import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/tr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  Plus, Calendar as CalendarIcon, Clock, User, Building2, 
  X, Check, AlertCircle, List, Grid, Video, MapPin,
  Bell, Star, ChevronLeft, ChevronRight
} from 'lucide-react';

moment.locale('tr');
const localizer = momentLocalizer(moment);

interface Meeting {
  id: number;
  customer_id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  customer_name: string;
  company: string;
  user_name: string;
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  company: string;
}

interface MeetingFormData {
  customer_id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
}

export const Meetings: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentView, setCurrentView] = useState(Views.MONTH);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<MeetingFormData>();

  useEffect(() => {
    fetchMeetings();
    fetchCustomers();
    // Check for upcoming meetings every minute
    const interval = setInterval(checkUpcomingMeetings, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await axios.get('/api/meetings');
      setMeetings(response.data);
    } catch (error) {
      toast.error('Toplantılar yüklenirken hata oluştu');
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

  const checkUpcomingMeetings = () => {
    const now = new Date();
    const upcoming = meetings.filter(meeting => {
      const meetingStart = new Date(meeting.start_date);
      const timeDiff = meetingStart.getTime() - now.getTime();
      return timeDiff > 0 && timeDiff <= 15 * 60 * 1000; // 15 minutes
    });

    upcoming.forEach(meeting => {
      if (Notification.permission === 'granted') {
        new Notification(`Toplantı Hatırlatması`, {
          body: `${meeting.title} toplantınız 15 dakika içinde başlayacak`,
          icon: '/favicon.ico'
        });
      }
      toast(`${meeting.title} toplantınız yaklaşıyor!`, {
        duration: 10000,
        icon: '⏰',
        style: { fontFamily: 'Poppins' }
      });
    });
  };

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const openModal = (slotInfo?: { start: Date; end: Date }) => {
    if (slotInfo) {
      setValue('start_date', moment(slotInfo.start).format('YYYY-MM-DDTHH:mm'));
      setValue('end_date', moment(slotInfo.end).format('YYYY-MM-DDTHH:mm'));
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const onSubmit = async (data: MeetingFormData) => {
    try {
      const response = await axios.post('/api/meetings', data);
      setMeetings(prev => [response.data, ...prev]);
      toast.success('Toplantı oluşturuldu', {
        icon: '📅',
        style: { borderRadius: '16px', background: '#10B981', color: '#fff', fontFamily: 'Poppins' }
      });
      closeModal();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Toplantı oluşturulurken hata oluştu');
    }
  };

  const updateMeetingStatus = async (meetingId: number, status: Meeting['status']) => {
    try {
      await axios.put(`/api/meetings/${meetingId}`, { status });
      setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, status } : m));
      toast.success('Toplantı durumu güncellendi', {
        style: { fontFamily: 'Poppins' }
      });
    } catch (error) {
      toast.error('Durum güncellenirken hata oluştu');
    }
  };

  const calendarEvents = meetings.map(meeting => ({
    id: meeting.id,
    title: meeting.title,
    start: new Date(meeting.start_date),
    end: new Date(meeting.end_date),
    resource: meeting
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Planlandı';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  const eventStyleGetter = (event: any) => {
    const meeting = event.resource;
    let backgroundColor = '#3B82F6';
    let borderColor = '#2563EB';
    
    switch (meeting.status) {
      case 'completed':
        backgroundColor = '#10B981';
        borderColor = '#059669';
        break;
      case 'cancelled':
        backgroundColor = '#EF4444';
        borderColor = '#DC2626';
        break;
      default:
        backgroundColor = '#8B5CF6';
        borderColor = '#7C3AED';
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderRadius: '12px',
        border: `2px solid ${borderColor}`,
        color: 'white',
        fontSize: '13px',
        fontWeight: '600',
        fontFamily: 'Poppins',
        padding: '4px 8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        opacity: meeting.status === 'cancelled' ? 0.6 : 1
      }
    };
  };

  const CustomToolbar = ({ label, onNavigate, onView, view }: any) => {
    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('PREV')}
            className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 hover:scale-110"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white min-w-[200px] text-center">
            {label}
          </h2>
          
          <button
            onClick={() => onNavigate('NEXT')}
            className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 hover:scale-110"
          >
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('TODAY')}
            className="px-6 py-3 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-800 transition-all duration-300 hover:scale-105"
          >
            Bugün
          </button>
          
          <div className="flex border-2 border-gray-200 dark:border-gray-600 rounded-2xl overflow-hidden">
            {[
              { key: Views.MONTH, label: 'Ay' },
              { key: Views.WEEK, label: 'Hafta' },
              { key: Views.DAY, label: 'Gün' }
            ].map((viewOption) => (
              <button
                key={viewOption.key}
                onClick={() => onView(viewOption.key)}
                className={`px-4 py-3 text-sm font-bold transition-all duration-300 ${
                  view === viewOption.key
                    ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {viewOption.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const CustomEvent = ({ event }: any) => {
    const meeting = event.resource;
    return (
      <div className="p-1">
        <div className="font-bold text-xs truncate">{event.title}</div>
        <div className="text-xs opacity-90 truncate">{meeting.customer_name}</div>
        <div className="text-xs opacity-75">{moment(event.start).format('HH:mm')}</div>
      </div>
    );
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
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-emerald-600 rounded-3xl blur-3xl opacity-10"></div>
        <div className="relative modern-card p-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-blue-600 rounded-3xl shadow-lg animate-float">
                <CalendarIcon className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Toplantılar
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-2 font-medium">
                  Müşteri toplantılarınızı planlayın ve takip edin
                </p>
              </div>
            </div>
            <div className="mt-6 sm:mt-0 flex space-x-4">
              <div className="flex border-2 border-gray-200 dark:border-gray-600 rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-5 py-3 text-sm font-bold transition-all duration-300 ${viewMode === 'calendar' 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <CalendarIcon className="h-4 w-4 mr-2 inline" />
                  Takvim
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-5 py-3 text-sm font-bold transition-all duration-300 ${viewMode === 'list' 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <List className="h-4 w-4 mr-2 inline" />
                  Liste
                </button>
              </div>
              
              <button
                onClick={() => openModal()}
                className="modern-button-primary"
              >
                <Plus className="h-5 w-5 mr-3" />
                Yeni Toplantı
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar or List View */}
      {viewMode === 'calendar' ? (
        <div className="modern-card p-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <style jsx global>{`
            .rbc-calendar {
              font-family: 'Poppins', sans-serif;
              background: transparent;
            }
            
            .rbc-header {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border: none;
              padding: 16px 8px;
              font-weight: 700;
              font-size: 14px;
              color: #374151;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-radius: 12px 12px 0 0;
            }
            
            .dark .rbc-header {
              background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
              color: #f3f4f6;
            }
            
            .rbc-month-view {
              border: none;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
            }
            
            .rbc-date-cell {
              padding: 12px 8px;
              text-align: center;
              border-right: 1px solid #e5e7eb;
              border-bottom: 1px solid #e5e7eb;
              background: #ffffff;
              transition: all 0.2s ease;
            }
            
            .dark .rbc-date-cell {
              background: #1f2937;
              border-color: #374151;
            }
            
            .rbc-date-cell:hover {
              background: #f8fafc;
              transform: scale(1.02);
            }
            
            .dark .rbc-date-cell:hover {
              background: #374151;
            }
            
            .rbc-today {
              background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%) !important;
              font-weight: 700;
              color: #1e40af;
            }
            
            .dark .rbc-today {
              background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%) !important;
              color: #bfdbfe;
            }
            
            .rbc-off-range-bg {
              background: #f9fafb;
            }
            
            .dark .rbc-off-range-bg {
              background: #111827;
            }
            
            .rbc-event {
              border: none !important;
              border-radius: 8px !important;
              padding: 4px 8px !important;
              font-size: 12px !important;
              font-weight: 600 !important;
              margin: 2px !important;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
              cursor: pointer !important;
              transition: all 0.2s ease !important;
            }
            
            .rbc-event:hover {
              transform: scale(1.05) !important;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
            }
            
            .rbc-event-content {
              font-family: 'Poppins', sans-serif;
            }
            
            .rbc-day-slot .rbc-time-slot {
              border-top: 1px solid #f3f4f6;
            }
            
            .dark .rbc-day-slot .rbc-time-slot {
              border-color: #374151;
            }
            
            .rbc-time-view {
              border: none;
              border-radius: 16px;
              overflow: hidden;
              background: #ffffff;
            }
            
            .dark .rbc-time-view {
              background: #1f2937;
            }
            
            .rbc-time-header {
              border-bottom: 2px solid #e5e7eb;
            }
            
            .dark .rbc-time-header {
              border-color: #374151;
            }
            
            .rbc-time-content {
              border-top: none;
            }
            
            .rbc-timeslot-group {
              border-bottom: 1px solid #f3f4f6;
            }
            
            .dark .rbc-timeslot-group {
              border-color: #374151;
            }
            
            .rbc-current-time-indicator {
              background-color: #ef4444;
              height: 3px;
              border-radius: 2px;
              box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
            }
            
            .rbc-day-bg.rbc-today {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            }
            
            .dark .rbc-day-bg.rbc-today {
              background: linear-gradient(135deg, #451a03 0%, #78350f 100%);
            }
          `}</style>
          
          <div style={{ height: '700px' }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectSlot={(slotInfo) => openModal(slotInfo)}
              selectable
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              view={currentView}
              onView={setCurrentView}
              eventPropGetter={eventStyleGetter}
              components={{
                toolbar: CustomToolbar,
                event: CustomEvent
              }}
              messages={{
                next: 'Sonraki',
                previous: 'Önceki',
                today: 'Bugün',
                month: 'Ay',
                week: 'Hafta',
                day: 'Gün',
                agenda: 'Ajanda',
                date: 'Tarih',
                time: 'Saat',
                event: 'Etkinlik',
                noEventsInRange: 'Bu tarih aralığında toplantı yok',
                showMore: (total) => `+${total} daha fazla`
              }}
              formats={{
                timeGutterFormat: 'HH:mm',
                eventTimeRangeFormat: ({ start, end }) => 
                  `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
                dayFormat: 'DD',
                dateFormat: 'DD',
                dayHeaderFormat: 'dddd, DD MMMM',
                monthHeaderFormat: 'MMMM YYYY',
                dayRangeHeaderFormat: ({ start, end }) =>
                  `${moment(start).format('DD MMMM')} - ${moment(end).format('DD MMMM YYYY')}`
              }}
              popup
              popupOffset={30}
            />
          </div>
        </div>
      ) : (
        <div className="modern-card animate-slide-up" style={{ animationDelay: '100ms' }}>
          {meetings.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-float">
                <CalendarIcon className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Toplantı bulunamadı</h3>
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-10">
                İlk toplantınızı planlayarak başlayın
              </p>
              <button
                onClick={() => openModal()}
                className="modern-button-primary"
              >
                <Plus className="h-5 w-5 mr-3" />
                Yeni Toplantı
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {meetings.map((meeting, index) => (
                <div 
                  key={meeting.id} 
                  className="p-8 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {meeting.title}
                        </h3>
                        <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full ${getStatusColor(meeting.status)}`}>
                          {getStatusText(meeting.status)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-8 text-base text-gray-500 dark:text-gray-400 mb-4">
                        <div className="flex items-center font-semibold">
                          <User className="h-5 w-5 mr-2" />
                          {meeting.customer_name}
                        </div>
                        {meeting.company && (
                          <div className="flex items-center font-semibold">
                            <Building2 className="h-5 w-5 mr-2" />
                            {meeting.company}
                          </div>
                        )}
                        <div className="flex items-center font-semibold">
                          <Clock className="h-5 w-5 mr-2" />
                          {moment(meeting.start_date).format('DD.MM.YYYY HH:mm')} - {moment(meeting.end_date).format('HH:mm')}
                        </div>
                      </div>
                      
                      {meeting.description && (
                        <p className="text-base text-gray-600 dark:text-gray-300 font-medium">
                          {meeting.description}
                        </p>
                      )}
                    </div>
                    
                    {meeting.status === 'scheduled' && (
                      <div className="flex space-x-3 ml-6">
                        <button
                          onClick={() => updateMeetingStatus(meeting.id, 'completed')}
                          className="inline-flex items-center px-5 py-3 text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-800 transition-all duration-300 hover:scale-105 shadow-sm"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Tamamla
                        </button>
                        <button
                          onClick={() => updateMeetingStatus(meeting.id, 'cancelled')}
                          className="inline-flex items-center px-5 py-3 text-sm font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900 rounded-2xl hover:bg-red-100 dark:hover:bg-red-800 transition-all duration-300 hover:scale-105 shadow-sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          İptal Et
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl mr-4">
                    <CalendarIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Yeni Toplantı Planla
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
                    Toplantı Başlığı *
                  </label>
                  <input
                    {...register('title', { required: 'Başlık gerekli' })}
                    className="modern-input"
                    placeholder="Toplantı başlığını girin"
                  />
                  {errors.title && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Açıklama
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="modern-textarea"
                    placeholder="Toplantı detaylarını açıklayın..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Başlangıç Tarihi *
                    </label>
                    <input
                      type="datetime-local"
                      {...register('start_date', { required: 'Başlangıç tarihi gerekli' })}
                      className="modern-input"
                    />
                    {errors.start_date && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{errors.start_date.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Bitiş Tarihi *
                    </label>
                    <input
                      type="datetime-local"
                      {...register('end_date', { required: 'Bitiş tarihi gerekli' })}
                      className="modern-input"
                    />
                    {errors.end_date && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{errors.end_date.message}</p>
                    )}
                  </div>
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
                    Toplantı Oluştur
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