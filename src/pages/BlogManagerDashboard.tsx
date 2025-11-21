import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Upload, Download, Eye, ChevronRight, ChevronLeft, Newspaper, Pencil, Trash2, Save } from 'lucide-react';
import apiClient, { type BlogPost as ApiBlogPost } from '../lib/api';
import ConfirmModal from '../components/ui/ConfirmModal';
import AlertModal from '../components/ui/AlertModal';
import PromptModal from '../components/ui/PromptModal';

export type BlogPost = {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  image: string;
  featured: boolean;
  status?: 'draft' | 'published' | 'archived';
};

const LS_KEY = 'medarionBlogPosts';

const defaultPost = (author?: string): BlogPost => ({
  id: Date.now(),
  title: '',
  excerpt: '',
  content: '',
  author: author || 'Editor',
  date: new Date().toISOString().slice(0, 10),
  category: 'General',
  readTime: '5 min read',
  image: '',
  featured: false,
  status: 'draft',
});

const BlogManagerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const canSuper = !!(profile && ((profile as any).role === 'admin' || (profile as any).is_admin || (profile as any).app_roles?.includes('super_admin')));
  const canBlog = canSuper || !!((profile as any)?.app_roles?.some((r: string) => ['blog_admin','content_editor'].includes(r)));

  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [category, setCategory] = useState<string>('all');
  const [status, setStatus] = useState<'all'|'draft'|'published'|'archived'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; variant?: 'danger' | 'warning'; isLoading?: boolean; onConfirm: () => void }>({ isOpen: false, title: '', message: '', variant: 'warning', isLoading: false, onConfirm: () => {} });
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; variant?: 'success' | 'error' | 'warning' | 'info' }>({ isOpen: false, title: '', message: '', variant: 'info' });
  const [promptModal, setPromptModal] = useState<{ isOpen: boolean; title: string; message: string; placeholder?: string; onConfirm: (value: string) => void }>({ isOpen: false, title: '', message: '', placeholder: '', onConfirm: () => {} });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await apiClient.getBlogPosts({ limit: 200 });
        const api = (res.data?.posts || []) as ApiBlogPost[];
        if (api.length) {
          const mapped: BlogPost[] = api.map(p => ({
            id: Number(p.id),
            title: p.title || '',
            excerpt: p.excerpt || '',
            content: p.content || '',
            author: p.authorName || [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Medarion',
            date: p.publishedAt || new Date().toISOString(),
            category: (p as any).category || 'General',
            readTime: '5 min read',
            image: p.featuredImage || '',
            featured: Boolean((p as any).featured),
            status: p.status || 'draft',
          }));
          setPosts(mapped);
          // Mirror to localStorage as fallback for offline
          try { localStorage.setItem(LS_KEY, JSON.stringify(mapped)); } catch {}
          return;
        }
      } catch {
        // ignore and fall back
      } finally {
        setLoading(false);
      }
      try {
        const raw = localStorage.getItem(LS_KEY);
        setPosts(raw ? JSON.parse(raw) : []);
      } catch {
        setPosts([]);
      }
    })();
  }, []);

  const savePosts = (arr: BlogPost[]) => {
    setPosts(arr);
    try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch {}
  };

  const categories = useMemo(() => {
    const set = new Set<string>(['General']);
    posts.forEach(p => { if (p.category) set.add(p.category); });
    return Array.from(set).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(p => {
      const okQ = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || p.author.toLowerCase().includes(q);
      const okC = category === 'all' || p.category === category;
      const okS = status === 'all' || (p.status || 'draft') === status;
      return okQ && okC && okS;
    });
  }, [posts, query, category, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (!canBlog) {
    return (
      <div className="p-6">
        <div className="text-center text-[var(--color-text-secondary)] border border-[var(--color-divider-gray)] rounded-lg p-6">
          <p>Blog Manager is restricted. Contact your administrator for access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar */}
      <aside className="lg:col-span-1 space-y-4">
        <div className="tile">
          <div className="tile-header flex items-center gap-2">
            <Newspaper className="h-4 w-4 icon-primary" />
            <h3 className="font-semibold text-[var(--color-text-primary)]">Filters</h3>
            <button className="ml-auto btn-outline px-2 py-1 rounded" onClick={()=>setFiltersOpen(o=>!o)}>{filtersOpen ? 'Hide' : 'Show'}</button>
          </div>
          {filtersOpen && (
            <div className="tile-body space-y-3">
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">Search</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="p-2 rounded border border-[var(--color-divider-gray)] bg-[var(--color-background-default)]">
                    <Search className="h-4 w-4 icon-muted" />
                  </div>
                  <input className="input flex-1" placeholder="Search posts..." value={query} onChange={(e)=>{ setQuery(e.target.value); setPage(1); }} />
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">Category</label>
                <select className="input mt-1 w-full" value={category} onChange={(e)=>{ setCategory(e.target.value); setPage(1); }}>
                  <option value="all">All</option>
                  {categories.map(c => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">Status</label>
                <select className="input mt-1 w-full" value={status} onChange={(e)=>{ setStatus(e.target.value as any); setPage(1); }}>
                  <option value="all">All</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button className="btn-outline px-3 py-2 rounded w-full" onClick={()=>{ setQuery(''); setCategory('all'); setStatus('all'); setPage(1); }}>
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="tile">
          <div className="tile-header">
            <h3 className="font-semibold text-[var(--color-text-primary)]">Bulk Actions</h3>
          </div>
          <div className="tile-body space-y-2">
            <button className="btn-outline w-full px-3 py-2 rounded flex items-center gap-2" onClick={()=>{
              try { navigator.clipboard.writeText(JSON.stringify(posts, null, 2)); } catch {}
            }}><Download className="h-4 w-4"/> Export JSON</button>
            <button className="btn-outline w-full px-3 py-2 rounded flex items-center gap-2" onClick={()=>{
              setPromptModal({ isOpen: true, title: 'Import Blog Posts', message: 'Paste the JSON data for blog posts:', placeholder: 'Paste JSON here...', onConfirm: (pasted) => { setPromptModal(prev => ({ ...prev, isOpen: false })); if (!pasted) return; try { const arr = JSON.parse(pasted) as BlogPost[]; savePosts(arr); setAlertModal({ isOpen: true, title: 'Success', message: `${arr.length} post(s) imported successfully`, variant: 'success' }); } catch { setAlertModal({ isOpen: true, title: 'Error', message: 'Invalid JSON format', variant: 'error' }); } } });
            }}><Upload className="h-4 w-4"/> Import JSON</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <section className="lg:col-span-3 space-y-4">
        <div className="tile">
          <div className="tile-header flex items-center gap-2">
            <h3 className="font-semibold text-[var(--color-text-primary)]">Posts</h3>
            <span className="text-xs text-[var(--color-text-secondary)]">{loading ? 'Loading…' : `${filtered.length} results`}</span>
            <button className="ml-auto btn-primary px-3 py-2 rounded flex items-center gap-2" onClick={()=> setEditing(defaultPost(profile?.full_name))}>
              <Plus className="h-4 w-4"/> New Post
            </button>
          </div>
          <div className="tile-body">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--color-text-secondary)]">
                    <th className="py-2 pr-3">Title</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map(p => (
                    <tr key={p.id} className="border-t border-[var(--color-divider-gray)]">
                      <td className="py-2 pr-3">
                        <div className="font-medium text-[var(--color-text-primary)]">{p.title || '(Untitled)'}</div>
                        <div className="text-xs text-[var(--color-text-secondary)] line-clamp-1">{p.excerpt}</div>
                      </td>
                      <td className="py-2 pr-3">{p.category}</td>
                      <td className="py-2 pr-3">
                        <select className="input py-1 px-2 text-xs" value={p.status||'draft'} onChange={(e)=>{
                          const next = posts.map(x => x.id===p.id ? { ...x, status: e.target.value as any } : x);
                          savePosts(next);
                        }}>
                          <option value="draft">draft</option>
                          <option value="published">published</option>
                          <option value="archived">archived</option>
                        </select>
                      </td>
                      <td className="py-2 pr-3">{new Date(p.date).toLocaleDateString()}</td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <button className="btn-outline px-2 py-1 rounded" onClick={()=> setEditing(p)}><Pencil className="h-4 w-4"/></button>
                          <button className="btn-outline px-2 py-1 rounded" onClick={async ()=>{
                            setConfirmModal({ isOpen: true, title: 'Delete Post', message: `Are you sure you want to delete "${p.title || 'this post'}"? This action cannot be undone.`, variant: 'danger', onConfirm: async () => { setConfirmModal(prev => ({ ...prev, isLoading: true })); try { setSaving(true); await apiClient.deleteBlogPost(p.id); savePosts(posts.filter(x=>x.id!==p.id)); setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false })); setAlertModal({ isOpen: true, title: 'Success', message: 'Post deleted successfully', variant: 'success' }); } catch { setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false })); setAlertModal({ isOpen: true, title: 'Error', message: 'Failed to delete post', variant: 'error' }); } finally { setSaving(false); } } }); }}><Trash2 className="h-4 w-4"/></button>
                          <button className="btn-outline px-2 py-1 rounded" title="Preview"><Eye className="h-4 w-4"/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end gap-2 mt-4">
              <button className="btn-outline px-2 py-1 rounded" onClick={()=> setPage(p => Math.max(1, p-1))}><ChevronLeft className="h-4 w-4"/></button>
              <span className="text-xs text-[var(--color-text-secondary)]">Page {safePage} / {totalPages}</span>
              <button className="btn-outline px-2 py-1 rounded" onClick={()=> setPage(p => Math.min(totalPages, p+1))}><ChevronRight className="h-4 w-4"/></button>
            </div>
          </div>
        </div>
      </section>

      {/* Editor Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=> setEditing(null)} />
          <div className="relative bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] rounded-xl w-full max-w-3xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{editing.id ? 'Edit Post' : 'New Post'}</h3>
              <button className="btn-outline px-2 py-1 rounded" onClick={()=> setEditing(null)}>Close</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input" placeholder="Title" value={editing.title} onChange={e=> setEditing(prev => prev? { ...prev, title: e.target.value } : prev)} />
              <input className="input" placeholder="Category" value={editing.category} onChange={e=> setEditing(prev => prev? { ...prev, category: e.target.value } : prev)} />
              <input className="input" placeholder="Author" value={editing.author} onChange={e=> setEditing(prev => prev? { ...prev, author: e.target.value } : prev)} />
              <input className="input" placeholder="Image URL" value={editing.image} onChange={e=> setEditing(prev => prev? { ...prev, image: e.target.value } : prev)} />
              <textarea className="input md:col-span-2" placeholder="Excerpt" value={editing.excerpt} onChange={e=> setEditing(prev => prev? { ...prev, excerpt: e.target.value } : prev)} />
              {/* Minimal WYSIWYG: contenteditable area */}
              <div className="md:col-span-2">
                <label className="text-xs text-[var(--color-text-secondary)]">Content</label>
                <div
                  className="input h-64 overflow-auto prose max-w-none dark:prose-invert"
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e)=>{
                    const html = (e.target as HTMLDivElement).innerHTML;
                    setEditing(prev => prev ? { ...prev, content: html } : prev);
                  }}
                  dangerouslySetInnerHTML={{ __html: editing.content }}
                />
                <div className="text-[10px] mt-1 text-[var(--color-text-secondary)]">Tip: paste formatted text or images; HTML will be saved.</div>
              </div>
              <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={!!editing.featured} onChange={e=> setEditing(prev => prev? { ...prev, featured: e.target.checked } : prev)} /> Featured</label>
              <div className="md:col-span-2 flex items-center justify-end gap-2">
                <button className="btn-outline px-3 py-2 rounded" onClick={()=> setEditing(null)} disabled={saving}>Cancel</button>
                <button className="btn-primary px-3 py-2 rounded flex items-center gap-2" disabled={saving} onClick={async ()=>{
                  if (!editing) return;
                  try {
                    setSaving(true);
                    const payload: Partial<ApiBlogPost> = {
                      title: editing.title,
                      excerpt: editing.excerpt,
                      content: editing.content,
                      featuredImage: editing.image,
                      status: editing.status || 'draft',
                      // Backend will infer author from token; category support may use category/category_id
                      ...(editing.category ? { category: editing.category } as any : {}),
                    };
                    const exists = posts.some(p => p.id === editing.id);
                    if (exists) {
                      await apiClient.updateBlogPost(editing.id, payload);
                      const next = posts.map(p => p.id===editing.id ? editing : p);
                      savePosts(next);
                    } else {
                      const res = await apiClient.createBlogPost(payload);
                      const newId = Number((res.data as any)?.post?.id || Date.now());
                      const next = [...posts, { ...editing, id: newId }];
                      savePosts(next);
                    }
                    setEditing(null);
                    setAlertModal({ isOpen: true, title: 'Success', message: 'Post saved successfully', variant: 'success' });
                  } catch {
                    setAlertModal({ isOpen: true, title: 'Error', message: 'Failed to save post', variant: 'error' });
                  } finally {
                    setSaving(false);
                  }
                }}><Save className="h-4 w-4"/>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        isLoading={confirmModal.isLoading}
      />
      
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
      
      <PromptModal
        isOpen={promptModal.isOpen}
        onClose={() => setPromptModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={promptModal.onConfirm}
        title={promptModal.title}
        message={promptModal.message}
        placeholder={promptModal.placeholder}
        type="text"
      />
    </div>
  );
};

export default BlogManagerDashboard; 