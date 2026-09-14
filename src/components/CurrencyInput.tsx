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

  const commitCents = (nextCents: string, nextNegative = negative) => {
    const normalized = nextCents.replace(/\D/g, '').replace(/^0+(?=\d)/, '') || '0';
    setCents(normalized);
    const numVal = parseInt(normalized, 10) / 100;
    onChange(nextNegative ? -numVal : numVal);
  };

  const appendDigits = (digits: string) => {
    const cleanDigits = digits.replace(/\D/g, '');
    if (!cleanDigits) return;
    const nextCents = (cents === '0' ? cleanDigits : cents + cleanDigits).slice(0, 13);
    commitCents(nextCents);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      commitCents(cents.length > 1 ? cents.slice(0, -1) : '0');
      return;
    }
    if (e.key === 'Delete') {
      e.preventDefault();
      commitCents('0');
      return;
    }
    if (allowNegative && e.key === '-') {
      e.preventDefault();
      const newNeg = !negative;
      setNegative(newNeg);
      commitCents(cents, newNeg);
      return;
    }
    if (e.key === 'Tab' || e.key === 'Enter') return;
    if (e.key.match(/^\d$/)) {
      e.preventDefault();
      // Limit to prevent overflow (max ~99 billion)
      if (cents.length < 13) appendDigits(e.key);
    }
  };

  // Teclados virtuais normalmente nÃ£o disparam keydown. Trata o evento de input
  // para que o mesmo campo funcione tanto no celular quanto no teclado fÃ­sico.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nativeEvent = e.nativeEvent as InputEvent;
    const inputType = nativeEvent.inputType;
    if (inputType === 'deleteContentBackward' || inputType === 'deleteContentForward') {
      commitCents(cents.length > 1 ? cents.slice(0, -1) : '0');
      return;
    }
    if (inputType === 'deleteByCut' || inputType === 'deleteByDrag') {
      commitCents('0');
      return;
    }
    if (inputType === 'insertFromPaste') {
      commitCents(e.target.value);
      return;
    }
    // Alguns teclados virtuais (principalmente Android) nÃ£o preenchem
    // InputEvent.data. Nesse caso, o valor do prÃ³prio campo jÃ¡ contÃ©m os
    // centavos digitados e deve substituir o estado, em vez de ser anexado.
    if (nativeEvent.data) {
      appendDigits(nativeEvent.data);
      return;
    }
    commitCents(e.target.value);
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      value={displayValue}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      onFocus={() => inputRef.current?.select()}
      className={`cursor-text select-all ${className}`}
    />
  );
};

export default CurrencyInput;
