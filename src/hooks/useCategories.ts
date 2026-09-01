import React from 'react';

export const DEFAULT_CATEGORIES = [
  'LOC MOTTUS', 'ANDRE', 'RASTREAR', 'AP AURORA', 'ALANE', 'IMOVEIS', 'BIA', 'IMPRESS 3D', 'ADS GOOGLE',
  'Moradia', 'Transporte', 'Alimentação', 'Investimentos', 'Serviços', 'Empresarial', 'Tributos', 'Viagem',
  'Tecnologia', 'Quitação de Dívida', 'Saúde', 'Lazer', 'Compras pessoais', 'Salário', 'Outros',
];

const STORAGE_KEY = 'aureum_categories_v1';
const EVENT_NAME = 'aureum-categories-changed';
const unique = (items: string[]) => {
  const values = new Map<string, string>();
  items.map((item) => item.trim()).filter(Boolean).forEach((item) => {
    const key = item.toLocaleUpperCase('pt-BR');
    if (!values.has(key)) values.set(key, item);
  });
  return Array.from(values.values());
};

const loadCategories = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const saved = stored === null ? null : JSON.parse(stored);
    const legacy = JSON.parse(localStorage.getItem('aureum_card_expense_categories') || '[]');
    if (Array.isArray(saved)) return unique(saved);
    return unique([...DEFAULT_CATEGORIES, ...(Array.isArray(legacy) ? legacy : [])]);
  } catch {
    return DEFAULT_CATEGORIES;
  }
};

const persist = (categories: string[]) => {
  const next = unique(categories);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
  return next;
};

export const useCategories = (usedCategories: string[] = []) => {
  const [catalog, setCatalog] = React.useState(loadCategories);

  React.useEffect(() => {
    const refresh = (event: Event) => setCatalog((event as CustomEvent<string[]>).detail || loadCategories());
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener(EVENT_NAME, refresh); window.removeEventListener('storage', refresh); };
  }, []);

  const categories = React.useMemo(() => unique([...catalog, ...usedCategories]), [catalog, usedCategories]);
  const addCategory = (name: string) => setCatalog(persist([...catalog, name]));
  const renameCategory = (oldName: string, newName: string) => setCatalog(persist(catalog.map((item) => item === oldName ? newName : item)));
  const removeCategory = (name: string) => setCatalog(persist(catalog.filter((item) => item !== name)));

  return { categories, catalog, addCategory, renameCategory, removeCategory };
};
