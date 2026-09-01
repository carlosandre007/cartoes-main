# Fluxo Financeiro Realizado

O recurso novo fica desativado por padrão. Ele não cria tabelas, não altera autenticação e não migra registros históricos.

## Ativação local

Defina `VITE_ENABLE_REALIZED_CASH_FLOW="true"` em `.env.local` e reinicie o servidor de desenvolvimento. Para voltar imediatamente à tela anterior, remova a variável ou use `false`.

## Fontes do fluxo

- Receitas e despesas pessoais: transações `PAGO`, origem `OUTRO` e centro de custo `Fluxo pessoal`.
- Custos fixos: somente registros pagos que possuam `dataPagamento` segura em `custo_fixo_detalhes`.
- Cartões: uma saída consolidada por `pagamentoFaturaId`, na `dataPagamentoFatura`.
- Compras no cartão, previsões e pendências não entram.

Os metadados automáticos usam as colunas JSONB existentes (`cartao_detalhes` e `custo_fixo_detalhes`). Nenhuma migração de banco é necessária.

## Histórico

Pagamentos antigos sem uma data efetiva registrada não são exibidos. O sistema não infere pagamento pelo vencimento e não modifica dados antigos.

## Restauração

- Código: desative a flag para restaurar a tela anterior. O ponto Git anterior à implementação é `60922bbe9907492d918f97965872438ca1afefba`.
- Dados: desativar a flag não remove dados. Movimentações pessoais continuam sendo transações normais e podem ser editadas/excluídas pelos mecanismos do sistema.
- Banco: esta etapa não aplica migração. Um backup recuperável do Supabase deve ser feito pelo responsável antes de qualquer publicação futura.

## Publicação segura

1. Validar localmente com a flag ativa.
2. Fazer backup recuperável do Supabase.
3. Confirmar isolamento RLS com dois usuários de teste autorizados.
4. Autorizar explicitamente o build de produção.
5. Publicar o `dist` completo, incluindo `sw.js`.
6. Ativar a flag no ambiente da hospedagem somente após aprovação.
