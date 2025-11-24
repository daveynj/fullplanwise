import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/components/RichTextEditor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import type { BlogPost } from '@shared/schema';

export default function AdminBlogPosts() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    author: '',
    publishDate: new Date().toISOString().split('T')[0],
    category: '',
    tags: '',
    readTime: '',
    featured: false,
    featuredImageUrl: '',
    featuredImageAlt: '',
    metaTitle: '',
    metaDescription: '',
    publishedAt: '',
    isPublished: false,
  });

  const { data: postsData, isLoading } = useQuery<{ posts: BlogPost[]; total: number }>({
    queryKey: ['/api/admin/blog/posts'],
    queryFn: () => fetch('/api/admin/blog/posts?pageSize=100').then(res => res.json()),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/admin/blog/posts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/posts'] });
      setCreateDialogOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Blog post created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create blog post',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest('PUT', `/api/admin/blog/posts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/posts'] });
      setEditDialogOpen(false);
      resetForm();
      setSelectedPost(null);
      toast({
        title: 'Success',
        description: 'Blog post updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update blog post',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/blog/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/posts'] });
      setDeleteDialogOpen(false);
      setSelectedPost(null);
      toast({
        title: 'Success',
        description: 'Blog post deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete blog post',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      author: '',
      publishDate: new Date().toISOString().split('T')[0],
      category: '',
      tags: '',
      readTime: '',
      featured: false,
      featuredImageUrl: '',
      featuredImageAlt: '',
      metaTitle: '',
      metaDescription: '',
      publishedAt: '',
      isPublished: false,
    });
  };

  const handleCreate = () => {
    const payload: any = {
      title: formData.title,
      slug: formData.slug,
      content: formData.content,
      excerpt: formData.excerpt,
      author: formData.author,
      publishDate: formData.publishDate,
      category: formData.category,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      readTime: formData.readTime || undefined,
      featured: formData.featured,
      // Convert empty strings to undefined for optional fields
      featuredImageUrl: formData.featuredImageUrl || undefined,
      featuredImageAlt: formData.featuredImageAlt || undefined,
      metaTitle: formData.metaTitle || undefined,
      metaDescription: formData.metaDescription || undefined,
      // Convert date string to Date object
      publishedAt: formData.publishedAt ? new Date(formData.publishedAt) : undefined,
      isPublished: formData.isPublished,
    };
    createMutation.mutate(payload);
  };

  const handleUpdate = () => {
    if (!selectedPost) return;
    const payload: any = {
      title: formData.title,
      slug: formData.slug,
      content: formData.content,
      excerpt: formData.excerpt,
      author: formData.author,
      publishDate: formData.publishDate,
      category: formData.category,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      readTime: formData.readTime || null,
      featured: formData.featured,
      // Convert empty strings to null for optional fields
      featuredImageUrl: formData.featuredImageUrl || null,
      featuredImageAlt: formData.featuredImageAlt || null,
      metaTitle: formData.metaTitle || null,
      metaDescription: formData.metaDescription || null,
      // Convert date string to Date object
      publishedAt: formData.publishedAt ? new Date(formData.publishedAt) : null,
      isPublished: formData.isPublished,
    };
    updateMutation.mutate({ id: selectedPost.id, data: payload });
  };

  const handleDelete = () => {
    if (!selectedPost) return;
    deleteMutation.mutate(selectedPost.id);
  };

  const openEditDialog = (post: BlogPost) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      author: post.author,
      publishDate: post.publishDate,
      category: post.category,
      tags: post.tags?.join(', ') || '',
      readTime: post.readTime || '',
      featured: post.featured,
      featuredImageUrl: post.featuredImageUrl || '',
      featuredImageAlt: post.featuredImageAlt || '',
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
      publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString().split('T')[0] : '',
      isPublished: post.isPublished || false,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (post: BlogPost) => {
    setSelectedPost(post);
    setDeleteDialogOpen(true);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size too large (max 5MB)',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setFormData(prev => ({
        ...prev,
        featuredImageUrl: data.url
      }));

      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-admin-blog-title">Admin Blog Management</h1>
          <p className="text-muted-foreground mt-2">Create and manage blog posts</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} data-testid="button-create-post">
              <Plus className="mr-2 h-4 w-4" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Blog Post</DialogTitle>
              <DialogDescription>
                Fill in the details below to create a new blog post.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-title">Title *</Label>
                  <Input
                    id="create-title"
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setFormData({ ...formData, title, slug: generateSlug(title) });
                    }}
                    placeholder="Enter post title"
                    data-testid="input-title"
                  />
                </div>
                <div>
                  <Label htmlFor="create-slug">Slug *</Label>
                  <Input
                    id="create-slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="url-friendly-slug"
                    data-testid="input-slug"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="create-excerpt">Excerpt *</Label>
                <Textarea
                  id="create-excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief summary of the post"
                  rows={3}
                  data-testid="input-excerpt"
                />
              </div>

              {/* SEO Meta Fields */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-3">SEO Meta Data (Optional)</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="create-meta-title">Meta Title</Label>
                    <Input
                      id="create-meta-title"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                      placeholder="SEO title (max 60 characters)"
                      maxLength={60}
                      data-testid="input-meta-title"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.metaTitle.length}/60 characters
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="create-meta-description">Meta Description</Label>
                    <Textarea
                      id="create-meta-description"
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      placeholder="SEO description (max 160 characters)"
                      rows={2}
                      maxLength={160}
                      data-testid="input-meta-description"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.metaDescription.length}/160 characters
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="create-featured-image-url">Featured Image</Label>
                      <div className="space-y-2">
                        <Input
                          id="create-featured-image-url"
                          value={formData.featuredImageUrl}
                          onChange={(e) => setFormData({ ...formData, featuredImageUrl: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                          data-testid="input-featured-image-url"
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e)}
                            className="cursor-pointer"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload an image or paste a URL
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="create-featured-image-alt">Featured Image Alt Text</Label>
                      <Input
                        id="create-featured-image-alt"
                        value={formData.featuredImageAlt}
                        onChange={(e) => setFormData({ ...formData, featuredImageAlt: e.target.value })}
                        placeholder="Descriptive alt text"
                        maxLength={125}
                        data-testid="input-featured-image-alt"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        SEO accessibility description (max 125 chars)
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="create-published-at">Published Date</Label>
                      <Input
                        id="create-published-at"
                        type="date"
                        value={formData.publishedAt}
                        onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                        data-testid="input-published-at"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        When this post was/will be published
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 mt-6">
                      <Checkbox
                        id="create-is-published"
                        checked={formData.isPublished}
                        onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked as boolean })}
                        data-testid="checkbox-is-published"
                      />
                      <Label htmlFor="create-is-published" className="font-normal">
                        Published (visible on site and in sitemap)
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Content *</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(html) => setFormData({ ...formData, content: html })}
                  placeholder="Write your blog post content here..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-author">Author *</Label>
                  <Input
                    id="create-author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Author name"
                    data-testid="input-author"
                  />
                </div>
                <div>
                  <Label htmlFor="create-publish-date">Publish Date *</Label>
                  <Input
                    id="create-publish-date"
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                    data-testid="input-publish-date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-category">Category *</Label>
                  <Input
                    id="create-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Teaching Tips, Announcement"
                    data-testid="input-category"
                  />
                </div>
                <div>
                  <Label htmlFor="create-read-time">Read Time</Label>
                  <Input
                    id="create-read-time"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    placeholder="e.g., 5 min"
                    data-testid="input-read-time"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="create-tags">Tags (comma-separated)</Label>
                <Input
                  id="create-tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="teaching, tips, beginner"
                  data-testid="input-tags"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create-featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked as boolean })}
                  data-testid="checkbox-featured"
                />
                <Label htmlFor="create-featured" className="font-normal">
                  Featured post (appears prominently on blog page)
                </Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending || !formData.title || !formData.slug || !formData.content || !formData.excerpt || !formData.author || !formData.category}
                  data-testid="button-save-post"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Post'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog - Similar to Create but with update logic */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
            <DialogDescription>
              Update the details of your blog post.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter post title"
                  data-testid="input-edit-title"
                />
              </div>
              <div>
                <Label htmlFor="edit-slug">Slug *</Label>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="url-friendly-slug"
                  data-testid="input-edit-slug"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-excerpt">Excerpt *</Label>
              <Textarea
                id="edit-excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief summary of the post"
                rows={3}
                data-testid="input-edit-excerpt"
              />
            </div>

            {/* SEO Meta Fields */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold mb-3">SEO Meta Data (Optional)</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-meta-title">Meta Title</Label>
                  <Input
                    id="edit-meta-title"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    placeholder="SEO title (max 60 characters)"
                    maxLength={60}
                    data-testid="input-edit-meta-title"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.metaTitle.length}/60 characters
                  </p>
                </div>
                <div>
                  <Label htmlFor="edit-meta-description">Meta Description</Label>
                  <Textarea
                    id="edit-meta-description"
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    placeholder="SEO description (max 160 characters)"
                    rows={2}
                    maxLength={160}
                    data-testid="input-edit-meta-description"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.metaDescription.length}/160 characters
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-featured-image-url">Featured Image</Label>
                    <div className="space-y-2">
                      <Input
                        id="edit-featured-image-url"
                        value={formData.featuredImageUrl}
                        onChange={(e) => setFormData({ ...formData, featuredImageUrl: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        data-testid="input-edit-featured-image-url"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, true)}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload an image or paste a URL
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="edit-featured-image-alt">Featured Image Alt Text</Label>
                    <Input
                      id="edit-featured-image-alt"
                      value={formData.featuredImageAlt}
                      onChange={(e) => setFormData({ ...formData, featuredImageAlt: e.target.value })}
                      placeholder="Descriptive alt text"
                      maxLength={125}
                      data-testid="input-edit-featured-image-alt"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      SEO accessibility description (max 125 chars)
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-published-at">Published Date</Label>
                    <Input
                      id="edit-published-at"
                      type="date"
                      value={formData.publishedAt}
                      onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                      data-testid="input-edit-published-at"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      When this post was/will be published
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 mt-6">
                    <Checkbox
                      id="edit-is-published"
                      checked={formData.isPublished}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked as boolean })}
                      data-testid="checkbox-edit-is-published"
                    />
                    <Label htmlFor="edit-is-published" className="font-normal">
                      Published (visible on site and in sitemap)
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label>Content *</Label>
              <RichTextEditor
                content={formData.content}
                onChange={(html) => setFormData({ ...formData, content: html })}
                placeholder="Write your blog post content here..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-author">Author *</Label>
                <Input
                  id="edit-author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Author name"
                  data-testid="input-edit-author"
                />
              </div>
              <div>
                <Label htmlFor="edit-publish-date">Publish Date *</Label>
                <Input
                  id="edit-publish-date"
                  type="date"
                  value={formData.publishDate}
                  onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                  data-testid="input-edit-publish-date"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Category *</Label>
                <Input
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Teaching Tips, Announcement"
                  data-testid="input-edit-category"
                />
              </div>
              <div>
                <Label htmlFor="edit-read-time">Read Time</Label>
                <Input
                  id="edit-read-time"
                  value={formData.readTime}
                  onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                  placeholder="e.g., 5 min"
                  data-testid="input-edit-read-time"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="teaching, tips, beginner"
                data-testid="input-edit-tags"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked as boolean })}
                data-testid="checkbox-edit-featured"
              />
              <Label htmlFor="edit-featured" className="font-normal">
                Featured post (appears prominently on blog page)
              </Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-edit-cancel">
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
                data-testid="button-update-post"
              >
                {updateMutation.isPending ? 'Updating...' : 'Update Post'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedPost?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Blog Posts List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading blog posts...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {postsData?.posts && postsData.posts.length > 0 ? (
            postsData.posts.map((post) => (
              <Card key={post.id} data-testid={`card-post-${post.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        {post.featured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {post.excerpt}
                      </CardDescription>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>By {post.author}</span>
                        <span>{post.publishDate}</span>
                        <span>{post.category}</span>
                        {post.readTime && <span>{post.readTime}</span>}
                      </div>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {post.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        data-testid={`button-view-${post.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(post)}
                        data-testid={`button-edit-${post.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(post)}
                        data-testid={`button-delete-${post.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No blog posts yet. Create your first post!</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
