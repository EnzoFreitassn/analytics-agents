// Banco de exemplos pergunta -> SQL (few-shot) para o RAG.
//
// IMPORTANTE: este conjunto é DISJUNTO das perguntas de evals/questions.json.
// Nenhuma pergunta daqui é usada na avaliação — são padrões "vizinhos" que
// ensinam a forma (join, group by, filtro de status, mês, top-N, anti-join,
// subquery de agregação), sem ensinar o teste. Reusar as perguntas do eval
// como few-shot seria contaminar a medição.

export type Example = { pergunta: string; sql: string };

export const EXAMPLES: Example[] = [
  {
    pergunta: "Quantos produtos existem em cada categoria?",
    sql: "SELECT c.name AS categoria, COUNT(p.id) AS total FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.name ORDER BY total DESC",
  },
  {
    pergunta: "Qual a receita por mês?",
    sql: "SELECT date_trunc('month', o.created_at) AS mes, SUM(oi.quantity * oi.unit_price) AS receita FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') GROUP BY 1 ORDER BY 1",
  },
  {
    pergunta: "Qual o produto mais caro?",
    sql: "SELECT name, price FROM products ORDER BY price DESC LIMIT 1",
  },
  {
    pergunta: "Quantos pedidos cada cliente fez?",
    sql: "SELECT c.id, c.name, COUNT(o.id) AS pedidos FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id, c.name ORDER BY pedidos DESC",
  },
  {
    pergunta: "Qual a receita por categoria?",
    sql: "SELECT c.name AS categoria, SUM(oi.quantity * oi.unit_price) AS receita FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id JOIN categories c ON c.id = p.category_id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') GROUP BY c.name ORDER BY receita DESC",
  },
  {
    pergunta: "Quais produtos nunca foram vendidos?",
    sql: "SELECT p.id, p.name FROM products p LEFT JOIN order_items oi ON oi.product_id = p.id WHERE oi.id IS NULL",
  },
  {
    pergunta: "Qual o custo médio de frete por transportadora?",
    sql: "SELECT ca.name AS transportadora, AVG(s.shipping_cost) AS frete_medio FROM shipments s JOIN carriers ca ON ca.id = s.carrier_id GROUP BY ca.name ORDER BY frete_medio DESC",
  },
  {
    pergunta: "Quantas avaliações cada produto tem e qual a nota média?",
    sql: "SELECT p.name, COUNT(r.id) AS n_avaliacoes, AVG(r.rating) AS nota_media FROM products p JOIN reviews r ON r.product_id = p.id GROUP BY p.name ORDER BY n_avaliacoes DESC",
  },
  {
    pergunta: "Qual o total pago por forma de pagamento?",
    sql: "SELECT pm.name AS metodo, SUM(pay.amount) AS total FROM payments pay JOIN payment_methods pm ON pm.id = pay.payment_method_id WHERE pay.status = 'COMPLETED' GROUP BY pm.name ORDER BY total DESC",
  },
  {
    pergunta: "Quais cupons estão ativos atualmente?",
    sql: "SELECT code, discount_type, discount_value FROM coupons WHERE active = true AND now() BETWEEN valid_from AND valid_to",
  },
  {
    pergunta: "Qual o estoque total de cada produto somando os armazéns?",
    sql: "SELECT p.name, SUM(i.quantity) AS estoque FROM products p JOIN inventory i ON i.product_id = p.id GROUP BY p.name ORDER BY estoque DESC",
  },
  {
    pergunta: "Quantos clientes já fizeram pelo menos um pedido?",
    sql: "SELECT COUNT(DISTINCT customer_id) AS clientes_ativos FROM orders",
  },
  {
    pergunta: "Qual a receita dos últimos 30 dias?",
    sql: "SELECT SUM(oi.quantity * oi.unit_price) AS receita FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status IN ('PAID','SHIPPED','DELIVERED') AND o.created_at >= now() - interval '30 days'",
  },
  {
    pergunta: "Quais os 3 fornecedores com mais produtos?",
    sql: "SELECT s.name, COUNT(p.id) AS n_produtos FROM suppliers s JOIN products p ON p.supplier_id = s.id GROUP BY s.name ORDER BY n_produtos DESC LIMIT 3",
  },
  {
    pergunta: "Qual a média de itens por pedido?",
    sql: "SELECT AVG(n) AS media_itens FROM (SELECT order_id, COUNT(*) AS n FROM order_items GROUP BY order_id) t",
  },
];
