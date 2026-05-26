import React, { useState, useRef } from 'react';
import { Key, Cpu, Shield, Trash2, Download, Upload, AlertCircle, Check, HelpCircle, Languages, Link, ChevronRight } from 'lucide-react';
import { Manual, Chat } from '../types';

interface SettingsViewProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  expertMode: boolean;
  setExpertMode: (val: boolean) => void;
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  manuals: Manual[];
  setManuals: React.Dispatch<React.SetStateAction<Manual[]>>;
  lang: 'EN' | 'RU';
  setLang: (l: 'EN' | 'RU') => void;
}

const MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 / Chat' },
  { id: 'mistralai/mistral-large', name: 'Mistral Large' },
  { id: 'meta-llama/llama-3.1-405b', name: 'Llama 3.1 405B' },
];

export default function SettingsView({
  apiKey,
  setApiKey,
  selectedModel,
  setSelectedModel,
  expertMode,
  setExpertMode,
  chats,
  setChats,
  manuals,
  setManuals,
  lang,
  setLang,
}: SettingsViewProps) {
  const [testResult, setTestResult] = useState<'success' | 'failed' | 'testing' | null>(null);
  const [showKey, setShowKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    title: lang === 'RU' ? 'Настройки Системы' : 'Configuration Settings',
    apiKeyLabel: lang === 'RU' ? 'API Ключ OpenRouter' : 'OpenRouter API Key',
    apiKeyPlaceholder: lang === 'RU' ? 'Введите sk-or-...' : 'Enter your sk-or-... key',
    apiKeyHelp: lang === 'RU'
      ? 'Этот ключ сохраняется только в браузере (localStorage) и отправляется исключительно на официальный API OpenRouter.'
      : 'Your credentials remain isolated inside localStorage and are transmitted strictly towards OpenRouter APIs.',
    testBtn: lang === 'RU' ? 'Проверить соединение' : 'Test API Connection',
    expertLabel: lang === 'RU' ? 'Профессиональный режим коучинга' : 'Professional Expert Mode',
    expertHelp: lang === 'RU'
      ? 'Активирует жесткий, бескомпромиссный анализ и убирает классические ограничения вежливости из ответов нейросети.'
      : 'Bypasses AI politeness fluff, generating hyper-direct, aggressive strategic deconstructions, and raw advice.',
    dataLabel: lang === 'RU' ? 'Управление Данными' : 'Data Management',
    clearAllChats: lang === 'RU' ? 'Сбросить историю диалогов' : 'Purge conversation logs',
    exportManuals: lang === 'RU' ? 'Экспорт баз (JSON)' : 'Export rules (JSON)',
    importManuals: lang === 'RU' ? 'Импорт баз (JSON)' : 'Import rules (JSON)',
    successTest: lang === 'RU' ? 'Соединение успешно установлено!' : 'Connection successfully validated!',
    failedTest: lang === 'RU' ? 'Ошибка проверки! Проверьте правильность файла.' : 'Validation failed! Recalibrate key parameters.',
    testing: lang === 'RU' ? 'Проверка...' : 'Pinging endpoints...',
    tgHelp: lang === 'RU' ? 'Интеграция Telegram' : 'Telegram Session Status',
    tgStatus: lang === 'RU' ? 'Статус аккаунта:' : 'Connection parameters:',
    tgOnline: lang === 'RU' ? 'Подключен (сессия проверена)' : 'Active (Direct Sync established)',
    tgOffline: lang === 'RU' ? 'Не подключен' : 'Offline / Standalone',
    tgLogout: lang === 'RU' ? 'Отклонить сессию' : 'Revoke Session Token',
    modelLabel: lang === 'RU' ? 'Предпочитаемая нейросеть' : 'Preferred Foundation Model',
  };

  const handleTestAPI = async () => {
    if (!apiKey) {
      setTestResult('failed');
      return;
    }
    setTestResult('testing');
    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      });
      if (res.ok) {
        setTestResult('success');
      } else {
        setTestResult('failed');
      }
    } catch (e) {
      setTestResult('failed');
    }
  };

  const handleClearHistory = () => {
    if (window.confirm(lang === 'RU' ? 'Вы уверены, что хотите сбросить всю историю?' : 'Are you sure you want to purge all conversation logs?')) {
      const defaultChat: Chat = {
        id: `chat_${Date.now()}`,
        title: lang === 'RU' ? 'Новый диалог' : 'New dialogue session',
        messages: [
          {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: lang === 'RU' ? 'Чат сброшен. Готов к работе!' : 'Conversations reset. Type prompts to start!',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
        activeManualIds: manuals.filter((m) => m.isActive).map((m) => m.id),
      };
      setChats([defaultChat]);
      if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    }
  };

  const handleExportManuals = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(manuals, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `manuals_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportManualsClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          const validated = imported.filter((m) => m.name && m.content && m.id);
          setManuals([...manuals, ...validated]);
          alert(lang === 'RU' ? `Успешно импортировано инструкций: ${validated.length}` : `Successfully injected: ${validated.length} playbooks`);
          
          if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
          }
        } else {
          alert('Incorrect JSON structure. Must be an array.');
        }
      } catch (err) {
        alert('Failed parsing file. Please yield standard JSON data.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div id="settings-tab-container" className="flex flex-col h-full bg-tg-bg overflow-y-auto pb-24 select-none relative z-10 animate-fade-in">
      
      {/* Immersive Profile-like Top Section */}
      <div className="bg-[#121212] pt-8 pb-6 px-4 flex flex-col items-center justify-center border-b border-white/[0.03]">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_8px_16px_rgba(0,0,0,0.5)] flex items-center justify-center text-4xl mb-4 relative">
          ⚙️
          <div className="absolute inset-0 bg-white/5 rounded-full pointer-events-none"></div>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight leading-none mb-1">
          {t.title}
        </h1>
        <p className="text-xs text-tg-secondary font-medium tracking-wide opacity-80">
          Operator Console v2.0
        </p>
      </div>

      <div className="p-4 space-y-6">
        {/* NETWORK & API SECTION */}
        <div>
          <h2 className="text-[11px] font-bold text-tg-secondary uppercase tracking-wider pl-4 mb-2">{t.modelLabel} & API</h2>
          <div className="bg-[#141414] rounded-3xl overflow-hidden shadow-sm border border-white/[0.03]">
            {/* API Key Field */}
            <div className="p-4 border-b border-white/[0.02]">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-white flex items-center gap-2">
                  <Key className="h-4 w-4 text-tg-accent" />
                  {t.apiKeyLabel}
                </label>
                {testResult === 'success' && <Check className="h-4 w-4 text-emerald-400" />}
                {testResult === 'failed' && <AlertCircle className="h-4 w-4 text-red-400" />}
              </div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  className="w-full bg-[#1A1A1A] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-tg-accent/50 transition-colors"
                  placeholder={t.apiKeyPlaceholder}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setTestResult(null);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-tg-secondary hover:text-white transition font-medium"
                >
                  {showKey ? (lang === 'RU' ? 'Скрыть' : 'Hide') : (lang === 'RU' ? 'Показать' : 'Show')}
                </button>
              </div>
              <p className="text-[10px] text-tg-secondary mt-2 opacity-70">
                {t.apiKeyHelp}
              </p>
            </div>

            {/* Model Field */}
            <div className="p-4 border-b border-white/[0.02]">
              <label className="text-sm font-medium text-white flex items-center gap-2 mb-2">
                <Cpu className="h-4 w-4 text-tg-accent" />
                {t.modelLabel}
              </label>
              <select
                className="w-full bg-[#1A1A1A] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white appearance-none focus:outline-none focus:border-tg-accent/50 transition-colors"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Test Connection */}
            <div className="p-2">
               <button
                onClick={handleTestAPI}
                disabled={testResult === 'testing'}
                className="w-full relative inline-flex items-center justify-center rounded-xl bg-transparent px-4 py-3 text-sm font-medium text-tg-accent hover:bg-white/[0.02] transition-colors disabled:opacity-50"
              >
                {testResult === 'testing' ? t.testing : t.testBtn}
              </button>
            </div>
          </div>
        </div>

        {/* BEHAVIOR SECTION */}
        <div>
          <h2 className="text-[11px] font-bold text-tg-secondary uppercase tracking-wider pl-4 mb-2">{lang === 'RU' ? 'Поведение' : 'Behavior'}</h2>
          <div className="bg-[#141414] rounded-3xl overflow-hidden shadow-sm border border-white/[0.03]">
            {/* Language */}
            <div className="p-4 border-b border-white/[0.02] flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-white flex items-center gap-2">
                  <Languages className="h-4 w-4 text-tg-accent" />
                  {lang === 'RU' ? 'Язык Интерфейса' : 'Interface Language'}
                </span>
              </div>
              <div className="flex bg-[#1A1A1A] rounded-xl p-1 border border-white/[0.05]">
                <button
                  onClick={() => setLang('RU')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${lang === 'RU' ? 'bg-[#2A2A2A] text-white shadow-sm' : 'text-tg-secondary hover:text-white'}`}
                >
                  RU
                </button>
                <button
                  onClick={() => setLang('EN')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${lang === 'EN' ? 'bg-[#2A2A2A] text-white shadow-sm' : 'text-tg-secondary hover:text-white'}`}
                >
                  EN
                </button>
              </div>
            </div>

            {/* Expert Mode */}
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.01] transition-colors" onClick={() => setExpertMode(!expertMode)}>
              <div className="flex flex-col gap-1 pr-4">
                <span className="text-sm font-medium text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-500" />
                  {t.expertLabel}
                </span>
                <span className="text-[10px] text-tg-secondary opacity-70 leading-relaxed">
                  {t.expertHelp}
                </span>
              </div>
              <div className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${expertMode ? 'bg-amber-500' : 'bg-[#1A1A1A] border-white/[0.05]'}`}>
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${expertMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* DATA MANAGEMENT */}
        <div>
           <h2 className="text-[11px] font-bold text-tg-secondary uppercase tracking-wider pl-4 mb-2">{t.dataLabel}</h2>
           <div className="bg-[#141414] rounded-3xl overflow-hidden shadow-sm border border-white/[0.03]">
             <button
                onClick={handleImportManualsClick}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.01] transition-colors border-b border-white/[0.02]"
             >
                <span className="text-sm font-medium text-white flex items-center gap-2">
                  <Upload className="h-4 w-4 text-tg-secondary" />
                  {t.importManuals}
                </span>
                <ChevronRight className="h-4 w-4 text-tg-secondary/50" />
             </button>
             <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImportFileChange}
              />
              <button
                onClick={handleExportManuals}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.01] transition-colors border-b border-white/[0.02]"
             >
                <span className="text-sm font-medium text-white flex items-center gap-2">
                  <Download className="h-4 w-4 text-tg-secondary" />
                  {t.exportManuals}
                </span>
                <ChevronRight className="h-4 w-4 text-tg-secondary/50" />
             </button>
             <button
                onClick={handleClearHistory}
                className="w-full flex items-center justify-between p-4 hover:bg-red-500/[0.02] transition-colors group"
             >
                <span className="text-sm font-medium text-red-400 group-hover:text-red-300 transition-colors flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  {t.clearAllChats}
                </span>
                <ChevronRight className="h-4 w-4 text-red-500/50" />
             </button>
           </div>
        </div>

      </div>
    </div>
  );
}
