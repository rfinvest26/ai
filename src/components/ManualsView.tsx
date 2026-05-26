import React, { useState } from 'react';
import { BookOpen, Tag, Plus, Check, Trash2, Edit2, Download, Upload, AlertCircle } from 'lucide-react';
import { Manual } from '../types';

interface ManualsViewProps {
  manuals: Manual[];
  setManuals: React.Dispatch<React.SetStateAction<Manual[]>>;
  lang: 'EN' | 'RU';
}

const CATEGORIES = ['Negotiation', 'Sales', 'Relationships', 'Tech/Product', 'Psychology', 'Other'];
const CATEGORIES_RU = ['Переговоры', 'Продажи', 'Отношения', 'Технологии/Продукт', 'Психология', 'Другое'];

export default function ManualsView({ manuals, setManuals, lang }: ManualsViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Negotiation');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Translates
  const t = {
    title: lang === 'RU' ? 'Библиотека Инструкций' : 'Manuals & Guides',
    subtitle: lang === 'RU'
      ? 'Создавайте или загружайте инструкции. AI адаптирует свои ответы и советы под эти материалы.'
      : 'Create or load custom knowledge bases. The AI will strictly adapt its tips and guidance according to these rules.',
    addBtn: lang === 'RU' ? 'Добавить Инструкцию' : 'Add New Manual',
    search: lang === 'RU' ? 'Поиск инструкций...' : 'Search manuals...',
    namePlaceholder: lang === 'RU' ? 'Например: Скрипт Продаж ИТ v2' : 'E.g., B2B Sales Script v2',
    nameLabel: lang === 'RU' ? 'Название инструкции' : 'Manual Name',
    categoryLabel: lang === 'RU' ? 'Категория' : 'Category',
    contentLabel: lang === 'RU' ? 'Содержимое (Скрипты, правила, контекст)' : 'Manual Text (Content, rules, scripts, context)',
    contentPlaceholder: lang === 'RU' ? 'Вставьте сюда регламент, примеры диалогов, правила общения...' : 'Paste your playbooks, sample conversations, golden rules, etc...',
    cancel: lang === 'RU' ? 'Отмена' : 'Cancel',
    save: lang === 'RU' ? 'Сохранить' : 'Save',
    activeStatus: lang === 'RU' ? 'Активно по умолчанию' : 'Default Active',
    noManuals: lang === 'RU' ? 'Пока нет загруженных инструкций.' : 'No manual playbooks loaded yet.',
    createFirst: lang === 'RU' ? 'Создать из шаблона' : 'Load Default Templates',
    deleteConfirm: lang === 'RU' ? 'Вы уверены, что хотите удалить эту инструкцию?' : 'Are you sure you want to delete this manual?',
  };

  // Pre-load default template options
  const handleLoadTemplates = () => {
    const templates: Manual[] = [
      {
        id: 'tmpl_sales',
        name: lang === 'RU' ? '🎯 Мастер Продаж (B2B Close)' : '🎯 B2B High-Ticket Closer',
        category: 'Sales',
        content: lang === 'RU'
          ? `ПРАВИЛА ПРОДАЖ С ВЫСОКИМ ЧЕКОМ:\n1. Никогда не делайте скидку без встречного шага (например, предоплата сегодня).\n2. На возражение "Дорого" отвечайте декомпозицией: "Какая окупаемость инвестиций вам нужна?"\n3. Всегда заканчивайте свои фразы вопросом.\n4. Используйте триггер дефицита: "Есть только одно свободное окно на внедрение во 2 квартале".`
          : `HIGH-TICKET SALES PLAYBOOK:\n1. Never offer a discount without requesting a concession in return (e.g. upfront payment today).\n2. Handle "It is too expensive" objection with ROI decomposition: "Let us review what return on investment you expect."\n3. Always close every message with an open-ended strategic question.\n4. Introduce high-scarcity: "There is currently only one onboarding slot left for Q2."`,
        isActive: true
      },
      {
        id: 'tmpl_negotiators',
        name: lang === 'RU' ? '🤝 Гарвардские Переговоры (BATNA)' : '🤝 Harvard Negotiation Method',
        category: 'Negotiation',
        content: lang === 'RU'
          ? `ГАРВАРДСКИЙ МЕТОД ПЕРЕГОВОРОВ:\n1. Отделяйте людей от проблемы. Будьте мягкими с людьми, но твердыми с фактами.\n2. Фокусируйтесь на интересах сторон, а не на фиксированных позициях.\n3. Обсуждайте взаимно выгодные варианты (создавайте дополнительную ценность).\n4. Настаивайте на использовании объективных критериев (рыночные цены, законы).\n5. Постоянно держите в уме свою НАОС (BATNA — лучшая альтернатива обсуждаемому соглашению).`
          : `HARVARD NEGOTIATION METHODOLOGY:\n1. Separate the people from the problem. Be soft on the people, but hard on the core issues.\n2. Focus on underlying interests, never on rigid defensive positions.\n3. Invent options for mutual gain beforehand.\n4. Insist on objective evaluation standards.\n5. Keep your BATNA (Best Alternative to a Negotiated Agreement) close and do not compromise beyond it.`,
        isActive: true
      },
      {
        id: 'tmpl_harmony',
        name: lang === 'RU' ? '❤️ Гармония в Отношениях' : '❤️ Relationship Harmony',
        category: 'Relationships',
        content: lang === 'RU'
          ? `МЕТОДИКА МЯГКОГО ОБЩЕНИЯ:\n1. Говорите через "Я-сообщения": "Мне было бы очень приятно, если...", вместо "Ты никогда не делаешь...".\n2. Избегайте генерализаций: слов "всегда", "никогда", "вечно".\n3. Подтверждайте чувства собеседника: "Я понимаю твои переживания, это действительно обидно".\n4. Фокусируйтесь на конкретном факте в настоящем, не вспоминайте ошибки прошлого.`
          : `HEALTHY RELATIONSHIP STRATEGY:\n1. Always utilize "I-statements" instead of "You-statements". E.g., "I feel distressed when..." instead of "You never do...".\n2. Avoid using generalizations like "always", "never", "constantly".\n3. Actively validate the partner's emotions: "I hear you, and your perspective makes complete sense."\n4. Focus intensely on the present issue, never bring up historic mistakes.`,
        isActive: false
      }
    ];

    setManuals([...manuals, ...templates]);

    if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    if (editingId) {
      setManuals((prev) =>
        prev.map((m) =>
          m.id === editingId
            ? { ...m, name: name.trim(), content: content.trim(), category }
            : m
        )
      );
      setEditingId(null);
    } else {
      const newManual: Manual = {
        id: `manual_${Date.now()}`,
        name: name.trim(),
        content: content.trim(),
        category,
        isActive: true,
      };
      setManuals([newManual, ...manuals]);
    }

    setName('');
    setContent('');
    setIsAdding(false);

    if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const handleEdit = (manual: Manual) => {
    setEditingId(manual.id);
    setName(manual.name);
    setContent(manual.content);
    setCategory(manual.category);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      setManuals(manuals.filter((m) => m.id !== id));
      if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
    }
  };

  const handleToggleActive = (id: string) => {
    setManuals((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m))
    );
    if (window.Telegram?.WebApp?.HapticFeedback && window.Telegram?.WebApp?.isVersionAtLeast && window.Telegram.WebApp.isVersionAtLeast('6.1')) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  // Filter manuals based on search
  const filteredManuals = manuals.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="manuals-tab-container" className="flex flex-col h-full bg-tg-bg p-4 overflow-y-auto space-y-4 pb-16">
      {/* Visual Hub Title */}
      <div className="flex justify-between items-center bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] border border-white/[0.05] rounded-2xl p-4 shadow-sm select-none">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-tg-accent" />
            {t.title}
          </h1>
          <p className="text-xs text-tg-secondary mt-1 max-w-[280px]">
            {t.subtitle}
          </p>
        </div>
        
        {!isAdding && (
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
            }}
            className="flex h-10 w-10 md:h-auto md:w-auto md:px-3 md:py-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_12px_rgba(59,130,246,0.5)] items-center justify-center text-xs font-semibold shadow-md active:scale-95 transition"
          >
            <Plus className="h-4.5 w-4.5 md:mr-1" />
            <span className="hidden md:inline">{t.addBtn}</span>
          </button>
        )}
      </div>

      {/* Editor Panel Block */}
      {isAdding && (
        <form
          onSubmit={handleSave}
          className="bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] border border-white/[0.05] rounded-2xl p-4 space-y-4 shadow-lg animate-in fade-in zoom-in-95 duration-150 relative"
        >
          <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
            <h2 className="text-xs font-bold text-tg-secondary uppercase tracking-wider font-mono">
              {editingId ? (lang === 'RU' ? 'Редактировать' : 'Edit Book') : (lang === 'RU' ? 'Новая запись' : 'Add manual')}
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setName('');
                setContent('');
                setEditingId(null);
              }}
              className="text-xs text-tg-secondary hover:text-white transition"
            >
              {t.cancel}
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-tg-secondary font-medium">{t.nameLabel}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePlaceholder}
              className="w-full bg-tg-bg border border-white/[0.05] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-tg-accent transition placeholder:text-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-tg-secondary font-medium">{t.categoryLabel}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-tg-bg border border-white/[0.05] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-tg-accent"
              >
                {CATEGORIES.map((cat, idx) => (
                  <option key={cat} className="bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] text-white text-xs" value={cat}>
                    {lang === 'RU' ? CATEGORIES_RU[idx] : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-tg-secondary font-medium">{t.contentLabel}</label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.contentPlaceholder}
              className="w-full bg-tg-bg border border-white/[0.05] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-tg-accent font-mono resize-none h-36 placeholder:text-gray-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setName('');
                setContent('');
                setEditingId(null);
              }}
              className="px-4 py-2 rounded-lg bg-tg-bg border border-white/[0.05] text-xs text-tg-secondary font-semibold hover:bg-[#1f2a36] hover:text-white transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-tg-accent text-white text-xs font-semibold hover:bg-tg-accent-hover transition flex items-center gap-1 shadow"
            >
              <Check className="h-4 w-4" />
              {t.save}
            </button>
          </div>
        </form>
      )}

      {/* SEARCH AND QUICK INJECT TEMPLATES */}
      {!isAdding && (
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.search}
              className="w-full bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] border border-white/[0.05] rounded-2xl pl-3.5 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-tg-accent"
            />
          </div>

          {manuals.length === 0 && (
            <button
              onClick={handleLoadTemplates}
              className="px-4 py-2.5 rounded-2xl border border-dashed border-tg-accent/40 text-tg-accent hover:bg-tg-accent/5 text-xs font-semibold transition shrink-0"
            >
              ✨ {t.createFirst}
            </button>
          )}
        </div>
      )}

      {/* Manual Cards list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredManuals.map((m) => (
          <div
            key={m.id}
            className="bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] border border-white/[0.05] rounded-2xl p-4 space-y-3 shadow flex flex-col justify-between group hover:border-[#384a5c] transition"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-tg-bg text-tg-accent">
                  <Tag className="h-2.5 w-2.5" />
                  {CATEGORIES_RU[CATEGORIES.indexOf(m.category)] || m.category}
                </span>

                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleEdit(m)}
                    className="p-1 rounded hover:bg-tg-bg text-tg-secondary hover:text-white transition"
                    title={lang === 'RU' ? 'Редактировать' : 'Edit'}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-1 rounded hover:bg-tg-bg text-tg-secondary hover:text-red-400 transition"
                    title={lang === 'RU' ? 'Удалить' : 'Delete'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-white tracking-tight">{m.name}</h3>

              <p className="text-xs text-tg-secondary line-clamp-4 leading-normal bg-tg-bg/50 px-2.5 py-2 rounded-lg font-mono text-[11px] select-all whitespace-pre-wrap">
                {m.content}
              </p>
            </div>

            <div className="border-t border-white/[0.05] pt-3 flex items-center justify-between select-none">
              <span className="text-[10px] text-tg-secondary italic">
                {lang === 'RU' ? 'Используется в чате' : 'Used in chat session'}
              </span>

              <button
                onClick={() => handleToggleActive(m.id)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-in-out focus:outline-none ${
                    m.isActive ? 'bg-tg-accent' : 'bg-tg-bg border border-white/[0.05]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-150 ease-in-out ${
                    m.isActive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredManuals.length === 0 && manuals.length > 0 && (
        <div className="bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] border border-white/[0.05] rounded-2xl p-8 text-center select-none">
          <AlertCircle className="h-8 w-8 text-tg-secondary mx-auto mb-2" />
          <p className="text-xs text-tg-secondary">
            {lang === 'RU' ? 'Совпадений не найдено.' : 'No matching manual books found.'}
          </p>
        </div>
      )}

      {!isAdding && manuals.length === 0 && (
        <div className="bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05] border border-white/[0.05] border-dashed rounded-2xl p-10 text-center select-none">
          <BookOpen className="h-10 w-10 text-tg-secondary/40 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">{t.noManuals}</h3>
          <p className="text-xs text-tg-secondary max-w-xs mx-auto mb-4">
            {t.subtitle}
          </p>
          <button
            onClick={handleLoadTemplates}
            className="px-4 py-2 border border-tg-accent bg-tg-accent/10 hover:bg-tg-accent text-tg-accent hover:text-white rounded-lg text-xs font-semibold transition"
          >
            📚 {t.createFirst}
          </button>
        </div>
      )}
    </div>
  );
}
