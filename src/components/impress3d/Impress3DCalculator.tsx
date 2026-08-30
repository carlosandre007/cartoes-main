import React, { useState } from 'react';
import { Calculator, HelpCircle } from 'lucide-react';
import { Impress3DSettings } from '../../types/impress3d';

interface Impress3DCalculatorProps {
  settings: Impress3DSettings;
}

export const Impress3DCalculator: React.FC<Impress3DCalculatorProps> = ({ settings }) => {
  const [weight, setWeight] = useState<string>('85');
  const [filamentPrice, setFilamentPrice] = useState<string>(settings.filament_default_price_kg.toString());
  const [power, setPower] = useState<string>(settings.printer_power_w.toString());
  const [timeHours, setTimeHours] = useState<string>('3');
  const [timeMinutes, setTimeMinutes] = useState<string>('20');
  const [kwhPrice, setKwhPrice] = useState<string>(settings.kwh_price.toString());
  const [packaging, setPackaging] = useState<string>('1.50');
  const [others, setOthers] = useState<string>('0.00');
  const [salePrice, setSalePrice] = useState<string>('35.00');

  // Parsers
  const w = parseFloat(weight) || 0;
  const fPrice = parseFloat(filamentPrice) || 0;
  const p = parseFloat(power) || 0;
  const tH = parseFloat(timeHours) || 0;
  const tM = parseFloat(timeMinutes) || 0;
  const totalMinutes = tH * 60 + tM;
  const kPrice = parseFloat(kwhPrice) || 0;
  const pack = parseFloat(packaging) || 0;
  const oth = parseFloat(others) || 0;
  const sPrice = parseFloat(salePrice) || 0;

  // Calculos
  const filamentCost = (w * fPrice) / 1000;
  const energyCost = (totalMinutes / 60) * (p / 1000) * kPrice;
  const totalCost = filamentCost + energyCost + pack + oth;
  const profit = sPrice - totalCost;
  const margin = sPrice > 0 ? (profit / sPrice) * 100 : 0;

  return (
    <div className="bg-zinc-900 border border-amber-500/10 rounded-2xl p-5 space-y-6 font-sans">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-zinc-100 uppercase tracking-wider font-mono">
            Calculadora de Custo de Impressão 3D
          </h2>
          <p className="text-[10px] sm:text-xs text-zinc-400">
            Simulador operacional de custos, lucro e margem de precificação por peça
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Parâmetros do Lançamento */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">
            1. Custos de Produção da Peça
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Filamento */}
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-850 space-y-3">
              <span className="text-xs font-bold text-zinc-400 font-mono block">Filamento</span>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Peso da peça (g)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Preço do Filamento (R$/kg)</label>
                <input
                  type="number"
                  value={filamentPrice}
                  onChange={(e) => setFilamentPrice(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Energia */}
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-850 space-y-3">
              <span className="text-xs font-bold text-zinc-400 font-mono block">Consumo Elétrico</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">Horas</label>
                  <input
                    type="number"
                    value={timeHours}
                    onChange={(e) => setTimeHours(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">Minutos</label>
                  <input
                    type="number"
                    value={timeMinutes}
                    onChange={(e) => setTimeMinutes(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">Watts (W)</label>
                  <input
                    type="number"
                    value={power}
                    onChange={(e) => setPower(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">Tarifa kWh (R$)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={kwhPrice}
                    onChange={(e) => setKwhPrice(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Outros e Embalagem */}
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-850 grid grid-cols-2 gap-3 sm:col-span-2">
              <div>
                <label className="block text-xs font-bold text-zinc-400 font-mono mb-1">Embalagem (R$)</label>
                <input
                  type="number"
                  value={packaging}
                  onChange={(e) => setPackaging(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 font-mono mb-1">Outros Custos (R$)</label>
                <input
                  type="number"
                  value={others}
                  onChange={(e) => setOthers(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resultados Financeiros da Simulação */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">
              2. Precificação e Resultados
            </h3>

            <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-3">
              <div>
                <label className="block text-xs font-bold text-amber-400 font-mono mb-1.5">
                  Preço Sugerido de Venda (R$)
                </label>
                <input
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-amber-500/30 rounded-xl text-sm font-bold text-amber-300 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              {/* Custos Discriminados */}
              <div className="border-t border-zinc-800 pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Filamento ({w}g):</span>
                  <span className="font-mono text-zinc-200">R$ {filamentCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Energia ({totalMinutes} min):</span>
                  <span className="font-mono text-zinc-200">R$ {energyCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Embalagem:</span>
                  <span className="font-mono text-zinc-200">R$ {pack.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Outros Custos:</span>
                  <span className="font-mono text-zinc-200">R$ {oth.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cards Rápidos de Margem */}
          <div className="bg-gradient-to-br from-zinc-900 to-amber-950/20 border border-amber-500/15 rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-850/50">
                <span className="text-[9px] text-zinc-500 uppercase font-mono block">Custo Total</span>
                <span className="text-sm font-extrabold font-mono text-zinc-100">R$ {totalCost.toFixed(2)}</span>
              </div>
              <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-850/50">
                <span className="text-[9px] text-zinc-500 uppercase font-mono block">Lucro por Peça</span>
                <span className={`text-sm font-extrabold font-mono ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  R$ {profit.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <span className="text-xs font-extrabold text-amber-300 uppercase font-mono">Margem de Lucro:</span>
              <span className="text-base font-black font-mono text-amber-400">{margin.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
