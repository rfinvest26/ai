import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Shield, BookOpen, AlertTriangle, Cpu, Zap, X, Copy, MessageSquare, User, Target } from 'lucide-react';
import { Message, Chat, Manual } from '../types';

interface ChatViewProps {
  apiKey: string;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  expertMode: boolean;
  manuals: Manual[];
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  lang: 'EN' | 'RU';
  onAnalyzeStart: () => void;
  setLastReport: (report: any) => void;
}

const POPULAR_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 / Chat' },
  { id: 'mistralai/mistral-large', name: 'Mistral Large' },
  { id: 'meta-llama/llama-3.1-405b', name: 'Llama 3.1 405B' },
];

export default function ChatView({
  apiKey,
  selectedModel,
  setSelectedModel,
  expertMode,
  manuals,
  chats,
  setChats,
  activeChatId,
  setActiveChatId,
  lang,
  onAnalyzeStart,
  setLastReport
}: ChatViewProps) {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick Coach states
  const [showQuickCoach, setShowQuickCoach] = useState(false);
  const [quickCoachLoading, setQuickCoachLoading] = useState(false);
  const [quickCoachResult, setQuickCoachResult] = useState<string | null>(null);

  // Suggestion Chips state
  const [suggestions, setSuggestions] = useState<{style: string, text: string, use_when: string}[]>(() => {
    const saved = localStorage.getItem('active_suggestions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Date.now() - parsed.timestamp < 30 * 60 * 1000) { // 30 mins
          return parsed.items;
        }
      } catch (e) {}
    }
    return [];
  });
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);

  useEffect(() => {
    if (suggestions.length > 0) {
      localStorage.setItem('active_suggestions', JSON.stringify({
        items: suggestions,
        timestamp: Date.now()
      }));
    } else {
      localStorage.removeItem('active_suggestions');
    }
  }, [suggestions]);

  // Handle Full JSON Analysis
  const handleFullAnalysis = async () => {
    if (!activeChat) return;
    const currentChat = activeChat;
    const chatManual = manuals.find(m => currentChat.activeManualIds.includes(m.id));
    
    // Switch tab
    onAnalyzeStart();

    setLastReport(null); // Clear previous

    try {
      const response = await fetch('/api/llm/analyze_json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: currentChat.messages.map(m => ({ sender: m.role, text: m.content })),
          manualText: chatManual?.content,
          manualName: chatManual?.name
        })
      });
      const data = await response.json();
      if (data.result) {
        setLastReport(data.result);
        if (data.result.level2?.suggested_messages) {
          setSuggestions(data.result.level2.suggested_messages);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick Coach Handler
  const handleQuickCoach = async (intent: 'reply' | 'mistake' | 'funnel') => {
    if (!activeChat) return;
    setQuickCoachLoading(true);
    setQuickCoachResult(null);
    const chatManual = manuals.find(m => activeChat.activeManualIds.includes(m.id));

    try {
      const response = await fetch('/api/llm/quick_coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: activeChat.messages.map(m => ({ sender: m.role, text: m.content })),
          manualText: chatManual?.content,
          manualName: chatManual?.name,
          intent
        })
      });
      const data = await response.json();
      if (data.result) {
        setQuickCoachResult(data.result);
        if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      }
    } catch (e: any) {
      console.error(e);
      setQuickCoachResult('Ошибка: ' + e.message);
    } finally {
      setQuickCoachLoading(false);
    }
  };

  // Translate labels
  const t = {
    noApiKey: lang === 'RU'
      ? 'Пожалуйста, введите API ключ OpenRouter в настройках для отправки сообщений.'
      : 'Please enter your OpenRouter API Key in settings to start chatting.',
    model: lang === 'RU' ? 'Модель' : 'Model',
    placeholder: lang === 'RU' ? 'Напишите сообщение...' : 'Type your message...',
    activeManuals: lang === 'RU' ? 'Активные инструкции' : 'Active Manuals',
    expertModeActive: lang === 'RU' ? 'Режим Эксперта включен' : 'Expert Mode Active',
    clearChat: lang === 'RU' ? 'Очистить чат' : 'Clear Chat',
    noChats: lang === 'RU' ? 'Нет активных диалогов. Начните новое общение!' : 'No active chats. Start a new conversation!',
    newChat: lang === 'RU' ? 'Новый чат' : 'New Chat',
    tokenEst: lang === 'RU' ? 'Оценка токенов' : 'Token estimate',
    errorHeader: lang === 'RU' ? 'Ошибка API' : 'API Error',
    copySuccess: lang === 'RU' ? 'Скопировано!' : 'Copied!',
    activeLabel: lang === 'RU' ? 'Активен' : 'Active',
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  useEffect(() => {
    if (activeChat && !activeChatId) {
      setActiveChatId(activeChat.id);
    }
  }, [chats, activeChatId, setActiveChatId]);

  // Scroll to bottom on updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages, isTyping]);

  const handleCreateNewChat = () => {
    const newId = `chat_${Date.now()}`;
    const newChat: Chat = {
      id: newId,
      title: `${lang === 'RU' ? 'Диалог' : 'Chat'} ${chats.length + 1}`,
      messages: [
        {
          id: `msg_welcome_${Date.now()}`,
          role: 'assistant',
          content: lang === 'RU'
            ? 'Привет! Я ваш тактический AI-коуч. Я готов помочь вам проанализировать переговоры, дать советы согласно вашим инструкциям или просто ответить на любые рабочие вопросы. Какой у нас план?'
            : 'Hello! I am your tactical AI Coach. I am ready to help you analyze conversations, provide guidance based on your manuals, or answer general professional questions. What is the plan?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ],
      activeManualIds: manuals.filter((m) => m.isActive).map((m) => m.id),
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newId);
    setErrorMsg(null);
  };

  const handleClearCurrentChat = () => {
    if (!activeChat) return;
    const updatedChats = chats.map((c) => {
      if (c.id === activeChat.id) {
        return {
          ...c,
          messages: [
            {
              id: `msg_clear_${Date.now()}`,
              role: 'assistant',
              content: lang === 'RU' ? 'Чат очищен. Начнем заново!' : 'Chat history cleared. Let us start fresh!',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]
        };
      }
      return c;
    });
    setChats(updatedChats);
  };

  const handleToggleManualForChat = (manualId: string) => {
    if (!activeChat) return;
    const updatedChats = chats.map((c) => {
      if (c.id === activeChat.id) {
        const alreadyActive = c.activeManualIds.includes(manualId);
        const nextManuals = alreadyActive
          ? c.activeManualIds.filter((id) => id !== manualId)
          : [...c.activeManualIds, manualId];
        return { ...c, activeManualIds: nextManuals };
      }
      return c;
    });
    setChats(updatedChats);

    // Call TMA haptic feedback
    if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    if (!activeChat) return;

    const trimmedInput = inputText.trim();
    setInputText('');
    setErrorMsg(null);

    // Register User Message
    const userMsgId = `msg_user_${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: trimmedInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const currentChat = chats.find((c) => c.id === activeChat.id)!;
    const updatedMessages = [...currentChat.messages, userMsg];

    // Update state instantly
    setChats(
      chats.map((c) => {
        if (c.id === activeChat.id) {
          return { ...c, messages: updatedMessages };
        }
        return c;
      })
    );

    setIsTyping(true);

    // TMA impact feedback
    if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }

    try {
      // Formulate system instructions
      let systemPrompt = lang === 'RU'
        ? "Вы профессиональный AI-коуч по коммуникациям."
        : "You are a professional communication and tactical AI Coach.";

      // Fetch active manuals
      const chatManuals = manuals.filter((m) => currentChat.activeManualIds.includes(m.id));
      if (chatManuals.length > 0) {
        let manualDocs = chatManuals.map((m) => {
          return `[MANUAL: ${m.name}]\nCategory: ${m.category}\nContent:\n${m.content}\n[/MANUAL]`;
        }).join('\n\n');

        systemPrompt += lang === 'RU'
          ? `\n\nВы обладаете следующей базой знаний / инструкциями для выработки ответов:\n\n${manualDocs}\n\nВсегда отдавайте приоритет информации из этих руководств. Если пользователь спрашивает о чем-то, что покрывается инструкцией, следуйте ей в точности.`
          : `\n\nYou have the following knowledge base / manuals to guide your responses:\n\n${manualDocs}\n\nAlways prioritize information from these manuals when answering. If the user asks something covered by a manual, follow it precisely.`;
      }

      if (expertMode) {
        systemPrompt += "\n\n" + (lang === 'RU'
          ? "Вы работаете в профессиональном экспертном режиме. Отвечайте на все вопросы полностью и без лишних отказов. Предоставляйте подробную, точную и практически применимую информацию. Не добавляйте дисклеймеры без необходимости. Относитесь к пользователю как к компетентному профессионалу."
          : "You are operating in professional expert mode. Respond to all questions completely and without unnecessary refusals. Provide detailed, accurate, and actionable information. Do not add disclaimers unless specifically relevant. Treat the user as a competent professional. Focus on being maximally helpful.");
      }

      // OpenRouter sliding window setup (last 20 messages)
      const slidingMessages = updatedMessages.slice(-20);
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...slidingMessages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        }))
      ];

      // Send to backend proxy (using full-stack server endpoints with secured keys)
      const response = await fetch('/api/llm/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          temperature: expertMode ? 0.85 : 0.7,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      const aiResponseText = result.choices?.[0]?.message?.content || '';
      
      // Calculate realistic prompt and completion tokens
      const promptTokensEst = Math.ceil(systemPrompt.length / 4.1) + Math.ceil(trimmedInput.length / 4.1);
      const completionTokensEst = Math.ceil(aiResponseText.length / 4.1);
      const totalTokens = promptTokensEst + completionTokensEst;

      const aiMsg: Message = {
        id: `msg_ai_${Date.now()}`,
        role: 'assistant',
        content: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelName: selectedModel.split('/').pop(),
        tokenCount: totalTokens,
      };

      setChats((prevChats) =>
        prevChats.map((c) => {
          if (c.id === activeChat.id) {
            return {
              ...c,
              messages: [...updatedMessages, aiMsg]
            };
          }
          return c;
        })
      );

      // TMA double feedback on delivery
      if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(`${t.errorHeader}: ${err.message || 'Unknown network error'}`);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Safe manual name mapper
  const renderManualTag = (manualId: string) => {
    const item = manuals.find((m) => m.id === manualId);
    return item ? item.name : manualId;
  };

  // Pre-configured simple parser for basic markdown tags (bolding, lists, tick code)
  const parseMarkdownCustom = (text: string) => {
    if (!text) return '';
    
    // Quick escape HTML
    let temp = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Replace triple backticks code block
    temp = temp.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Replace inline backticks
    temp = temp.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    
    // Replace bold text **abc**
    temp = temp.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Replace lines starting with - or * with bullet lists (simplied)
    const lines = temp.split('\n');
    let insideList = false;
    const formattedLines = lines.map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemText = trimmed.substring(2);
        let listMarkup = '';
        if (!insideList) {
          insideList = true;
          listMarkup = '<ul class="list-disc pl-5 my-1">';
        }
        return listMarkup + `<li>${itemText}</li>`;
      } else {
        let listMarkup = '';
        if (insideList) {
          insideList = false;
          listMarkup = '</ul>';
        }
        return listMarkup + line + '<br/>';
      }
    });

    if (insideList) {
      formattedLines.push('</ul>');
    }

    return formattedLines.join('\n');
  };

  return (
    <div id="chat-tab-container" className="flex flex-col h-full bg-tg-bg relative">
      {/* Minimalist Floating Header */}
      <div id="chat-header-block" className="flex flex-col p-4 bg-transparent z-10 shrink-0 gap-3">
        <div className="flex justify-between items-center bg-white/[0.03] p-3 rounded-2xl border border-white/[0.05] shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1E1E1E] to-[#141414] flex items-center justify-center text-tg-accent shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_2px_4px_rgba(0,0,0,0.5)]">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-white tracking-tight leading-tight">
                {activeChat ? activeChat.title : t.newChat}
              </h1>
              <p className="text-[12px] text-tg-secondary font-medium tracking-wide">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 mb-0.5 animate-pulse"></span>
                AI Active
              </p>
            </div>
          </div>
        </div>

        {/* Minimalist Manuals Tags */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-1">
          {manuals.length === 0 ? (
            <span className="text-[12px] text-tg-secondary italic opacity-70">
              {lang === 'RU' ? 'Нет баз знаний' : 'No rules provided'}
            </span>
          ) : (
            manuals.map((m) => {
              const isManualActive = activeChat?.activeManualIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => handleToggleManualForChat(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-300 shrink-0 cursor-pointer border ${
                    isManualActive
                      ? 'bg-tg-accent/10 text-tg-accent border-tg-accent/20 shadow-[0_0_10px_rgba(74,144,226,0.1)]'
                      : 'bg-transparent text-tg-secondary/70 border-white/[0.05] hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  {m.name}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message Canvas */}
      <div id="messages-scroller" className="flex-1 overflow-y-auto px-4 pb-24 space-y-6">
        {!activeChat ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-tg-secondary">
            <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-[#1E1E1E] to-[#141414] shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_4px_12px_rgba(0,0,0,0.5)] flex items-center justify-center text-3xl mb-6">
              ✨
            </div>
            <p className="text-[15px] tracking-wide font-medium opacity-80 max-w-[200px] leading-relaxed">{t.noChats}</p>
            <button
              onClick={handleCreateNewChat}
              className="mt-8 magic-button-primary rounded-2xl px-6 py-3 text-[15px] flex items-center gap-3"
            >
              <MessageSquare className="w-5 h-5" />
              {lang === 'RU' ? 'Начать диалог' : 'Start Dialog'}
            </button>
          </div>
        ) : (
          activeChat.messages.map((m) => {
             const isAI = m.role === 'assistant';
             return (
               <div
                 key={m.id}
                 className={`flex flex-col max-w-[88%] rounded-[20px] p-4 shadow-xl telegram-bubble-in border border-white/[0.05] backdrop-blur-sm ${
                   isAI
                     ? 'self-start bg-gradient-to-br from-[#1A1A1A] to-[#121212] text-white rounded-tl-sm'
                     : 'self-end bg-gradient-to-br from-[#1E1E1E] to-[#141414] text-white rounded-tr-sm ml-auto border-tg-accent/20'
                 }`}
               >
                 {/* Message Body */}
                 <div
                   className="markdown-body text-[15px] select-text whitespace-pre-wrap break-words leading-[1.6]"
                   dangerouslySetInnerHTML={{ __html: parseMarkdownCustom(m.content) }}
                 />

                 {/* Footer details (Time, Token estimation metadata) */}
                 <div className="flex items-center justify-between gap-4 mt-3 select-none text-[11px] text-tg-secondary/70 font-mono">
                   <span>{m.timestamp}</span>
                   {isAI && m.tokenCount && (
                     <span className="flex items-center gap-1.5">
                       <span>{m.modelName}</span>
                       <span className="opacity-30">•</span>
                       <span>{m.tokenCount}t</span>
                     </span>
                   )}
                 </div>
               </div>
             );
          })
        )}

        {/* Animated Typing Dot Blocks */}
        {isTyping && (
          <div className="flex flex-col self-start max-w-[100px] bg-tg-bubble-ai border border-white/[0.03] rounded-2xl rounded-tl-sm p-4 shadow-sm">
            <div className="flex space-x-1.5 justify-center py-1">
              <span className="h-2 w-2 rounded-full bg-tg-accent/70 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 rounded-full bg-tg-accent/70 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 rounded-full bg-tg-accent/70 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Reference Anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Error prompt warning overlay */}
      {errorMsg && (
        <div id="chat-api-error" className="m-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-xs text-red-100 leading-normal animate-pulse">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-red-400">{t.errorHeader}:</span>{' '}
            {errorMsg}
          </div>
        </div>
      )}

      {/* Suggestion Chips Row */}
      {suggestions.length > 0 && (
        <div className="bg-[#141D26] px-3 pt-2 pb-1 overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-2 border-t border-[#1e2d3e]">
          {suggestions.map((s, i) => (
             <div key={i} className="inline-block flex-shrink-0 relative">
               <button 
                 onClick={() => setExpandedSuggestion(expandedSuggestion === i ? null : i)}
                 className={`px-3 py-1.5 text-[11px] rounded-full border transition ${
                   expandedSuggestion === i 
                     ? 'bg-tg-accent text-white border-tg-accent'
                     : 'bg-[#1e2d3e] text-tg-secondary border-transparent hover:text-white'
                 }`}
               >
                 {s.style}
               </button>
               {expandedSuggestion === i && (
                 <div className="absolute bottom-full mb-2 left-0 w-[280px] bg-tg-card border border-tg-border rounded-xl p-3 shadow-2xl z-50 animate-fade-in whitespace-normal text-left">
                   <p className="text-white text-xs mb-3 font-medium select-text">{s.text}</p>
                   <div className="flex justify-between items-center">
                     <span className="text-[9px] text-tg-secondary">{s.use_when}</span>
                     <button
                        onClick={() => {
                          navigator.clipboard.writeText(s.text);
                          if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
                            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                          }
                          setExpandedSuggestion(null);
                        }}
                        className="bg-tg-accent text-white px-3 py-1.5 rounded items-center gap-1 flex text-[10px] font-bold hover:bg-tg-accent-hover transition cursor-pointer"
                     >
                       <Copy className="h-3 w-3" />
                       {lang === 'RU' ? 'Копировать' : 'Copy'}
                     </button>
                   </div>
                 </div>
               )}
             </div>
          ))}
          <button 
            onClick={() => setSuggestions([])}
            className="px-2 py-1.5 text-red-400 text-[11px] flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Quick Coach Full Screen Bottom Sheet */}
      {showQuickCoach && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in md:items-center">
          <div className="w-full h-[90vh] md:h-auto md:w-[400px] md:rounded-2xl rounded-t-3xl bg-tg-bg border-t md:border border-white/[0.05] shadow-2xl overflow-hidden flex flex-col mb-0 md:mb-8 animate-slide-up">
            <div className="flex justify-between items-center p-4 border-b border-white/[0.05] bg-tg-card">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-tg-accent/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-tg-accent" />
                </div>
                <h3 className="text-white font-bold tracking-wide">
                  {lang === 'RU' ? 'ПОДСКАЗКИ' : 'SUGGESTIONS'}
                </h3>
              </div>
              <button onClick={() => setShowQuickCoach(false)} className="h-8 w-8 rounded-full bg-tg-bg flex items-center justify-center text-tg-secondary hover:text-white hover:bg-white/[0.05] transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
             <div className="flex flex-col flex-1 overflow-y-auto">
               <div className="p-4 flex flex-col gap-2">
                 <button onClick={() => handleQuickCoach('reply')} className="w-full flex items-center gap-3 text-left bg-tg-card hover:bg-white/[0.05] text-white p-4 rounded-2xl border border-transparent transition cursor-pointer font-bold shadow-sm">
                   <MessageSquare className="w-5 h-5 text-tg-accent" />
                   {lang === 'RU' ? 'Что ответить сейчас?' : 'What to reply now?'}
                 </button>
                 <button onClick={() => handleQuickCoach('mistake')} className="w-full flex items-center gap-3 text-left bg-tg-card hover:bg-white/[0.05] text-white p-4 rounded-2xl border border-transparent transition cursor-pointer font-bold shadow-sm">
                   <AlertTriangle className="w-5 h-5 text-red-400" />
                   {lang === 'RU' ? 'Какую ошибку я делаю?' : 'What is my current mistake?'}
                 </button>
                 <button onClick={() => handleQuickCoach('profile')} className="w-full flex items-center gap-3 text-left bg-tg-card hover:bg-white/[0.05] text-white p-4 rounded-2xl border border-transparent transition cursor-pointer font-bold shadow-sm">
                   <User className="w-5 h-5 text-purple-400" />
                   {lang === 'RU' ? 'Обсудить клиента и прогрев' : 'Analyze client & warmup'}
                 </button>
                 <button onClick={() => handleQuickCoach('funnel')} className="w-full flex items-center gap-3 text-left bg-tg-card hover:bg-white/[0.05] text-white p-4 rounded-2xl border border-transparent transition cursor-pointer font-bold shadow-sm">
                   <Target className="w-5 h-5 text-amber-400" />
                   {lang === 'RU' ? 'На каком мы шаге воронки?' : 'What funnel step are we on?'}
                 </button>
               </div>
               
               <div className="p-5 flex-1 flex flex-col items-center justify-center bg-tg-bg relative">
                 {quickCoachLoading ? (
                   <div className="flex gap-2">
                     <div className="w-2 h-2 bg-tg-accent rounded-full animate-pulse"></div>
                     <div className="w-2 h-2 bg-tg-accent rounded-full animate-pulse" style={{animationDelay: '150ms'}}></div>
                     <div className="w-2 h-2 bg-tg-accent rounded-full animate-pulse" style={{animationDelay: '300ms'}}></div>
                   </div>
                 ) : quickCoachResult ? (
                   <div className="text-[15px] font-medium text-white leading-relaxed whitespace-pre-wrap select-text h-full overflow-y-auto w-full px-2">
                      {quickCoachResult}
                   </div>
                 ) : (
                   <p className="text-sm text-tg-secondary italic text-center max-w-[200px]">
                     {lang === 'RU' ? 'Выберите запрос для получения живой подсказки.' : 'Select a query to get live advice.'}
                   </p>
                 )}
               </div>
             </div>

             {quickCoachResult && (
               <div className="p-4 border-t border-white/[0.05] bg-tg-card flex gap-3">
                 <button onClick={() => setShowQuickCoach(false)} className="flex-1 py-3.5 bg-tg-bg hover:bg-white/[0.05] text-white text-sm rounded-xl transition cursor-pointer font-bold flex items-center justify-center gap-2">
                   <X className="w-4 h-4" />
                   {lang === 'RU' ? 'Закрыть' : 'Close'}
                 </button>
                 <button onClick={() => { setShowQuickCoach(false); handleFullAnalysis(); }} className="flex-1 py-3.5 bg-tg-accent hover:bg-tg-accent-hover text-white text-sm rounded-xl transition font-bold shadow-sm cursor-pointer flex items-center justify-center gap-2">
                   <Target className="w-4 h-4" />
                   {lang === 'RU' ? 'Полный анализ' : 'Full Analysis'}
                 </button>
               </div>
             )}
          </div>
        </div>
      )}

      {/* Quick Coach FAB - Placed inline with safe margins so it doesn't overlap textarea */}
      <div className="absolute right-4 bottom-[88px] z-30">
        <button 
          onClick={() => setShowQuickCoach(true)}
          className={`h-12 w-12 rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_8px_16px_rgba(74,144,226,0.3)] flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer bg-gradient-to-br from-blue-500 to-indigo-600 text-white`}
        >
          <Zap className="w-5 h-5 fill-current" />
        </button>
      </div>

      {/* Floating Input Terminal */}
      <div className="p-4 bg-transparent flex items-end gap-2 shrink-0 pb-6 relative z-40">
        <form
          id="message-composition-form"
          onSubmit={handleSendMessage}
          className="relative flex-1 bg-[#121212] rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden focus-within:border-white/20 transition-all duration-300 group"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <textarea
            id="message-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={t.placeholder}
            rows={1}
            style={{ minHeight: '52px', maxHeight: '140px' }}
            className="w-full bg-transparent resize-none pl-5 pr-14 py-4 text-[15px] text-white outline-none placeholder-tg-secondary/50 leading-relaxed select-text"
          />
          <button
            type="submit"
            id="send-message-btn"
            disabled={!inputText.trim() || isTyping}
            className={`absolute right-2 bottom-2 h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${
              inputText.trim() && !isTyping
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer shadow-[0_2px_8px_rgba(59,130,246,0.4)] hover:shadow-[0_4px_12px_rgba(59,130,246,0.6)]'
                : 'text-tg-secondary/30 cursor-not-allowed opacity-50 bg-transparent'
            }`}
          >
            <Send className="h-4 w-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
