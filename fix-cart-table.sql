-- Create cart table for e-commerce system
CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT "FK_cart_user" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT "FK_cart_product" FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate entries
    CONSTRAINT "UQ_cart_user_product" UNIQUE ("userId", "productId", "isActive")
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS "IDX_cart_user" ON carts ("userId");
CREATE INDEX IF NOT EXISTS "IDX_cart_product" ON carts ("productId");

-- Fix login_logs table to add missing errorMessage column
ALTER TABLE login_logs ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;

COMMENT ON TABLE carts IS 'Shopping cart items for users';
COMMENT ON COLUMN carts."userId" IS 'Reference to user who owns this cart item';
COMMENT ON COLUMN carts."productId" IS 'Reference to product in cart';
COMMENT ON COLUMN carts.quantity IS 'Quantity of product in cart';
COMMENT ON COLUMN carts.price IS 'Price per unit when added to cart';
COMMENT ON COLUMN carts."isActive" IS 'Whether cart item is active (not deleted)';