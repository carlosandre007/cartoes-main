# Controle e confiabilidade financeira

## Recursos

- Memória de cálculo compartilhada do Total unificado de débitos.
- Fechamento mensal com bloqueio opcional de inclusão, edição e exclusão retroativa.
- Conciliação local de arquivos CSV e OFX; a importação não grava lançamentos.
- Central de inconsistências sem exclusão automática.
- Orçamentos por categoria e comparação com o mês anterior.
- Auditoria local das inclusões, alterações e exclusões de movimentações.
- Categorias globais com armazenamento local e sincronização Supabase quando a tabela estiver instalada.
- Discriminação clicável dos principais cards e indicadores da dashboard.

## Migração opcional do Supabase

O arquivo `supabase-migration-financial-governance.sql` cria `financial_categories` com RLS por usuário. Ele não é executado automaticamente. Sem essa migração, o catálogo continua funcional no navegador e a tentativa de leitura remota retorna vazia.

## Dados locais

- `aureum_categories_v1`: catálogo de categorias.
- `aureum_category_budgets_v1`: limites mensais.
- `aureum_locked_months_v1`: competências fechadas.
- `aureum_month_close_AAAA-MM`: fotografia informativa do fechamento.
- `aureum_audit_trail_v1`: últimas 2.000 alterações observadas.

## Reversão

O checkpoint anterior a esta ampliação é `db839d1`. Para revisão, compare o estado atual com esse commit. A reversão deve restaurar somente os arquivos modificados nesta etapa e remover os novos arquivos desta funcionalidade; não altere dados financeiros nem execute comandos destrutivos amplos.
