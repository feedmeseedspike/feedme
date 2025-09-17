-- Fix offers table to use proper foreign key relationship with categories
-- First, drop the existing category column if it exists
ALTER TABLE offers DROP COLUMN IF EXISTS category;

-- Add category_id as a foreign key reference to categories table
ALTER TABLE offers ADD COLUMN category_id UUID REFERENCES categories(id);

-- Add offer_id column to cart_items table
ALTER TABLE cart_items 
ADD COLUMN offer_id UUID REFERENCES offers(id) ON DELETE CASCADE;

-- Update the update_cart_items function to handle offers
CREATE OR REPLACE FUNCTION update_cart_items(p_cart_id UUID, p_new_items JSONB)
RETURNS VOID AS $$
DECLARE
    item JSONB;
BEGIN
    -- Delete all existing items for this cart
    DELETE FROM cart_items WHERE cart_id = p_cart_id;
    
    -- Insert new items
    FOR item IN SELECT * FROM jsonb_array_elements(p_new_items)
    LOOP
        INSERT INTO cart_items (
            cart_id, 
            product_id, 
            bundle_id, 
            offer_id,
            option, 
            quantity, 
            price
        ) VALUES (
            p_cart_id,
            CASE WHEN item->>'product_id' = '' OR item->>'product_id' = 'null' THEN NULL 
                 ELSE (item->>'product_id')::UUID END,
            CASE WHEN item->>'bundle_id' = '' OR item->>'bundle_id' = 'null' THEN NULL 
                 ELSE (item->>'bundle_id')::UUID END,
            CASE WHEN item->>'offer_id' = '' OR item->>'offer_id' = 'null' THEN NULL 
                 ELSE (item->>'offer_id')::UUID END,
            CASE WHEN item->>'option' = 'null' THEN NULL 
                 ELSE item->'option' END,
            (item->>'quantity')::INTEGER,
            CASE WHEN item->>'price' = 'null' THEN NULL 
                 ELSE (item->>'price')::DECIMAL END
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;