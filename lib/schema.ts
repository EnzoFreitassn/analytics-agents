// Descrição do schema em texto, HARDCODED — "tudo no prompt".
// Este é o baseline que a Etapa 4c mede: todas as ~30 tabelas no system prompt.
// (Na 4d vamos substituir por recuperação/RAG.)

export const SCHEMA_DESCRIPTION = `
Banco PostgreSQL de e-commerce. Tabelas e colunas em snake_case.
Dinheiro em decimal. Enums em MAIÚSCULAS.

== CATÁLOGO ==

categories: id (PK), name (único)

suppliers: id (PK), name, email (único), city, state (UF), created_at
  -- fornecedores dos produtos

products: id (PK), name, sku (único), category_id (FK categories),
  supplier_id (FK suppliers, fornecedor principal),
  price (preço de venda atual), cost (custo de aquisição),
  list_price (preço de tabela/cheio), sale_price (preço promocional vigente, pode ser nulo),
  created_at
  -- ATENÇÃO: price vs cost vs list_price vs sale_price são DIFERENTES.
  --   faturamento/receita usa unit_price do pedido; margem usa (unit_price - cost).

product_suppliers: id (PK), product_id (FK), supplier_id (FK), supply_cost
  -- fornecedores alternativos de um produto e o custo de fornecimento

product_variants: id (PK), product_id (FK), name, sku (único), price_adjustment

product_images: id (PK), product_id (FK), url, is_primary

== ESTOQUE / LOJAS ==

warehouses: id (PK), name, city, state (UF)

inventory: id (PK), product_id (FK), warehouse_id (FK), quantity
  -- quantity aqui é ESTOQUE (não confunda com order_items.quantity, que é venda)

stores: id (PK), name, city, state (UF)   -- lojas físicas

employees: id (PK), name, email (único), role, store_id (FK stores)
  -- NÃO há vínculo de funcionário com pedidos (não existe "vendedor do pedido")

== CLIENTES / ENDEREÇOS ==

customers: id (PK), name, email (único), city, state (UF), created_at

addresses: id (PK), customer_id (FK), type (BILLING | SHIPPING),
  street, city, state (UF), zip

== PEDIDOS ==

orders: id (PK), customer_id (FK), store_id (FK stores, pode ser nulo),
  shipping_address_id (FK addresses, ENTREGA),
  billing_address_id (FK addresses, COBRANÇA),
  status (PENDING | PAID | SHIPPED | DELIVERED | CANCELLED), created_at
  -- ATENÇÃO: shipping_address_id (entrega) é DIFERENTE de billing_address_id (cobrança).
  -- O valor do pedido NÃO fica em orders; some os itens.

order_items: id (PK), order_id (FK), product_id (FK), quantity, unit_price
  -- unit_price é o preço cobrado no pedido. Valor da linha = quantity * unit_price.

== PAGAMENTOS / REEMBOLSOS ==

payment_methods: id (PK), name (único)   -- ex: "Pix", "Cartão de Crédito", "Boleto"

payments: id (PK), order_id (FK), payment_method_id (FK), amount,
  status (PENDING | COMPLETED | FAILED | REFUNDED), paid_at
  -- dinheiro que ENTROU

refunds: id (PK), payment_id (FK), amount, reason, created_at
  -- dinheiro que SAIU de volta ao cliente. NÃO confundir com payments.

== ENVIO ==

carriers: id (PK), name (único)   -- transportadoras: "Correios", "Jadlog"...

shipments: id (PK), order_id (FK), carrier_id (FK), address_id (FK addresses),
  status (PREPARING | SHIPPED | IN_TRANSIT | DELIVERED | RETURNED),
  shipping_cost, tracking_code, shipped_at, delivered_at

== DEVOLUÇÕES ==

returns: id (PK), order_id (FK), reason,
  status (REQUESTED | APPROVED | REJECTED | COMPLETED), created_at

return_items: id (PK), return_id (FK), order_item_id (FK order_items), quantity

== AVALIAÇÕES ==

reviews: id (PK), product_id (FK), customer_id (FK), rating (1 a 5), comment, created_at
  -- avaliação de PRODUTO. Não existe avaliação de atendimento/SAC.

== CUPONS / PROMOÇÕES / DESCONTOS (TRÊS COISAS DIFERENTES) ==

coupons: id (PK), code (único), discount_type (PERCENT | FIXED), discount_value,
  valid_from, valid_to, active
  -- código que o cliente aplica no checkout

order_coupons: id (PK), order_id (FK), coupon_id (FK), amount_applied
  -- qual cupom foi usado em qual pedido e quanto de desconto deu

promotions: id (PK), name, description, discount_percent, starts_at, ends_at
  -- campanha ampla (ex: Black Friday). NÃO tem FK para produto ou pedido.

discounts: id (PK), product_id (FK), discount_percent, starts_at, ends_at
  -- desconto a nível de PRODUTO (não é cupom nem promoção de campanha)

== CARRINHOS / WISHLIST ==

carts: id (PK), customer_id (FK), status (ACTIVE | ABANDONED | CONVERTED), created_at

cart_items: id (PK), cart_id (FK), product_id (FK), quantity

wishlists: id (PK), customer_id (FK), created_at

wishlist_items: id (PK), wishlist_id (FK), product_id (FK)

== REGRAS IMPORTANTES ==
- Valor/receita de um pedido = SUM(order_items.quantity * order_items.unit_price).
- Faturamento/receita costuma considerar apenas pedidos PAID/SHIPPED/DELIVERED
  (exclui PENDING e CANCELLED), salvo indicação em contrário.
- Lucro/margem = SUM(order_items.quantity * (order_items.unit_price - products.cost)).
- "desconto" pode vir de três lugares diferentes (coupons/order_coupons,
  promotions, discounts) OU de list_price vs sale_price — escolha conforme a pergunta.
`.trim();
