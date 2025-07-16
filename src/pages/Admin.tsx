import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Settings, Palette, Globe, MessageSquare, Brain, 
  Mail, Instagram, Save, Eye, EyeOff, Sparkles,
  Shield, Bell, Database, Zap, Monitor, TestTube
} from 'lucide-react';

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    // General Settings
    app_name: 'Agency CRM Ultimate',
    app_logo: '',
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    accent_color: '#F59E0B',
    language: 'tr',
    theme_mode: 'auto',
    font_family: 'Poppins',
    
    // API Integrations
    openai_api_key: '',
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_whatsapp_number: '',
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    instagram_access_token: '',
    
    // Feature Toggles
    enable_ai_analysis: true,
    enable_whatsapp: true,
    enable_email_integration: true,
    enable_instagram: false,
    enable_notifications: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings');
      setSettings(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Settings fetch error:', error);
    }
  };

  const handleSave = async (section: string) => {
    setLoading(true);
    try {
      await axios.put('/api/settings', settings);
      toast.success(`${section} ayarları kaydedildi`, {
        icon: '✅',
        style: {
          borderRadius: '16px',
          background: '#10B981',
          color: '#fff',
          fontFamily: 'Poppins'
        },
      });
    } catch (error) {
      toast.error('Ayarlar kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const testIntegration = async (integration: string) => {
    toast.loading(`${integration} entegrasyonu test ediliyor...`, {
      style: {
        borderRadius: '16px',
        fontFamily: 'Poppins'
      },
    });
    
    try {
      let endpoint = '';
     // --- BU SWITCH BLOĞUNU GÜNCELLEYİN ---
      switch (integration) {
        case 'OpenAI':
          endpoint = '/api/test/openai';
          break;
        case 'SMTP':
          endpoint = '/api/test/smtp';
          break;
        // YENİ CASE'İ BURAYA EKLEYİN
        case 'Twilio':
          endpoint = '/api/test/twilio';
          break;
        default:
          throw new Error('Desteklenmeyen entegrasyon');
      }
      // --- GÜNCELLEMENİN SONU ---

      await axios.post(endpoint);
      toast.dismiss();
      toast.success(`${integration} entegrasyonu başarılı!`, {
        icon: '🎉',
        style: {
          borderRadius: '16px',
          background: '#10B981',
          color: '#fff',
          fontFamily: 'Poppins'
        },
      });
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.response?.data?.error || `${integration} entegrasyonu başarısız`, {
        style: {
          borderRadius: '16px',
          background: '#EF4444',
          color: '#fff',
          fontFamily: 'Poppins'
        },
      });
    }
  };

  const tabs = [
    { id: 'general', name: 'Genel Ayarlar', icon: Settings, color: 'from-blue-500 to-blue-600' },
    { id: 'theme', name: 'Tema & Görünüm', icon: Palette, color: 'from-purple-500 to-purple-600' },
    { id: 'integrations', name: 'Entegrasyonlar', icon: Globe, color: 'from-emerald-500 to-emerald-600' }
  ];

  return (
    <div className="space-y-8 font-poppins">
      {/* Header */}
      <div className="relative animate-slide-up">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 rounded-3xl blur-3xl opacity-10"></div>
        <div className="relative modern-card p-8">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl shadow-lg animate-float">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Yönetim Paneli
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-2 font-medium">
                Sistem ayarlarını ve entegrasyonları yönetin
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="modern-card overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <nav className="flex space-x-8 px-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-transparent text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                } relative whitespace-nowrap py-6 px-1 font-bold text-base flex items-center transition-all duration-300`}
              >
                {activeTab === tab.id && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-2xl shadow-lg -mx-4`}></div>
                )}
                <div className="relative flex items-center">
                  <tab.icon className="h-6 w-6 mr-3" />
                  {tab.name}
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-8">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-3xl p-8">
                <div className="flex items-center mb-8">
                  <Monitor className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Uygulama Ayarları
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Uygulama Adı
                    </label>
                    <input
                      type="text"
                      value={settings.app_name}
                      onChange={(e) => setSettings({...settings, app_name: e.target.value})}
                      className="modern-input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Dil
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({...settings, language: e.target.value})}
                      className="modern-select"
                    >
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-3xl p-8">
                <div className="flex items-center mb-8">
                  <Zap className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mr-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Özellik Ayarları
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {[
                    { key: 'enable_ai_analysis', label: 'AI Analiz Sistemi', description: 'Notları otomatik analiz et ve görev öner', icon: Brain },
                    { key: 'enable_whatsapp', label: 'WhatsApp Entegrasyonu', description: 'Twilio üzerinden WhatsApp mesajları', icon: MessageSquare },
                    { key: 'enable_email_integration', label: 'E-posta Entegrasyonu', description: 'SMTP ile e-posta gönderimi', icon: Mail },
                    { key: 'enable_instagram', label: 'Instagram Entegrasyonu', description: 'Instagram hesap analizi', icon: Instagram },
                    { key: 'enable_notifications', label: 'Bildirimler', description: 'Tarayıcı bildirimleri ve hatırlatmalar', icon: Bell }
                  ].map((feature) => (
                    <div key={feature.key} className="modern-card p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start">
                          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mr-4">
                            <feature.icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-gray-900 dark:text-white">
                              {feature.label}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings[feature.key as keyof typeof settings] as boolean}
                            onChange={(e) => setSettings({...settings, [feature.key]: e.target.checked})}
                            className="modern-checkbox"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('Genel')}
                  disabled={loading}
                  className="modern-button-primary"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  ) : (
                    <Save className="h-5 w-5 mr-3" />
                  )}
                  Kaydet
                </button>
              </div>
            </div>
          )}

          {/* Theme Settings */}
          {activeTab === 'theme' && (
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 rounded-3xl p-8">
                <div className="flex items-center mb-8">
                  <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Renk Paleti
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Ana Renk
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="color"
                        value={settings.primary_color}
                        onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                        className="h-16 w-24 rounded-2xl border-2 border-gray-300 dark:border-gray-600 cursor-pointer shadow-lg"
                      />
                      <input
                        type="text"
                        value={settings.primary_color}
                        onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                        className="modern-input flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      İkincil Renk
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="color"
                        value={settings.secondary_color}
                        onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                        className="h-16 w-24 rounded-2xl border-2 border-gray-300 dark:border-gray-600 cursor-pointer shadow-lg"
                      />
                      <input
                        type="text"
                        value={settings.secondary_color}
                        onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                        className="modern-input flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Vurgu Rengi
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="color"
                        value={settings.accent_color}
                        onChange={(e) => setSettings({...settings, accent_color: e.target.value})}
                        className="h-16 w-24 rounded-2xl border-2 border-gray-300 dark:border-gray-600 cursor-pointer shadow-lg"
                      />
                      <input
                        type="text"
                        value={settings.accent_color}
                        onChange={(e) => setSettings({...settings, accent_color: e.target.value})}
                        className="modern-input flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modern-card p-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                  Tema Önizleme
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button 
                    className="px-8 py-4 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${settings.primary_color}, ${settings.primary_color}dd)` }}
                  >
                    Ana Renk Butonu
                  </button>
                  <button 
                    className="px-8 py-4 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${settings.secondary_color}, ${settings.secondary_color}dd)` }}
                  >
                    İkincil Renk Butonu
                  </button>
                  <button 
                    className="px-8 py-4 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${settings.accent_color}, ${settings.accent_color}dd)` }}
                  >
                    Vurgu Rengi Butonu
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('Tema')}
                  disabled={loading}
                  className="modern-button-primary"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  ) : (
                    <Save className="h-5 w-5 mr-3" />
                  )}
                  Kaydet
                </button>
              </div>
            </div>
          )}

          {/* Integrations */}
          {activeTab === 'integrations' && (
            <div className="space-y-8">
              {/* OpenAI Integration */}
              <div className="modern-card p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl mr-6">
                      <Brain className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        OpenAI API
                      </h3>
                      <p className="text-base text-gray-500 dark:text-gray-400 font-medium">
                        AI analiz ve transkript özellikleri için
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => testIntegration('OpenAI')}
                    className="inline-flex items-center px-6 py-3 text-sm font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900 rounded-2xl hover:bg-purple-100 dark:hover:bg-purple-800 transition-all duration-300 hover:scale-105"
                  >
                    <TestTube className="h-5 w-5 mr-2" />
                    Test Et
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    API Anahtarı
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKeys ? 'text' : 'password'}
                      value={settings.openai_api_key}
                      onChange={(e) => setSettings({...settings, openai_api_key: e.target.value})}
                      placeholder="sk-..."
                      className="modern-input pr-16"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKeys(!showApiKeys)}
                      className="absolute inset-y-0 right-0 pr-6 flex items-center"
                    >
                      {showApiKeys ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Twilio Integration */}
              <div className="modern-card p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl mr-6">
                      <MessageSquare className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Twilio WhatsApp
                      </h3>
                      <p className="text-base text-gray-500 dark:text-gray-400 font-medium">
                        WhatsApp mesajlaşma entegrasyonu
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => testIntegration('Twilio')}
                    className="inline-flex items-center px-6 py-3 text-sm font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900 rounded-2xl hover:bg-green-100 dark:hover:bg-green-800 transition-all duration-300 hover:scale-105"
                  >
                    <TestTube className="h-5 w-5 mr-2" />
                    Test Et
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Account SID
                    </label>
                    <input
                      type={showApiKeys ? 'text' : 'password'}
                      value={settings.twilio_account_sid}
                      onChange={(e) => setSettings({...settings, twilio_account_sid: e.target.value})}
                      className="modern-input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Auth Token
                    </label>
                    <input
                      type={showApiKeys ? 'text' : 'password'}
                      value={settings.twilio_auth_token}
                      onChange={(e) => setSettings({...settings, twilio_auth_token: e.target.value})}
                      className="modern-input"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      WhatsApp Numarası
                    </label>
                    <input
                      type="text"
                      value={settings.twilio_whatsapp_number}
                      onChange={(e) => setSettings({...settings, twilio_whatsapp_number: e.target.value})}
                      placeholder="whatsapp:+14155238886"
                      className="modern-input"
                    />
                  </div>
                </div>
              </div>

              {/* SMTP Integration */}
              <div className="modern-card p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl mr-6">
                      <Mail className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        SMTP E-posta
                      </h3>
                      <p className="text-base text-gray-500 dark:text-gray-400 font-medium">
                        E-posta gönderimi için SMTP ayarları
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => testIntegration('SMTP')}
                    className="inline-flex items-center px-6 py-3 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-800 transition-all duration-300 hover:scale-105"
                  >
                    <TestTube className="h-5 w-5 mr-2" />
                    Test Et
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={settings.smtp_host}
                      onChange={(e) => setSettings({...settings, smtp_host: e.target.value})}
                      className="modern-input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Port
                    </label>
                    <input
                      type="text"
                      value={settings.smtp_port}
                      onChange={(e) => setSettings({...settings, smtp_port: e.target.value})}
                      className="modern-input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Kullanıcı Adı
                    </label>
                    <input
                      type="email"
                      value={settings.smtp_user}
                      onChange={(e) => setSettings({...settings, smtp_user: e.target.value})}
                      className="modern-input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Şifre
                    </label>
                    <input
                      type={showApiKeys ? 'text' : 'password'}
                      value={settings.smtp_pass}
                      onChange={(e) => setSettings({...settings, smtp_pass: e.target.value})}
                      className="modern-input"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('Entegrasyonlar')}
                  disabled={loading}
                  className="modern-button-primary"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  ) : (
                    <Save className="h-5 w-5 mr-3" />
                  )}
                  Kaydet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};