# Resultados de diagnóstico — modelo `openai/gpt-oss-120b`

Gerado em 2026-10-29T16:23:05.798Z. Pipeline cru (sem RAG, sem retry, sem autocorreção).

**Resumo:** 22 rodaram, 8 recusaram (dado inexistente), 0 falharam (de 30). prompt_tokens médio por pergunta: 1202 (baseline "tudo no prompt"). Obs: "rodou" só indica que o SQL executou — não que a resposta está semanticamente correta.

## q01 — facil

**Pergunta:** Quantos fornecedores temos cadastrados?

**Esperado:** COUNT(*) em suppliers.

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1235

**Tabelas recuperadas (RAG):** products, coupons, promotions, discounts, product_suppliers, shipments

**Motivo da recusa:** Não existe tabela ou coluna de fornecedores no esquema fornecido

---

## q02 — facil

**Pergunta:** Quantas avaliações de produtos foram feitas?

**Esperado:** COUNT(*) em reviews.

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1185

**Tabelas recuperadas (RAG):** products, product_variants, discounts, inventory, product_suppliers, categories

**Motivo da recusa:** Não há tabela ou coluna que registre avaliações de produtos no esquema fornecido.

---

## q03 — facil

**Pergunta:** Quantos pedidos foram feitos no total?

**Esperado:** COUNT(*) em orders = 1200.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1248

**Tabelas recuperadas (RAG):** order_coupons, order_items, products, coupons, discounts, orders

**SQL gerado:**
```sql
SELECT COUNT(*) AS total_pedidos FROM orders LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "total_pedidos": 1200
  }
]
```

---

## q04 — facil

**Pergunta:** Quantos clientes temos por estado?

**Esperado:** customers GROUP BY state.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1210

**Tabelas recuperadas (RAG):** employees, inventory, carriers, addresses, products, orders

**SQL gerado:**
```sql
SELECT state, COUNT(DISTINCT customer_id) AS clientes_por_estado FROM addresses GROUP BY state LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "state": "AM",
    "clientes_por_estado": 1
  },
  {
    "state": "BA",
    "clientes_por_estado": 8
  },
  {
    "state": "CE",
    "clientes_por_estado": 7
  },
  {
    "state": "DF",
    "clientes_por_estado": 6
  },
  {
    "state": "ES",
    "clientes_por_estado": 4
  }
]
```

---

## q05 — regra_negocio

**Pergunta:** Qual o faturamento total?

**Esperado:** SUM(order_items.quantity*unit_price) em pedidos PAID/SHIPPED/DELIVERED (excluir CANCELLED).

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1200

**Tabelas recuperadas (RAG):** products, order_items, order_coupons, cart_items, orders, coupons

**SQL gerado:**
```sql
SELECT SUM(oi.quantity * oi.unit_price) AS faturamento_total FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "faturamento_total": 24228837.93
  }
]
```

---

## q06 — regra_negocio

**Pergunta:** Qual o lucro total?

**Esperado:** SUM(quantity*(unit_price - products.cost)) nos pedidos faturados. Usar cost (não list_price/sale_price).

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1177

**Tabelas recuperadas (RAG):** order_items, products, cart_items, payments, order_coupons, coupons

**Motivo da recusa:** não existe tabela orders ou coluna status para filtrar pedidos faturados

---

## q07 — regra_negocio

**Pergunta:** Quantos pedidos foram entregues?

**Esperado:** COUNT em orders WHERE status='DELIVERED'.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1214

**Tabelas recuperadas (RAG):** orders, order_coupons, returns, shipments, coupons, employees

**SQL gerado:**
```sql
SELECT COUNT(*) AS pedidos_entregues FROM orders WHERE status = 'DELIVERED' LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "pedidos_entregues": 542
  }
]
```

---

## q08 — confusavel

**Pergunta:** Quanto foi concedido em cupons nos pedidos?

**Esperado:** CERTO: SUM(order_coupons.amount_applied). ERRADO: usar promotions ou discounts ou list_price/sale_price.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1206

**Tabelas recuperadas (RAG):** order_coupons, coupons, orders, discounts, returns, cart_items

**SQL gerado:**
```sql
SELECT SUM(amount_applied) AS total_cupom_concedido FROM order_coupons LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "total_cupom_concedido": 18061.09
  }
]
```

---

## q09 — confusavel

**Pergunta:** Qual o total já reembolsado aos clientes?

**Esperado:** CERTO: SUM(refunds.amount). ERRADO: usar payments.amount.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1189

**Tabelas recuperadas (RAG):** refunds, orders, products, cart_items, reviews, inventory

**SQL gerado:**
```sql
SELECT SUM(amount) AS total_refund FROM refunds LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "total_refund": 472923.53
  }
]
```

---

## q10 — confusavel

**Pergunta:** Qual o preço de tabela médio dos produtos?

**Esperado:** CERTO: AVG(products.list_price). ERRADO: usar price, cost ou sale_price.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1168

**Tabelas recuperadas (RAG):** products, product_variants, inventory, categories, order_items, discounts

**SQL gerado:**
```sql
SELECT AVG(list_price) AS avg_list_price FROM products LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "avg_list_price": 3810.2208333333333
  }
]
```

---

## q11 — confusavel

**Pergunta:** Em quais cidades os pedidos foram entregues com mais frequência?

**Esperado:** CERTO: usar orders.shipping_address_id -> addresses.city. ERRADO: usar billing_address_id ou customers.city.

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1273

**Tabelas recuperadas (RAG):** orders, products, employees, shipments, reviews, order_coupons

**Motivo da recusa:** O dado de cidades não está disponível no esquema.

---

## q12 — confusavel

**Pergunta:** Qual transportadora entregou mais pedidos?

**Esperado:** CERTO: shipments JOIN carriers WHERE shipment status DELIVERED, GROUP BY carrier. Não confundir com stores.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1174

**Tabelas recuperadas (RAG):** shipments, carriers, orders, cart_items, inventory, carts

**SQL gerado:**
```sql
SELECT ca.name AS transportadora, COUNT(*) AS total_entregas FROM shipments s JOIN carriers ca ON ca.id = s.carrier_id WHERE s.status = 'DELIVERED' GROUP BY ca.name ORDER BY total_entregas DESC LIMIT 1
```

**Resultado (primeiras linhas):**
```json
[
  {
    "transportadora": "Jadlog",
    "total_entregas": 142
  }
]
```

---

## q13 — confusavel

**Pergunta:** Qual método de pagamento é o mais usado?

**Esperado:** CERTO: payments JOIN payment_methods GROUP BY método. Agora o dado existe (não recusar).

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1189

**Tabelas recuperadas (RAG):** payments, payment_methods, products, order_coupons, coupons, inventory

**SQL gerado:**
```sql
SELECT pm.name AS metodo, COUNT(*) AS total_pagamentos FROM payments p JOIN payment_methods pm ON pm.id = p.payment_method_id WHERE p.status = 'COMPLETED' GROUP BY pm.name ORDER BY total_pagamentos DESC LIMIT 1
```

**Resultado (primeiras linhas):**
```json
[
  {
    "metodo": "Boleto",
    "total_pagamentos": 266
  }
]
```

---

## q14 — confusavel

**Pergunta:** Quantas unidades temos em estoque no total?

**Esperado:** CERTO: SUM(inventory.quantity). ERRADO: somar order_items.quantity (isso é venda, não estoque).

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1189

**Tabelas recuperadas (RAG):** inventory, order_items, products, order_coupons, coupons, employees

**SQL gerado:**
```sql
SELECT SUM(quantity) AS total_unidades FROM inventory LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "total_unidades": 23986
  }
]
```

---

## q15 — ambigua

**Pergunta:** Quais os melhores clientes?

**Esperado:** Ambíguo (valor gasto vs nº de pedidos). Responder com premissa.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1104

**Tabelas recuperadas (RAG):** wishlists, customers, employees, orders, cart_items, stores

**Premissa (ambiguidade):** Interpretado como clientes com maior número de pedidos, já que não há dados de valor de compra no esquema.

**SQL gerado:**
```sql
SELECT c.id, c.name, c.email, COUNT(o.id) AS total_pedidos FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id, c.name, c.email ORDER BY total_pedidos DESC LIMIT 10
```

**Resultado (primeiras linhas):**
```json
[
  {
    "id": 32,
    "name": "Ricardo Santos",
    "email": "ricardo_santos@example.com",
    "total_pedidos": 12
  },
  {
    "id": 92,
    "name": "Laura Xavier",
    "email": "laura_xavier@example.com",
    "total_pedidos": 12
  },
  {
    "id": 144,
    "name": "Danilo Costa",
    "email": "danilo_costa89@example.com",
    "total_pedidos": 12
  },
  {
    "id": 94,
    "name": "Manuela Pereira",
    "email": "manuela.pereira@example.com",
    "total_pedidos": 12
  },
  {
    "id": 192,
    "name": "Lara Costa",
    "email": "lara.costa81@example.com",
    "total_pedidos": 11
  }
]
```

---

## q16 — ambigua

**Pergunta:** Qual a categoria mais popular?

**Esperado:** Ambíguo (unidades vs receita vs nº de produtos). Responder com premissa.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1149

**Tabelas recuperadas (RAG):** categories, carts, reviews, cart_items, products, promotions

**Premissa (ambiguidade):** Interpretado como a categoria com maior número de produtos cadastrados

**SQL gerado:**
```sql
SELECT c.name AS categoria, COUNT(p.id) AS total_produtos FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.name ORDER BY total_produtos DESC LIMIT 1
```

**Resultado (primeiras linhas):**
```json
[
  {
    "categoria": "Esporte e Lazer",
    "total_produtos": 8
  }
]
```

---

## q17 — ambigua

**Pergunta:** Qual o melhor produto?

**Esperado:** Ambíguo (receita vs unidades vs lucro vs nota média). Responder com premissa.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1154

**Tabelas recuperadas (RAG):** products, inventory, discounts, promotions, categories, product_suppliers

**Premissa (ambiguidade):** Interpretado como o produto com o maior preço de venda (price)

**SQL gerado:**
```sql
SELECT name, price FROM products ORDER BY price DESC LIMIT 1
```

**Resultado (primeiras linhas):**
```json
[
  {
    "name": "Liquidificador 1200W",
    "price": 6883.74
  }
]
```

---

## q18 — multi_passo

**Pergunta:** Qual o crescimento da receita mês a mês nos últimos 12 meses?

**Esperado:** date_trunc('month', orders.created_at), SUM, LAG para variação. Excluir cancelados.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1279

**Tabelas recuperadas (RAG):** refunds, order_coupons, coupons, payments, products, cart_items

**SQL gerado:**
```sql
WITH monthly_rev AS ( SELECT date_trunc('month', o.created_at) AS mes, SUM(oi.quantity * oi.unit_price) AS receita FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') AND o.created_at >= date_trunc('month', now()) - interval '11 months' GROUP BY 1 ) SELECT mes, receita, CASE WHEN LAG(receita) OVER (ORDER BY mes) IS NULL THEN NULL ELSE ROUND(100.0 * (receita - LAG(receita) OVER (ORDER BY mes)) / LAG(receita) OVER (ORDER BY mes), 2) END AS crescimento_percentual FROM monthly_rev ORDER BY mes LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "mes": "2025-11-01T00:00:00.000Z",
    "receita": 1681779.7,
    "crescimento_percentual": null
  },
  {
    "mes": "2025-12-01T00:00:00.000Z",
    "receita": 1554097.14,
    "crescimento_percentual": -7.59
  },
  {
    "mes": "2026-01-01T00:00:00.000Z",
    "receita": 2089534.33,
    "crescimento_percentual": 34.45
  },
  {
    "mes": "2026-02-01T00:00:00.000Z",
    "receita": 2056715.15,
    "crescimento_percentual": -1.57
  },
  {
    "mes": "2026-03-01T00:00:00.000Z",
    "receita": 2362339.06,
    "crescimento_percentual": 14.86
  }
]
```

---

## q19 — multi_passo

**Pergunta:** Que porcentagem do faturamento cada categoria representa?

**Esperado:** receita por categoria / total * 100. order_items->products->categories.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1265

**Tabelas recuperadas (RAG):** categories, products, orders, cart_items, order_items, product_variants

**SQL gerado:**
```sql
WITH total AS (SELECT SUM(oi.quantity * oi.unit_price) AS total_rev FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status IN ('PAID','SHIPPED','DELIVERED')), cat_rev AS (SELECT c.name AS categoria, SUM(oi.quantity * oi.unit_price) AS receita FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id JOIN categories c ON c.id = p.category_id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') GROUP BY c.name) SELECT cr.categoria, cr.receita, 100.0 * cr.receita / t.total_rev AS perc_faturamento FROM cat_rev cr, total t ORDER BY perc_faturamento DESC LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "categoria": "Casa e Cozinha",
    "receita": 5918458.86,
    "perc_faturamento": 24.42733273918928
  },
  {
    "categoria": "Livros",
    "receita": 4547084.09,
    "perc_faturamento": 18.767239696501615
  },
  {
    "categoria": "Esporte e Lazer",
    "receita": 3992678.48,
    "perc_faturamento": 16.47903416389727
  },
  {
    "categoria": "Moda",
    "receita": 3914298.55,
    "perc_faturamento": 16.155535652633755
  },
  {
    "categoria": "Informática",
    "receita": 3039886.77,
    "perc_faturamento": 12.546564464967718
  }
]
```

---

## q20 — multi_passo

**Pergunta:** Quais os 5 produtos mais vendidos e quanto cada um faturou?

**Esperado:** Top 5 por SUM(quantity) + SUM(quantity*unit_price).

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1162

**Tabelas recuperadas (RAG):** products, cart_items, inventory, categories, product_variants, product_suppliers

**Motivo da recusa:** Não há tabelas ou colunas de pedidos/vendas (ex.: orders, order_items) no esquema para calcular faturamento dos produtos.

---

## q21 — multi_passo

**Pergunta:** Qual a nota média de avaliação por categoria?

**Esperado:** AVG(reviews.rating) agrupado por categoria (reviews->products->categories).

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1194

**Tabelas recuperadas (RAG):** reviews, categories, employees, products, cart_items, carts

**SQL gerado:**
```sql
SELECT c.name AS categoria, AVG(r.rating) AS nota_media FROM reviews r JOIN products p ON p.id = r.product_id JOIN categories c ON c.id = p.category_id GROUP BY c.name ORDER BY nota_media DESC LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "categoria": "Informática",
    "nota_media": 4
  },
  {
    "categoria": "Eletrônicos",
    "nota_media": 3.968503937007874
  },
  {
    "categoria": "Livros",
    "nota_media": 3.884892086330935
  },
  {
    "categoria": "Casa e Cozinha",
    "nota_media": 3.744360902255639
  },
  {
    "categoria": "Moda",
    "nota_media": 3.7333333333333334
  }
]
```

---

## q22 — multi_passo

**Pergunta:** Qual a taxa de devolução por categoria?

**Esperado:** return_items->order_items->products->categories; proporção de itens/pedidos devolvidos por categoria.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1240

**Tabelas recuperadas (RAG):** categories, returns, products, coupons, discounts, cart_items

**SQL gerado:**
```sql
WITH returned_counts AS ( SELECT c.id AS category_id, COUNT(DISTINCT r.order_id) AS returned_orders FROM returns r JOIN orders o ON o.id = r.order_id AND o.status = 'DELIVERED' JOIN order_items oi ON oi.order_id = r.order_id JOIN products p ON p.id = oi.product_id JOIN categories c ON c.id = p.category_id GROUP BY c.id ), total_counts AS ( SELECT c.id AS category_id, COUNT(DISTINCT o.id) AS total_orders FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id JOIN categories c ON c.id = p.category_id WHERE o.status = 'DELIVERED' GROUP BY c.id ) SELECT cat.name AS categoria, COALESCE(rc.returned_orders,0)::decimal / NULLIF(tc.total_orders,0) AS taxa_devolucao FROM categories cat LEFT JOIN total_counts tc ON tc.category_id = cat.id LEFT JOIN returned_counts rc ON rc.category_id = cat.id ORDER BY taxa_devolucao DESC LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "categoria": "Moda",
    "taxa_devolucao": 0.11555555555555555
  },
  {
    "categoria": "Casa e Cozinha",
    "taxa_devolucao": 0.11398963730569948
  },
  {
    "categoria": "Eletrônicos",
    "taxa_devolucao": 0.10052910052910052
  },
  {
    "categoria": "Esporte e Lazer",
    "taxa_devolucao": 0.08737864077669903
  },
  {
    "categoria": "Livros",
    "taxa_devolucao": 0.08040201005025126
  }
]
```

---

## q23 — multi_passo

**Pergunta:** Qual o valor total em estoque a preço de custo, por armazém?

**Esperado:** SUM(inventory.quantity * products.cost) GROUP BY warehouse.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1268

**Tabelas recuperadas (RAG):** order_items, inventory, coupons, products, order_coupons, orders

**SQL gerado:**
```sql
SELECT i.warehouse_id, SUM(i.quantity * p.cost) AS valor_total_custo FROM inventory i JOIN products p ON p.id = i.product_id GROUP BY i.warehouse_id ORDER BY valor_total_custo DESC LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "warehouse_id": 1,
    "valor_total_custo": 13755011.93
  },
  {
    "warehouse_id": 3,
    "valor_total_custo": 12589501.95
  },
  {
    "warehouse_id": 4,
    "valor_total_custo": 12533655.62
  },
  {
    "warehouse_id": 2,
    "valor_total_custo": 9467786.8
  }
]
```

---

## q24 — fraseado

**Pergunta:** Qual o ticket médio por pedido?

**Esperado:** AVG do total por pedido (subquery/CTE por order_id, depois AVG).

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1192

**Tabelas recuperadas (RAG):** orders, coupons, order_coupons, returns, payments, order_items

**SQL gerado:**
```sql
SELECT AVG(order_total) AS ticket_medio_por_pedido FROM ( SELECT oi.order_id, SUM(oi.quantity * oi.unit_price) AS order_total FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') GROUP BY oi.order_id ) sub LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "ticket_medio_por_pedido": 24926.78799382716
  }
]
```

---

## q25 — fraseado

**Pergunta:** Qual o ticket médio por cliente?

**Esperado:** Gasto total por cliente e então média entre clientes. Diferente de por pedido.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1194

**Tabelas recuperadas (RAG):** orders, coupons, addresses, payments, cart_items, order_coupons

**SQL gerado:**
```sql
WITH client_spending AS ( SELECT o.customer_id, SUM(p.amount) AS total_spent FROM orders o JOIN payments p ON p.order_id = o.id WHERE p.status = 'COMPLETED' AND o.status IN ('PAID','SHIPPED','DELIVERED') GROUP BY o.customer_id ) SELECT AVG(total_spent) AS ticket_medio_por_cliente FROM client_spending LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "ticket_medio_por_cliente": 121752.95442211055
  }
]
```

---

## q26 — regra_negocio

**Pergunta:** Quantos produtos estão sem estoque?

**Esperado:** Produtos com estoque total 0 (SUM(inventory.quantity)=0 ou sem linha de inventory).

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1168

**Tabelas recuperadas (RAG):** inventory, product_variants, products, order_items, reviews, product_suppliers

**SQL gerado:**
```sql
SELECT COUNT(*) AS produtos_sem_estoque FROM ( SELECT p.id, COALESCE(SUM(i.quantity),0) AS total_qty FROM products p LEFT JOIN inventory i ON i.product_id = p.id GROUP BY p.id HAVING COALESCE(SUM(i.quantity),0) = 0 ) sub LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "produtos_sem_estoque": 3
  }
]
```

---

## q27 — facil

**Pergunta:** Quantos carrinhos foram abandonados?

**Esperado:** COUNT em carts WHERE status='ABANDONED'.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1198

**Tabelas recuperadas (RAG):** carts, cart_items, products, orders, inventory, product_variants

**SQL gerado:**
```sql
SELECT COUNT(*) AS carrinhos_abandonados FROM carts WHERE status = 'ABANDONED' LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "carrinhos_abandonados": 66
  }
]
```

---

## q28 — alucinacao

**Pergunta:** Qual o custo de aquisição de clientes (CAC) por mês?

**Esperado:** RECUSAR: não há dados de gasto com marketing/aquisição no schema.

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1259

**Tabelas recuperadas (RAG):** wishlists, products, employees, customers, orders, coupons

**Motivo da recusa:** Não há dados de custos de aquisição ou despesas de marketing no esquema para calcular o CAC

---

## q29 — alucinacao

**Pergunta:** De qual canal de marketing vêm mais vendas?

**Esperado:** RECUSAR: não existe origem/canal de marketing em lugar nenhum do schema.

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1157

**Tabelas recuperadas (RAG):** products, cart_items, discounts, reviews, promotions, suppliers

**Motivo da recusa:** não há tabela ou coluna que registre canal de marketing no esquema

---

## q30 — alucinacao

**Pergunta:** Qual a nota de satisfação do atendimento ao cliente (SAC)?

**Esperado:** RECUSAR: reviews são de PRODUTO; não há avaliação de atendimento/SAC. Não confundir com reviews.

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1215

**Tabelas recuperadas (RAG):** reviews, orders, products, wishlists, employees, inventory

**Motivo da recusa:** Não há dados de avaliação de atendimento ou SAC no esquema fornecido

---
