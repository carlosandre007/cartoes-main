/**
 * CurrencyInput — Campo de moeda BRL com formatação automática.
 *
 * O usuário digita apenas dígitos. Os dois últimos sempre representam os centavos.
 * Exemplo: digitar "12345" exibe "123,45". Digitar "1" exibe "0,01".
 *
 * Props:
 *   value        — valor numérico atual (número float, ex: 123.45)
 *   onChange     — callback com o novo valor numérico (número float)
 *   className    — classes CSS adicionais para o input
 *   placeholder  — placeholder opcional
 *   allowNegative— se true, permite valores negativos (prefixo "-")
 *   disabled     — desabilita o campo
 *   id           — id HTML do input
 *   required     — atributo required do input
 */

import React, { useRef, useState, useEffect } from 'react';

interface CurrencyInputProps {
  value: number | string;
  onChange: (numericValue: number) => void;
  className?: string;
  placeholder?: string;
  allowNegative?: boolean;
  disabled?: boolean;
  id?: string;
  required?: boolean;
}

/** Converte centavos inteiros (string de dígitos) em display formatado pt-BR */
const centsToDisplay = (cents: string, negative: boolean): string => {
  const digits = cents.replace(/\D/g, '') || '0';
  const num = parseInt(digits, 10);
  const formatted = (num / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return negative ? `-${formatted}` : formatted;
};

/** Converta um número float em string de centavos ("12345" para 123.45) */
const numericToCents = (value: number | string): string => {
  const n = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
  if (!Number.isFinite(n) || n === 0) return '0';
  return Math.round(Math.abs(n) * 100).toString();
};

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = '0,00',
  allowNegative = false,
  disabled = false,
  id,
  required,
}) => {
  const [cents, setCents] = useState(() => numericToCents(value));
  const [negative, setNegative] = useState(() => {
    const n = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    return n < 0;
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync when external value changes (e.g., prefill on modal open)
  useEffect(() => {
    const n = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (Number.isFinite(n)) {
      setCents(numericToCents(n));
      setNegative(n < 0);
    } else {
      setCents('0');
      setNegative(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const displayValue = centsToDisplay(cents, negative);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newCents = cents.length > 1 ? cents.slice(0, -1) : '0';
      setCents(newCents);
      const numVal = parseInt(newCents, 10) / 100;
      onChange(negative ? -numVal : numVal);
      return;
    }
    if (e.key === 'Delete') {
      e.preventDefault();
      setCents('0');
      onChange(0);
      return;
    }
    if (allowNegative && e.key === '-') {
      e.preventDefault();
      const newNeg = !negative;
      setNegative(newNeg);
      const numVal = parseInt(cents, 10) / 100;
      onChange(newNeg ? -numVal : numVal);
      return;
    }
    if (e.key === 'Tab' || e.key === 'Enter') return;
    if (e.key.match(/^\d$/)) {
      e.preventDefault();
      // Limit to prevent overflow (max ~99 billion)
      if (cents.length >= 13) return;
      const newCents = cents === '0' ? e.key : cents + e.key;
      setCents(newCents);
      const numVal = parseInt(newCents, 10) / 100;
      onChange(negative ? -numVal : numVal);
    }
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      value={displayValue}
      readOnly
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      onKeyDown={handleKeyDown}
      onFocus={() => inputRef.current?.select()}
      className={`cursor-text select-all ${className}`}
    />
  );
};

export default CurrencyInput;
