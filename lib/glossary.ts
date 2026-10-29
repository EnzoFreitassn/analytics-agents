// Glossário de métricas e regras de negócio (texto curto).
// Preparado para a Etapa 4d (recuperação): por enquanto NÃO é usado no prompt,
// só fica pronto. Cada entrada é um "chunk" independente, recuperável.

export type GlossaryEntry = {
  termo: string;
  definicao: string;
};

export const GLOSSARY: GlossaryEntry[] = [
  {
    termo: "Faturamento (receita)",
    definicao:
      "Soma de order_items.quantity * order_items.unit_price, considerando apenas pedidos com status PAID, SHIPPED ou DELIVERED (exclui PENDING e CANCELLED).",
  },
  {
    termo: "Lucro bruto",
    definicao:
      "SUM(order_items.quantity * (order_items.unit_price - products.cost)) nos pedidos faturados (PAID/SHIPPED/DELIVERED).",
  },
  {
    termo: "Margem (%)",
    definicao:
      "Lucro bruto dividido pelo faturamento, em porcentagem: 100 * lucro / receita.",
  },
  {
    termo: "Ticket médio por pedido",
    definicao:
      "Média do valor total POR PEDIDO. Some os itens de cada pedido (quantity*unit_price) e então tire a média entre pedidos (não a média por item).",
  },
  {
    termo: "Ticket médio por cliente",
    definicao:
      "Gasto total de cada cliente e então a média entre clientes. Diferente de ticket por pedido.",
  },
  {
    termo: "Taxa de devolução",
    definicao:
      "Proporção de pedidos devolvidos: COUNT(distinct returns.order_id) / COUNT(orders), geralmente sobre pedidos entregues. Pode ser medida por categoria juntando return_items -> order_items -> products.",
  },
  {
    termo: "Desconto efetivo",
    definicao:
      "Diferença entre o que seria cobrado e o que foi cobrado. Pode vir de: list_price vs sale_price (produto), order_coupons.amount_applied (cupom no pedido), discounts.discount_percent (produto) ou promotions (campanha). Escolha a fonte conforme a pergunta.",
  },
  {
    termo: "Valor reembolsado",
    definicao:
      "Soma de refunds.amount. É dinheiro que saiu de volta ao cliente — NÃO é payments.amount (dinheiro que entrou).",
  },
  {
    termo: "Receita líquida",
    definicao:
      "Faturamento menos reembolsos: SUM(payments.amount dos COMPLETED) - SUM(refunds.amount).",
  },
  {
    termo: "Valor em estoque",
    definicao:
      "SUM(inventory.quantity * products.cost) (a custo) ou * products.price (a preço de venda), por armazém ou no total.",
  },
  {
    termo: "Nota média (avaliação)",
    definicao:
      "AVG(reviews.rating) por produto ou por categoria (juntando reviews -> products -> categories). Vai de 1 a 5.",
  },
  {
    termo: "Pedido faturado",
    definicao:
      "Pedido com status PAID, SHIPPED ou DELIVERED. PENDING e CANCELLED não contam como venda realizada.",
  },
  {
    termo: "Endereço de entrega vs cobrança",
    definicao:
      "Entrega = orders.shipping_address_id; cobrança = orders.billing_address_id. Para 'onde foi entregue', use o de entrega.",
  },
];
