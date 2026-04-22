-- AlterTable
ALTER TABLE "products" ALTER COLUMN "buying_price" SET DEFAULT 0,
ALTER COLUMN "selling_price" SET DEFAULT 0;

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");
