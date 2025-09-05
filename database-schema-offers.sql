-- Offers table for slot-based purchasing
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    price_per_slot DECIMAL(10,2) NOT NULL,
    total_slots INTEGER NOT NULL,
    available_slots INTEGER NOT NULL CHECK (available_slots >= 0),
    weight_per_slot VARCHAR(50), -- e.g., "10kg", "5kg"
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'sold_out')),
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offer purchases table to track who bought which slots
CREATE TABLE offer_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    slots_purchased INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
    phone VARCHAR(20),
    email VARCHAR(255),
    delivery_address TEXT,
    payment_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_end_date ON offers(end_date);
CREATE INDEX idx_offer_purchases_offer_id ON offer_purchases(offer_id);
CREATE INDEX idx_offer_purchases_user_id ON offer_purchases(user_id);

-- RLS policies (adjust based on your existing auth setup)
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_purchases ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all offers
CREATE POLICY "Public can view all offers" ON offers
FOR SELECT USING (true);

-- Allow service role to manage offers (for admin operations)
CREATE POLICY "Service role can manage offers" ON offers
FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to manage offers (for admin panel)
CREATE POLICY "Authenticated users can manage offers" ON offers
FOR ALL TO authenticated USING (true);

-- Allow unauthenticated insert for offers (for admin panel without strict auth)
CREATE POLICY "Allow offers insert" ON offers
FOR INSERT WITH CHECK (true);

-- Allow unauthenticated update for offers 
CREATE POLICY "Allow offers update" ON offers
FOR UPDATE USING (true);

-- Allow unauthenticated delete for offers
CREATE POLICY "Allow offers delete" ON offers
FOR DELETE USING (true);

-- Allow authenticated users to purchase offers
CREATE POLICY "Authenticated users can purchase offers" ON offer_purchases
FOR INSERT TO authenticated WITH CHECK (true);

-- Allow users to view their own purchases
CREATE POLICY "Users can view their own purchases" ON offer_purchases
FOR SELECT USING (auth.uid() = user_id);

-- Allow service role to view all purchases
CREATE POLICY "Service role can view all purchases" ON offer_purchases
FOR SELECT USING (auth.role() = 'service_role');

-- Trigger function to automatically deduct offer slots when order is paid
CREATE OR REPLACE FUNCTION process_offer_deductions()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when payment_status changes to 'Paid'
  IF OLD.payment_status != 'Paid' AND NEW.payment_status = 'Paid' THEN
    -- Process all offer items in this order
    UPDATE offers 
    SET 
      available_slots = GREATEST(0, offers.available_slots - order_items.quantity),
      status = CASE 
        WHEN GREATEST(0, offers.available_slots - order_items.quantity) = 0 THEN 'sold_out'
        ELSE offers.status
      END,
      updated_at = NOW()
    FROM order_items 
    WHERE order_items.order_id = NEW.id 
      AND order_items.offer_id = offers.id 
      AND order_items.offer_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on orders table
CREATE TRIGGER trigger_process_offer_deductions
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION process_offer_deductions();