import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function query(sql: string, params: unknown[] = []) {
  return client.query(sql, params);
}

async function main() {
  await client.connect();

  // CATEGORIAS
  const categoryNames = [
    "Electrónica","Ropa","Calzado","Hogar","Deportes",
    "Libros","Juguetes","Alimentación","Herramientas","Jardín",
    "Automotor","Música","Arte","Salud","Belleza",
    "Mascotas","Viajes","Oficina","Bebés","Gaming",
  ];
  console.log(`Insertando ${categoryNames.length} categorías...`);
  const catValues = categoryNames.map((n, i) => `($${i + 1}, NOW())`).join(",");
  const { rows: cats } = await query(
    `INSERT INTO "Category" (name, "updatedAt") VALUES ${catValues} RETURNING id`,
    categoryNames
  );
  const categoryIds = cats.map((c: { id: number }) => c.id);

  // USUARIOS
  const USERS = 500;
  console.log(`Insertando ${USERS} usuarios...`);
  const userRows: string[] = [];
  const userParams: unknown[] = [];
  let p = 1;
  for (let i = 0; i < USERS; i++) {
    userRows.push(`($${p++}, $${p++}, $${p++}, $${p++}, NOW(), NOW())`);
    userParams.push(
      `user${i + 1}@test.com`,
      "$2b$10$hashedpasswordplaceholder12345",
      rand(0, 9999),
      i < 5 ? "ADMIN" : "USER"
    );
  }
  const { rows: users } = await query(
    `INSERT INTO "User" (email, password, points, role, "createdAt", "updatedAt") VALUES ${userRows.join(",")} RETURNING id`,
    userParams
  );
  const userIds = users.map((u: { id: number }) => u.id);

  // PRODUCTOS en lotes de 500
  const PRODUCTS = 5000;
  const BATCH = 500;
  const adjectives = ["Premium","Económico","Pro","Ultra","Clásico","Moderno","Compacto","Deluxe","Mini","Max"];
  const nouns = ["Widget","Gadget","Dispositivo","Artículo","Producto","Item","Objeto","Elemento","Componente","Accesorio"];
  console.log(`Insertando ${PRODUCTS} productos...`);

  const allProducts: { id: number; price: number }[] = [];
  for (let b = 0; b < Math.ceil(PRODUCTS / BATCH); b++) {
    const size = Math.min(BATCH, PRODUCTS - b * BATCH);
    const rows: string[] = [];
    const params: unknown[] = [];
    let pi = 1;
    for (let i = 0; i < size; i++) {
      const idx = b * BATCH + i;
      rows.push(`($${pi++}, $${pi++}, $${pi++}, $${pi++}, $${pi++}, NOW(), NOW())`);
      params.push(
        `${pick(adjectives)} ${pick(nouns)} ${idx + 1}`,
        `Descripción del producto ${idx + 1}.`,
        (rand(100, 99999) / 100).toFixed(2),
        rand(0, 500),
        pick(categoryIds)
      );
    }
    const { rows: inserted } = await query(
      `INSERT INTO "Product" (name, description, price, stock, "categoryId", "createdAt", "updatedAt") VALUES ${rows.join(",")} RETURNING id, price`,
      params
    );
    allProducts.push(...inserted.map((r: { id: number; price: string }) => ({ id: r.id, price: parseFloat(r.price) })));
    process.stdout.write(`\r  Productos: ${Math.min((b + 1) * BATCH, PRODUCTS)}/${PRODUCTS}`);
  }
  console.log();

  // ORDERS
  const ORDERS = 5000;
  console.log(`Insertando ${ORDERS} órdenes...`);
  const statuses = ["PENDING", "PAID", "CANCELLED"];
  const orderIds: number[] = [];
  for (let b = 0; b < Math.ceil(ORDERS / BATCH); b++) {
    const size = Math.min(BATCH, ORDERS - b * BATCH);
    const rows: string[] = [];
    const params: unknown[] = [];
    let opi = 1;
    for (let i = 0; i < size; i++) {
      rows.push(`($${opi++}, $${opi++}, $${opi++}, NOW(), NOW())`);
      params.push(pick(userIds), pick(statuses), (rand(500, 500000) / 100).toFixed(2));
    }
    const { rows: inserted } = await query(
      `INSERT INTO "Order" ("userId", status, total, "createdAt", "updatedAt") VALUES ${rows.join(",")} RETURNING id`,
      params
    );
    orderIds.push(...inserted.map((r: { id: number }) => r.id));
    process.stdout.write(`\r  Órdenes: ${Math.min((b + 1) * BATCH, ORDERS)}/${ORDERS}`);
  }
  console.log();

  // ORDER ITEMS
  const ITEMS_PER_ORDER = 3;
  const totalItems = orderIds.length * ITEMS_PER_ORDER;
  console.log(`Insertando ${totalItems} order items...`);
  const itemBatch = 1000;
  let itemsDone = 0;
  for (let b = 0; b < Math.ceil(orderIds.length / (itemBatch / ITEMS_PER_ORDER)); b++) {
    const startOrder = b * Math.floor(itemBatch / ITEMS_PER_ORDER);
    const endOrder = Math.min(startOrder + Math.floor(itemBatch / ITEMS_PER_ORDER), orderIds.length);
    const rows: string[] = [];
    const params: unknown[] = [];
    let ip = 1;
    for (let o = startOrder; o < endOrder; o++) {
      for (let i = 0; i < ITEMS_PER_ORDER; i++) {
        const prod = pick(allProducts);
        const qty = rand(1, 5);
        const subtotal = parseFloat((qty * prod.price).toFixed(2));
        rows.push(`($${ip++}, $${ip++}, $${ip++}, $${ip++}, $${ip++}, NOW())`);
        params.push(orderIds[o], prod.id, qty, prod.price.toFixed(2), subtotal.toFixed(2));
      }
    }
    await query(
      `INSERT INTO "OrderItem" ("orderId", "productId", quantity, "unitPrice", subtotal, "createdAt") VALUES ${rows.join(",")}`,
      params
    );
    itemsDone += (endOrder - startOrder) * ITEMS_PER_ORDER;
    process.stdout.write(`\r  OrderItems: ${itemsDone}/${totalItems}`);
  }
  console.log();

  // Resumen
  const counts = await Promise.all([
    query(`SELECT COUNT(*) FROM "User"`),
    query(`SELECT COUNT(*) FROM "Category"`),
    query(`SELECT COUNT(*) FROM "Product"`),
    query(`SELECT COUNT(*) FROM "Order"`),
    query(`SELECT COUNT(*) FROM "OrderItem"`),
  ]);
  console.log("\n=== Seed completado ===");
  console.log(`Users: ${counts[0].rows[0].count} | Categories: ${counts[1].rows[0].count} | Products: ${counts[2].rows[0].count}`);
  console.log(`Orders: ${counts[3].rows[0].count} | OrderItems: ${counts[4].rows[0].count}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => client.end());
