import React, { useState, useEffect } from 'react';
import { MessageSquare, BookOpen, Search, Settings, Shield, AlertCircle, HelpCircle, LogOut, Target } from 'lucide-react';
import { Chat, Manual, TelegramUser } from './types';
import ChatView from './components/ChatView';
import ManualsView from './components/ManualsView';
import AnalyzerView from './components/AnalyzerView';
import SettingsView from './components/SettingsView';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: TelegramUser;
        };
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
      };
    };
  }
}

// Preloaded stock manuals
const STOCK_MANUALS: Manual[] = [
  {
    id: 'manual_crypto_fintech_trainer',
    name: '🤖 Трейд Prompt / ФинТех Тренер',
    isActive: true,
    category: 'Crypto & FinTech',
    content: `Роль: Ты — опытный бизнес-тренер и эксперт по прямым продажам в сфере FinTech и криптовалют. Твоя задача — обучать менеджеров (пользователей) тому, как правильно вести клиентов по воронке продаж, общаясь от лица девушки по предоставленному методическому пособию.

Цель обучения: Научить менеджера выстраивать доверительное общение («обычный прогрев»), выявлять боли клиента и экологично закрывать его на покупку обучения криптовалюте или совместные инвестиции, используя метод прямой линии продаж.

🛠 ИНСТРУКЦИЯ ПО ВЗАИМОДЕЙСТВИЮ С ПОЛЬЗОВАТЕЛЕМ (МЕНЕДЖЕРОМ)
Формат обучения: Общайся с пользователем как поддерживающий, но строгий наставник. Давай информацию дозированно. Используй разбор кейсов, ролевые игры (симуляции диалогов) и давай практические задания.

Проверка знаний: Прежде чем переходить к следующему этапу воронки, убедись, что пользователь зафиксировал правила предыдущего.

Анализ ошибок: Если пользователь пишет топорные, агрессивные или «скамерские» фразы, мягко корректируй его, показывая, как переписать текст в рамках экологичных прямых продаж.

📘 ЯДРО МАТЕРИАЛА ДЛЯ ОБУЧЕНИЯ (База знаний ИИ)
Используй эти 5 блоков для обучения пользователя. Проводи его по ним последовательно.

Блок 1. Архитектура Личного Бренда (Легенда)
Чему учить: Менеджер должен идеально держать образ «своей девчонки» и эксперта одновременно.
- Занятость: Мастер в бьюти-сфере (колорист/стилист). Зарабатывает руками, высокий уровень эмпатии.
- Бэкграунд: Экономическое/аналитическое образование. В салоне — ради гибкого графика, но основной доход делает на крипте.
- Связи: Сильное окружение (аналитики, закрытый клуб), откуда берутся сигналы.
- Амбиции: Планирует переезд/масштабирование бизнеса (открытие студии).

Блок 2. Психология и Позиционирование
Чему учить:
- Продаем не блокчейн, а решение болей (закрыть кредит, уйти с завода, купить авто).
- Лидерство: В житейских темах — милая и дружелюбная, в финансовых — строгая и принципиальная экспертка.
- Дефицит: Время расписано (клиенты + рынок). Общение — это привилегия.

Блок 3. Воронка Прогрева (Пошаговый разбор)
- День 1–2 (Квалификация и боли): Неформальное общение + нативный вброс стиля жизни («Устроила выходной, крипта закрыла цели по доходу, сижу в кафе»). Переход к болям клиента через личную историю («Сама год назад спину ломала на сменах...»).
- День 3 (Презентация направлений): Деление на Спотовый трейдинг (для консерваторов) или Web3/NFT (для любителей трендов). Мостик к предложению («Давай я пошагово покажу свою систему...»).

Блок 4. Презентация и Закрытие сделки
- Демонстрация: Показ реального интерфейса легальной биржи (Bybit, OKX) и логики сделок.
- Капитал: Определение комфортной, но ощутимой суммы для старта (20–30% от дохода клиента) + триггер упущенной выгоды (FOMO).
- Прозрачность: Ведение клиента по четким этапам (Регистрация/KYC ➡️ Теория и Риски ➡️ Первая практика под кураторством).

Блок 5. Работа с возражениями
- Страх потери денег ➡️ Снижаем градус: обучение, риск-менеджмент, защитные стоп-ордера.
- «Сложно/Не получится» ➡️ Поддержка: объясню на простых примерах, как для своих.
- Сомнения ➡️ Мотивационный толчок: либо оставить все как есть, либо рискнуть в команде.

📈 СЦЕНАРИЙ ОБУЧЕНИЯ (План действий для ИИ)
Шаг 1. Знакомство и Введение: Поприветствуй пользователя. Кратко объясни суть стратегии (экологичные продажи от лица девушки-эксперта). Спроси, знаком ли он с нишей крипты, и предложи разобрать Блок 1 (Легенду).
Шаг 2. Практические задания (Симуляции): После объяснения теории давай пользователю задания.
Пример задания: «Представь, что клиент спрашивает, чем ты занимаешься по жизни. Напиши ответ, используя нашу легенду (бьюти + экономический бэкграунд), но без прямой продажи крипты. Поехали!»
Шаг 3. Отработка возражений: Завершай обучение жестким тестом на отработку возражений, имитируя капризного или сомневающегося клиента.`
  }
];

export default function App() {
  // Navigation Tabs State: 'chat' | 'action' | 'manuals'
  const [activeTab, setActiveTab] = useState<'chat' | 'action' | 'manuals'>('chat');
  
  // Shared Analysis Result State
  // We need somewhere to store the last generated JSON report
  const [lastReport, setLastReport] = useState<any>(null);

  // Multi-Language localization toggle
  const [lang, setLang] = useState<'EN' | 'RU'>(() => {
    const saved = localStorage.getItem('tg_coach_lang');
    if (saved === 'RU' || saved === 'EN') return saved;
    // Guess based on browser locale or default to RU as per prompt
    return navigator.language.startsWith('ru') ? 'RU' : 'EN';
  });

  // OpenRouter Credentials
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('tg_coach_openrouter_key') || '';
  });

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('tg_coach_model') || 'google/gemini-2.5-flash';
  });

  const [expertMode, setExpertMode] = useState<boolean>(() => {
    return localStorage.getItem('tg_coach_expert_mode') === 'true';
  });

  // Manuals list state
  const [manuals, setManuals] = useState<Manual[]>(() => {
    const saved = localStorage.getItem('tg_coach_manuals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return STOCK_MANUALS;
  });

  // Chats list state
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem('tg_coach_chats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }

    // Default placeholder conversation
    return [
      {
        id: 'chat_default',
        title: lang === 'RU' ? 'Основной диалог' : 'Core Consultation',
        messages: [
          {
            id: 'msg_initial_1',
            role: 'assistant',
            content: lang === 'RU'
              ? 'Привет! Я твой личный тактический коуч по коммуникациям. Добавь инструкции в раздел **Книги** (например, свои скрипты общения) или сразу загрузи чат во вкладку **Анализатор**, чтобы получить стратегические советы и готовые ответы!'
              : 'Hello! I am your strategic communication coach. Add some guidelines/rules in **Manuals** or load/sync a conversation logs inside **Analyze** to immediately receive custom generated replies and professional strategies!',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
        activeManualIds: [],
      },
    ];
  });

  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    return chats[0]?.id || null;
  });

  // Telegram authentication states (direct sync / WebApp integration)
  const [tmaUser, setTmaUser] = useState<TelegramUser | null>(null);
  const [tmaAuthStatus, setTmaAuthStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');

  // Synchronize localStorage parameters
  useEffect(() => {
    localStorage.setItem('tg_coach_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('tg_coach_openrouter_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('tg_coach_model', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem('tg_coach_expert_mode', expertMode.toString());
  }, [expertMode]);

  useEffect(() => {
    localStorage.setItem('tg_coach_manuals', JSON.stringify(manuals));
  }, [manuals]);

  useEffect(() => {
    localStorage.setItem('tg_coach_chats', JSON.stringify(chats));
  }, [chats]);

  // TMA Initialization & Backend Verification
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tgApp = window.Telegram.WebApp;
      tgApp.ready();
      tgApp.expand();

      // Extract user parameters
      const initData = tgApp.initData;
      const initUser = tgApp.initDataUnsafe?.user;

      if (initUser) {
        setTmaUser(initUser);
      }

      if (initData) {
        setTmaAuthStatus('verifying');
        fetch('/api/auth/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData })
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.isValid) {
              setTmaAuthStatus('success');
              if (data.user) {
                setTmaUser(data.user);
              }
            } else {
              setTmaAuthStatus('failed');
            }
          })
          .catch((err) => {
            console.error(err);
            setTmaAuthStatus('failed');
          });
      }
    }
  }, []);

  const handleTabClick = (tab: 'chat' | 'action' | 'manuals' | 'analyze' | 'settings') => {
    setActiveTab(tab);
    // Call haptic feedback if running inside Telegram Mini App
    if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  return (
    <div id="tma-app-root" className="flex flex-col h-screen bg-tg-bg text-tg-text max-w-xl mx-auto shadow-2xl relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none"></div>
      
      {/* Primary Display Area */}
      <main id="app-viewport" className="flex-1 overflow-hidden relative bg-transparent z-10">
        {activeTab === 'chat' && (
          <ChatView
            apiKey={apiKey}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            expertMode={expertMode}
            manuals={manuals}
            chats={chats}
            setChats={setChats}
            activeChatId={activeChatId}
            setActiveChatId={setActiveChatId}
            lang={lang}
            onAnalyzeStart={() => { setActiveTab('action'); }}
            setLastReport={setLastReport}
          />
        )}

        {/* 'action' tab handles the ProgressiveReport */}
        {activeTab === 'action' && (
          <AnalyzerView
            apiKey={apiKey}
            selectedModel={selectedModel}
            manuals={manuals}
            chats={chats}
            setChats={setChats}
            setActiveTab={setActiveTab as any}
            setActiveChatId={setActiveChatId}
            lang={lang}
            lastReport={lastReport}
            setLastReport={setLastReport}
          />
        )}

        {activeTab === 'manuals' && (
          <div className="h-full flex flex-col overflow-y-auto">
            <ManualsView
              manuals={manuals}
              setManuals={setManuals}
              lang={lang}
            />
            <div className="pb-10"></div>
          </div>
        )}
      </main>

      {/* Navigation Dock */}
      <nav id="tma-navigation-dock" className="h-[72px] bg-[#0A0A0A]/80 backdrop-blur-xl border-t border-white/[0.05] flex justify-around items-center select-none shrink-0 z-50 pb-2 pt-1 shadow-2xl relative">
        <button
          onClick={() => handleTabClick('chat')}
          className={`flex flex-col items-center justify-center flex-1 transition h-full text-center ${
            activeTab === 'chat' ? 'text-tg-accent' : 'text-tg-secondary hover:text-tg-text'
          }`}
        >
          <MessageSquare className="h-5 w-5 mb-1 stroke-[1.5]" />
          <span className="text-[10px] tracking-wide font-medium">
            {lang === 'RU' ? 'Чат' : 'Chat'}
          </span>
        </button>

        <button
          onClick={() => handleTabClick('action')}
          className={`flex flex-col items-center justify-center flex-1 transition h-full text-center relative ${
            activeTab === 'action' ? 'text-tg-accent' : 'text-tg-secondary hover:text-tg-text'
          }`}
        >
          <Target className="h-5 w-5 mb-1 stroke-[1.5]" />
          <span className="text-[10px] tracking-wide font-medium">
            {lang === 'RU' ? 'Репорт' : 'Report'}
          </span>
          {lastReport && (
            <span className="absolute top-2 right-1/3 h-1.5 w-1.5 rounded-full bg-tg-accent animate-pulse" />
          )}
        </button>

        <button
          onClick={() => handleTabClick('manuals')}
          className={`flex flex-col items-center justify-center flex-1 transition h-full text-center ${
            activeTab === 'manuals' ? 'text-tg-accent' : 'text-tg-secondary hover:text-tg-text'
          }`}
        >
          <BookOpen className="h-5 w-5 mb-1 stroke-[1.5]" />
          <span className="text-[10px] tracking-wide font-medium">
            {lang === 'RU' ? 'Правила' : 'Rules'}
          </span>
        </button>
      </nav>
    </div>
  );
}
