# Resultados de diagnóstico — modelo `openai/gpt-oss-120b`

Gerado em 2026-10-29T15:56:26.554Z. Pipeline cru (sem RAG, sem retry, sem autocorreção).

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
SELECT state, COUNT(*) AS total_customers FROM customers GROUP BY state ORDER BY state LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "state": "AM",
    "total_customers": 1
  },
  {
    "state": "BA",
    "total_customers": 8
  },
  {
    "state": "CE",
    "total_customers": 7
  },
  {
    "state": "DF",
    "total_customers": 6
  },
  {
    "state": "ES",
    "total_customers": 4
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
SELECT COALESCE(SUM(oi.quantity * oi.unit_price),0) AS total_revenue FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') LIMIT 500
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
SELECT COALESCE(SUM(oi.quantity * (oi.unit_price - p.cost)), 0) AS total_profit FROM order_items oi JOIN orders o ON oi.order_id = o.id AND o.status IN ('PAID','SHIPPED','DELIVERED') JOIN products p ON oi.product_id = p.id LIMIT 500
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
SELECT COALESCE(SUM(oc.amount_applied), 0) AS total_coupon_discount FROM order_coupons oc JOIN orders o ON oc.order_id = o.id WHERE o.status IN ('PAID', 'SHIPPED', 'DELIVERED') LIMIT 500
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
SELECT COALESCE(SUM(amount), 0) AS total_refunded FROM refunds LIMIT 500
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
SELECT AVG(list_price) AS preco_tabela_medio FROM products LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "preco_tabela_medio": 3810.2208333333333
  }
]
```

---

## q11 — confusavel

**Pergunta:** Em quais cidades os pedidos foram entregues com mais frequência?

**Esperado:** CERTO: usar orders.shipping_address_id -> addresses.city. ERRADO: usar billing_address_id ou customers.city.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1881

**Premissa (ambiguidade):** Considerei entregas como registros da tabela shipments com status 'DELIVERED', usando a cidade do endereço de entrega (addresses).

**SQL gerado:**
```sql
SELECT a.city, COUNT(*) AS delivery_count FROM shipments s JOIN addresses a ON s.address_id = a.id WHERE s.status = 'DELIVERED' GROUP BY a.city ORDER BY delivery_count DESC LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "city": "Arthur de Nossa Senhora",
    "delivery_count": 14
  },
  {
    "city": "Pereira de Nossa Senhora",
    "delivery_count": 11
  },
  {
    "city": "Costa de Nossa Senhora",
    "delivery_count": 11
  },
  {
    "city": "Kléber de Nossa Senhora",
    "delivery_count": 10
  },
  {
    "city": "Martins do Sul",
    "delivery_count": 8
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
SELECT c.name, COUNT(*) AS delivered_orders FROM shipments s JOIN carriers c ON s.carrier_id = c.id WHERE s.status = 'DELIVERED' GROUP BY c.name ORDER BY delivered_orders DESC LIMIT 1
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
SELECT pm.name, COUNT(*) AS usage_count
FROM payments p
JOIN payment_methods pm ON p.payment_method_id = pm.id
WHERE p.status = 'COMPLETED'
GROUP BY pm.name
ORDER BY usage_count DESC
LIMIT 1
```

**Resultado (primeiras linhas):**
```json
[
  {
    "name": "Boleto",
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

**prompt_tokens:** 1875

**Premissa (ambiguidade):** Considerei 'melhores' como os clientes que gastaram maior valor total em pedidos com status PAID, SHIPPED ou DELIVERED; outra leitura possível seria por número de pedidos ou frequência de compra.

**SQL gerado:**
```sql
WITH customer_spending AS ( SELECT c.id, c.name, c.email, SUM(oi.quantity * oi.unit_price) AS total_spent, COUNT(DISTINCT o.id) AS orders_count FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items oi ON oi.order_id = o.id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') GROUP BY c.id, c.name, c.email ) SELECT id, name, email, total_spent, orders_count FROM customer_spending ORDER BY total_spent DESC LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "id": 94,
    "name": "Manuela Pereira",
    "email": "manuela.pereira@example.com",
    "total_spent": 344262.46,
    "orders_count": 12
  },
  {
    "id": 118,
    "name": "Benjamin Nogueira",
    "email": "benjamin.nogueira96@example.com",
    "total_spent": 299839.12,
    "orders_count": 9
  },
  {
    "id": 38,
    "name": "Emanuelly Macedo",
    "email": "emanuelly_macedo24@example.com",
    "total_spent": 297916.85,
    "orders_count": 9
  },
  {
    "id": 144,
    "name": "Danilo Costa",
    "email": "danilo_costa89@example.com",
    "total_spent": 271063.75,
    "orders_count": 11
  },
  {
    "id": 70,
    "name": "Hélio Moraes",
    "email": "helio.moraes@example.com",
    "total_spent": 265949.41,
    "orders_count": 9
  }
]
```

---

## q16 — ambigua

**Pergunta:** Qual a categoria mais popular?

**Esperado:** Ambíguo (unidades vs receita vs nº de produtos). Responder com premissa.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1875

**Premissa (ambiguidade):** Considerei 'popular' como a categoria com maior quantidade de itens vendidos; outra leitura possível seria por receita total.

**SQL gerado:**
```sql
WITH category_sales AS ( SELECT c.id, c.name, SUM(oi.quantity) AS total_quantity FROM order_items oi JOIN orders o ON oi.order_id = o.id JOIN products p ON oi.product_id = p.id JOIN categories c ON p.category_id = c.id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') GROUP BY c.id, c.name ) SELECT name AS categoria, total_quantity AS quantidade_vendida FROM category_sales ORDER BY total_quantity DESC LIMIT 1
```

**Resultado (primeiras linhas):**
```json
[
  {
    "categoria": "Moda",
    "quantidade_vendida": 1333
  }
]
```

---

## q17 — ambigua

**Pergunta:** Qual o melhor produto?

**Esperado:** Ambíguo (receita vs unidades vs lucro vs nota média). Responder com premissa.

**Resultado do pipeline:** ✅ ok

**prompt_tokens:** 1874

**Premissa (ambiguidade):** Considerei 'melhor' como o produto com maior receita total de vendas (valor dos pedidos com status PAID, SHIPPED ou DELIVERED). Outra leitura possível seria por unidades vendidas ou margem de lucro.

**SQL gerado:**
```sql
WITH product_sales AS ( SELECT oi.product_id, SUM(oi.quantity * oi.unit_price) AS revenue, SUM(oi.quantity) AS units_sold, SUM(oi.quantity * (oi.unit_price - p.cost)) AS profit FROM order_items oi JOIN orders o ON oi.order_id = o.id JOIN products p ON oi.product_id = p.id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') GROUP BY oi.product_id ) SELECT p.id, p.name, p.sku, ps.revenue, ps.units_sold, ps.profit FROM product_sales ps JOIN products p ON ps.product_id = p.id ORDER BY ps.revenue DESC LIMIT 1
```

**Resultado (primeiras linhas):**
```json
[
  {
    "id": 18,
    "name": "Liquidificador 1200W",
    "sku": "SKU-1017",
    "revenue": 1301026.86,
    "units_sold": 189,
    "profit": 570109.05
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
WITH monthly_revenue AS (
  SELECT date_trunc('month', o.created_at)::date AS month,
         SUM(oi.quantity * oi.unit_price) AS revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status IN ('PAID','SHIPPED','DELIVERED')
    AND o.created_at >= date_trunc('month', current_date) - interval '11 months'
  GROUP BY 1
  ORDER BY 1
)
SELECT month,
       revenue,
       CASE WHEN LAG(revenue) OVER (ORDER BY month) IS NULL THEN NULL
            ELSE ROUND((revenue - LAG(revenue) OVER (ORDER BY month)) * 100.0 / LAG(revenue) OVER (ORDER BY month), 2)
       END AS growth_percent
FROM monthly_revenue
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
WITH revenue AS ( SELECT oi.product_id, SUM(oi.quantity * oi.unit_price) AS prod_rev FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') GROUP BY oi.product_id ), cat_rev AS ( SELECT p.category_id, SUM(r.prod_rev) AS revenue FROM revenue r JOIN products p ON r.product_id = p.id GROUP BY p.category_id ), total AS ( SELECT SUM(revenue) AS total_rev FROM cat_rev ) SELECT c.name AS category, ROUND((cr.revenue / t.total_rev) * 100, 2) AS percentage FROM cat_rev cr JOIN categories c ON cr.category_id = c.id CROSS JOIN total t ORDER BY percentage DESC LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "category": "Casa e Cozinha",
    "percentage": 24.43
  },
  {
    "category": "Livros",
    "percentage": 18.77
  },
  {
    "category": "Esporte e Lazer",
    "percentage": 16.48
  },
  {
    "category": "Moda",
    "percentage": 16.16
  },
  {
    "category": "Informática",
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

**Premissa (ambiguidade):** Considerei 'mais vendidos' como maior quantidade vendida; outra leitura possível seria maior faturamento.

**SQL gerado:**
```sql
WITH product_sales AS ( SELECT oi.product_id, SUM(oi.quantity) AS total_quantity, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') GROUP BY oi.product_id ) SELECT p.id, p.name, ps.total_quantity, ps.revenue FROM product_sales ps JOIN products p ON p.id = ps.product_id ORDER BY ps.total_quantity DESC LIMIT 5
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
SELECT c.name AS categoria, AVG(r.rating) AS nota_media FROM reviews r JOIN products p ON r.product_id = p.id JOIN categories c ON p.category_id = c.id GROUP BY c.name LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "categoria": "Eletrônicos",
    "nota_media": 3.968503937007874
  },
  {
    "categoria": "Esporte e Lazer",
    "nota_media": 3.562962962962963
  },
  {
    "categoria": "Livros",
    "nota_media": 3.884892086330935
  },
  {
    "categoria": "Informática",
    "nota_media": 4
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

**prompt_tokens:** 1878

**SQL gerado:**
```sql
WITH sold AS (
    SELECT p.category_id, SUM(oi.quantity) AS sold_qty
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    WHERE o.status IN ('PAID','SHIPPED','DELIVERED')
    GROUP BY p.category_id
), returned AS (
    SELECT p.category_id, SUM(ri.quantity) AS returned_qty
    FROM return_items ri
    JOIN returns r ON ri.return_id = r.id
    JOIN order_items oi ON ri.order_item_id = oi.id
    JOIN products p ON oi.product_id = p.id
    WHERE r.status IN ('APPROVED','COMPLETED')
    GROUP BY p.category_id
)
SELECT c.name AS category,
       COALESCE(r.returned_qty, 0)::DECIMAL / NULLIF(s.sold_qty, 0) AS return_rate
FROM categories c
LEFT JOIN sold s ON c.id = s.category_id
LEFT JOIN returned r ON c.id = r.category_id
ORDER BY c.name LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "category": "Casa e Cozinha",
    "return_rate": 0.00974025974025974
  },
  {
    "category": "Eletrônicos",
    "return_rate": 0.009167303284950344
  },
  {
    "category": "Esporte e Lazer",
    "return_rate": 0.0061068702290076335
  },
  {
    "category": "Informática",
    "return_rate": 0.004897959183673469
  },
  {
    "category": "Livros",
    "return_rate": 0.008051529790660225
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
SELECT w.id, w.name, SUM(i.quantity * p.cost) AS total_cost_value
FROM inventory i
JOIN warehouses w ON i.warehouse_id = w.id
JOIN products p ON i.product_id = p.id
GROUP BY w.id, w.name
ORDER BY w.id LIMIT 500
```

**Resultado (primeiras linhas):**
```json
[
  {
    "id": 1,
    "name": "CD 1",
    "total_cost_value": 13755011.93
  },
  {
    "id": 2,
    "name": "CD 2",
    "total_cost_value": 9467786.8
  },
  {
    "id": 3,
    "name": "CD 3",
    "total_cost_value": 12589501.95
  },
  {
    "id": 4,
    "name": "CD 4",
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
SELECT AVG(customer_total) AS ticket_medio_por_cliente FROM ( SELECT o.customer_id, SUM(oi.quantity * oi.unit_price) AS customer_total FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') GROUP BY o.customer_id ) sub LIMIT 500
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

**prompt_tokens:** 1876

**SQL gerado:**
```sql
SELECT COUNT(*) AS produtos_sem_estoque FROM products p LEFT JOIN (SELECT product_id, SUM(quantity) AS total_qty FROM inventory GROUP BY product_id) i ON p.id = i.product_id WHERE COALESCE(i.total_qty,0) = 0 LIMIT 500
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

**Motivo da recusa:** Não há dados de custos de aquisição de clientes no esquema fornecido.

---

## q29 — alucinacao

**Pergunta:** De qual canal de marketing vêm mais vendas?

**Esperado:** RECUSAR: não existe origem/canal de marketing em lugar nenhum do schema.

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1878

**Motivo da recusa:** Não há dados de canal de marketing no esquema.

---

## q30 — alucinacao

**Pergunta:** Qual a nota de satisfação do atendimento ao cliente (SAC)?

**Esperado:** RECUSAR: reviews são de PRODUTO; não há avaliação de atendimento/SAC. Não confundir com reviews.

**Resultado do pipeline:** 🚫 recusou

**prompt_tokens:** 1882

**Motivo da recusa:** Não há tabela ou coluna que registre notas de satisfação do atendimento ao cliente (SAC) no esquema fornecido.

---
