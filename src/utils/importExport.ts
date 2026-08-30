import { OrigemFinanceira, Transaction, TransactionStatus, TransactionType } from '../types';

const VALID_ORIGINS: OrigemFinanceira[] = [
  'CONTA_BANCARIA', 'CARTAO_CREDITO', 'CUSTO_FIXO', 'FINANCIAMENTO',
  'EMPRESTIMO', 'CARNE', 'CONSORCIO', 'IMPOSTO', 'INVESTIMENTO', 'OUTRO',
];
const VALID_STATUS: TransactionStatus[] = ['PAGO', 'PENDENTE', 'AGENDADO', 'AGUARDANDO'];

const normalize = (value: unknown) => String(value ?? '')
  .trim()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]/g, '')
  .toLowerCase();

const aliases: Record<string, string[]> = {
  tipo: ['tipo'], descricao: ['descricao', 'historico', 'lancamento'],
  valor: ['valor', 'montante'], data: ['data', 'vencimento'],
  categoria: ['categoria'], empresa: ['empresa'],
  centroCusto: ['centrocusto', 'centrodecusto'],
  formaPagamento: ['formapagamento', 'formadepagamento', 'pagamento'],
  origemFinanceira: ['origem', 'origemfinanceira'], status: ['status', 'situacao'],
};

const asDate = (value: unknown): string => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const raw = String(value ?? '').trim();
  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : new Date().toISOString().slice(0, 10);
};

const asMoney = (value: unknown): number => {
  if (typeof value === 'number') return Math.abs(value);
  const raw = String(value ?? '').replace(/[^0-9,.-]/g, '');
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  return Math.abs(Number.parseFloat(normalized) || 0);
};

const asSignedMoney = (value: unknown): number => {
  if (typeof value === 'number') return value;
  const raw = String(value ?? '').replace(/[^0-9,.-]/g, '');
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  return Number.parseFloat(normalized) || 0;
};

export const parseRowsToTransactions = (rows: unknown[][]): Omit<Transaction, 'id'>[] => {
  if (rows.length < 2) return [];
  const headers = rows[0].map(normalize);
  const indexOf = (field: keyof typeof aliases) => headers.findIndex((h) => aliases[field].includes(h));
  const indexes = Object.fromEntries(Object.keys(aliases).map((key) => [key, indexOf(key as keyof typeof aliases)]));
  if (indexes.descricao < 0 || indexes.valor < 0 || indexes.data < 0) return [];

  return rows.slice(1).flatMap((row) => {
    const get = (field: string) => indexes[field] >= 0 ? row[indexes[field]] : '';
    const descricao = String(get('descricao') ?? '').trim();
    const valor = asMoney(get('valor'));
    if (!descricao || valor <= 0) return [];
    const tipoRaw = normalize(get('tipo')).toUpperCase();
    const tipo: TransactionType = tipoRaw === 'RECEITA' ? 'RECEITA' : 'DESPESA';
    const origemRaw = normalize(get('origemFinanceira')).toUpperCase() as OrigemFinanceira;
    const statusRaw = normalize(get('status')).toUpperCase() as TransactionStatus;
    return [{
      tipo,
      descricao,
      valor,
      data: asDate(get('data')),
      categoria: String(get('categoria') || 'Outros').trim(),
      empresa: String(get('empresa') || 'Geral').trim(),
      centroCusto: String(get('centroCusto') || 'Diretoria').trim(),
      formaPagamento: String(get('formaPagamento') || 'PIX').trim(),
      origemFinanceira: VALID_ORIGINS.includes(origemRaw) ? origemRaw : 'CONTA_BANCARIA',
      status: VALID_STATUS.includes(statusRaw) ? statusRaw : 'PAGO',
    }];
  });
};

export interface ImportedCardPurchase {
  transaction: Omit<Transaction, 'id'>;
  parcelasRestantes: number;
}

export const parseRowsToCardPurchases = (rows: unknown[][]): ImportedCardPurchase[] => {
  if (rows.length < 2) return [];
  const headers = rows[0].map(normalize);
  const installmentsIndex = headers.findIndex((header) =>
    ['parcelasrestantes', 'parcelasfaltantes', 'quantidadedeparcelas', 'parcelas'].includes(header)
  );
  const valueIndex = headers.findIndex((header) => aliases.valor.includes(header));

  return rows.slice(1).flatMap((row) => {
    const parsed = parseRowsToTransactions([rows[0], row]);
    if (!parsed.length) return [];
    const rawInstallments = installmentsIndex >= 0 ? Number(row[installmentsIndex]) : 1;
    const parcelasRestantes = Number.isFinite(rawInstallments)
      ? Math.min(120, Math.max(1, Math.trunc(rawInstallments)))
      : 1;
    const signedValue = valueIndex >= 0 ? asSignedMoney(row[valueIndex]) : parsed[0].valor;
    if (signedValue === 0) return [];
    return [{ transaction: { ...parsed[0], valor: signedValue }, parcelasRestantes }];
  });
};

const parseCSVRow = (line: string, delimiter: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"' && quoted) { current += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) { cells.push(current.trim()); current = ''; }
    else current += char;
  }
  cells.push(current.trim());
  return cells;
};

export const parseCSVToTransactions = (csvText: string): Omit<Transaction, 'id'>[] => {
  const lines = csvText.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const delimiter = (lines[0].match(/;/g)?.length || 0) > (lines[0].match(/,/g)?.length || 0) ? ';' : ',';
  return parseRowsToTransactions(lines.map((line) => parseCSVRow(line, delimiter)));
};

export const parseCSVToCardPurchases = (csvText: string): ImportedCardPurchase[] => {
  const lines = csvText.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const delimiter = (lines[0].match(/;/g)?.length || 0) > (lines[0].match(/,/g)?.length || 0) ? ';' : ',';
  return parseRowsToCardPurchases(lines.map((line) => parseCSVRow(line, delimiter)));
};

const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const exportTransactionsToCSV = (transactions: Transaction[]): string => {
  const headers = ['ID', 'Tipo', 'Descrição', 'Valor', 'Data', 'Categoria', 'Empresa', 'CentroCusto', 'FormaPagamento', 'Origem', 'Status'];
  const rows = transactions.map((t) => [
    t.id, t.tipo, t.descricao, t.valor.toFixed(2).replace('.', ','), t.data,
    t.categoria, t.empresa, t.centroCusto, t.formaPagamento, t.origemFinanceira, t.status,
  ].map(csvCell).join(';'));
  return `\uFEFF${headers.map(csvCell).join(';')}\n${rows.join('\n')}`;
};

export const downloadCSVFile = (filename: string, csvContent: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
