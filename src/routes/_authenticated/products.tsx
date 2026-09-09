import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteProduct,
  listProducts,
  saveProduct,
  setProductActive,
  type Product,
} from "@/lib/bioshop.functions";
import { formatMmk, LOW_STOCK_THRESHOLD } from "@/lib/format";

const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProducts(),
});

export const Route = createFileRoute("/_authenticated/products")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: ProductsPage,
  errorComponent: ({ error }) => (
    <p role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </p>
  ),
  notFoundComponent: () => <p className="p-6 text-sm">No products found.</p>,
});

function ProductsPage() {
  const { data } = useSuspenseQuery(productsQuery);
  const queryClient = useQueryClient();
  const toggleActive = useServerFn(setProductActive);
  const removeProduct = useServerFn(deleteProduct);
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["products"] });
    await queryClient.invalidateQueries({ queryKey: ["shop-overview"] });
  };

  const toggleMutation = useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) => toggleActive({ data: input }),
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeProduct({ data: { id } }),
    onSuccess: async () => {
      toast.success("Product deleted.");
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell
      title="Products"
      subtitle={`${data.products.length} listed`}
      action={
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus className="size-4" />
          Add product
        </Button>
      }
    >
      {data.products.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No products yet. Add your first listing so buyers can order from your link.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.products.map((product) => (
            <article
              key={product.id}
              className={`overflow-hidden rounded-2xl border bg-card ${
                product.stockQuantity <= LOW_STOCK_THRESHOLD
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-border"
              }`}
            >
              <button
                type="button"
                onClick={() => setEditing(product)}
                className="block aspect-square w-full bg-muted"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-muted-foreground">
                    <ImagePlus className="size-6" />
                  </span>
                )}
              </button>
              <div className="p-3">
                <p className="truncate text-sm font-semibold">{product.name}</p>
                <p className="text-xs text-muted-foreground">{formatMmk(product.priceMmk)}</p>
                <p
                  className={`mt-1 text-xs font-medium ${
                    product.stockQuantity <= LOW_STOCK_THRESHOLD
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {product.stockQuantity} in stock
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Switch
                    checked={product.isActive}
                    aria-label={`Show ${product.name} in store`}
                    onCheckedChange={(checked) =>
                      toggleMutation.mutate({ id: product.id, isActive: checked })
                    }
                  />
                  <button
                    type="button"
                    aria-label={`Delete ${product.name}`}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    onClick={() => deleteMutation.mutate(product.id)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ProductDialog
        sellerId={data.sellerId}
        editing={editing}
        onClose={() => setEditing(null)}
        onSaved={refresh}
      />
    </AppShell>
  );
}

function ProductDialog({
  sellerId,
  editing,
  onClose,
  onSaved,
}: {
  sellerId: string;
  editing: Product | "new" | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const persist = useServerFn(saveProduct);
  const existing = editing !== null && editing !== "new" ? editing : null;
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const key = existing?.id ?? "new";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const priceMmk = Number(form.get("price") ?? 0);
    const stockQuantity = Number(form.get("stock") ?? 0);

    if (!name) {
      toast.error("Please enter a product name.");
      return;
    }
    if (
      !Number.isFinite(priceMmk) ||
      priceMmk < 0 ||
      !Number.isFinite(stockQuantity) ||
      stockQuantity < 0
    ) {
      toast.error("Price and stock must be positive numbers.");
      return;
    }

    setBusy(true);
    try {
      let imagePath: string | null | undefined;
      if (file) {
        const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${sellerId}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file);
        if (error) throw new Error(error.message);
        imagePath = path;
      }

      await persist({
        data: {
          ...(existing ? { id: existing.id } : {}),
          name,
          priceMmk: Math.round(priceMmk),
          stockQuantity: Math.round(stockQuantity),
          ...(imagePath === undefined ? {} : { imagePath }),
        },
      });

      toast.success(existing ? "Product updated." : "Product added.");
      setFile(null);
      onClose();
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the product.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={editing !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit product" : "Add product"}</DialogTitle>
        </DialogHeader>
        <form key={key} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="image">Product photo</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            {file ? (
              <img
                src={URL.createObjectURL(file)}
                alt="Selected product photo"
                className="mt-2 h-28 w-28 rounded-xl object-cover"
              />
            ) : existing?.imageUrl ? (
              <img
                src={existing.imageUrl}
                alt={existing.name}
                className="mt-2 h-28 w-28 rounded-xl object-cover"
              />
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              maxLength={120}
              required
              defaultValue={existing?.name ?? ""}
              placeholder="Korean style tote bag"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (MMK)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                step={100}
                required
                defaultValue={existing?.priceMmk ?? 0}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min={0}
                required
                defaultValue={existing?.stockQuantity ?? 0}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "Saving…" : existing ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
