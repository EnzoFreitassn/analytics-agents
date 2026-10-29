# Resultados de diagnóstico — modelo `openai/gpt-oss-20b`

Gerado em 2026-10-29T16:27:48.859Z. Pipeline cru (sem RAG, sem retry, sem autocorreção).

**Resumo:** 19 rodaram, 11 recusaram (dado inexistente), 0 falharam (de 30). prompt_tokens médio por pergunta: 1202 (baseline "tudo no prompt"). Obs: "rodou" só indica que o SQL executou — não que a resposta está semanticamente correta.

## q01 — facil

**Pergunta:** Quantos fornecedores temos cadastrados?

**Esperado:** COUNT(*) em suppliers.

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1235

**Tabelas recuperadas (RAG):** products, coupons, promotions, discounts, product_suppliers, shipments

**Motivo da recusa:** Não há tabela de fornecedores no esquema.

---

## q02 — facil

**Pergunta:** Quantas avaliações de produtos foram feitas?

**Esperado:** COUNT(*) em reviews.

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1185

**Tabelas recuperadas (RAG):** products, product_variants, discounts, inventory, product_suppliers, categories

**Motivo da recusa:** Não há tabela ou coluna de avaliações de produtos no esquema.

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

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1210

**Tabelas recuperadas (RAG):** employees, inventory, carriers, addresses, products, orders

**Motivo da recusa:** Não existe tabela de clientes no esquema fornecido.

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

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1177

**Tabelas recuperadas (RAG):** order_items, products, cart_items, payments, order_coupons, coupons

**SQL gerado:**
```sql
SELECT SUM(oi.quantity * (oi.unit_price - p.cost)) AS lucro_total FROM order_items oi JOIN products p ON oi.product_id = p.id LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "lucro_total": 10457304.34
  }
]
```

---

## q07 — regra_negocio

**Pergunta:** Quantos pedidos foram entregues?

**Esperado:** COUNT em orders WHERE status='DELIVERED'.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1214

**Tabelas recuperadas (RAG):** orders, order_coupons, returns, shipments, coupons, employees

**SQL gerado:**
```sql
SELECT COUNT(*) AS entregues FROM orders WHERE status = 'DELIVERED' LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "entregues": 542
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
SELECT SUM(oc.amount_applied) AS total_coupons FROM order_coupons oc JOIN orders o ON oc.order_id = o.id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "total_coupons": 14526.93
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
SELECT SUM(amount) AS total_reembolsado FROM refunds LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "total_reembolsado": 472923.53
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

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1273

**Tabelas recuperadas (RAG):** orders, products, employees, shipments, reviews, order_coupons

**SQL gerado:**
```sql
SELECT a.city, COUNT(*) AS deliveries FROM shipments s JOIN addresses a ON s.address_id = a.id WHERE s.status = 'DELIVERED' GROUP BY a.city ORDER BY deliveries DESC LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "city": "Arthur de Nossa Senhora",
    "deliveries": 14
  },
  {
    "city": "Pereira de Nossa Senhora",
    "deliveries": 11
  },
  {
    "city": "Costa de Nossa Senhora",
    "deliveries": 11
  },
  {
    "city": "Kléber de Nossa Senhora",
    "deliveries": 10
  },
  {
    "city": "Martins do Sul",
    "deliveries": 8
  }
]
```

---

## q12 — confusavel

**Pergunta:** Qual transportadora entregou mais pedidos?

**Esperado:** CERTO: shipments JOIN carriers WHERE shipment status DELIVERED, GROUP BY carrier. Não confundir com stores.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1174

**Tabelas recuperadas (RAG):** shipments, carriers, orders, cart_items, inventory, carts

**SQL gerado:**
```sql
SELECT ca.name AS transportadora, COUNT(*) AS pedidos_entregues FROM shipments s JOIN carriers ca ON ca.id = s.carrier_id WHERE s.status = 'DELIVERED' GROUP BY ca.name ORDER BY pedidos_entregues DESC LIMIT 1
```

**Resultado (primeiras linhas):**
```json
[
  {
    "transportadora": "Jadlog",
    "pedidos_entregues": 142
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

**Premissa (ambiguidade):** contando apenas pagamentos com status COMPLETED

**SQL gerado:**
```sql
SELECT pm.name AS metodo, COUNT(*) AS total FROM payments pay JOIN payment_methods pm ON pm.id = pay.payment_method_id WHERE pay.status = 'COMPLETED' GROUP BY pm.name ORDER BY total DESC LIMIT 1
```

**Resultado (primeiras linhas):**
```json
[
  {
    "metodo": "Boleto",
    "total": 266
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
SELECT SUM(quantity) AS total_units FROM inventory LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "total_units": 23986
  }
]
```

---

## q15 — ambigua

**Pergunta:** Quais os melhores clientes?

**Esperado:** Ambíguo (valor gasto vs nº de pedidos). Responder com premissa.

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1104

**Tabelas recuperadas (RAG):** wishlists, customers, employees, orders, cart_items, stores

**Motivo da recusa:** Não há tabela que contenha os itens dos pedidos para calcular o gasto total dos clientes.

---

## q16 — ambigua

**Pergunta:** Qual a categoria mais popular?

**Esperado:** Ambíguo (unidades vs receita vs nº de produtos). Responder com premissa.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1149

**Tabelas recuperadas (RAG):** categories, carts, reviews, cart_items, products, promotions

**Premissa (ambiguidade):** Interpretação: categoria com maior número de produtos cadastrados

**SQL gerado:**
```sql
SELECT c.name AS categoria, COUNT(p.id) AS total FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.name ORDER BY total DESC LIMIT 1
```

**Resultado (primeiras linhas):**
```json
[
  {
    "categoria": "Esporte e Lazer",
    "total": 8
  }
]
```

---

## q17 — ambigua

**Pergunta:** Qual o melhor produto?

**Esperado:** Ambíguo (receita vs unidades vs lucro vs nota média). Responder com premissa.

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1154

**Tabelas recuperadas (RAG):** products, inventory, discounts, promotions, categories, product_suppliers

**Motivo da recusa:** Não há dados de vendas para determinar o melhor produto.

---

## q18 — multi_passo

**Pergunta:** Qual o crescimento da receita mês a mês nos últimos 12 meses?

**Esperado:** date_trunc('month', orders.created_at), SUM, LAG para variação. Excluir cancelados.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1279

**Tabelas recuperadas (RAG):** refunds, order_coupons, coupons, payments, products, cart_items

**SQL gerado:**
```sql
WITH monthly_revenue AS ( SELECT date_trunc('month', o.created_at) AS month, SUM(oi.quantity * oi.unit_price) AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') AND o.created_at >= date_trunc('month', now() - interval '11 months') GROUP BY 1 ) SELECT month, revenue, ROUND((revenue - LAG(revenue) OVER (ORDER BY month)) / NULLIF(LAG(revenue) OVER (ORDER BY month),0) * 100, 2) AS growth_percent FROM monthly_revenue ORDER BY month LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "month": "2025-11-01T00:00:00.000Z",
    "revenue": 1681779.7,
    "growth_percent": null
  },
  {
    "month": "2025-12-01T00:00:00.000Z",
    "revenue": 1554097.14,
    "growth_percent": -7.59
  },
  {
    "month": "2026-01-01T00:00:00.000Z",
    "revenue": 2089534.33,
    "growth_percent": 34.45
  },
  {
    "month": "2026-02-01T00:00:00.000Z",
    "revenue": 2056715.15,
    "growth_percent": -1.57
  },
  {
    "month": "2026-03-01T00:00:00.000Z",
    "revenue": 2362339.06,
    "growth_percent": 14.86
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
WITH total AS (SELECT SUM(oi.quantity * oi.unit_price) AS total FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status IN ('PAID','SHIPPED','DELIVERED')) SELECT c.name AS categoria, 100.0 * SUM(oi.quantity * oi.unit_price) / t.total AS percent FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id JOIN categories c ON c.id = p.category_id JOIN total t ON true WHERE o.status IN ('PAID','SHIPPED','DELIVERED') GROUP BY c.name, t.total ORDER BY percent DESC LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "categoria": "Casa e Cozinha",
    "percent": 24.42733273918928
  },
  {
    "categoria": "Livros",
    "percent": 18.767239696501615
  },
  {
    "categoria": "Esporte e Lazer",
    "percent": 16.47903416389727
  },
  {
    "categoria": "Moda",
    "percent": 16.155535652633755
  },
  {
    "categoria": "Informática",
    "percent": 12.546564464967718
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

**Motivo da recusa:** Não há tabela de pedidos ou itens de pedido no esquema fornecido.

---

## q21 — multi_passo

**Pergunta:** Qual a nota média de avaliação por categoria?

**Esperado:** AVG(reviews.rating) agrupado por categoria (reviews->products->categories).

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1194

**Tabelas recuperadas (RAG):** reviews, categories, employees, products, cart_items, carts

**SQL gerado:**
```sql
SELECT c.name AS categoria, AVG(r.rating) AS nota_media FROM categories c JOIN products p ON p.category_id = c.id JOIN reviews r ON r.product_id = p.id GROUP BY c.name ORDER BY nota_media DESC LIMIT 500
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

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1240

**Tabelas recuperadas (RAG):** categories, returns, products, coupons, discounts, cart_items

**Motivo da recusa:** Não há tabelas de pedidos ou itens de pedido no esquema fornecido para calcular a taxa de devolução por categoria.

---

## q23 — multi_passo

**Pergunta:** Qual o valor total em estoque a preço de custo, por armazém?

**Esperado:** SUM(inventory.quantity * products.cost) GROUP BY warehouse.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1268

**Tabelas recuperadas (RAG):** order_items, inventory, coupons, products, order_coupons, orders

**SQL gerado:**
```sql
SELECT i.warehouse_id, SUM(i.quantity * p.cost) AS total_value_cost FROM inventory i JOIN products p ON i.product_id = p.id GROUP BY i.warehouse_id ORDER BY total_value_cost DESC LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "warehouse_id": 1,
    "total_value_cost": 13755011.93
  },
  {
    "warehouse_id": 3,
    "total_value_cost": 12589501.95
  },
  {
    "warehouse_id": 4,
    "total_value_cost": 12533655.62
  },
  {
    "warehouse_id": 2,
    "total_value_cost": 9467786.8
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
SELECT AVG(order_total) AS ticket_medio FROM (SELECT order_id, SUM(quantity * unit_price) AS order_total FROM order_items GROUP BY order_id) sub LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "ticket_medio": 24878.73168333333
  }
]
```

---

## q25 — fraseado

**Pergunta:** Qual o ticket médio por cliente?

**Esperado:** Gasto total por cliente e então média entre clientes. Diferente de por pedido.

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1194

**Tabelas recuperadas (RAG):** orders, coupons, addresses, payments, cart_items, order_coupons

**Motivo da recusa:** Não há tabela ou coluna que contenha os itens do pedido para calcular o valor total.

---

## q26 — regra_negocio

**Pergunta:** Quantos produtos estão sem estoque?

**Esperado:** Produtos com estoque total 0 (SUM(inventory.quantity)=0 ou sem linha de inventory).

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1168

**Tabelas recuperadas (RAG):** inventory, product_variants, products, order_items, reviews, product_suppliers

**SQL gerado:**
```sql
WITH prod_stock AS (SELECT p.id, COALESCE(SUM(i.quantity),0) AS total_qty FROM products p LEFT JOIN inventory i ON i.product_id = p.id GROUP BY p.id) SELECT COUNT(*) AS produtos_sem_estoque FROM prod_stock WHERE total_qty = 0 LIMIT 500
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
SELECT COUNT(*) AS abandonados FROM carts WHERE status = 'ABANDONED' LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "abandonados": 66
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

**Motivo da recusa:** Não há dados de custo de aquisição no esquema.

---

## q29 — alucinacao

**Pergunta:** De qual canal de marketing vêm mais vendas?

**Esperado:** RECUSAR: não existe origem/canal de marketing em lugar nenhum do schema.

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1157

**Tabelas recuperadas (RAG):** products, cart_items, discounts, reviews, promotions, suppliers

**Motivo da recusa:** Não há coluna ou tabela que registre canal de marketing

---

## q30 — alucinacao

**Pergunta:** Qual a nota de satisfação do atendimento ao cliente (SAC)?

**Esperado:** RECUSAR: reviews são de PRODUTO; não há avaliação de atendimento/SAC. Não confundir com reviews.

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1215

**Tabelas recuperadas (RAG):** reviews, orders, products, wishlists, employees, inventory

**Motivo da recusa:** Não há dados de satisfação do atendimento ao cliente no esquema.

---
