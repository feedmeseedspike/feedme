-- Blog schema for FeedMe v2
-- Creates tables for blog posts, categories, tags, and related functionality

-- Blog categories table
CREATE TABLE blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for category badge
    icon VARCHAR(50), -- Icon name for category
    featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog tags table
CREATE TABLE blog_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog posts table
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt TEXT, -- Short description/summary
    content TEXT NOT NULL, -- Full blog content (HTML/Markdown)
    featured_image TEXT, -- URL to featured image
    featured_image_alt VARCHAR(255), -- Alt text for featured image
    category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    featured BOOLEAN DEFAULT false, -- For featured posts on homepage
    published_at TIMESTAMP WITH TIME ZONE,
    reading_time INTEGER, -- Estimated reading time in minutes
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    -- SEO fields
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    -- Recipe-specific fields (when applicable)
    prep_time INTEGER, -- Preparation time in minutes
    cook_time INTEGER, -- Cooking time in minutes
    servings INTEGER, -- Number of servings
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    ingredients JSONB, -- Array of ingredients with quantities
    instructions JSONB, -- Array of cooking steps
    nutritional_info JSONB, -- Nutritional information
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for blog post tags (many-to-many)
CREATE TABLE blog_post_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, tag_id)
);

-- Blog post likes table (track who liked what)
CREATE TABLE blog_post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Blog comments table
CREATE TABLE blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE, -- For reply threads
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipe-to-product connections (link recipe ingredients to marketplace products)
CREATE TABLE blog_recipe_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    product_id UUID, -- References your existing products table
    ingredient_name VARCHAR(255) NOT NULL,
    quantity VARCHAR(100), -- e.g., "2 cups", "500g"
    optional BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, product_id, ingredient_name)
);

-- Indexes for better performance
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_post_tags_post ON blog_post_tags(post_id);
CREATE INDEX idx_blog_post_tags_tag ON blog_post_tags(tag_id);
CREATE INDEX idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX idx_blog_comments_user ON blog_comments(user_id);
CREATE INDEX idx_blog_post_likes_post ON blog_post_likes(post_id);
CREATE INDEX idx_blog_post_likes_user ON blog_post_likes(user_id);

-- Full text search index for blog posts
CREATE INDEX idx_blog_posts_search ON blog_posts USING gin(to_tsvector('english', title || ' ' || excerpt || ' ' || content));

-- RLS policies
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_recipe_products ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public can view published blog posts" ON blog_posts
FOR SELECT USING (status = 'published');

CREATE POLICY "Public can view blog categories" ON blog_categories
FOR SELECT USING (true);

CREATE POLICY "Public can view blog tags" ON blog_tags
FOR SELECT USING (true);

CREATE POLICY "Public can view approved comments" ON blog_comments
FOR SELECT USING (status = 'approved');

-- Authenticated users can like posts
CREATE POLICY "Authenticated users can like posts" ON blog_post_likes
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Authenticated users can comment
CREATE POLICY "Authenticated users can comment" ON blog_comments
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can edit their own comments
CREATE POLICY "Users can edit own comments" ON blog_comments
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Admin/service role can manage all content
CREATE POLICY "Service role can manage blog categories" ON blog_categories
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage blog posts" ON blog_posts
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage blog tags" ON blog_tags
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage comments" ON blog_comments
FOR ALL USING (auth.role() = 'service_role');

-- Trigger to update post likes count
CREATE OR REPLACE FUNCTION update_blog_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_posts 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_posts 
        SET likes_count = GREATEST(0, likes_count - 1) 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_blog_post_likes_count
    AFTER INSERT OR DELETE ON blog_post_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_post_likes_count();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_blog_categories_updated_at
    BEFORE UPDATE ON blog_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO blog_categories (name, slug, description, color, icon, featured, sort_order) VALUES
('Recipes', 'recipes', 'Delicious recipes and cooking guides', '#EF4444', 'chef-hat', true, 1),
('Food Stories', 'food-stories', 'Cultural stories and food traditions', '#3B82F6', 'book-open', true, 2),
('Nutrition Tips', 'nutrition-tips', 'Health and nutrition advice', '#10B981', 'heart', true, 3),
('Local Culture', 'local-culture', 'Local food culture and events', '#F59E0B', 'map-pin', false, 4),
('Cooking Tips', 'cooking-tips', 'Kitchen techniques and cooking hacks', '#8B5CF6', 'lightbulb', false, 5),
('Vendor Spotlight', 'vendor-spotlight', 'Featured vendors and their stories', '#EC4899', 'store', false, 6);

-- Insert default tags
INSERT INTO blog_tags (name, slug) VALUES
('Quick & Easy', 'quick-easy'),
('Vegetarian', 'vegetarian'),
('Vegan', 'vegan'),
('Gluten Free', 'gluten-free'),
('Healthy', 'healthy'),
('Traditional', 'traditional'),
('Nigerian', 'nigerian'),
('International', 'international'),
('Breakfast', 'breakfast'),
('Lunch', 'lunch'),
('Dinner', 'dinner'),
('Snacks', 'snacks'),
('Desserts', 'desserts'),
('Beverages', 'beverages');

-- Function to increment blog post views
CREATE OR REPLACE FUNCTION increment_blog_post_views(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE blog_posts 
  SET views_count = views_count + 1 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;