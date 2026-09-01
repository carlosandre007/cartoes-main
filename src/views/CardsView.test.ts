import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InvoiceTotalValue } from './CardsView';

test('campo visual da fatura renderiza R$ 1.189,09', () => {
  const html = renderToStaticMarkup(React.createElement(InvoiceTotalValue, { amount: 1189.09 }));
  assert.match(html, /R\$ 1\.189,09/);
});
