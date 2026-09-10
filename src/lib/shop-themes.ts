/** Shop categories a seller can pick, each with its own store page look. */
export type ShopCategory = {
  value: string;
  label: string;
  description: string;
  themeClass: string;
};

export const SHOP_CATEGORIES: readonly ShopCategory[] = [
  {
    value: "general",
    label: "General store",
    description: "A bit of everything",
    themeClass: "theme-general",
  },
  {
    value: "grocery",
    label: "Canned & packaged foods",
    description: "Groceries, snacks, drinks",
    themeClass: "theme-grocery",
  },
  {
    value: "clothing",
    label: "Clothing",
    description: "Everyday wear, longyi, uniforms",
    themeClass: "theme-clothing",
  },
  {
    value: "fashion",
    label: "Fashion & accessories",
    description: "Bags, shoes, jewellery",
    themeClass: "theme-fashion",
  },
  {
    value: "gadgets",
    label: "Gadgets & accessories",
    description: "Phones, chargers, earphones",
    themeClass: "theme-gadgets",
  },
  {
    value: "beauty",
    label: "Beauty & skincare",
    description: "Cosmetics, skincare, perfume",
    themeClass: "theme-beauty",
  },
  {
    value: "home",
    label: "Home & living",
    description: "Kitchenware, decor, bedding",
    themeClass: "theme-home",
  },
  {
    value: "handmade",
    label: "Handmade & crafts",
    description: "Handmade gifts and art",
    themeClass: "theme-handmade",
  },
] as const;

export const DEFAULT_SHOP_CATEGORY = "general";

export const shopCategoryValues = SHOP_CATEGORIES.map((category) => category.value);

export const findShopCategory = (value: string | null | undefined): ShopCategory =>
  SHOP_CATEGORIES.find((category) => category.value === value) ?? SHOP_CATEGORIES[0];

/** CSS class that re-themes the store page for a category. */
export const shopThemeClass = (value: string | null | undefined): string =>
  findShopCategory(value).themeClass;

export const shopCategoryLabel = (value: string | null | undefined): string =>
  findShopCategory(value).label;
