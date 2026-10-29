# Resultados de diagnóstico — modelo `openai/gpt-oss-20b`

Gerado em 2026-10-29T16:01:22.795Z. Pipeline cru (sem RAG, sem retry, sem autocorreção).

**Resumo:** 27 rodaram, 3 recusaram (dado inexistente), 0 falharam (de 30). prompt_tokens médio por pergunta: 1878 (baseline "tudo no prompt"). Obs: "rodou" só indica que o SQL executou — não que a resposta está semanticamente correta.

## q01 — facil

**Pergunta:** Quantos fornecedores temos cadastrados?

**Esperado:** COUNT(*) em suppliers.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1876

**SQL gerado:**
```sql
SELECT COUNT(*) AS total_suppliers FROM suppliers LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "total_suppliers": 10
  }
]
```

---

## q02 — facil

**Pergunta:** Quantas avaliações de produtos foram feitas?

**Esperado:** COUNT(*) em reviews.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1877

**SQL gerado:**
```sql
SELECT COUNT(*) AS total_reviews FROM reviews LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "total_reviews": 800
  }
]
```

---

## q03 — facil

**Pergunta:** Quantos pedidos foram feitos no total?

**Esperado:** COUNT(*) em orders = 1200.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1877

**SQL gerado:**
```sql
SELECT COUNT(*) AS total_orders FROM orders LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "total_orders": 1200
  }
]
```

---

## q04 — facil

**Pergunta:** Quantos clientes temos por estado?

**Esperado:** customers GROUP BY state.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1876

**SQL gerado:**
```sql
SELECT state, COUNT(*) AS num_customers FROM customers GROUP BY state LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "state": "SP",
    "num_customers": 43
  },
  {
    "state": "GO",
    "num_customers": 7
  },
  {
    "state": "AM",
    "num_customers": 1
  },
  {
    "state": "PA",
    "num_customers": 7
  },
  {
    "state": "PE",
    "num_customers": 13
  }
]
```

---

## q05 — regra_negocio

**Pergunta:** Qual o faturamento total?

**Esperado:** SUM(order_items.quantity*unit_price) em pedidos PAID/SHIPPED/DELIVERED (excluir CANCELLED).

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1875

**SQL gerado:**
```sql
SELECT SUM(oi.quantity * oi.unit_price) AS total_revenue FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "total_revenue": 24228837.93
  }
]
```

---

## q06 — regra_negocio

**Pergunta:** Qual o lucro total?

**Esperado:** SUM(quantity*(unit_price - products.cost)) nos pedidos faturados. Usar cost (não list_price/sale_price).

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1874

**SQL gerado:**
```sql
SELECT SUM(oi.quantity * (oi.unit_price - p.cost)) AS total_profit FROM order_items oi JOIN orders o ON oi.order_id = o.id JOIN products p ON oi.product_id = p.id WHERE o.status IN ('PAID', 'SHIPPED', 'DELIVERED') LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "total_profit": 8494623.98
  }
]
```

---

## q07 — regra_negocio

**Pergunta:** Quantos pedidos foram entregues?

**Esperado:** COUNT em orders WHERE status='DELIVERED'.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1876

**SQL gerado:**
```sql
SELECT COUNT(*) AS total_delivered_orders FROM orders WHERE status = 'DELIVERED' LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "total_delivered_orders": 542
  }
]
```

---

## q08 — confusavel

**Pergunta:** Quanto foi concedido em cupons nos pedidos?

**Esperado:** CERTO: SUM(order_coupons.amount_applied). ERRADO: usar promotions ou discounts ou list_price/sale_price.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1879

**SQL gerado:**
```sql
SELECT SUM(oc.amount_applied) AS total_coupon_discount
FROM order_coupons oc
JOIN orders o ON oc.order_id = o.id
WHERE o.status IN ('PAID', 'SHIPPED', 'DELIVERED') LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "total_coupon_discount": 14526.93
  }
]
```

---

## q09 — confusavel

**Pergunta:** Qual o total já reembolsado aos clientes?

**Esperado:** CERTO: SUM(refunds.amount). ERRADO: usar payments.amount.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1880

**SQL gerado:**
```sql
SELECT SUM(amount) AS total_refunded FROM refunds LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "total_refunded": 472923.53
  }
]
```

---

## q10 — confusavel

**Pergunta:** Qual o preço de tabela médio dos produtos?

**Esperado:** CERTO: AVG(products.list_price). ERRADO: usar price, cost ou sale_price.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1878

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

**prompt_tokens:** 1881

**SQL gerado:**
```sql
SELECT a.city, COUNT(*) AS delivered_orders FROM orders o JOIN addresses a ON o.shipping_address_id = a.id WHERE o.status = 'DELIVERED' GROUP BY a.city ORDER BY delivered_orders DESC LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "city": "Arthur de Nossa Senhora",
    "delivered_orders": 14
  },
  {
    "city": "Pereira de Nossa Senhora",
    "delivered_orders": 11
  },
  {
    "city": "Costa de Nossa Senhora",
    "delivered_orders": 11
  },
  {
    "city": "Kléber de Nossa Senhora",
    "delivered_orders": 10
  },
  {
    "city": "Martins do Sul",
    "delivered_orders": 8
  }
]
```

---

## q12 — confusavel

**Pergunta:** Qual transportadora entregou mais pedidos?

**Esperado:** CERTO: shipments JOIN carriers WHERE shipment status DELIVERED, GROUP BY carrier. Não confundir com stores.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1877

**SQL gerado:**
```sql
SELECT c.name, COUNT(*) AS delivered_orders FROM shipments s JOIN carriers c ON s.carrier_id = c.id WHERE s.status = 'DELIVERED' GROUP BY c.id, c.name ORDER BY delivered_orders DESC LIMIT 1
```

**Resultado (primeiras linhas):**
```json
[
  {
    "name": "Jadlog",
    "delivered_orders": 142
  }
]
```

---

## q13 — confusavel

**Pergunta:** Qual método de pagamento é o mais usado?

**Esperado:** CERTO: payments JOIN payment_methods GROUP BY método. Agora o dado existe (não recusar).

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1878

**SQL gerado:**
```sql
SELECT pm.name AS payment_method, COUNT(*) AS usage_count
FROM payments p
JOIN payment_methods pm ON p.payment_method_id = pm.id
WHERE p.status = 'COMPLETED'
GROUP BY pm.id, pm.name
ORDER BY usage_count DESC
LIMIT 1
```

**Resultado (primeiras linhas):**
```json
[
  {
    "payment_method": "Boleto",
    "usage_count": 266
  }
]
```

---

## q14 — confusavel

**Pergunta:** Quantas unidades temos em estoque no total?

**Esperado:** CERTO: SUM(inventory.quantity). ERRADO: somar order_items.quantity (isso é venda, não estoque).

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1878

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

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1875

**Premissa (ambiguidade):** Considerei 'melhor' como maior valor gasto; outra leitura possível seria número de pedidos

**SQL gerado:**
```sql
WITH customer_spend AS (SELECT c.id AS customer_id, c.name, c.email, SUM(oi.quantity * oi.unit_price) AS total_spent FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items oi ON oi.order_id = o.id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') GROUP BY c.id, c.name, c.email) SELECT * FROM customer_spend ORDER BY total_spent DESC LIMIT 10
```

**Resultado (primeiras linhas):**
```json
[
  {
    "customer_id": 94,
    "name": "Manuela Pereira",
    "email": "manuela.pereira@example.com",
    "total_spent": 344262.46
  },
  {
    "customer_id": 118,
    "name": "Benjamin Nogueira",
    "email": "benjamin.nogueira96@example.com",
    "total_spent": 299839.12
  },
  {
    "customer_id": 38,
    "name": "Emanuelly Macedo",
    "email": "emanuelly_macedo24@example.com",
    "total_spent": 297916.85
  },
  {
    "customer_id": 144,
    "name": "Danilo Costa",
    "email": "danilo_costa89@example.com",
    "total_spent": 271063.75
  },
  {
    "customer_id": 70,
    "name": "Hélio Moraes",
    "email": "helio.moraes@example.com",
    "total_spent": 265949.41
  }
]
```

---

## q16 — ambigua

**Pergunta:** Qual a categoria mais popular?

**Esperado:** Ambíguo (unidades vs receita vs nº de produtos). Responder com premissa.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1875

**Premissa (ambiguidade):** Considerei 'mais popular' como categoria com maior quantidade de unidades vendidas

**SQL gerado:**
```sql
WITH sales AS (SELECT p.category_id, SUM(oi.quantity) AS total_units FROM order_items oi JOIN orders o ON oi.order_id = o.id JOIN products p ON oi.product_id = p.id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') GROUP BY p.category_id) SELECT c.id, c.name, s.total_units FROM sales s JOIN categories c ON s.category_id = c.id ORDER BY s.total_units DESC LIMIT 1
```

**Resultado (primeiras linhas):**
```json
[
  {
    "id": 4,
    "name": "Moda",
    "total_units": 1333
  }
]
```

---

## q17 — ambigua

**Pergunta:** Qual o melhor produto?

**Esperado:** Ambíguo (receita vs unidades vs lucro vs nota média). Responder com premissa.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1874

**Premissa (ambiguidade):** Considerei 'melhor' como o produto com maior receita (valor total das vendas)

**SQL gerado:**
```sql
WITH product_revenue AS (
  SELECT
    p.id,
    p.name,
    SUM(oi.quantity * oi.unit_price) AS revenue
  FROM products p
  JOIN order_items oi ON oi.product_id = p.id
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status IN ('PAID','SHIPPED','DELIVERED')
  GROUP BY p.id, p.name
)
SELECT id, name, revenue
FROM product_revenue
ORDER BY revenue DESC
LIMIT 1
```

**Resultado (primeiras linhas):**
```json
[
  {
    "id": 18,
    "name": "Liquidificador 1200W",
    "revenue": 1301026.86
  }
]
```

---

## q18 — multi_passo

**Pergunta:** Qual o crescimento da receita mês a mês nos últimos 12 meses?

**Esperado:** date_trunc('month', orders.created_at), SUM, LAG para variação. Excluir cancelados.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1883

**SQL gerado:**
```sql
WITH monthly_rev AS (
  SELECT
    date_trunc('month', o.created_at) AS month,
    SUM(oi.quantity * oi.unit_price) AS revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status IN ('PAID','SHIPPED','DELIVERED')
    AND date_trunc('month', o.created_at) >= date_trunc('month', current_date) - interval '11 months'
  GROUP BY 1
), ranked AS (
  SELECT
    month,
    revenue,
    LAG(revenue) OVER (ORDER BY month) AS prev_revenue
  FROM monthly_rev
)
SELECT
  month,
  revenue,
  ROUND((revenue - prev_revenue) / NULLIF(prev_revenue,0)::numeric * 100, 2) AS growth_percent
FROM ranked
ORDER BY month LIMIT 500
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

**prompt_tokens:** 1879

**SQL gerado:**
```sql
WITH order_revenue AS (
  SELECT oi.product_id, oi.quantity, oi.unit_price
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  WHERE o.status IN ('PAID', 'SHIPPED', 'DELIVERED')
),
product_category AS (
  SELECT p.id AS product_id, c.id AS category_id, c.name AS category_name
  FROM products p
  JOIN categories c ON p.category_id = c.id
)
SELECT pc.category_name,
       SUM(or_.quantity * or_.unit_price) AS revenue,
       ROUND(100.0 * SUM(or_.quantity * or_.unit_price) / NULLIF(total.total_revenue,0), 2) AS percentage
FROM order_revenue or_
JOIN product_category pc ON or_.product_id = pc.product_id
CROSS JOIN (SELECT SUM(quantity * unit_price) AS total_revenue FROM order_revenue) total
GROUP BY pc.category_name, total.total_revenue
ORDER BY percentage DESC LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "category_name": "Casa e Cozinha",
    "revenue": 5918458.86,
    "percentage": 24.43
  },
  {
    "category_name": "Livros",
    "revenue": 4547084.09,
    "percentage": 18.77
  },
  {
    "category_name": "Esporte e Lazer",
    "revenue": 3992678.48,
    "percentage": 16.48
  },
  {
    "category_name": "Moda",
    "revenue": 3914298.55,
    "percentage": 16.16
  },
  {
    "category_name": "Informática",
    "revenue": 3039886.77,
    "percentage": 12.55
  }
]
```

---

## q20 — multi_passo

**Pergunta:** Quais os 5 produtos mais vendidos e quanto cada um faturou?

**Esperado:** Top 5 por SUM(quantity) + SUM(quantity*unit_price).

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1884

**SQL gerado:**
```sql
SELECT p.id, p.name, SUM(oi.quantity) AS total_quantity, SUM(oi.quantity * oi.unit_price) AS revenue FROM products p JOIN order_items oi ON p.id = oi.product_id JOIN orders o ON oi.order_id = o.id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') GROUP BY p.id, p.name ORDER BY total_quantity DESC LIMIT 5
```

**Resultado (primeiras linhas):**
```json
[
  {
    "id": 3,
    "name": "Fone Bluetooth Pro",
    "total_quantity": 206,
    "revenue": 406903.56
  },
  {
    "id": 27,
    "name": "Tênis Esportivo",
    "total_quantity": 201,
    "revenue": 1045015.08
  },
  {
    "id": 46,
    "name": "Livro de Receitas Saudáveis",
    "total_quantity": 191,
    "revenue": 486604.97
  },
  {
    "id": 18,
    "name": "Liquidificador 1200W",
    "total_quantity": 189,
    "revenue": 1301026.86
  },
  {
    "id": 38,
    "name": "Tapete de Yoga",
    "total_quantity": 188,
    "revenue": 81287.44
  }
]
```

---

## q21 — multi_passo

**Pergunta:** Qual a nota média de avaliação por categoria?

**Esperado:** AVG(reviews.rating) agrupado por categoria (reviews->products->categories).

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1878

**SQL gerado:**
```sql
SELECT c.name AS category_name, ROUND(AVG(r.rating)::numeric, 2) AS avg_rating FROM reviews r JOIN products p ON r.product_id = p.id JOIN categories c ON p.category_id = c.id GROUP BY c.id, c.name ORDER BY avg_rating DESC LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "category_name": "Informática",
    "avg_rating": 4
  },
  {
    "category_name": "Eletrônicos",
    "avg_rating": 3.97
  },
  {
    "category_name": "Livros",
    "avg_rating": 3.88
  },
  {
    "category_name": "Casa e Cozinha",
    "avg_rating": 3.74
  },
  {
    "category_name": "Moda",
    "avg_rating": 3.73
  }
]
```

---

## q22 — multi_passo

**Pergunta:** Qual a taxa de devolução por categoria?

**Esperado:** return_items->order_items->products->categories; proporção de itens/pedidos devolvidos por categoria.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1878

**Premissa (ambiguidade):** Considerei taxa de devolução como a razão entre quantidade de itens devolvidos e quantidade de itens vendidos por categoria.

**SQL gerado:**
```sql
WITH sold AS (
  SELECT p.category_id, SUM(oi.quantity) AS sold_qty
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.status IN ('PAID','SHIPPED','DELIVERED')
  GROUP BY p.category_id
),
returned AS (
  SELECT p.category_id, SUM(ri.quantity) AS returned_qty
  FROM return_items ri
  JOIN order_items oi ON ri.order_item_id = oi.id
  JOIN products p ON oi.product_id = p.id
  GROUP BY p.category_id
)
SELECT c.name AS category,
       COALESCE(r.returned_qty,0) AS returned_qty,
       s.sold_qty,
       ROUND(COALESCE(r.returned_qty,0)::numeric / NULLIF(s.sold_qty,0) * 100, 2) AS return_rate_percent
FROM sold s
LEFT JOIN returned r ON s.category_id = r.category_id
JOIN categories c ON s.category_id = c.id
ORDER BY return_rate_percent DESC LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "category": "Moda",
    "returned_qty": 25,
    "sold_qty": 1333,
    "return_rate_percent": 1.88
  },
  {
    "category": "Casa e Cozinha",
    "returned_qty": 20,
    "sold_qty": 1232,
    "return_rate_percent": 1.62
  },
  {
    "category": "Livros",
    "returned_qty": 18,
    "sold_qty": 1242,
    "return_rate_percent": 1.45
  },
  {
    "category": "Eletrônicos",
    "returned_qty": 18,
    "sold_qty": 1309,
    "return_rate_percent": 1.38
  },
  {
    "category": "Esporte e Lazer",
    "returned_qty": 17,
    "sold_qty": 1310,
    "return_rate_percent": 1.3
  }
]
```

---

## q23 — multi_passo

**Pergunta:** Qual o valor total em estoque a preço de custo, por armazém?

**Esperado:** SUM(inventory.quantity * products.cost) GROUP BY warehouse.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1885

**SQL gerado:**
```sql
SELECT w.id AS warehouse_id, w.name AS warehouse_name, SUM(i.quantity * p.cost) AS total_cost_value FROM inventory i JOIN products p ON i.product_id = p.id JOIN warehouses w ON i.warehouse_id = w.id GROUP BY w.id, w.name ORDER BY w.id LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "warehouse_id": 1,
    "warehouse_name": "CD 1",
    "total_cost_value": 13755011.93
  },
  {
    "warehouse_id": 2,
    "warehouse_name": "CD 2",
    "total_cost_value": 9467786.8
  },
  {
    "warehouse_id": 3,
    "warehouse_name": "CD 3",
    "total_cost_value": 12589501.95
  },
  {
    "warehouse_id": 4,
    "warehouse_name": "CD 4",
    "total_cost_value": 12533655.62
  }
]
```

---

## q24 — fraseado

**Pergunta:** Qual o ticket médio por pedido?

**Esperado:** AVG do total por pedido (subquery/CTE por order_id, depois AVG).

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1876

**SQL gerado:**
```sql
SELECT AVG(order_total) AS ticket_medio FROM (SELECT o.id, SUM(oi.quantity * oi.unit_price) AS order_total FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') GROUP BY o.id) sub LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "ticket_medio": 24926.78799382716
  }
]
```

---

## q25 — fraseado

**Pergunta:** Qual o ticket médio por cliente?

**Esperado:** Gasto total por cliente e então média entre clientes. Diferente de por pedido.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1876

**SQL gerado:**
```sql
WITH order_totals AS (SELECT o.customer_id, SUM(oi.quantity * oi.unit_price) AS order_total FROM orders o JOIN order_items oi ON o.id = oi.order_id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') GROUP BY o.id, o.customer_id) SELECT customer_id, AVG(order_total) AS avg_ticket FROM order_totals GROUP BY customer_id LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "customer_id": 58,
    "avg_ticket": 23832.255
  },
  {
    "customer_id": 8,
    "avg_ticket": 22776.16857142857
  },
  {
    "customer_id": 184,
    "avg_ticket": 25060.246666666666
  },
  {
    "customer_id": 116,
    "avg_ticket": 39392.525
  },
  {
    "customer_id": 87,
    "avg_ticket": 23010.212
  }
]
```

---

## q26 — regra_negocio

**Pergunta:** Quantos produtos estão sem estoque?

**Esperado:** Produtos com estoque total 0 (SUM(inventory.quantity)=0 ou sem linha de inventory).

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1876

**SQL gerado:**
```sql
SELECT COUNT(*) AS produtos_sem_estoque FROM products p LEFT JOIN (SELECT product_id, SUM(quantity) AS total_qty FROM inventory GROUP BY product_id) inv ON p.id = inv.product_id WHERE COALESCE(inv.total_qty,0) = 0 LIMIT 500
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

**prompt_tokens:** 1877

**SQL gerado:**
```sql
SELECT COUNT(*) AS abandoned_carts FROM carts WHERE status = 'ABANDONED' LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "abandoned_carts": 66
  }
]
```

---

## q28 — alucinacao

**Pergunta:** Qual o custo de aquisição de clientes (CAC) por mês?

**Esperado:** RECUSAR: não há dados de gasto com marketing/aquisição no schema.

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1882

**Motivo da recusa:** Não há dados de custo de aquisição de clientes no esquema.

---

## q29 — alucinacao

**Pergunta:** De qual canal de marketing vêm mais vendas?

**Esperado:** RECUSAR: não existe origem/canal de marketing em lugar nenhum do schema.

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1878

**Motivo da recusa:** Não há coluna ou tabela que registre canal de marketing

---

## q30 — alucinacao

**Pergunta:** Qual a nota de satisfação do atendimento ao cliente (SAC)?

**Esperado:** RECUSAR: reviews são de PRODUTO; não há avaliação de atendimento/SAC. Não confundir com reviews.

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1882

**Motivo da recusa:** Não há dados de avaliação de atendimento ao cliente no esquema.

---
