"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, FileText, Calendar, Tag } from "lucide-react";
import { Button } from "@components/ui/button";
import { BlogPost, BlogCategory } from "@/lib/actions/blog.actions";
import BlogPostForm from "./BlogPostForm";
import { format } from "date-fns";

export default function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/blog/posts?status=all&limit=50");
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/blog/categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setShowForm(true);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      const response = await fetch(`/api/blog/posts/${post.slug}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId));
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPost(null);
    fetchPosts(); // Refresh posts
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryName = (categoryId?: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
              <div className="h-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <BlogPostForm 
        post={editingPost}
        categories={categories}
        onClose={handleFormClose}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Blog Posts</h2>
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
            {posts.length} posts
          </span>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-[#1B6013] hover:bg-[#1B6013]/90"
        >
          <Plus size={16} className="mr-2" />
          New Post
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <FileText size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts yet</h3>
          <p className="text-gray-500 mb-6">Get started by creating your first blog post.</p>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-[#1B6013] hover:bg-[#1B6013]/90"
          >
            <Plus size={16} className="mr-2" />
            Create First Post
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {/* Featured Image */}
              <div className="h-48 bg-gray-100 relative">
                {post.featured_image ? (
                  <img
                    src={post.featured_image}
                    alt={post.featured_image_alt || post.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FileText size={32} />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                    {post.status}
                  </span>
                </div>
                
                {/* Featured Badge */}
                {post.featured && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      ⭐ Featured
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {post.excerpt || 'No excerpt available'}
                  </p>
                </div>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Tag size={12} />
                    {getCategoryName(post.category_id)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye size={12} />
                    {post.views_count}
                  </div>
                  {post.reading_time && (
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {post.reading_time}m
                    </div>
                  )}
                </div>

                {/* Recipe Info */}
                {(post.prep_time || post.cook_time) && (
                  <div className="flex gap-3 text-xs text-gray-500">
                    {post.prep_time && (
                      <span>Prep: {post.prep_time}min</span>
                    )}
                    {post.cook_time && (
                      <span>Cook: {post.cook_time}min</span>
                    )}
                    {post.difficulty && (
                      <span className={`px-2 py-1 rounded-full ${
                        post.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        post.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {post.difficulty}
                      </span>
                    )}
                  </div>
                )}

                {/* Date */}
                <div className="text-xs text-gray-500">
                  {post.published_at ? 
                    `Published ${format(new Date(post.published_at), 'MMM d, yyyy')}` :
                    `Created ${format(new Date(post.created_at), 'MMM d, yyyy')}`
                  }
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(post)}
                    className="flex-1"
                  >
                    <Edit size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                  >
                    <Eye size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(post.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}