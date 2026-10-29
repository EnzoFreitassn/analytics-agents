import {
  PrismaClient,
  OrderStatus,
  AddressType,
  PaymentStatus,
  ShipmentStatus,
  ReturnStatus,
  CartStatus,
  DiscountType,
  Prisma,
} from "@prisma/client";
import { fakerPT_BR as faker } from "@faker-js/faker";

const prisma = new PrismaClient();
faker.seed(42);

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

const CATEGORIES: { name: string; products: string[] }[] = [
  { name: "Eletrônicos", products: ["Smartphone Galaxy X", "Notebook Ultra 14", "Fone Bluetooth Pro", 'Smart TV 50"', "Caixa de Som Portátil", "Tablet Lite 10", "Carregador Turbo USB-C", "Webcam Full HD"] },
  { name: "Informática", products: ["Teclado Mecânico RGB", "Mouse Gamer 16000 DPI", 'Monitor 27" 144Hz', "SSD NVMe 1TB", "Memória RAM 16GB", "Placa de Vídeo RTX", "Hub USB 7 Portas", "Headset Gamer 7.1"] },
  { name: "Casa e Cozinha", products: ["Air Fryer 5L", "Liquidificador 1200W", "Cafeteira Expresso", "Jogo de Panelas Antiaderente", "Aspirador de Pó Vertical", "Panela de Pressão Elétrica", "Conjunto de Facas Inox", "Sanduicheira Grill"] },
  { name: "Moda", products: ["Camiseta Básica Algodão", "Calça Jeans Slim", "Tênis Esportivo", "Jaqueta Corta-Vento", "Vestido Floral", "Relógio Analógico", "Mochila Casual", "Óculos de Sol Polarizado"] },
  { name: "Esporte e Lazer", products: ["Bicicleta Aro 29", "Kit Halteres 20kg", "Bola de Futebol Campo", "Esteira Elétrica Dobrável", "Corda de Pular Profissional", "Tapete de Yoga", "Barraca Camping 4 Pessoas", "Garrafa Térmica 1L"] },
  { name: "Livros", products: ["O Programador Pragmático", "Clean Code", "Guia de Investimentos", "Romance Nacional Premiado", "Atlas Geográfico Ilustrado", "Livro de Receitas Saudáveis", "História do Brasil", "Dicionário Escolar"] },
];

const UF_WEIGHTS = [
  { uf: "SP", weight: 22 }, { uf: "MG", weight: 10 }, { uf: "RJ", weight: 8 }, { uf: "BA", weight: 7 },
  { uf: "PR", weight: 6 }, { uf: "RS", weight: 6 }, { uf: "PE", weight: 5 }, { uf: "CE", weight: 5 },
  { uf: "SC", weight: 4 }, { uf: "GO", weight: 4 }, { uf: "PA", weight: 3 }, { uf: "MA", weight: 3 },
  { uf: "ES", weight: 2 }, { uf: "DF", weight: 2 }, { uf: "MT", weight: 2 }, { uf: "MS", weight: 1 },
  { uf: "AM", weight: 1 }, { uf: "RN", weight: 1 }, { uf: "PB", weight: 1 },
];

const STATUS_WEIGHTS = [
  { status: OrderStatus.DELIVERED, weight: 45 },
  { status: OrderStatus.SHIPPED, weight: 15 },
  { status: OrderStatus.PAID, weight: 20 },
  { status: OrderStatus.PENDING, weight: 10 },
  { status: OrderStatus.CANCELLED, weight: 10 },
];

const PAYMENT_METHODS = ["Cartão de Crédito", "Pix", "Boleto", "Cartão de Débito"];
const CARRIERS = ["Correios", "Jadlog", "Loggi", "Total Express"];

const NUM_CUSTOMERS = 200;
const NUM_ORDERS = 1200;
const NUM_SUPPLIERS = 10;
const NUM_WAREHOUSES = 4;
const NUM_STORES = 5;
const NUM_EMPLOYEES = 25;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function weightedPick<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = faker.number.float({ min: 0, max: total });
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

function money(v: number): Prisma.Decimal {
  return new Prisma.Decimal(v.toFixed(2));
}

const now = new Date();
const twelveMonthsAgo = new Date(now);
twelveMonthsAgo.setFullYear(now.getFullYear() - 1);

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log("Limpando tabelas...");
  // Ordem respeita as FKs (filhos primeiro).
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderCoupon.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.review.deleteMany();
  await prisma.returnItem.deleteMany();
  await prisma.return.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.carrier.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productSupplier.deleteMany();
  await prisma.product.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.store.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.category.deleteMany();

  // --- Categorias ---
  console.log("Categorias...");
  const categoryIds: Record<string, number> = {};
  for (const c of CATEGORIES) {
    const created = await prisma.category.create({ data: { name: c.name } });
    categoryIds[c.name] = created.id;
  }

  // --- Fornecedores ---
  console.log("Fornecedores...");
  const supplierData: Prisma.SupplierCreateManyInput[] = [];
  for (let i = 0; i < NUM_SUPPLIERS; i++) {
    supplierData.push({
      name: faker.company.name(),
      email: faker.internet.email({ provider: `forn${i}.com` }).toLowerCase(),
      city: faker.location.city(),
      state: weightedPick(UF_WEIGHTS).uf,
    });
  }
  await prisma.supplier.createMany({ data: supplierData });
  const suppliers = await prisma.supplier.findMany({ select: { id: true } });

  // --- Produtos (preços confundíveis) ---
  console.log("Produtos...");
  const productData: Prisma.ProductCreateManyInput[] = [];
  let skuCounter = 1000;
  for (const c of CATEGORIES) {
    for (const name of c.products) {
      const cost = faker.number.float({ min: 20, max: 4000, fractionDigits: 2 });
      const price = cost * faker.number.float({ min: 1.25, max: 1.8 });
      const listPrice = price * faker.number.float({ min: 1.05, max: 1.35 }); // tabela cheia
      const hasSale = faker.datatype.boolean(0.4);
      const salePrice = hasSale ? price * faker.number.float({ min: 0.75, max: 0.95 }) : null;
      productData.push({
        name,
        sku: `SKU-${skuCounter++}`,
        categoryId: categoryIds[c.name],
        supplierId: faker.helpers.arrayElement(suppliers).id,
        price: money(price),
        cost: money(cost),
        listPrice: money(listPrice),
        salePrice: salePrice === null ? null : money(salePrice),
        createdAt: faker.date.past({ years: 2 }),
      });
    }
  }
  await prisma.product.createMany({ data: productData });
  const products = await prisma.product.findMany({
    select: { id: true, price: true, cost: true },
  });

  // --- Fornecedores x Produtos, variantes, imagens ---
  console.log("Variantes, imagens, product_suppliers...");
  const psData: Prisma.ProductSupplierCreateManyInput[] = [];
  const variantData: Prisma.ProductVariantCreateManyInput[] = [];
  const imageData: Prisma.ProductImageCreateManyInput[] = [];
  let variantSku = 5000;
  for (const p of products) {
    const nSup = faker.number.int({ min: 1, max: 2 });
    const chosenSuppliers = faker.helpers.arrayElements(suppliers, nSup);
    for (const s of chosenSuppliers) {
      psData.push({
        productId: p.id,
        supplierId: s.id,
        supplyCost: money(Number(p.cost) * faker.number.float({ min: 0.85, max: 1.1 })),
      });
    }
    const nVar = faker.number.int({ min: 0, max: 3 });
    for (let v = 0; v < nVar; v++) {
      variantData.push({
        productId: p.id,
        name: faker.helpers.arrayElement(["Pequeno", "Médio", "Grande", "Preto", "Branco", "Azul", "128GB", "256GB"]),
        sku: `VAR-${variantSku++}`,
        priceAdjustment: money(faker.number.float({ min: 0, max: 200, fractionDigits: 2 })),
      });
    }
    const nImg = faker.number.int({ min: 1, max: 3 });
    for (let im = 0; im < nImg; im++) {
      imageData.push({
        productId: p.id,
        url: faker.image.url(),
        isPrimary: im === 0,
      });
    }
  }
  await prisma.productSupplier.createMany({ data: psData, skipDuplicates: true });
  await prisma.productVariant.createMany({ data: variantData });
  await prisma.productImage.createMany({ data: imageData });

  // --- Armazéns + estoque ---
  console.log("Armazéns e estoque...");
  const whData: Prisma.WarehouseCreateManyInput[] = [];
  for (let i = 0; i < NUM_WAREHOUSES; i++) {
    whData.push({ name: `CD ${i + 1}`, city: faker.location.city(), state: weightedPick(UF_WEIGHTS).uf });
  }
  await prisma.warehouse.createMany({ data: whData });
  const warehouses = await prisma.warehouse.findMany({ select: { id: true } });

  const invData: Prisma.InventoryCreateManyInput[] = [];
  for (const p of products) {
    const chosenWh = faker.helpers.arrayElements(warehouses, faker.number.int({ min: 1, max: NUM_WAREHOUSES }));
    for (const w of chosenWh) {
      invData.push({
        productId: p.id,
        warehouseId: w.id,
        quantity: faker.helpers.weightedArrayElement([
          { value: 0, weight: 1 },
          { value: faker.number.int({ min: 1, max: 50 }), weight: 3 },
          { value: faker.number.int({ min: 51, max: 500 }), weight: 6 },
        ]),
      });
    }
  }
  await prisma.inventory.createMany({ data: invData, skipDuplicates: true });

  // --- Lojas e funcionários ---
  console.log("Lojas e funcionários...");
  const storeData: Prisma.StoreCreateManyInput[] = [];
  for (let i = 0; i < NUM_STORES; i++) {
    storeData.push({ name: `Loja ${faker.location.city()}`, city: faker.location.city(), state: weightedPick(UF_WEIGHTS).uf });
  }
  await prisma.store.createMany({ data: storeData });
  const stores = await prisma.store.findMany({ select: { id: true } });

  const empData: Prisma.EmployeeCreateManyInput[] = [];
  for (let i = 0; i < NUM_EMPLOYEES; i++) {
    const fn = faker.person.firstName();
    const ln = faker.person.lastName();
    empData.push({
      name: `${fn} ${ln}`,
      email: faker.internet.email({ firstName: fn, lastName: ln, provider: `loja${i}.com` }).toLowerCase(),
      role: faker.helpers.arrayElement(["Vendedor", "Gerente", "Estoquista", "Atendente"]),
      storeId: faker.helpers.arrayElement(stores).id,
    });
  }
  await prisma.employee.createMany({ data: empData });

  // --- Clientes ---
  console.log("Clientes...");
  const customerData: Prisma.CustomerCreateManyInput[] = [];
  const usedEmails = new Set<string>();
  for (let i = 0; i < NUM_CUSTOMERS; i++) {
    const fn = faker.person.firstName();
    const ln = faker.person.lastName();
    let email = faker.internet.email({ firstName: fn, lastName: ln, provider: "example.com" }).toLowerCase();
    if (usedEmails.has(email)) email = email.replace("@", `.${i}@`);
    usedEmails.add(email);
    customerData.push({
      name: `${fn} ${ln}`,
      email,
      city: faker.location.city(),
      state: weightedPick(UF_WEIGHTS).uf,
      createdAt: faker.date.past({ years: 1 }),
    });
  }
  await prisma.customer.createMany({ data: customerData });
  const customers = await prisma.customer.findMany({ select: { id: true, state: true, city: true } });

  // --- Endereços (1 billing + 1 shipping por cliente) ---
  console.log("Endereços...");
  const addressData: Prisma.AddressCreateManyInput[] = [];
  for (const c of customers) {
    for (const type of [AddressType.BILLING, AddressType.SHIPPING]) {
      addressData.push({
        customerId: c.id,
        type,
        street: faker.location.streetAddress(),
        city: c.city,
        state: c.state,
        zip: faker.location.zipCode("########"),
      });
    }
  }
  await prisma.address.createMany({ data: addressData });
  const addresses = await prisma.address.findMany({ select: { id: true, customerId: true, type: true } });
  const billingByCustomer = new Map<number, number>();
  const shippingByCustomer = new Map<number, number>();
  for (const a of addresses) {
    if (a.type === AddressType.BILLING) billingByCustomer.set(a.customerId, a.id);
    else shippingByCustomer.set(a.customerId, a.id);
  }

  // --- Pedidos + itens ---
  console.log("Pedidos e itens...");
  for (let i = 0; i < NUM_ORDERS; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const createdAt = faker.date.between({ from: twelveMonthsAgo, to: now });
    const status = weightedPick(STATUS_WEIGHTS).status;
    const itemCount = faker.number.int({ min: 1, max: 4 });
    const chosen = faker.helpers.arrayElements(products, itemCount);

    await prisma.order.create({
      data: {
        customerId: customer.id,
        storeId: faker.datatype.boolean(0.5) ? faker.helpers.arrayElement(stores).id : null,
        shippingAddressId: shippingByCustomer.get(customer.id) ?? null,
        billingAddressId: billingByCustomer.get(customer.id) ?? null,
        status,
        createdAt,
        items: {
          create: chosen.map((p) => ({
            productId: p.id,
            quantity: faker.number.int({ min: 1, max: 5 }),
            unitPrice: p.price,
          })),
        },
      },
    });
    if ((i + 1) % 300 === 0) console.log(`  ${i + 1}/${NUM_ORDERS} pedidos...`);
  }

  // Totais por pedido (SUM quantity*unit_price).
  const orders = await prisma.order.findMany({
    select: { id: true, status: true, createdAt: true, customerId: true, shippingAddressId: true },
  });
  const itemTotals = await prisma.orderItem.groupBy({
    by: ["orderId"],
    _sum: { quantity: true },
  });
  const rawTotals = await prisma.$queryRaw<{ order_id: number; total: Prisma.Decimal }[]>`
    SELECT order_id, SUM(quantity * unit_price) AS total FROM order_items GROUP BY order_id
  `;
  const totalByOrder = new Map<number, number>();
  for (const r of rawTotals) totalByOrder.set(r.order_id, Number(r.total));
  void itemTotals;

  // --- Métodos de pagamento ---
  console.log("Pagamentos...");
  await prisma.paymentMethod.createMany({ data: PAYMENT_METHODS.map((name) => ({ name })) });
  const methods = await prisma.paymentMethod.findMany({ select: { id: true } });

  // --- Pagamentos (apenas pedidos pagos ou posteriores) ---
  const paymentData: Prisma.PaymentCreateManyInput[] = [];
  const paidStatuses: OrderStatus[] = [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED];
  const paidOrders = orders.filter((o) => paidStatuses.includes(o.status));
  for (const o of paidOrders) {
    paymentData.push({
      orderId: o.id,
      paymentMethodId: faker.helpers.arrayElement(methods).id,
      amount: money(totalByOrder.get(o.id) ?? 0),
      status: PaymentStatus.COMPLETED,
      paidAt: o.createdAt,
    });
  }
  await prisma.payment.createMany({ data: paymentData });
  const payments = await prisma.payment.findMany({ select: { id: true, orderId: true, amount: true } });
  const paymentByOrder = new Map<number, { id: number; amount: Prisma.Decimal }>();
  for (const p of payments) paymentByOrder.set(p.orderId, { id: p.id, amount: p.amount });

  // --- Transportadoras + envios ---
  console.log("Transportadoras e envios...");
  await prisma.carrier.createMany({ data: CARRIERS.map((name) => ({ name })) });
  const carriers = await prisma.carrier.findMany({ select: { id: true } });

  const shipmentData: Prisma.ShipmentCreateManyInput[] = [];
  const shippedStatuses: OrderStatus[] = [OrderStatus.SHIPPED, OrderStatus.DELIVERED];
  const shippedOrders = orders.filter((o) => shippedStatuses.includes(o.status));
  for (const o of shippedOrders) {
    const isDelivered = o.status === OrderStatus.DELIVERED;
    const shippedAt = faker.date.between({ from: o.createdAt, to: now });
    shipmentData.push({
      orderId: o.id,
      carrierId: faker.helpers.arrayElement(carriers).id,
      addressId: o.shippingAddressId,
      status: isDelivered ? ShipmentStatus.DELIVERED : ShipmentStatus.IN_TRANSIT,
      shippingCost: money(faker.number.float({ min: 9.9, max: 59.9, fractionDigits: 2 })),
      trackingCode: faker.string.alphanumeric(13).toUpperCase(),
      shippedAt,
      deliveredAt: isDelivered ? faker.date.between({ from: shippedAt, to: now }) : null,
    });
  }
  await prisma.shipment.createMany({ data: shipmentData });

  // --- Devoluções (sobre pedidos entregues) ---
  console.log("Devoluções...");
  const deliveredOrders = orders.filter((o) => o.status === OrderStatus.DELIVERED);
  const returnsToCreate = faker.helpers.arrayElements(deliveredOrders, Math.floor(deliveredOrders.length * 0.1));
  for (const o of returnsToCreate) {
    const items = await prisma.orderItem.findMany({ where: { orderId: o.id }, select: { id: true, quantity: true } });
    if (items.length === 0) continue;
    const status = faker.helpers.arrayElement([ReturnStatus.REQUESTED, ReturnStatus.APPROVED, ReturnStatus.COMPLETED, ReturnStatus.REJECTED]);
    const ret = await prisma.return.create({
      data: {
        orderId: o.id,
        reason: faker.helpers.arrayElement(["Produto com defeito", "Não era o esperado", "Chegou danificado", "Arrependimento"]),
        status,
        createdAt: faker.date.between({ from: o.createdAt, to: now }),
        items: {
          create: faker.helpers.arrayElements(items, faker.number.int({ min: 1, max: Math.min(2, items.length) })).map((it) => ({
            orderItemId: it.id,
            quantity: Math.max(1, Math.floor(it.quantity / 2)),
          })),
        },
      },
    });

    // Reembolso quando a devolução foi aprovada/concluída e o pedido tinha pagamento.
    if ((status === ReturnStatus.APPROVED || status === ReturnStatus.COMPLETED) && paymentByOrder.has(o.id)) {
      const pay = paymentByOrder.get(o.id)!;
      await prisma.refund.create({
        data: {
          paymentId: pay.id,
          amount: money(Number(pay.amount) * faker.number.float({ min: 0.3, max: 1.0 })),
          reason: "Devolução",
          createdAt: faker.date.between({ from: ret.createdAt, to: now }),
        },
      });
    }
  }

  // --- Avaliações ---
  console.log("Avaliações...");
  const reviewData: Prisma.ReviewCreateManyInput[] = [];
  for (let i = 0; i < 800; i++) {
    reviewData.push({
      productId: faker.helpers.arrayElement(products).id,
      customerId: faker.helpers.arrayElement(customers).id,
      rating: faker.helpers.weightedArrayElement([
        { value: 5, weight: 40 }, { value: 4, weight: 30 }, { value: 3, weight: 15 },
        { value: 2, weight: 8 }, { value: 1, weight: 7 },
      ]),
      comment: faker.datatype.boolean(0.6) ? faker.lorem.sentence() : null,
      createdAt: faker.date.past({ years: 1 }),
    });
  }
  await prisma.review.createMany({ data: reviewData });

  // --- Cupons / promoções / descontos ---
  console.log("Cupons, promoções, descontos...");
  const couponData: Prisma.CouponCreateManyInput[] = [];
  for (let i = 0; i < 15; i++) {
    const isPercent = faker.datatype.boolean();
    couponData.push({
      code: `${faker.word.noun().toUpperCase().slice(0, 6)}${faker.number.int({ min: 5, max: 50 })}`,
      discountType: isPercent ? DiscountType.PERCENT : DiscountType.FIXED,
      discountValue: money(isPercent ? faker.number.int({ min: 5, max: 30 }) : faker.number.int({ min: 10, max: 100 })),
      validFrom: faker.date.past({ years: 1 }),
      validTo: faker.date.future({ years: 1 }),
      active: faker.datatype.boolean(0.8),
    });
  }
  await prisma.coupon.createMany({ data: couponData, skipDuplicates: true });
  const coupons = await prisma.coupon.findMany({ select: { id: true } });

  const promoData: Prisma.PromotionCreateManyInput[] = [];
  for (const name of ["Black Friday", "Cyber Monday", "Semana do Consumidor", "Liquida Verão", "Dia das Mães", "Natal", "Aniversário da Loja", "Volta às Aulas"]) {
    const startsAt = faker.date.past({ years: 1 });
    promoData.push({
      name,
      description: `Campanha ${name}`,
      discountPercent: money(faker.number.int({ min: 5, max: 40 })),
      startsAt,
      endsAt: faker.date.between({ from: startsAt, to: now }),
    });
  }
  await prisma.promotion.createMany({ data: promoData });

  const discountData: Prisma.DiscountCreateManyInput[] = [];
  for (const p of faker.helpers.arrayElements(products, 15)) {
    const startsAt = faker.date.past({ years: 1 });
    discountData.push({
      productId: p.id,
      discountPercent: money(faker.number.int({ min: 5, max: 50 })),
      startsAt,
      endsAt: faker.date.between({ from: startsAt, to: now }),
    });
  }
  await prisma.discount.createMany({ data: discountData });

  // Cupons aplicados a ~20% dos pedidos.
  const ocData: Prisma.OrderCouponCreateManyInput[] = [];
  for (const o of faker.helpers.arrayElements(orders, Math.floor(orders.length * 0.2))) {
    ocData.push({
      orderId: o.id,
      couponId: faker.helpers.arrayElement(coupons).id,
      amountApplied: money(faker.number.float({ min: 5, max: 150, fractionDigits: 2 })),
    });
  }
  await prisma.orderCoupon.createMany({ data: ocData, skipDuplicates: true });

  // --- Carrinhos e wishlists ---
  console.log("Carrinhos e wishlists...");
  for (let i = 0; i < 150; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const nItems = faker.number.int({ min: 1, max: 5 });
    await prisma.cart.create({
      data: {
        customerId: customer.id,
        status: faker.helpers.weightedArrayElement([
          { value: CartStatus.ABANDONED, weight: 5 },
          { value: CartStatus.CONVERTED, weight: 3 },
          { value: CartStatus.ACTIVE, weight: 2 },
        ]),
        createdAt: faker.date.past({ years: 1 }),
        items: {
          create: faker.helpers.arrayElements(products, nItems).map((p) => ({
            productId: p.id,
            quantity: faker.number.int({ min: 1, max: 3 }),
          })),
        },
      },
    });
  }

  for (let i = 0; i < 60; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const chosen = faker.helpers.arrayElements(products, faker.number.int({ min: 1, max: 6 }));
    await prisma.wishlist.create({
      data: {
        customerId: customer.id,
        createdAt: faker.date.past({ years: 1 }),
        items: { create: chosen.map((p) => ({ productId: p.id })) },
      },
    });
  }

  // --- Resumo ---
  const counts = {
    categorias: await prisma.category.count(),
    fornecedores: await prisma.supplier.count(),
    produtos: await prisma.product.count(),
    variantes: await prisma.productVariant.count(),
    estoque: await prisma.inventory.count(),
    lojas: await prisma.store.count(),
    funcionarios: await prisma.employee.count(),
    clientes: await prisma.customer.count(),
    enderecos: await prisma.address.count(),
    pedidos: await prisma.order.count(),
    itens: await prisma.orderItem.count(),
    pagamentos: await prisma.payment.count(),
    reembolsos: await prisma.refund.count(),
    envios: await prisma.shipment.count(),
    devolucoes: await prisma.return.count(),
    avaliacoes: await prisma.review.count(),
    cupons: await prisma.coupon.count(),
    promocoes: await prisma.promotion.count(),
    descontos: await prisma.discount.count(),
    cupons_aplicados: await prisma.orderCoupon.count(),
    carrinhos: await prisma.cart.count(),
    wishlists: await prisma.wishlist.count(),
  };
  console.log("\nSeed concluído:");
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
