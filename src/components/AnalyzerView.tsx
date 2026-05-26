import React, { useState, useEffect } from 'react';
import { Send, Key, MessageSquare, Target, User, Shield, Compass, Copy, ArrowRight, RefreshCw, AlertTriangle, CheckSquare, Sparkles, AlertCircle, Trash } from 'lucide-react';
import { Manual, TelegramDialog, TelegramMessage, AnalysisResult, Chat, Message } from '../types';
import ProgressiveReport from './ProgressiveReport';

interface AnalyzerViewProps {
  apiKey: string;
  selectedModel: string;
  manuals: Manual[];
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  setActiveTab: (tab: 'chat' | 'manuals' | 'analyze' | 'settings') => void;
  setActiveChatId: (id: string | null) => void;
  lang: 'EN' | 'RU';
  lastReport?: any;
  setLastReport?: (report: any) => void;
}

export default function AnalyzerView({
  apiKey,
  selectedModel,
  manuals,
  chats,
  setChats,
  setActiveTab,
  setActiveChatId,
  lang,
  lastReport,
  setLastReport,
}: AnalyzerViewProps) {
  // Connection states
  const [phone, setPhone] = useState('');
  const [password2FA, setPassword2FA] = useState('');
  const [is2FARequired, setIs2FARequired] = useState(false);
  const [connectedUser, setConnectedUser] = useState<any>(() => {
    const saved = localStorage.getItem('tg_analyzer_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authId, setAuthId] = useState<string | null>(null);
  const [smsCode, setSmsCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'connect' | 'dialogs' | 'configure' | 'results'>(() => {
    const saved = localStorage.getItem('tg_analyzer_user');
    return saved ? 'dialogs' : 'connect';
  });

  // Recent dialog list
  const [dialogs, setDialogs] = useState<TelegramDialog[]>([]);
  const [selectedDialogId, setSelectedDialogId] = useState<string | null>(null);

  // Username search states
  const [searchUsername, setSearchUsername] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Configuration metrics
  const [analysisMode, setAnalysisMode] = useState<'goal' | 'manual'>('goal');
  const [selectedManualId, setSelectedManualId] = useState<string>('');
  const [coachingGoal, setCoachingGoal] = useState('');
  const [customLog, setCustomLog] = useState('');

  // Analysis result
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(() => {
    const saved = localStorage.getItem('tg_analyzer_result');
    return saved ? JSON.parse(saved) : null;
  });

  // Keep a persistent log of ALL historic analyses
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>(() => {
    const saved = localStorage.getItem('tg_coach_analyzes_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [loaderPhase, setLoaderPhase] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoaderPhase(0);
      interval = setInterval(() => {
        setLoaderPhase((prev) => (prev + 1) % 5);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const [copyStates, setCopyStates] = useState<{ [key: string]: boolean }>({});
  const [errorPrompt, setErrorPrompt] = useState<string | null>(null);

  // ---------- AUTOPILOT STATE & PERSONA PRESETS ----------
  const [activeAutopilots, setActiveAutopilots] = useState<{chatId: string; chatName: string; contextName: string; contextInstruction: string}[]>([]);
  const [autopilotLogs, setAutopilotLogs] = useState<any[]>([]);
  const [autopilotSubMode, setAutopilotSubMode] = useState<'coaching' | 'autopilot'>('coaching');
  const [autopilotPersona, setAutopilotPersona] = useState<'sales' | 'gentle' | 'hard' | 'custom'>('custom');
  const [autopilotDirective, setAutopilotDirective] = useState('');
  const [autopilotToggling, setAutopilotToggling] = useState(false);

  // Simulation state for offline/demo mode
  const [simText, setSimText] = useState('');
  const [simulating, setSimulating] = useState(false);

  const personaDirectives = {
    hard: lang === 'RU'
      ? "Веди переговоры с позиции силы, нивелируй любые попытки манипуляций, продавливай максимальную материальную и тактическую выгоду, держи хладнокровный и твердый тон переговорщика."
      : "Negotiate from an absolute position of power. Disarm manipulation attempts, demand top-tier material terms, and maintain a steel-cold business posture.",
    gentle: lang === 'RU'
      ? "Будь максимально дружелюбным, понимающим эмпатом. Проявляй искреннюю эмпатию, тепло, пиши мягко, идеально сглаживай острые углы и дари безупречное ощущение заботы."
      : "Be a warm, deeply empathetic communicator. Output friendly conversational vibes, active listening tokens, and make the recipient feel safe and cared for.",
    sales: lang === 'RU'
      ? "Выявляй скрытые боли собеседника, профессионально отрабатывай любые возражения, мотивируй совершить транзакцию или внести предоплату за услуги / товар прямо сейчас."
      : "Target pain points, handle common objections like a pro sales rep, and motivate them to commit to a deposit, purchase, or contract closure immediately.",
    custom: ""
  };

  const getPersonaName = (p: 'sales' | 'gentle' | 'hard' | 'custom') => {
    if (p === 'hard') return lang === 'RU' ? '⚔️ Жёсткий переговорщик' : '⚔️ Hard Negotiator';
    if (p === 'gentle') return lang === 'RU' ? '🌸 Заботливая поддержка' : '🌸 Warm Supporter';
    if (p === 'sales') return lang === 'RU' ? '💰 Эксперт Продаж 100%' : '💰 Sales Master';
    return lang === 'RU' ? '⚙️ Свой сценарий' : '⚙️ Custom Script';
  };

  const syncAutopilotStatus = () => {
    const session = localStorage.getItem('tg_session_string') || '';
    
    // 1. Get List of active autopilots
    fetch('/api/telegram/autopilot/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.activeList) {
          setActiveAutopilots(data.activeList);
        }
      })
      .catch((e) => console.error("Error loading active autopilots:", e));

    // 2. Load recent Autopilot Telemetry Logs
    fetch('/api/telegram/autopilot/logs')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.logs) {
          setAutopilotLogs(data.logs);
        }
      })
      .catch((e) => console.error("Error loading autopilot logs:", e));
  };

  // Dialog selection
  const selectedDialog = dialogs.find((d) => d.id === selectedDialogId);

  // Labels RU/EN
  const t = {
    title: lang === 'RU' ? 'Анализатор Сообщений' : 'Telegram Chat Analyzer',
    subtitle: lang === 'RU'
      ? 'Подключите свой аккаунт по SMS (безопасное демо через GramJS) для тактического разбора.'
      : 'Connect your Telegram account via secure SMS flow to receive elite communication strategies.',
    phoneLabel: lang === 'RU' ? 'Номер телефона Telegram' : 'Telegram Phone Number',
    phonePlaceholder: lang === 'RU' ? '+7 999 123-4567' : '+1 (555) 123-4567',
    sendCode: lang === 'RU' ? 'Получить код авторизации' : 'Send Verification Code',
    smsLabel: lang === 'RU' ? 'Введите SMS Код' : 'Enter SMS Code',
    codePlaceholder: lang === 'RU' ? 'Код из Telegram сообщения' : 'Telegram service SMS code',
    verifyCode: lang === 'RU' ? 'Подтвердить вход' : 'Verify and Sync Account',
    logout: lang === 'RU' ? 'Выйти' : 'Disconnect Account',
    recentDialogs: lang === 'RU' ? 'Ваши чаты и контакты' : 'Your Chats and Direct Messages',
    customPaste: lang === 'RU' ? 'Или вставьте диалог вручную' : 'Or paste a conversation transcript',
    customPastePlaceholder: lang === 'RU'
      ? 'John: Привет, когда пришлешь дизайн?\nМне: Завтра к обеду, ок?'
      : 'Alice: Hey, can you do the project for 5k?\nMe: That sounds decent, let me review...',
    selectDialogAlert: lang === 'RU' ? 'Выберите диалог ниже или вставьте текст' : 'Select a dialouge below or paste custom transcript',
    modeLabel: lang === 'RU' ? 'Режим тактики' : 'Tactics Mode',
    modeManual: lang === 'RU' ? 'Наложить Инструкцию' : 'Inject Custom Manual',
    modeGoal: lang === 'RU' ? 'Задать конкретную цель' : 'Define Strategic Goal',
    goalPlaceholder: lang === 'RU' ? 'Например: Закрыть сделку на $5000 или позвать на второе свидание...' : 'E.g., I want to convince John to agree to a $5000 retainer, or book a second date...',
    manualSelectLabel: lang === 'RU' ? 'Выберите инструкцию для выработки стиля' : 'Select active manual handbook rules',
    startAnalysis: lang === 'RU' ? 'Запустить AI-Анализ Переговоров' : 'Launch AI Tactical Analysis',
    noApiKey: lang === 'RU' ? 'Введите API ключ OpenRouter на странице настроек!' : 'Please set your OpenRouter API Key in the Settings page!',
    analyzingText: lang === 'RU' ? 'Анализируем диалог, вырабатываем стратегию...' : 'Deconstructing dialogue, generating strategies...',
    summary: lang === 'RU' ? 'Сводка и динамика общения' : 'Conversation Summary',
    working: lang === 'RU' ? 'Что сработало хорошо (Плюсы)' : 'What is working positive signals',
    notWorking: lang === 'RU' ? 'Ошибки и упущенные шансы (Минусы)' : 'Mistakes & Red Flags to avoid',
    advice: lang === 'RU' ? 'Тактические советы по переписке' : 'Tactical Communication Advice',
    suggestions: lang === 'RU' ? 'Рекомендуемые готовые сообщения' : 'Suggested Draft Messages to Send',
    assessment: lang === 'RU' ? 'Оценка шансов на успех' : 'Overall Assessment Score',
    verdict: lang === 'RU' ? 'Краткий вердикт' : 'Verdict',
    copy: lang === 'RU' ? 'Копировать' : 'Copy Message',
    followUp: lang === 'RU' ? 'Обсудить в чат-ассистенте' : 'Optimize via Coaching Chat',
    or: lang === 'RU' ? '- ИЛИ -' : '- OR -',
    customTab: lang === 'RU' ? 'Свободный ввод' : 'Pasted Log Input',
    telegramTab: lang === 'RU' ? 'Синхронизация аккаунта' : 'Direct TG Sync',
  };

  // Fetch dialogs from server on load (or use simulated database) and poll autopilots
  useEffect(() => {
    if (step === 'dialogs') {
      const activeSession = localStorage.getItem('tg_session_string') || '';

      const queryParams = activeSession
        ? `?session=${encodeURIComponent(activeSession)}`
        : '';

      fetch(`/api/telegram/dialogs${queryParams}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setDialogs(data.dialogs);
          }
        })
        .catch((e) => console.error(e));

      // Fetch active autopilots and logs when on dialogs dashboard
      syncAutopilotStatus();
      const interval = setInterval(syncAutopilotStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Initiate SMS Code sent request
  const handleConnectPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setLoading(true);
    setErrorPrompt(null);
    setIs2FARequired(false);

    // Light vibration on start
    if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    try {
      const response = await fetch('/api/telegram/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAuthId(data.authId);
        if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      } else {
        throw new Error(data.error || 'Connection request failed');
      }
    } catch (e: any) {
      setErrorPrompt(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify code & Establish session
  const handleVerifySMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsCode || !authId) return;

    setLoading(true);
    setErrorPrompt(null);

    try {
      const response = await fetch('/api/telegram/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          authId, 
          code: smsCode, 
          password: password2FA.trim() || undefined 
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setConnectedUser(data.user);
        localStorage.setItem('tg_analyzer_user', JSON.stringify(data.user));
        localStorage.setItem('tg_session_string', data.session);
        
        setIs2FARequired(false);
        setPassword2FA('');
        setStep('dialogs');
        if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      } else if (data.error === "2FA_PASSWORD_REQUIRED") {
        setIs2FARequired(true);
        if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
        }
      } else {
        throw new Error(data.error || 'Verification code or password is incorrect.');
      }
    } catch (e: any) {
      setErrorPrompt(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Disconnect Telegram 
  const handleDisconnect = () => {
    setConnectedUser(null);
    localStorage.removeItem('tg_analyzer_user');
    localStorage.removeItem('tg_session_string');
    setStep('connect');
    setSelectedDialogId(null);
    setPhone('');
    setSmsCode('');
    setAuthId(null);
    setPassword2FA('');
    setIs2FARequired(false);
  };

  // Search User by @Username helper
  const handleSearchUser = async () => {
    if (!searchUsername.trim()) return;
    setSearchLoading(true);
    setSearchError(null);

    const activeSession = localStorage.getItem('tg_session_string') || '';
    const queryParams = `?username=${encodeURIComponent(searchUsername.trim())}&session=${encodeURIComponent(activeSession)}`;

    try {
      const response = await fetch(`/api/telegram/search${queryParams}`);
      const data = await response.json();
      if (response.ok && data.success && data.dialog) {
        // Prepend new dialogue if not in list
        const found = dialogs.find((d) => d.id === data.dialog.id);
        if (!found) {
          setDialogs((prev) => [data.dialog, ...prev]);
        }
        setSelectedDialogId(data.dialog.id);
        setCustomLog('');
        setStep('configure');
        setSearchUsername('');
        if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      } else {
        throw new Error(data.error || 'Failed to search username.');
      }
    } catch (e: any) {
      setSearchError(e.message || 'Error occurred during username search.');
      if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStates({ ...copyStates, [id]: true });
    setTimeout(() => {
      setCopyStates({ ...copyStates, [id]: false });
    }, 2000);

    if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  // Deep coaching session analysis trigger
  const handleAnalyzeChat = async () => {
    if (!apiKey) {
      setErrorPrompt(t.noApiKey);
      return;
    }

    // Determine dialogue messages logs to compile
    let conversationTranscript = '';
    
    if (selectedDialogId) {
      const dialog = dialogs.find((d) => d.id === selectedDialogId);
      if (dialog) {
        conversationTranscript = dialog.messages.map((m) => `${m.sender}: ${m.text}`).join('\n');
      }
    } else if (customLog.trim()) {
      conversationTranscript = customLog.trim();
    } else {
      setErrorPrompt(t.selectDialogAlert);
      return;
    }

    setLoading(true);
    setErrorPrompt(null);

    if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    // Injected manual content placeholder
    let activeManualContent = '';
    let chosenManualName = '';
    if (analysisMode === 'manual' && selectedManualId) {
      const activeManual = manuals.find((m) => m.id === selectedManualId);
      if (activeManual) {
        activeManualContent = activeManual.content;
        chosenManualName = activeManual.name;
      }
    }

    const currentGoal = coachingGoal.trim() || (lang === 'RU' ? 'Выработка тактического преимущества и закрытие сделки' : 'Achieve strategic conversational alignment and clear direction');

    try {
      const prompt = `You are an expert communication coach, direct sales expert, and master conversational strategist.
You must perform a meticulously detailed analysis of the following complete Telegram conversation history log based on the active strategy manual prompt guidelines.

--- CONVERSATION CHAT LOG (COMPLETE RECENT TRANSCRIPT) ---
${conversationTranscript}
-----------------------------

User's communication goal: "${currentGoal}"
Active Strategy Guide/Manual (must analyze compliance with all roles, blocks, stages, and tasks specified in here):
"${activeManualContent || 'Direct, ecological relationship building and clear next steps.'}"

Analyze compliance against the manual step-by-step. Pinpoint exactly which block we are currently in, which guidelines the user followed well, and which goals are still unfulfilled.

Your response MUST follow this structured format explicitly, dividing each section with exact bracket headers. Do not include extra intro/outro lines.

[SUMMARY]
Write a highly analytical 3-sentence summary of the conversation dynamics, the overall relational status, and the underlying tone of the client.

[WORKING]
- Positive user signal or well-applied technique 1
- Positive user signal or well-applied technique 2
(List 2 or 3 bullet points starting with "- ")

[NOT_WORKING]
- Specific mistake, deviation from the manual, or suboptimal phrasing compiled from user messages 1
- Specific mistake, deviation from the manual, or suboptimal phrasing compiled from user messages 2
(List 3 precise, real mistakes of the user starting with "- ")

[STRUCTURE]
- Step 1: Status (Completed / In Progress / Not Started) & notes on of how it went.
- Step 2: Status (Completed / In Progress / Not Started) & notes on of how it went.
- Step 3: Status (Completed / In Progress / Not Started) & notes on of how it went.
(Include 3 to 4 sequential stages representing the dialogue structure & funnel milestones, showing current completion status)

[QUESTIONS_TO_ASK]
- Crucial detail to discover from client (e.g. pain points, background, qualification info) 1
- Crucial detail to discover from client (e.g. pain points, background, qualification info) 2
(List 2 or 3 vital questions or items to clarify/probe in the coming messages based on manual requirements)

[NEXT_STEPS]
- Strategic step 1 with clear action
- Strategic step 2 with clear action
(List 2 or 3 direct actionable steps on how to guide the client further down the line)

[MANUAL_COMPLIANCE]
Compare original user outputs to the strategy manual and provide a short 2-3 sentence review evaluating how well the user followed roles, rules, and stages. Mention specific compliance mistakes if any.

[ADVICE]
- Actionable tactical tip on styling, pacing, or conversational leverage 1
- Actionable tactical tip on styling, pacing, or conversational leverage 2
(List 2 or 3 tactical actionable bullet points starting with "- ")

[SUGGESTED_MESSAGES]
- SUGGESTION 1: Copy-pasteable suggested next draft text
- SUGGESTION 2: Copy-pasteable suggested next draft text
- SUGGESTION 3: Copy-pasteable suggested next draft text
(List exactly 3 highly authentic messages of various styles tailored to the manual. Keep them human, free of corporate speak, and very copy-pasteable)

[SCORE]
Give a numerical score between 1 and 10 of current relationship health / compliance. E.g. "7".

[VERDICT]
Write a 1-sentence strategic bottom-line verdict.

Remember to follow these markers exactly so the client software parses the advice blocks properly. Do not include any meta conversation. Translate the entire analysis to ${lang === 'RU' ? 'Russian (Русский язык)' : 'English language'}.`;

      // Trigger standard API Fetch towards modern proxy helper
      const response = await fetch('/api/llm/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.65,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `HTTP ${response.status}`);
      }

      const resultData = await response.json();
      const rawText = resultData.choices?.[0]?.message?.content || '';

      // Parser for structured results
      const parseSection = (marker: string, textStr: string): string[] => {
        const regex = new RegExp(`\\[${marker}\\]([\\s\\S]*?)(?=\\[|$)`, 'i');
        const match = textStr.match(regex);
        if (!match) return [];
        return match[1]
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.startsWith('-') || line.length > 3)
          .map((line) => line.replace(/^-\s*/, ''));
      };

      const summaryText = parseSection('SUMMARY', rawText).join(' ') || rawText.slice(0, 300) + '...';
      const workingList = parseSection('WORKING', rawText);
      const notWorkingList = parseSection('NOT_WORKING', rawText);
      const tacticalAdviceList = parseSection('ADVICE', rawText);
      const suggestionsList = parseSection('SUGGESTED_MESSAGES', rawText).map((msg) => {
        // Strip numbering "SUGGESTION 1: " or "- "
        return msg.replace(/^(SUGGESTION\s+\d+:\s*|- )/i, '').replace(/[\"\']/g, '').trim();
      });

      const conversationStructure = parseSection('STRUCTURE', rawText);
      const questionsToAsk = parseSection('QUESTIONS_TO_ASK', rawText);
      const nextStepsPath = parseSection('NEXT_STEPS', rawText);
      
      const manualComplianceMatch = rawText.match(/\[MANUAL_COMPLIANCE\]([\s\S]*?)(?=\[|$)/i);
      const manualCompliance = manualComplianceMatch 
        ? manualComplianceMatch[1].trim().replace(/^-\s*/gm, '') 
        : '';

      const scoreMatch = rawText.match(/\[SCORE\]\s*(\d+)/i);
      const parsedScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 7;
      
      const verdictMatch = rawText.match(/\[VERDICT\]\s*([^\n]+)/i);
      const parsedVerdict = verdictMatch ? verdictMatch[1].trim().replace(/[\"\']/g, '') : 'Proceed with caution according to instructions.';

      const finalResult: AnalysisResult = {
        id: `result_${Date.now()}`,
        dialogId: selectedDialogId || 'custom',
        dialogName: selectedDialogId ? (dialogs.find((d) => d.id === selectedDialogId)?.name || 'Sync Chat') : 'Pasted Log',
        summary: summaryText,
        whatIsWorking: workingList.length ? workingList : [lang === 'RU' ? 'Никаких грубых нарушений не замечено.' : 'No major conversational flaws detected.'],
        whatIsNotWorking: notWorkingList.length ? notWorkingList : [lang === 'RU' ? 'Грубых ошибок не зафиксировано.' : 'No red flags detected in current batch.'],
        tacticalAdvice: tacticalAdviceList.length ? tacticalAdviceList : [lang === 'RU' ? 'Продолжайте удерживать дружелюбную нить диалога.' : 'Continue maintaining a constructive approach.'],
        suggestedMessages: suggestionsList.length >= 2 ? suggestionsList : [rawText.slice(0, 100), 'Ask a direct clarifying question', 'Book a call tomorrow'],
        overallAssessment: parsedScore,
        overallVerdict: parsedVerdict,
        timestamp: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        goal: currentGoal,
        manualName: chosenManualName || undefined,
        conversationStructure,
        questionsToAsk,
        nextStepsPath,
        manualCompliance
      };

      setAnalysisResult(finalResult);
      localStorage.setItem('tg_analyzer_result', JSON.stringify(finalResult));
      
      // Save to analysisHistory persistent list
      setAnalysisHistory((prev) => {
        const nextHist = [finalResult, ...prev];
        localStorage.setItem('tg_coach_analyzes_history', JSON.stringify(nextHist));
        return nextHist;
      });

      setStep('results');

      if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

    } catch (e: any) {
      console.error(e);
      setErrorPrompt(e.message || 'API Query limit exceeded or structural failure.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutopilot = async (action: 'start' | 'stop') => {
    if (!selectedDialogId || !selectedDialog) return;
    
    setAutopilotToggling(true);
    setErrorPrompt(null);
    const session = localStorage.getItem('tg_session_string') || '';
    
    const contextInstruction = autopilotPersona === 'custom' 
      ? autopilotDirective 
      : personaDirectives[autopilotPersona];
      
    try {
      if (action === 'start') {
        const response = await fetch('/api/telegram/autopilot/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session,
            chatId: selectedDialogId,
            chatName: selectedDialog.name,
            contextName: getPersonaName(autopilotPersona),
            contextInstruction,
            lang
          })
        });
        const data = await response.json();
        if (data.success) {
          syncAutopilotStatus();
          setStep('dialogs');
          if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
          }
        } else {
          setErrorPrompt(data.error || "Failed to enable autopilot.");
        }
      } else {
        const response = await fetch('/api/telegram/autopilot/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session,
            chatId: selectedDialogId
          })
        });
        const data = await response.json();
        if (data.success) {
          syncAutopilotStatus();
          setStep('dialogs');
          if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
          }
        } else {
          setErrorPrompt(data.error || "Failed to turn off autopilot.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorPrompt(err.message || "Network error while toggling autopilot.");
    } finally {
      setAutopilotToggling(false);
    }
  };

  const handleSimulateAutopilotReply = async (incomingText: string) => {
    if (!selectedDialogId || !selectedDialog) return;
    setSimulating(true);
    setErrorPrompt(null);
    
    // Add incoming message to dialog visually so the user can see it right away!
    const mockMsg = {
      sender: selectedDialog.name,
      text: incomingText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Update local dialogs representation
    const updatedDialogs = dialogs.map((d) => {
      if (d.id === selectedDialogId) {
        return {
          ...d,
          lastMessage: incomingText,
          messages: [...d.messages, mockMsg]
        };
      }
      return d;
    });
    setDialogs(updatedDialogs);
    setSimText('');
    
    const contextInstruction = autopilotPersona === 'custom' 
      ? autopilotDirective 
      : personaDirectives[autopilotPersona];

    try {
      const response = await fetch('/api/telegram/autopilot/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incomingText,
          chatId: selectedDialogId,
          chatName: selectedDialog.name,
          contextInstruction,
          lang
        })
      });
      const data = await response.json();
      if (data.success && data.replyText) {
        // Add reply to dialogue
        const replyMsg = {
          sender: "Me",
          text: data.replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedDialogsWithReply = dialogs.map((d) => {
          if (d.id === selectedDialogId) {
            // Find if we already put our mockMsg in messages and avoid duplicate logs
            const withoutDuplicateMe = d.messages.filter(m => m !== mockMsg);
            return {
              ...d,
              lastMessage: data.replyText,
              messages: [...withoutDuplicateMe, mockMsg, replyMsg]
            };
          }
          return d;
        });
        setDialogs(updatedDialogsWithReply);
        syncAutopilotStatus();
        
        if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      } else {
        setErrorPrompt(data.error || "Failed to generate simulated response.");
      }
    } catch (e: any) {
      console.error(e);
      setErrorPrompt(e.message || "Simulation error.");
    } finally {
      setSimulating(false);
    }
  };

  const handleDeleteHistoryItem = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = analysisHistory.filter((item) => item.id !== idToDelete);
    setAnalysisHistory(updated);
    localStorage.setItem('tg_coach_analyzes_history', JSON.stringify(updated));
    
    if (analysisResult?.id === idToDelete) {
      setAnalysisResult(null);
      localStorage.removeItem('tg_analyzer_result');
    }

    if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  // Preloads the analyzed context into Chat and automatically switches to ChatView
  const handleInjectToActiveChat = (recommendation: string) => {
    if (!analysisResult) return;

    const dialogHeader = analysisResult.dialogName || 'Custom Log';
    const bulletList = (arr: string[]) => arr.map(item => `• ${item}`).join('\n');

    const formattedAnalysisContent = lang === 'RU'
      ? `### 📊 Анализ диалога: ${dialogHeader}
**Цель:** ${analysisResult.goal}
${analysisResult.manualName ? `**Инструкция:** ${analysisResult.manualName}` : ''}

**Краткая сводка:**
${analysisResult.summary}

**Вердикт:** ${analysisResult.overallVerdict}
**Шанс на успех:** ${analysisResult.overallAssessment}/10

**👍 Что сработало хорошо:**
${bulletList(analysisResult.whatIsWorking)}

**👎 Ошибки и упущенные шансы:**
${bulletList(analysisResult.whatIsNotWorking)}

**🎯 Тактические советы:**
${bulletList(analysisResult.tacticalAdvice)}

**💬 Выбранная готовая рекомендация для отправки:**
*"${recommendation}"*`
      : `### 📊 Dialogue Analysis: ${dialogHeader}
**Goal:** ${analysisResult.goal}
${analysisResult.manualName ? `**Source Manual:** ${analysisResult.manualName}` : ''}

**Conversation Summary:**
${analysisResult.summary}

**Strategic Verdict:** ${analysisResult.overallVerdict}
**Probability Level:** ${analysisResult.overallAssessment}/10

**👍 Working positive patterns:**
${bulletList(analysisResult.whatIsWorking)}

**👎 Mistakes & conversational red flags:**
${bulletList(analysisResult.whatIsNotWorking)}

**🎯 Tactical Recommendations:**
${bulletList(analysisResult.tacticalAdvice)}

**💬 Chosen draft recommendation:**
*"${recommendation}"*`;

    const userPromptText = lang === 'RU'
      ? `Запусти тактическое коучинг-сопровождение для моего общения с ${dialogHeader} по цели: "${analysisResult.goal}". Адаптируй выбранную рекомендацию: "${recommendation}"`
      : `Launch tactical coaching support for my conversation with ${dialogHeader} regarding goal: "${analysisResult.goal}". Help me adapt the chosen recommendation: "${recommendation}"`;

    const chatTitle = lang === 'RU' ? `Тактика - ${dialogHeader}` : `Tactics - ${dialogHeader}`;
    const newChatId = `chat_coach_${Date.now()}`;
    const newChat: Chat = {
      id: newChatId,
      title: chatTitle,
      messages: [
        {
          id: `coach_msg_1_${Date.now()}`,
          role: 'user',
          content: userPromptText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          id: `coach_msg_2_${Date.now()}`,
          role: 'assistant',
          content: formattedAnalysisContent + "\n\n" + (lang === 'RU'
            ? "Контекст загружен. Я готов обсудить этот диалог! Скажи, с какого сообщения начать, или попроси предложить другие варианты формулировок с определенной интонацией."
            : "Context established perfectly. I am ready to advise you on this dialogue! Tell me how to adjust the tone, or ask me to draft secondary options for specific replies."),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      activeManualIds: manuals.filter((m) => m.isActive).map((m) => m.id)
    };

    setChats([newChat, ...chats]);
    setActiveChatId(newChatId);
    setActiveTab('chat');

    if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  };

  if (loading) {
    const phasesRU = [
      "📡 Инициализация тактической нейросети...",
      "🔍 Анализ глубинной структуры транскрипта...",
      "🧠 Сопоставление с руководствами и планом...",
      "🎯 Формулирование поведенческих паттернов...",
      "💬 Сборка безупречных вариантов ответов..."
    ];
    const phasesEN = [
      "📡 Initializing tactical neural matrix...",
      "🔍 Analyzing micro-indicators inside dialog...",
      "🧠 Correlating stylebook guidelines...",
      "🎯 Synthesizing mental negotiation roles...",
      "💬 Forging high-converter reply templates..."
    ];
    const currentPhaseText = lang === 'RU' ? phasesRU[loaderPhase] : phasesEN[loaderPhase];

    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-tg-bg relative overflow-hidden select-none">
        
        {/* Glowing Background Grid */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(42,171,238,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(42,171,238,0.15)_1px,transparent_1px)] bg-[size:16px_16px]" />
        
        <div className="relative flex flex-col items-center max-w-sm space-y-6 z-10 w-full">
          
          {/* Circular Oracle Scan effect */}
          <div className="relative flex items-center justify-center">
            {/* outer ring */}
            <div className="h-28 w-28 rounded-full border border-tg-accent/20 animate-spin" style={{ animationDuration: '6s' }} />
            {/* intermediate ring */}
            <div className="absolute h-22 w-22 rounded-full border border-dashed border-tg-accent/40 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
            {/* core glowing pulse */}
            <div className="absolute h-16 w-16 rounded-full bg-tg-accent/10 border-2 border-tg-accent flex items-center justify-center shadow-[0_0_20px_rgba(42,171,238,0.4)] animate-pulse">
              <Sparkles className="h-7 w-7 text-tg-accent" />
            </div>
            {/* radar sweep bar */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gradient-to-b from-tg-accent via-tg-accent/40 to-transparent h-28 transform origin-center animate-spin" style={{ animationDuration: '2.5s' }} />
          </div>

          <div className="space-y-2.5 w-full">
            <h2 className="text-xs font-bold text-white tracking-widest uppercase font-mono">
              🛡️ {lang === 'RU' ? 'ТАКТИЧЕСКИЙ СКАНЕР' : 'COGNITIVE RADAR ACTIVE'}
            </h2>
            <div className="h-[24px] flex items-center justify-center">
              <p className="text-xs text-tg-accent font-semibold filter drop-shadow-[0_0_4px_rgba(42,171,238,0.3)] animate-pulse">
                {currentPhaseText}
              </p>
            </div>
          </div>

          {/* Simple percentage simulated line */}
          <div className="w-48 bg-[#1B2936] rounded-full h-1 border border-[#2A3C4D] overflow-hidden">
            <div 
              className="bg-tg-accent h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(42,171,238,0.6)]"
              style={{ width: `${(loaderPhase + 1) * 20}%` }}
            />
          </div>

          <p className="text-[10px] text-tg-secondary max-w-[280px] leading-relaxed italic animate-pulse">
            {lang === 'RU'
              ? 'На основе Gemini 3.5 Флэш без цензуры. Выравниваем стратегию общения...'
              : 'Powered by unrestricted Gemini 3.5 Flash. Aligning conversational blueprint...'}
          </p>
        </div>
      </div>
    );
  }

  // If we have a newly generated complex JSON report passed from ChatView, render the ProgressiveReport
  if (lastReport) {
    return (
      <div className="flex flex-col h-full bg-[#0E1520] p-4 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6 bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] p-3 border border-white/[0.05] rounded-2xl">
           <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-tg-accent to-blue-500 flex items-center justify-center shadow-lg">
             <Target className="h-5 w-5 text-white" />
           </div>
           <div>
             <h2 className="text-white font-bold tracking-tight">
               {lang === 'RU' ? 'Результат анализа' : 'Analysis Result'}
             </h2>
             <p className="text-[10px] text-tg-secondary">
               {lang === 'RU' ? 'Сгенерировано AI Coach' : 'Generated by AI Coach'}
             </p>
           </div>
           <button 
             onClick={() => setLastReport && setLastReport(null)}
             className="ml-auto text-xs bg-[#1E2D3D] text-white px-3 py-1.5 rounded hover:bg-tg-border transition cursor-pointer"
           >
             {lang === 'RU' ? 'Закрыть' : 'Close'}
           </button>
        </div>
        
        <ProgressiveReport 
          data={lastReport} 
          lang={lang} 
          isLoading={false} 
        />
      </div>
    );
  }

  // If NO lastReport, but we are supposed to render the new Action TAB content...
  // ACTUALLY if lastReport is null, we can render the main old dashboard from AnalyzerView,
  // or a placeholder if the user thinks it should be purely the report view.
  // We'll just safely let the old Dashboard render below when lastReport is null.

  return (
    <div id="analyzer-main-container" className="flex flex-col h-full bg-tg-bg relative z-10 animate-fade-in overflow-y-auto p-4 space-y-4 pb-20 select-none">
      
      {/* Visual Navigation Hub */}
      {step === 'results' && (
        <div className="flex justify-between items-center bg-[#1D2B3A] border border-white/[0.05] rounded-2xl px-3 py-2 text-xs">
          <span className="text-tg-accent font-semibold flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            {lang === 'RU' ? 'Разбор готов!' : 'Analysis ready!'}
          </span>
          <button
            onClick={() => {
              setStep(connectedUser ? 'dialogs' : 'connect');
              setSelectedDialogId(null);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] border border-white/[0.05] hover:bg-tg-bg text-tg-secondary font-medium transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {lang === 'RU' ? 'Новый разбор' : 'Restart Analysis'}
          </button>
        </div>
      )}

      {/* STEP 1: Phone sync panel */}
      {step === 'connect' && (
        <div className="space-y-4">
          <div className="bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] border border-white/[0.05] rounded-2xl p-4 shadow-sm">
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="h-5 w-5 text-tg-accent" />
              {t.title}
            </h1>
            <p className="text-xs text-tg-secondary mt-1">
              {t.subtitle}
            </p>
          </div>

          <div id="auth-box" className="bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] border border-white/[0.05] rounded-2xl p-4 space-y-4 shadow-md">
            <h2 className="text-xs font-bold text-tg-secondary uppercase tracking-wider font-mono border-b border-white/[0.05] pb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              {t.telegramTab}
            </h2>

            {!authId ? (
              <form onSubmit={handleConnectPhone} className="space-y-3">
                <p className="text-[11px] text-[#A0AEBC] leading-relaxed">
                  {lang === 'RU'
                    ? 'Анализируйте ваши реальные чаты в реальном времени. Введите ваш телефон для безопасной авторизации через GramJS.'
                    : 'Analyze your real dialogues in real-time. Input your phone to establish an encrypted local GramJS session.'}
                </p>

                <div className="space-y-1">
                  <label className="text-xs text-tg-secondary font-medium">{t.phoneLabel}</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.phonePlaceholder}
                    className="w-full bg-tg-bg border border-white/[0.05] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-tg-accent transition font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !phone}
                  className="w-full py-2.5 rounded-lg bg-tg-accent text-white hover:bg-tg-accent-hover font-semibold text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-3.8 w-3.8" />
                  {loading ? '...' : t.sendCode}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifySMS} className="space-y-3">
                {is2FARequired ? (
                  <div className="space-y-1.5 p-3 rounded-lg bg-red-500/5 border border-red-500/10 mb-2">
                    <p className="text-xs text-red-400 font-semibold leading-relaxed">
                      🔒 {lang === 'RU' ? 'Обнаружена Двухфакторная Аутентификация (2FA)!' : 'Two-Factor Authentication is active!'}
                    </p>
                    <label className="text-[10px] text-tg-secondary font-medium block">
                      {lang === 'RU' ? 'Введите ваш 2FA пароль' : 'Enter your 2FA password'}
                    </label>
                    <input
                      type="password"
                      required
                      value={password2FA}
                      onChange={(e) => setPassword2FA(e.target.value)}
                      placeholder="My 2FA Password"
                      className="w-full bg-tg-bg border border-red-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-amber-400 font-medium leading-relaxed bg-amber-500/5 px-2 py-1.5 rounded border border-amber-500/10">
                    ⚠️ {lang === 'RU' ? 'Код отправлен в ваш аккаунт Telegram (от служебного аккаунта или в SMS)' : 'Code sent to your Telegram account (from service account or SMS)'}
                  </p>
                )}

                <div className="space-y-1">
                  <label className="text-xs text-tg-secondary font-medium">{t.smsLabel}</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    placeholder={t.codePlaceholder}
                    className="w-full bg-tg-bg border border-white/[0.05] rounded-lg px-3 py-2.5 text-sm text-white text-center tracking-widest focus:outline-none focus:border-tg-accent transition font-mono"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthId(null);
                      setIs2FARequired(false);
                      setPassword2FA('');
                    }}
                    className="flex-1 py-2.5 rounded-lg bg-tg-bg border border-white/[0.05] text-xs text-tg-secondary hover:text-white"
                  >
                    {lang === 'RU' ? 'Назад' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-2.5 rounded-lg bg-tg-accent text-white hover:bg-tg-accent-hover font-bold text-xs"
                  >
                    {t.verifyCode}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {step === 'dialogs' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] border border-white/[0.05] rounded-2xl p-3 flex justify-between items-center select-none">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-tg-bg border border-white/[0.05] flex items-center justify-center text-sm shadow-inner text-white">
                <User className="h-4 w-4 text-tg-secondary" />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-none">
                  {connectedUser?.first_name || 'Alex'}
                </p>
                <p className="text-[10px] text-tg-secondary">
                  {connectedUser?.username ? `@${connectedUser.username}` : 'Authenticated Web Session'}
                </p>
              </div>
            </div>

            <button
              onClick={handleDisconnect}
              className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider font-mono bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded transition"
            >
              {t.logout}
            </button>
          </div>

          {/* TELEMETRY FEED IF ACTIVE */}
          {autopilotLogs.length > 0 && (
            <div className="bg-[#0b131c] border border-emerald-500/20 rounded-2xl p-3.5 space-y-2.5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-center select-none">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  📡 TELEMETRY: 24/7 AUTOPILOT STREAM
                </span>
                <span className="text-[9px] font-mono text-tg-secondary bg-tg-bg px-2 py-0.5 rounded border border-white/[0.05]">
                  {autopilotLogs.length} events
                </span>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {autopilotLogs.map((log) => (
                  <div key={log.id} className="p-2 rounded bg-tg-bg/80 border border-white/[0.05]/30 space-y-1 font-mono text-[10px]">
                    <div className="flex justify-between items-center text-gray-500 text-[8px]">
                      <span className="text-tg-accent font-bold">👉 Msg to: {log.chatName}</span>
                      <span>⏱️ {log.timestamp}</span>
                    </div>
                    <p className="text-gray-400 italic">Received: "{log.incomingMessage}"</p>
                    <p className="text-emerald-400 font-semibold leading-relaxed">
                      Auto-Replied: "{log.outgoingReply}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] border border-white/[0.05] rounded-2xl p-4 space-y-4">
            <div className="border-b border-white/[0.05] pb-1.5 flex justify-between items-center">
              <h2 className="text-xs font-bold text-tg-secondary uppercase tracking-wider font-mono">
                💬 {t.recentDialogs}
              </h2>
            </div>

            {/* Username Search bar */}
            <div className="space-y-1.5 bg-tg-bg/60 p-3 rounded-lg border border-white/[0.05]/40">
              <label className="text-[10px] text-tg-secondary font-bold uppercase tracking-wider block font-mono">
                🔍 {lang === 'RU' ? 'Поиск контакта по юзернейму' : 'Search Contact by @Username'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  placeholder="@username"
                  className="flex-1 bg-tg-bg border border-white/[0.05] rounded-lg px-2.5 py-1.8 text-xs text-white focus:outline-none focus:border-tg-accent transition font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearchUser();
                  }}
                />
                <button
                  type="button"
                  onClick={handleSearchUser}
                  disabled={searchLoading || !searchUsername.trim()}
                  className="px-3.5 py-1.8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_12px_rgba(59,130,246,0.5)] border border-white/5 text-xs font-bold transition disabled:opacity-50 shrink-0 select-none cursor-pointer"
                >
                  {searchLoading ? '...' : (lang === 'RU' ? 'Найти' : 'Search')}
                </button>
              </div>
              {searchError && (
                <p className="text-[10px] text-red-400 font-semibold mt-1">
                  ⚠️ {searchError}
                </p>
              )}
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {dialogs.map((d) => {
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedDialogId(d.id);
                      setCustomLog(''); // Ensure manual prompt log is removed
                      setStep('configure');
                    }}
                    className="w-full flex items-start gap-3 p-3 rounded-lg border border-transparent bg-tg-bg hover:bg-[#1E2D3D] hover:border-white/[0.05] transition duration-150 text-left select-none relative"
                  >
                    <div className="h-9 w-9 rounded-full text-white flex items-center justify-center font-bold text-sm shrink-0 shadow bg-gradient-to-tr from-[#3a5d8c] to-blue-500">
                      {d.name.substring(0, 1)}
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-bold text-white truncate leading-none">{d.name}</h3>
                      </div>
                      <p className="text-[11px] text-tg-secondary truncate mt-1.5 font-sans italic">
                        "{d.lastMessage}"
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* HISTORICAL ANALYSIS ARCHIVE (BROWSE SAVED SESSIONS) */}
          {analysisHistory.length > 0 && (
            <div className="bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] border border-white/[0.05] rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-tg-secondary uppercase tracking-wider font-mono flex items-center justify-between border-b border-white/[0.05] pb-1.5 leading-none select-none">
                <span>📜 {lang === 'RU' ? 'Архив прошлых разборов' : 'Tactical Analysis History'}</span>
                <span className="text-[9px] bg-tg-bg border border-white/[0.05] px-1.5 py-0.5 rounded text-tg-secondary font-mono">
                  {analysisHistory.length}
                </span>
              </h3>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {analysisHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setAnalysisResult(item);
                      setStep('results');
                      if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
                        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
                      }
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-tg-bg hover:bg-[#1E2D3D] border border-white/[0.05]/50 hover:border-tg-accent/40 transition cursor-pointer text-left"
                  >
                    <div className="flex-1 min-w-0 pr-2 font-sans">
                       <div className="flex items-center gap-1.5 select-none font-sans">
                        <span className="text-xs font-bold text-white truncate max-w-[130px]">
                          {item.dialogName}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                          item.overallAssessment >= 8 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : item.overallAssessment >= 5 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {item.overallAssessment}/10
                        </span>
                      </div>
                      <p className="text-[10px] text-tg-secondary truncate mt-1 italic select-none">
                        "{item.overallVerdict}"
                      </p>
                      <span className="text-[8px] text-gray-500 font-mono mt-1 block select-none">
                        ⏱️ {item.timestamp}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                      className="p-1.5 rounded-md text-tg-secondary hover:text-red-400 hover:bg-red-500/10 transition shrink-0 cursor-pointer"
                      title={lang === 'RU' ? 'Удалить из архива' : 'Delete from history'}
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Configure analysis mode */}
      {step === 'configure' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/[0.05] pb-1.5">
            <h2 className="text-xs font-bold text-tg-secondary uppercase font-mono">
              ⚙️ {lang === 'RU' ? 'Настройки Работы' : 'Dialog Setup'}
            </h2>
            <button
              onClick={() => setStep(connectedUser ? 'dialogs' : 'connect')}
              className="text-xs text-tg-secondary hover:text-white"
            >
              {lang === 'RU' ? 'Назад' : 'Back'}
            </button>
          </div>

          <div className="bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] border border-white/[0.05] rounded-2xl p-4 space-y-4 shadow">
            {selectedDialogId && selectedDialog ? (
              <div className="bg-[#101921] border border-white/[0.05]/60 rounded-lg p-2.5">
                <span className="text-[9px] text-tg-secondary font-mono uppercase block">
                  {lang === 'RU' ? 'Выбранный Собеседник:' : 'Target Participant:'}
                </span>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  👤 {selectedDialog.name}
                </span>
              </div>
            ) : (
              <div className="bg-tg-bg/80 border border-white/[0.05] rounded-lg p-2.5">
                <span className="text-[10px] text-tg-secondary block">
                  {lang === 'RU' ? 'Объект анализа:' : 'Target Chat:'}
                </span>
                <span className="text-xs font-bold text-white">
                  {lang === 'RU' ? 'Вручную скопированный диалог' : 'Custom pasted transcript log'}
                </span>
              </div>
            )}

            {/* COACHING TACTICAL DISCHARGE PANEL */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-tg-secondary font-semibold">{t.modeLabel}</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => setAnalysisMode('goal')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition ${
                      analysisMode === 'goal'
                        ? 'bg-tg-accent text-white border-tg-accent shadow-sm'
                        : 'bg-tg-bg text-tg-secondary border-white/[0.05] hover:bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05]/70'
                    }`}
                  >
                    🎯 {t.modeGoal}
                  </button>
                  <button
                    onClick={() => {
                      setAnalysisMode('manual');
                      if (manuals.length > 0 && !selectedManualId) {
                        setSelectedManualId(manuals[0].id);
                      }
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition ${
                      analysisMode === 'manual'
                        ? 'bg-tg-accent text-white border-tg-accent shadow-sm'
                        : 'bg-tg-bg text-tg-secondary border-white/[0.05] hover:bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05]/70'
                    }`}
                  >
                    📚 {t.modeManual}
                  </button>
                </div>
              </div>

              {analysisMode === 'goal' ? (
                <div className="space-y-1">
                  <label className="text-xs text-tg-secondary font-semibold">
                    {lang === 'RU' ? 'Цель общения' : 'Your Conversation Goal'}
                  </label>
                  <textarea
                    value={coachingGoal}
                    onChange={(e) => setCoachingGoal(e.target.value)}
                    rows={3}
                    placeholder={t.goalPlaceholder}
                    className="w-full bg-tg-bg border border-white/[0.05] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-tg-accent resize-none placeholder-gray-600 font-sans"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs text-tg-secondary font-semibold">{t.manualSelectLabel}</label>
                  {manuals.length === 0 ? (
                    <div className="p-3 bg-tg-bg/70 border border-dashed border-white/[0.05] rounded-lg text-center">
                      <p className="text-[11px] text-tg-secondary mb-2">
                        {lang === 'RU' ? 'У вас нет созданных инструкций в Библиотеке.' : 'You have no manuals in your Library.'}
                      </p>
                      <button
                        onClick={() => {
                          setActiveTab('manuals');
                        }}
                        className="px-2.5 py-1.5 rounded bg-tg-accent text-white text-[10px] font-bold"
                      >
                        {lang === 'RU' ? '+ Создать инструкцию' : '+ Add Manual'}
                      </button>
                    </div>
                  ) : (
                    <select
                      value={selectedManualId}
                      onChange={(e) => setSelectedManualId(e.target.value)}
                      className="w-full bg-tg-bg border border-white/[0.05] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-tg-accent"
                    >
                      {manuals.map((m) => (
                        <option key={m.id} value={m.id} className="bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] text-white text-xs">
                          {m.name} ({m.category})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <button
                onClick={handleAnalyzeChat}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_12px_rgba(59,130,246,0.5)] border border-white/5 font-bold text-xs rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="h-4.5 w-4.5" />
                {loading ? t.analyzingText : t.startAnalysis}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Results Dashboard Layout */}
      {step === 'results' && analysisResult && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200 select-text">
          
          {/* Main Scoring Header Card */}
          <div className="bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] border border-white/[0.05] rounded-2xl p-4 shadow-md flex items-center justify-between select-none">
            <div className="space-y-1">
              <span className="text-[10px] text-tg-secondary font-bold font-mono tracking-wider uppercase block">
                {lang === 'RU' ? 'ДИАЛОГ:' : 'TARGET:'} {analysisResult.dialogName}
              </span>
              <h2 className="text-xs text-tg-secondary italic select-none">
                "{analysisResult.overallVerdict}"
              </h2>
            </div>

            <div className="h-16 w-16 select-none rounded-full bg-[#112330] border-2 border-tg-accent flex flex-col items-center justify-center shadow-lg transform hover:scale-105 transition">
              <span className="text-lg font-bold text-tg-accent font-mono leading-none">
                {analysisResult.overallAssessment}
              </span>
              <span className="text-[8px] text-tg-secondary font-mono tracking-widest mt-1">/ 10</span>
            </div>
          </div>

          {/* Goal & Guidelines block */}
          <div className="bg-[#1C2938] border border-white/[0.05] rounded-2xl p-3 text-xs leading-normal select-text">
            <span className="text-[10px] text-[#A0AEBC] block font-semibold font-mono uppercase mb-1">
              🎯 {lang === 'RU' ? 'Поставленная цель:' : 'Configured goal:'}
            </span>
            <p className="text-white italic font-medium">"{analysisResult.goal}"</p>
            {analysisResult.manualName && (
              <span className="inline-block mt-1.5 bg-[#2AABEE]/15 border border-[#2AABEE]/30 text-tg-accent px-1.5 py-0.5 rounded text-[9px] font-mono select-none">
                📚 {lang === 'RU' ? 'Инструкция:' : 'Manual:'} {analysisResult.manualName}
              </span>
            )}
          </div>

          {/* Conversation Summary Section */}
          <div className="bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] border border-white/[0.05] rounded-2xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-tg-accent uppercase font-mono tracking-wider">
              📝 {t.summary}
            </h3>
            <p className="text-xs text-[#E2E8F0] leading-relaxed">
              {analysisResult.summary}
            </p>
          </div>

          {/* Bento-grid like pros & cons summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* pros */}
            <div className="bg-emerald-500/10 border-emerald-500/20 shadow-sm border border-[#214332] rounded-2xl p-4 space-y-2.5">
              <h3 className="text-xs font-bold text-emerald-400 uppercase font-mono tracking-wider flex items-center gap-1.5 select-none">
                🟢 {t.working}
              </h3>
              <ul className="space-y-1.5">
                {analysisResult.whatIsWorking.map((pt, i) => (
                  <li key={i} className="text-xs text-white leading-normal pl-3 relative shadow-sm">
                    <span className="absolute left-0 top-1 text-emerald-400 text-xs">•</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>

            {/* cons */}
            <div className="bg-red-500/10 border-red-500/20 shadow-sm border border-[#482226] rounded-2xl p-4 space-y-2.5">
              <h3 className="text-xs font-bold text-red-400 uppercase font-mono tracking-wider flex items-center gap-1.5 select-none">
                🔴 {lang === 'RU' ? 'Допущенные ошибки' : 'Flaws & Mistakes Committed'}
              </h3>
              <ul className="space-y-1.5">
                {analysisResult.whatIsNotWorking.map((pt, i) => (
                  <li key={i} className="text-xs text-white leading-normal pl-3 relative shadow-sm">
                    <span className="absolute left-0 top-1 text-red-400 text-xs">•</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* New Element: Manual Compliance Overview */}
          {analysisResult.manualCompliance && (
            <div className="bg-sky-500/10 border-sky-500/20 shadow-sm border border-[#21485c]/40 rounded-2xl p-4 space-y-2 shadow-inner">
              <h3 className="text-xs font-bold text-sky-450 uppercase font-mono tracking-wider flex items-center gap-1.5 select-none">
                🛡️ {lang === 'RU' ? 'Соответствие выбранной инструкции / мануалу' : 'Strategy Manual Alignment'}
              </h3>
              <p className="text-xs text-[#E2E8F0] leading-relaxed whitespace-pre-line">
                {analysisResult.manualCompliance}
              </p>
            </div>
          )}

          {/* New Element: Conversation Funnel Milestones (Structure) */}
          {analysisResult.conversationStructure && analysisResult.conversationStructure.length > 0 && (
            <div className="bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] border border-white/[0.05] rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider flex items-center gap-1.5 select-none">
                📊 {lang === 'RU' ? 'Структура и этапы общения (Funnel)' : 'Conversation Roadmap & Funnel Step'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {analysisResult.conversationStructure.map((step, i) => (
                  <div key={i} className="bg-[#172230] border border-white/[0.05]/50 rounded-lg p-2.5 flex gap-2.5 items-start">
                    <div className="h-5 w-5 rounded-full bg-[#1A2536] border border-amber-500/30 text-amber-400 flex items-center justify-center font-mono font-bold text-[9px] shrink-0 mt-0.5 select-none shadow-sm">
                      {i + 1}
                    </div>
                    <p className="text-[11px] text-white font-medium leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Element: Unreturned Details to Probe / Ask (Orange Card) */}
          {analysisResult.questionsToAsk && analysisResult.questionsToAsk.length > 0 && (
            <div className="bg-orange-500/10 border-orange-500/20 shadow-sm border border-[#4d3720] rounded-2xl p-4 space-y-2.5">
              <h3 className="text-xs font-bold text-orange-400 uppercase font-mono tracking-wider flex items-center gap-1.5 select-none">
                🔍 {lang === 'RU' ? 'Что еще стоит проработать / узнать у клиента' : 'Vital Information Still Needed'}
              </h3>
              <ul className="space-y-1.5">
                {analysisResult.questionsToAsk.map((pt, i) => (
                  <li key={i} className="text-xs text-orange-100/90 leading-relaxed pl-3.5 relative">
                    <span className="absolute left-0 top-1 text-orange-400 text-xs">•</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* New Element: Next Steps Roadmap on how to continue (Jade green card) */}
          {analysisResult.nextStepsPath && analysisResult.nextStepsPath.length > 0 && (
            <div className="bg-teal-500/10 border-teal-500/20 shadow-sm border border-[#1b4e43] rounded-2xl p-4 space-y-2.5 shadow-md">
              <h3 className="text-xs font-bold text-emerald-450 uppercase font-mono tracking-wider flex items-center gap-1.5 select-none">
                🚀 {lang === 'RU' ? 'Как пойти дальше: Пошаговый план продолжения' : 'How to Proceed: Action Roadmap'}
              </h3>
              <ul className="space-y-1.5">
                {analysisResult.nextStepsPath.map((pt, i) => (
                  <li key={i} className="text-xs text-emerald-100/90 leading-relaxed pl-3.5 relative">
                    <span className="absolute left-0 top-1 text-emerald-400 text-xs">•</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strategic Action Points Advice */}
          <div className="bg-purple-500/10 border-purple-500/20 shadow-sm border border-[#3E3F57] rounded-2xl p-4 space-y-2.5">
            <h3 className="text-xs font-bold text-violet-350 uppercase font-mono tracking-wider flex items-center gap-1.5 select-none">
              🧭 {lang === 'RU' ? 'Секреты и Коучинговые подсказки' : 'Coach Advice & Strategic Insights'}
            </h3>
            <ul className="space-y-2">
              {analysisResult.tacticalAdvice.map((pt, i) => (
                <li key={i} className="text-xs text-[#E9D5FF] leading-relaxed pl-3.5 relative">
                  <span className="absolute left-0 top-1 text-[#C084FC]">•</span>
                  {pt}
                </li>
              ))}
            </ul>
          </div>

          {/* SUGGESTED DRAFT ANSWERS (KEY FEATURE) */}
          <div className="space-y-2 leading-none">
            <h3 className="text-xs font-bold text-[#A0AEBC] uppercase font-mono tracking-wider select-none">
              💬 {t.suggestions}
            </h3>

            <div className="space-y-2.5 select-none">
              {analysisResult.suggestedMessages.map((msg, i) => {
                const uniqueId = `suggestion_${i}`;
                const isCopied = copyStates[uniqueId];
                return (
                  <div
                    key={i}
                    className="bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] border border-white/[0.05] rounded-2xl p-3.5 space-y-3 shadow-md border-l-2 border-l-tg-accent hover:border-l-tg-accent-hover transition flex flex-col justify-between"
                  >
                    <p className="text-xs text-white font-serif select-text italic leading-relaxed break-words">
                      "{msg}"
                    </p>

                    <div className="flex gap-2 justify-end self-end select-none">
                      <button
                        onClick={() => handleCopyText(msg, uniqueId)}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition ${
                          isCopied
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-tg-bg border-white/[0.05] text-tg-secondary hover:text-white hover:border-[#384a5c]'
                        }`}
                      >
                        <Copy className="h-3 w-3" />
                        {isCopied ? (lang === 'RU' ? 'Скопировано' : 'Copied!') : t.copy}
                      </button>

                      <button
                        onClick={() => handleInjectToActiveChat(msg)}
                        className="px-3 py-1.5 rounded-lg bg-tg-accent/15 hover:bg-tg-accent border border-tg-accent/20 hover:border-transparent text-tg-accent hover:text-white text-[10px] font-bold flex items-center gap-1 transition"
                      >
                        <MessageSquare className="h-3 w-3" />
                        {t.followUp}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Error Box prompt */}
      {errorPrompt && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-2 text-xs text-red-200">
          <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0" />
          <p>{errorPrompt}</p>
        </div>
      )}
    </div>
  );
}
