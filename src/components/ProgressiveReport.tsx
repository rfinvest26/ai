import React, { useState, useEffect } from 'react';
import { Target, AlertTriangle, CheckCircle, Copy, ChevronDown, ChevronUp } from 'lucide-react';

export interface ReportData {
  level0: {
    funnel_step: number;
    signal: 'green' | 'yellow' | 'red';
  };
  level1: {
    priority_action: string;
    next_step: string;
  };
  level2: {
    questions_to_ask: string[];
    suggested_messages: { style: string; text: string; use_when: string }[];
  };
  level3: {
    summary: string;
    working: string[];
    not_working: string[];
    compliance_verdict: string;
    missing_info: string[];
    confidence: number;
  };
}

interface ProgressiveReportProps {
  data: ReportData;
  isLoading?: boolean;
  lang: 'EN' | 'RU';
}

export default function ProgressiveReport({ data, isLoading, lang }: ProgressiveReportProps) {
  const [level, setLevel] = useState<number>(0);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setLevel(0);
      return;
    }

    // Step-by-step reveal
    const t1 = setTimeout(() => setLevel(1), 500); // 0.5s for level 1
    const t2 = setTimeout(() => setLevel(2), 1500); // 1.5s for level 2

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isLoading, data]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  if (isLoading || level === 0) {
    return (
      <div className="p-4 bg-tg-bg rounded-xl border border-tg-border space-y-4 animate-fade-in">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold uppercase text-tg-secondary">
            {lang === 'RU' ? 'Анализирую воронку...' : 'Analyzing Funnel...'}
          </span>
          <div className="flex gap-1 items-center">
             <div className="w-2 h-2 rounded-full bg-yellow-500 animate-ping" />
          </div>
        </div>
        <div className="flex h-2 bg-[#1A2634] rounded-full overflow-hidden">
          <div 
            className="h-full bg-tg-accent transition-all duration-1000"
            style={{ width: `${(data?.level0?.funnel_step || 1) * 20}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-tg-secondary font-mono">
          <span>Шаг 1</span>
          <span>Шаг 5</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in w-full">
      {/* Level 1: Main Action */}
      {(level >= 1) && (
        <div className={`p-4 rounded-xl border ${
          data.level0.signal === 'green' ? 'bg-emerald-500/10 border-emerald-500/30' :
          data.level0.signal === 'red' ? 'bg-red-500/10 border-red-500/30' :
          'bg-amber-500/10 border-amber-500/30'
        }`}>
          <div className="flex items-start gap-3">
             <div className="pt-1">
               {data.level0.signal === 'red' && <AlertTriangle className="h-5 w-5 text-red-400" />}
               {data.level0.signal === 'green' && <CheckCircle className="h-5 w-5 text-emerald-400" />}
               {data.level0.signal === 'yellow' && <Target className="h-5 w-5 text-amber-400" />}
             </div>
             <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  {lang === 'RU' ? 'Главная мысль' : 'Priority Action'}
                </h3>
                <p className="text-xs text-tg-secondary mb-2 leading-relaxed">
                  {data.level1.priority_action}
                </p>
                <div className="bg-[#101820] rounded p-2 border border-[#253545]">
                  <span className="text-[10px] uppercase font-bold text-tg-accent block mb-1">
                    {lang === 'RU' ? 'Следующий шаг:' : 'Next Step:'}
                  </span>
                  <p className="text-xs text-white">
                    {data.level1.next_step}
                  </p>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Level 2: Templates and Questions */}
      {level >= 2 && (
        <div className="space-y-4 animate-fade-in">
          {(data.level2.questions_to_ask?.length > 0) && (
            <div className="p-3 bg-tg-bg border border-tg-border rounded-xl">
              <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wide">
                {lang === 'RU' ? 'Задать эти вопросы' : 'Questions to Ask'}
              </h4>
              <ul className="list-disc pl-4 space-y-1">
                {data.level2.questions_to_ask.map((q, i) => (
                  <li key={i} className="text-xs text-tg-secondary">{q}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
             <h4 className="text-xs font-bold text-white uppercase tracking-wide px-1">
                {lang === 'RU' ? 'Готовые ответы' : 'Suggested Replies'}
             </h4>
             {data.level2.suggested_messages?.map((msg, i) => (
                <div key={i} className="bg-[#1A2634] border border-[#2B3B4C] p-3 rounded-xl relative group">
                  <div className="flex justify-between items-center mb-1">
                     <span className="text-[10px] font-mono text-tg-accent bg-tg-accent/10 px-1.5 py-0.5 rounded">
                       {msg.style}
                     </span>
                     <button
                        onClick={() => handleCopy(msg.text)}
                        className="text-tg-secondary hover:text-white transition p-1 cursor-pointer"
                        title="Copy"
                     >
                       <Copy className="h-3 w-3" />
                     </button>
                  </div>
                  <p className="text-sm text-white pr-6 leading-snug">
                    {msg.text}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-2 italic">
                    Когда: {msg.use_when}
                  </p>
                </div>
             ))}
          </div>
        </div>
      )}

      {/* Level 3: Full Analysis Collapsible */}
      {level >= 2 && (
        <div className="border-t border-[#253545] pt-4 mt-4">
          <button 
            onClick={() => setShowFull(!showFull)}
            className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-tg-secondary hover:text-white transition cursor-pointer"
          >
            {showFull ? (lang === 'RU' ? 'Скрыть полный анализ' : 'Hide Full Analysis') : (lang === 'RU' ? 'Раскрыть полный анализ' : 'Show Full Analysis')}
            {showFull ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {showFull && (
            <div className="p-4 bg-[#141C24] rounded-xl border border-[#253545] mt-2 space-y-4 animate-fade-in text-xs">
              <div>
                <h4 className="font-bold text-white mb-1">Резюме</h4>
                <p className="text-tg-secondary">{data.level3.summary}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h4 className="font-bold text-emerald-400 mb-1">Сильные стороны</h4>
                  <ul className="list-disc pl-4 text-emerald-300/80 space-y-1">
                    {data.level3.working.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-red-400 mb-1">Ошибки</h4>
                  <ul className="list-disc pl-4 text-red-300/80 space-y-1">
                    {data.level3.not_working.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-tg-accent mb-1">Соответствие мануалу</h4>
                <p className="text-tg-secondary">{data.level3.compliance_verdict}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
