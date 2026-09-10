import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LOW_STOCK_THRESHOLD, ORDER_STATUSES } from "@/lib/format";

export type Seller = {
  id: string;
  businessName: string;
  phone: string;
  tiktokHandle: string;
  kbzpayName: string;
  kbzpayNumber: string;
  wavepayName: string;
  wavepayNumber: string;
  ayapayName: string;
  ayapayNumber: string;
  codEnabled: boolean;
  codCities: string[];
  shopAddress: string;
  shopLat: number | null;
  shopLng: number | null;
  shopMapUrl: string | null;
};

export type Product = {
  id: string;
  name: string;
  priceMmk: number;
  stockQuantity: number;
  imagePath: string | null;
  imageUrl: string | null;
  isActive: boolean;
};

export type Order = {
  id: string;
  buyerName: string;
  buyerPhone: string;
  deliveryCity: string;
  deliveryAddress: string;
  quantity: number;
  unitPriceMmk: number;
  totalMmk: number;
  productName: string;
  status: string;
  paymentMethod: string;
  mapUrl: string | null;
  screenshotUrl: string | null;
  createdAt: string;
};

type SellerRow = {
  id: string;
  business_name: string;
  phone: string;
  tiktok_handle: string;
  kbzpay_name: string;
  kbzpay_number: string;
  wavepay_name: string;
  wavepay_number: string;
  ayapay_name: string;
  ayapay_number: string;
  cod_enabled: boolean;
  cod_cities: string[] | null;
  shop_address: string | null;
  shop_lat: number | null;
  shop_lng: number | null;
};

const toSeller = (row: SellerRow): Seller => ({
  id: row.id,
  businessName: row.business_name,
  phone: row.phone,
  tiktokHandle: row.tiktok_handle,
  kbzpayName: row.kbzpay_name,
  kbzpayNumber: row.kbzpay_number,
  wavepayName: row.wavepay_name,
  wavepayNumber: row.wavepay_number,
  ayapayName: row.ayapay_name,
  ayapayNumber: row.ayapay_number,
  codEnabled: row.cod_enabled,
  codCities: row.cod_cities ?? [],
  shopAddress: row.shop_address ?? "",
  shopLat: row.shop_lat,
  shopLng: row.shop_lng,
  shopMapUrl: buildMapUrl(row.shop_lat, row.shop_lng),
});

const SELLER_COLUMNS =
  "id, business_name, phone, tiktok_handle, kbzpay_name, kbzpay_number, wavepay_name, wavepay_number, ayapay_name, ayapay_number, cod_enabled, cod_cities, shop_address, shop_lat, shop_lng";

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20) || "shop";

type MinimalClient = {
  from: (table: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (columns: string) => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    insert: (values: unknown) => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upsert: (values: unknown) => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (values: unknown) => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete: () => any;
  };
  storage: {
    from: (bucket: string) => {
      createSignedUrl: (
        path: string,
        expiresIn: number,
      ) => Promise<{ data: { signedUrl: string } | null }>;
      remove: (paths: string[]) => Promise<unknown>;
    };
  };
};

const signedUrl = async (
  client: MinimalClient,
  bucket: string,
  path: string | null,
): Promise<string | null> => {
  if (!path) return null;
  const { data } = await client.storage.from(bucket).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
};

/** Builds a Google Maps link for a pinned delivery location. */
const buildMapUrl = (lat: number | null, lng: number | null): string | null =>
  lat === null || lng === null ? null : `https://www.google.com/maps?q=${lat},${lng}`;

/** Loads the signed-in seller's shop, creating it with sample data on first visit. */
const loadOrCreateSeller = async (
  client: MinimalClient,
  userId: string,
  email: string | null,
): Promise<SellerRow> => {
  const existing = await client
    .from("sellers")
    .select(SELLER_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.data) return existing.data as SellerRow;

  const base = slugify(email?.split("@")[0] ?? "shop");
  const handle = `${base}${Math.floor(Math.random() * 9000 + 1000)}`;

  const created = await client
    .from("sellers")
    .insert({ user_id: userId, tiktok_handle: handle, business_name: "My Maket" })
    .select(SELLER_COLUMNS)
    .single();

  if (created.error) throw new Error(created.error.message);
  const seller = created.data as SellerRow;

  // Sample catalogue and orders so the dashboard is useful right away.
  const demoProducts = await client
    .from("products")
    .insert([
      { seller_id: seller.id, name: "Korean style tote bag", price_mmk: 32000, stock_quantity: 12 },
      { seller_id: seller.id, name: "Matte lipstick set", price_mmk: 18500, stock_quantity: 3 },
      { seller_id: seller.id, name: "Cotton oversized tee", price_mmk: 24000, stock_quantity: 25 },
    ])
    .select("id, price_mmk");

  const rows = (demoProducts.data ?? []) as Array<{ id: string; price_mmk: number }>;
  if (rows.length === 3) {
    await client.from("orders").insert([
      {
        seller_id: seller.id,
        product_id: rows[0]!.id,
        buyer_name: "Su Su Naing",
        buyer_phone: "09 771 234 567",
        delivery_city: "Yangon",
        delivery_address: "No. 24, Bogyoke Road, Pabedan Township",
        quantity: 1,
        unit_price_mmk: rows[0]!.price_mmk,
        order_status: "pending",
      },
      {
        seller_id: seller.id,
        product_id: rows[1]!.id,
        buyer_name: "Aung Ko Latt",
        buyer_phone: "09 456 112 998",
        delivery_city: "Mandalay",
        delivery_address: "78th Street, between 32nd and 33rd, Chanayethazan",
        quantity: 2,
        unit_price_mmk: rows[1]!.price_mmk,
        order_status: "confirmed",
      },
      {
        seller_id: seller.id,
        product_id: rows[2]!.id,
        buyer_name: "Thiri Hlaing",
        buyer_phone: "09 250 887 445",
        delivery_city: "Nay Pyi Taw",
        delivery_address: "Block 9, Zabuthiri Township",
        quantity: 1,
        unit_price_mmk: rows[2]!.price_mmk,
        order_status: "shipped",
      },
    ]);
  }

  return seller;
};

export const getShopOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = context.supabase as unknown as MinimalClient;
    const email = (context.claims as { email?: string } | null)?.email ?? null;
    const seller = await loadOrCreateSeller(client, context.userId, email);

    const [ordersResult, productsResult] = await Promise.all([
      client
        .from("orders")
        .select(
          "id, buyer_name, delivery_city, quantity, unit_price_mmk, order_status, created_at, products(name)",
        )
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false }),
      client.from("products").select("id, name, stock_quantity").eq("seller_id", seller.id),
    ]);

    type OverviewOrder = {
      id: string;
      buyer_name: string;
      delivery_city: string;
      quantity: number;
      unit_price_mmk: number;
      order_status: string;
      created_at: string;
      products: { name: string } | null;
    };

    const orders = (ordersResult.data ?? []) as OverviewOrder[];
    const products = (productsResult.data ?? []) as Array<{
      id: string;
      name: string;
      stock_quantity: number;
    }>;

    const totalSales = orders
      .filter((order) => order.order_status === "confirmed" || order.order_status === "shipped")
      .reduce((sum, order) => sum + order.quantity * order.unit_price_mmk, 0);

    return {
      seller: toSeller(seller),
      totalSales,
      pendingCount: orders.filter((order) => order.order_status === "pending").length,
      lowStock: products
        .filter((product) => product.stock_quantity <= LOW_STOCK_THRESHOLD)
        .map((product) => ({ id: product.id, name: product.name, stock: product.stock_quantity })),
      recentOrders: orders.slice(0, 3).map((order) => ({
        id: order.id,
        buyerName: order.buyer_name,
        deliveryCity: order.delivery_city,
        productName: order.products?.name ?? "Deleted product",
        totalMmk: order.quantity * order.unit_price_mmk,
        status: order.order_status,
        createdAt: order.created_at,
      })),
    };
  });

export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Order[]> => {
    const client = context.supabase as unknown as MinimalClient;
    const seller = await client
      .from("sellers")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    const sellerId = (seller.data as { id: string } | null)?.id;
    if (!sellerId) return [];

    const { data } = await client
      .from("orders")
      .select(
        "id, buyer_name, buyer_phone, delivery_city, delivery_address, quantity, unit_price_mmk, payment_screenshot_path, payment_method, delivery_lat, delivery_lng, order_status, created_at, products(name)",
      )
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    type OrderRow = {
      id: string;
      buyer_name: string;
      buyer_phone: string;
      delivery_city: string;
      delivery_address: string;
      quantity: number;
      unit_price_mmk: number;
      payment_screenshot_path: string | null;
      payment_method: string | null;
      delivery_lat: number | null;
      delivery_lng: number | null;
      order_status: string;
      created_at: string;
      products: { name: string } | null;
    };

    const rows = (data ?? []) as OrderRow[];

    return Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        buyerName: row.buyer_name,
        buyerPhone: row.buyer_phone,
        deliveryCity: row.delivery_city,
        deliveryAddress: row.delivery_address,
        quantity: row.quantity,
        unitPriceMmk: row.unit_price_mmk,
        totalMmk: row.quantity * row.unit_price_mmk,
        productName: row.products?.name ?? "Deleted product",
        status: row.order_status,
        paymentMethod: row.payment_method ?? "prepaid",
        mapUrl: buildMapUrl(row.delivery_lat, row.delivery_lng),
        screenshotUrl: await signedUrl(client, "payment-screenshots", row.payment_screenshot_path),
        createdAt: row.created_at,
      })),
    );
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ orderId: z.string().uuid(), status: z.enum(ORDER_STATUSES) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as MinimalClient;
    const { error } = await client
      .from("orders")
      .update({ order_status: data.status })
      .eq("id", data.orderId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ sellerId: string; products: Product[] }> => {
    const client = context.supabase as unknown as MinimalClient;
    const seller = await client
      .from("sellers")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    const sellerId = (seller.data as { id: string } | null)?.id;
    if (!sellerId) return { sellerId: "", products: [] };

    const { data } = await client
      .from("products")
      .select("id, name, price_mmk, stock_quantity, image_url, is_active")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    type ProductRow = {
      id: string;
      name: string;
      price_mmk: number;
      stock_quantity: number;
      image_url: string | null;
      is_active: boolean;
    };

    const products = await Promise.all(
      ((data ?? []) as ProductRow[]).map(async (row) => ({
        id: row.id,
        name: row.name,
        priceMmk: row.price_mmk,
        stockQuantity: row.stock_quantity,
        imagePath: row.image_url,
        imageUrl: await signedUrl(client, "product-images", row.image_url),
        isActive: row.is_active,
      })),
    );

    return { sellerId, products };
  });

const productInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Product name is required").max(120),
  priceMmk: z.number().int().min(0).max(1_000_000_000),
  stockQuantity: z.number().int().min(0).max(1_000_000),
  imagePath: z.string().max(400).nullable().optional(),
});

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productInput.parse(input))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as MinimalClient;
    const seller = await client
      .from("sellers")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    const sellerId = (seller.data as { id: string } | null)?.id;
    if (!sellerId) throw new Error("Shop not found");

    const values = {
      name: data.name,
      price_mmk: data.priceMmk,
      stock_quantity: data.stockQuantity,
      ...(data.imagePath === undefined ? {} : { image_url: data.imagePath }),
    };

    const { error } = data.id
      ? await client.from("products").update(values).eq("id", data.id)
      : await client.from("products").insert({ ...values, seller_id: sellerId });

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setProductActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), isActive: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as MinimalClient;
    const { error } = await client
      .from("products")
      .update({ is_active: data.isActive })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as MinimalClient;
    const { error } = await client.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const settingsInput = z.object({
  businessName: z.string().trim().min(1, "Business name is required").max(80),
  phone: z.string().trim().max(40),
  tiktokHandle: z
    .string()
    .trim()
    .min(3, "Handle must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dots, dashes or underscores"),
  kbzpayName: z.string().trim().max(80),
  kbzpayNumber: z.string().trim().max(40),
  wavepayName: z.string().trim().max(80),
  wavepayNumber: z.string().trim().max(40),
  ayapayName: z.string().trim().max(80),
  ayapayNumber: z.string().trim().max(40),
  codEnabled: z.boolean(),
  codCities: z.array(z.string().trim().min(1).max(60)).max(60),
  shopAddress: z.string().trim().max(200),
  shopLat: z.number().min(-90).max(90).nullable(),
  shopLng: z.number().min(-180).max(180).nullable(),
});

export const updateShopSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => settingsInput.parse(input))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as MinimalClient;
    const { error } = await client
      .from("sellers")
      .update({
        business_name: data.businessName,
        phone: data.phone,
        tiktok_handle: data.tiktokHandle.toLowerCase(),
        kbzpay_name: data.kbzpayName,
        kbzpay_number: data.kbzpayNumber,
        wavepay_name: data.wavepayName,
        wavepay_number: data.wavepayNumber,
        ayapay_name: data.ayapayName,
        ayapay_number: data.ayapayNumber,
        cod_enabled: data.codEnabled,
        cod_cities: data.codEnabled ? data.codCities : [],
        shop_address: data.shopAddress,
        shop_lat: data.shopLat,
        shop_lng: data.shopLng,
      })
      .eq("user_id", context.userId);

    if (error) {
      throw new Error(
        error.message.includes("sellers_tiktok_handle_key")
          ? "That store link is already taken, please pick another handle."
          : error.message,
      );
    }
    return { ok: true };
  });

/** Public store page data — no sign-in required. */
export const getPublicStore = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ handle: z.string().trim().max(40) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supabase = supabaseAdmin;

    const { data: seller } = await supabase
      .from("sellers")
      .select(SELLER_COLUMNS)
      .eq("tiktok_handle", data.handle.toLowerCase())
      .maybeSingle();

    if (!seller) return null;

    const { data: products } = await supabase
      .from("products")
      .select("id, name, price_mmk, stock_quantity, image_url")
      .eq("seller_id", seller.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const withImages = await Promise.all(
      (products ?? []).map(async (product) => {
        let imageUrl: string | null = null;
        if (product.image_url) {
          const { data: signed } = await supabase.storage
            .from("product-images")
            .createSignedUrl(product.image_url, 60 * 60);
          imageUrl = signed?.signedUrl ?? null;
        }
        return {
          id: product.id,
          name: product.name,
          priceMmk: product.price_mmk,
          stockQuantity: product.stock_quantity,
          imageUrl,
        };
      }),
    );

    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const host = getRequestHeader("host") ?? "";
    const proto = getRequestHeader("x-forwarded-proto") ?? "https";
    const handle = data.handle.toLowerCase();
    const origin = host ? `${proto}://${host}` : "";

    return {
      seller: toSeller(seller as SellerRow),
      products: withImages,
      storeUrl: origin ? `${origin}/s/${handle}` : null,
      ogImageUrl: origin ? `${origin}/api/public/og/${handle}` : null,
    };
  });

const checkoutInput = z.object({
  sellerId: z.string().uuid(),
  productId: z.string().uuid(),
  buyerName: z.string().trim().min(1).max(80),
  buyerPhone: z
    .string()
    .trim()
    .min(6)
    .max(40)
    .regex(/^[0-9+\-\s()]+$/, "Please enter a valid phone number"),
  deliveryCity: z.string().trim().min(1).max(60),
  deliveryAddress: z.string().trim().min(5).max(400),
  quantity: z.number().int().min(1).max(50),
  screenshotPath: z.string().max(400).nullable(),
});

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => checkoutInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supabase = supabaseAdmin;

    const { data: product } = await supabase
      .from("products")
      .select("id, price_mmk, seller_id")
      .eq("id", data.productId)
      .eq("seller_id", data.sellerId)
      .eq("is_active", true)
      .maybeSingle();

    if (!product) throw new Error("This product is no longer available.");

    const { error } = await supabase.from("orders").insert({
      seller_id: data.sellerId,
      product_id: data.productId,
      buyer_name: data.buyerName,
      buyer_phone: data.buyerPhone,
      delivery_city: data.deliveryCity,
      delivery_address: data.deliveryAddress,
      quantity: data.quantity,
      unit_price_mmk: product.price_mmk,
      payment_screenshot_path: data.screenshotPath,
      order_status: "pending",
    });

    if (error) throw new Error(error.message);
    return { ok: true, total: product.price_mmk * data.quantity };
  });

const cartCheckoutInput = z.object({
  sellerId: z.string().uuid(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(50),
      }),
    )
    .min(1, "Please pick at least one product")
    .max(20),
  buyerName: z.string().trim().min(1).max(80),
  buyerPhone: z
    .string()
    .trim()
    .min(6)
    .max(40)
    .regex(/^[0-9+\-\s()]+$/, "Please enter a valid phone number"),
  deliveryCity: z.string().trim().min(1).max(60),
  deliveryAddress: z.string().trim().min(5).max(400),
  paymentMethod: z.enum(["prepaid", "cod"]),
  screenshotPath: z.string().trim().max(400).nullable(),
  deliveryLat: z.number().min(-90).max(90).nullable(),
  deliveryLng: z.number().min(-180).max(180).nullable(),
  deliveryPlaceLabel: z.string().trim().max(300).nullable(),
});

/** Places a multi-item buyer order — one pending row per cart line. */
export const placeCartOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => cartCheckoutInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supabase = supabaseAdmin;

    const { data: seller } = await supabase
      .from("sellers")
      .select("cod_enabled, cod_cities")
      .eq("id", data.sellerId)
      .maybeSingle();

    if (!seller) throw new Error("This shop is no longer available.");

    const codCities = (seller.cod_cities ?? []) as string[];
    const codAllowed =
      seller.cod_enabled === true &&
      codCities.some((city) => city.toLowerCase() === data.deliveryCity.toLowerCase());

    if (data.paymentMethod === "cod" && !codAllowed) {
      throw new Error("Cash on delivery is not available for this city, please pay in advance.");
    }
    if (data.paymentMethod === "prepaid" && !data.screenshotPath) {
      throw new Error("Please attach your payment screenshot.");
    }

    const { data: products } = await supabase
      .from("products")
      .select("id, name, price_mmk")
      .eq("seller_id", data.sellerId)
      .eq("is_active", true)
      .in(
        "id",
        data.items.map((item) => item.productId),
      );

    const available = new Map((products ?? []).map((product) => [product.id, product]));

    const lines = data.items.map((item) => {
      const product = available.get(item.productId);
      if (!product) throw new Error("One of the products is no longer available.");
      return {
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPriceMmk: product.price_mmk,
        totalMmk: product.price_mmk * item.quantity,
      };
    });

    const { error } = await supabase.from("orders").insert(
      lines.map((line) => ({
        seller_id: data.sellerId,
        product_id: line.productId,
        buyer_name: data.buyerName,
        buyer_phone: data.buyerPhone,
        delivery_city: data.deliveryCity,
        delivery_address: data.deliveryAddress,
        quantity: line.quantity,
        unit_price_mmk: line.unitPriceMmk,
        payment_method: data.paymentMethod,
        payment_screenshot_path: data.paymentMethod === "cod" ? null : data.screenshotPath,
        delivery_lat: data.deliveryLat,
        delivery_lng: data.deliveryLng,
        delivery_place_label: data.deliveryPlaceLabel,
        order_status: "pending",
      })),
    );

    if (error) throw new Error(error.message);

    await notifySellerOfOrder({
      sellerId: data.sellerId,
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
      deliveryCity: data.deliveryCity,
      deliveryAddress: data.deliveryAddress,
      paymentMethod: data.paymentMethod,
      mapUrl: buildMapUrl(data.deliveryLat, data.deliveryLng),
      items: lines.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        totalMmk: line.totalMmk,
      })),
      total: lines.reduce((sum, line) => sum + line.totalMmk, 0),
    });

    return {
      ok: true,
      paymentMethod: data.paymentMethod,
      items: lines.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        totalMmk: line.totalMmk,
      })),
      total: lines.reduce((sum, line) => sum + line.totalMmk, 0),
    };
  });

type NotifyInput = {
  sellerId: string;
  buyerName: string;
  buyerPhone: string;
  deliveryCity: string;
  deliveryAddress: string;
  paymentMethod: "prepaid" | "cod";
  mapUrl: string | null;
  items: { name: string; quantity: number; totalMmk: number }[];
  total: number;
};

/** Sends the seller an instant Telegram alert. Never blocks the buyer's order. */
const notifySellerOfOrder = async (input: NotifyInput): Promise<void> => {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: seller }, { data: alerts }] = await Promise.all([
      supabaseAdmin.from("sellers").select("business_name").eq("id", input.sellerId).maybeSingle(),
      supabaseAdmin
        .from("seller_alerts")
        .select("telegram_chat_id")
        .eq("seller_id", input.sellerId)
        .maybeSingle(),
    ]);

    const chatId = alerts?.telegram_chat_id ?? "";
    if (!chatId) return;

    const { buildOrderAlertMessage } = await import("@/lib/order-alert");
    const { sendTelegramMessage } = await import("@/lib/telegram.server");

    await sendTelegramMessage(
      chatId,
      buildOrderAlertMessage({
        shopName: seller?.business_name ?? "Your shop",
        buyerName: input.buyerName,
        buyerPhone: input.buyerPhone,
        deliveryCity: input.deliveryCity,
        deliveryAddress: input.deliveryAddress,
        paymentMethod: input.paymentMethod,
        mapUrl: input.mapUrl,
        items: input.items,
        total: input.total,
      }),
    );
  } catch {
    // Alerting is best-effort; the order is already saved.
  }
};

const sellerIdForUser = async (client: MinimalClient, userId: string): Promise<string> => {
  const { data } = await client.from("sellers").select("id").eq("user_id", userId).maybeSingle();
  const seller = data as { id: string } | null;
  if (!seller) throw new Error("Shop not found.");
  return seller.id;
};

/** Reads the seller's order-alert settings. */
export const getAlertSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = context.supabase as unknown as MinimalClient;
    const sellerId = await sellerIdForUser(client, context.userId);
    const { data } = await client
      .from("seller_alerts")
      .select("telegram_chat_id")
      .eq("seller_id", sellerId)
      .maybeSingle();
    const row = data as { telegram_chat_id: string } | null;
    return { telegramChatId: row?.telegram_chat_id ?? "" };
  });

/** Saves the Telegram chat that should receive new-order alerts. */
export const saveAlertSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        telegramChatId: z
          .string()
          .trim()
          .max(40)
          .regex(/^-?[0-9]*$/, "Chat id should only contain numbers"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as MinimalClient;
    const sellerId = await sellerIdForUser(client, context.userId);
    const { error } = await client
      .from("seller_alerts")
      .upsert({ seller_id: sellerId, telegram_chat_id: data.telegramChatId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Sends a test alert so the seller can confirm Telegram works. */
export const sendTestAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = context.supabase as unknown as MinimalClient;
    const sellerId = await sellerIdForUser(client, context.userId);
    const { data } = await client
      .from("seller_alerts")
      .select("telegram_chat_id")
      .eq("seller_id", sellerId)
      .maybeSingle();
    const chatId = (data as { telegram_chat_id: string } | null)?.telegram_chat_id ?? "";

    const { sendTelegramMessage } = await import("@/lib/telegram.server");
    const result = await sendTelegramMessage(
      chatId,
      "✅ Maket test alert — new orders will arrive here.",
    );
    if (!result.ok) throw new Error(result.error);
    return { ok: true };
  });

/** Lightweight polling signal used to alert the seller inside the dashboard. */
export const getOrderPulse = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = context.supabase as unknown as MinimalClient;
    const sellerId = await sellerIdForUser(client, context.userId);
    const { data } = await client
      .from("orders")
      .select("id, buyer_name, created_at")
      .eq("seller_id", sellerId)
      .eq("order_status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const row = data as { id: string; buyer_name: string; created_at: string } | null;
    return row
      ? { latestOrderId: row.id, buyerName: row.buyer_name, createdAt: row.created_at }
      : { latestOrderId: null, buyerName: null, createdAt: null };
  });
