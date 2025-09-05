"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Eye, Image as ImageIcon } from "lucide-react";
import { Button } from "@components/ui/button";
import { BlogPost, BlogCategory } from "@/lib/actions/blog.actions";
import dynamic from 'next/dynamic';

// Dynamically import React Quill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface BlogPostFormProps {
  post?: BlogPost | null;
  categories: BlogCategory[];
  onClose: () => void;
}

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    ['clean']
  ],
};

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'blockquote', 'code-block', 'link', 'image'
];

export default function BlogPostForm({ post, categories, onClose }: BlogPostFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    featured_image: '',
    featured_image_alt: '',
    category_id: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    featured: false,
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    prep_time: '',
    cook_time: '',
    servings: '',
    difficulty: '' as '' | 'easy' | 'medium' | 'hard',
    ingredients: [] as string[],
    instructions: [] as string[],
  });

  const [loading, setLoading] = useState(false);
  const [newIngredient, setNewIngredient] = useState('');
  const [newInstruction, setNewInstruction] = useState('');

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        featured_image: post.featured_image || '',
        featured_image_alt: post.featured_image_alt || '',
        category_id: post.category_id || '',
        status: post.status || 'draft',
        featured: post.featured || false,
        meta_title: post.meta_title || '',
        meta_description: post.meta_description || '',
        meta_keywords: post.meta_keywords || '',
        prep_time: post.prep_time?.toString() || '',
        cook_time: post.cook_time?.toString() || '',
        servings: post.servings?.toString() || '',
        difficulty: post.difficulty || '',
        ingredients: Array.isArray(post.ingredients) ? 
          post.ingredients.map((ing: any) => typeof ing === 'string' ? ing : `${ing.quantity || ''} ${ing.name || ''}`.trim()) : 
          [],
        instructions: Array.isArray(post.instructions) ? 
          post.instructions.map((inst: any) => typeof inst === 'string' ? inst : inst.text || inst) : 
          [],
      });
    }
  }, [post]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Title and content are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        prep_time: formData.prep_time ? parseInt(formData.prep_time) : null,
        cook_time: formData.cook_time ? parseInt(formData.cook_time) : null,
        servings: formData.servings ? parseInt(formData.servings) : null,
        ingredients: formData.ingredients.filter(ing => ing.trim()),
        instructions: formData.instructions.filter(inst => inst.trim()),
        published_at: formData.status === 'published' && !post?.published_at ? new Date().toISOString() : undefined,
      };

      const url = post ? `/api/blog/posts/${post.slug}` : '/api/blog/posts';
      const method = post ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.success) {
        onClose();
      } else {
        alert('Error saving post: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Error saving post');
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient.trim()]
      }));
      setNewIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const addInstruction = () => {
    if (newInstruction.trim()) {
      setFormData(prev => ({
        ...prev,
        instructions: [...prev.instructions, newInstruction.trim()]
      }));
      setNewInstruction('');
    }
  };

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={onClose}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Posts
        </Button>
        <h1 className="text-2xl font-bold">
          {post ? 'Edit Post' : 'New Blog Post'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#1B6013] focus:border-[#1B6013]"
                placeholder="Enter blog post title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#1B6013] focus:border-[#1B6013]"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' | 'archived' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#1B6013] focus:border-[#1B6013]"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Excerpt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#1B6013] focus:border-[#1B6013]"
                rows={3}
                placeholder="Brief description of the post"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                  className="w-4 h-4 text-[#1B6013] focus:ring-[#1B6013] border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Featured Post</span>
              </label>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ImageIcon size={20} />
            Featured Image
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={formData.featured_image}
                onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#1B6013] focus:border-[#1B6013]"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt Text
              </label>
              <input
                type="text"
                value={formData.featured_image_alt}
                onChange={(e) => setFormData(prev => ({ ...prev, featured_image_alt: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#1B6013] focus:border-[#1B6013]"
                placeholder="Description for accessibility"
              />
            </div>
          </div>

          {formData.featured_image && (
            <div className="mt-4">
              <img
                src={formData.featured_image}
                alt={formData.featured_image_alt || 'Preview'}
                className="w-full max-w-md h-48 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <h2 className="text-lg font-semibold">Content *</h2>
          <div className="prose-editor">
            <ReactQuill
              value={formData.content}
              onChange={(content) => setFormData(prev => ({ ...prev, content }))}
              modules={quillModules}
              formats={quillFormats}
              theme="snow"
              className="bg-white"
            />
          </div>
        </div>

        {/* Recipe Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <h2 className="text-lg font-semibold">Recipe Information (Optional)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prep Time (minutes)
              </label>
              <input
                type="number"
                value={formData.prep_time}
                onChange={(e) => setFormData(prev => ({ ...prev, prep_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#1B6013] focus:border-[#1B6013]"
                placeholder="20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cook Time (minutes)
              </label>
              <input
                type="number"
                value={formData.cook_time}
                onChange={(e) => setFormData(prev => ({ ...prev, cook_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#1B6013] focus:border-[#1B6013]"
                placeholder="30"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Servings
              </label>
              <input
                type="number"
                value={formData.servings}
                onChange={(e) => setFormData(prev => ({ ...prev, servings: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#1B6013] focus:border-[#1B6013]"
                placeholder="4"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as '' | 'easy' | 'medium' | 'hard' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#1B6013] focus:border-[#1B6013]"
              >
                <option value="">Select Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ingredients
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-[#1B6013] focus:border-[#1B6013]"
                placeholder="e.g., 2 cups rice"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
              />
              <Button type="button" onClick={addIngredient} variant="outline">
                Add
              </Button>
            </div>
            {formData.ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <span className="flex-1 px-3 py-2 bg-gray-50 rounded-md text-sm">
                  {ingredient}
                </span>
                <Button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions
            </label>
            <div className="flex gap-2 mb-3">
              <textarea
                value={newInstruction}
                onChange={(e) => setNewInstruction(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-[#1B6013] focus:border-[#1B6013]"
                placeholder="e.g., Heat oil in a large pot and add onions..."
                rows={2}
              />
              <Button type="button" onClick={addInstruction} variant="outline">
                Add
              </Button>
            </div>
            {formData.instructions.map((instruction, index) => (
              <div key={index} className="flex items-start gap-2 mb-2">
                <span className="bg-[#1B6013] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-1">
                  {index + 1}
                </span>
                <span className="flex-1 px-3 py-2 bg-gray-50 rounded-md text-sm">
                  {instruction}
                </span>
                <Button
                  type="button"
                  onClick={() => removeInstruction(index)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <h2 className="text-lg font-semibold">SEO Settings (Optional)</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Title
              </label>
              <input
                type="text"
                value={formData.meta_title}
                onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#1B6013] focus:border-[#1B6013]"
                placeholder="SEO title (leave blank to use post title)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Description
              </label>
              <textarea
                value={formData.meta_description}
                onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#1B6013] focus:border-[#1B6013]"
                rows={3}
                placeholder="Brief description for search engines"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={formData.meta_keywords}
                onChange={(e) => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#1B6013] focus:border-[#1B6013]"
                placeholder="recipe, jollof rice, nigerian food"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          <div className="flex gap-3">
            {post && (
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
              >
                <Eye size={16} className="mr-2" />
                Preview
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#1B6013] hover:bg-[#1B6013]/90"
            >
              <Save size={16} className="mr-2" />
              {loading ? 'Saving...' : post ? 'Update Post' : 'Create Post'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}