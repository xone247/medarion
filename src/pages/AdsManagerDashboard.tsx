import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Megaphone, Plus, Search, Upload, Download, Pencil, Trash2, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmModal from '../components/ui/ConfirmModal';
import AlertModal from '../components/ui/AlertModal';
import PromptModal from '../components/ui/PromptModal';

export type AdPlacement = 'blog_top' | 'blog_inline' | 'newsletter' | 'dashboard_sidebar' | 'dashboard_inline';
export type AdCategory = 'blog_general' | 'dashboard_personalized' | 'newsletter_general';
export type DemoAd = {
  id: string;
  title: string;
  imageUrl: string;
  ctaText: string;
  targetUrl: string;
  advertiser?: string;
  category: AdCategory;
  placements: AdPlacement[];
  status?: 'active' | 'paused' | 'draft';
};

const LS_KEY = 'medarionAds';

const defaultAd = (): DemoAd => ({
  id: 'ad-' + Date.now(),
  title: '',
  imageUrl: '',
  ctaText: '',
  targetUrl: '',
  advertiser: '',
  category: 'blog_general',
  placements: ['blog_top'],
  status: 'draft',
});

const AdsManagerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const canSuper = !!(profile && (profile.is_admin || (profile as any).app_roles?.includes('super_admin')));
  const canAds = canSuper || !!((profile as any)?.app_roles?.includes('ads_admin'));

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all'|'active'|'paused'|'draft'>('all');
  const [category, setCategory] = useState<'all'|AdCategory>('all');
  const [page, setPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; adId: number | null; onConfirm: () => void }>({ isOpen: false, adId: null, onConfirm: () => {} });
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; variant?: 'success' | 'error' | 'warning' | 'info' }>({ isOpen: false, title: '', message: '', variant: 'info' });
  const [promptModal, setPromptModal] = useState<{ isOpen: boolean; title: string; message: string; placeholder?: string; onConfirm: (value: string) => void }>({ isOpen: false, title: '', message: '', placeholder: '', onConfirm: () => {} });
  const pageSize = 8;

  const [ads, setAds] = useState<DemoAd[]>([]);
  const [editing, setEditing] = useState<DemoAd | null>(null);

  useEffect(() => {
    try { const raw = localStorage.getItem(LS_KEY); setAds(raw ? JSON.parse(raw) : []); } catch { setAds([]); }
  }, []);

  const saveAds = (arr: DemoAd[]) => { setAds(arr); try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch {} };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ads.filter(a => {
      const okQ = !q || a.title.toLowerCase().includes(q) || (a.advertiser||'').toLowerCase().includes(q);
      const okS = status === 'all' || (a.status||'draft') === status;
      const okC = category === 'all' || a.category === category;
      return okQ && okS && okC;
    });
  }, [ads, query, status, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (!canAds) {
    return (
      <div className="p-6">
        <div className="text-center text-[var(--color-text-secondary)] border border-[var(--color-divider-gray)] rounded-lg p-6">
          <p>Ads Manager is restricted. Contact your administrator for access.</p>
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
            <Megaphone className="h-4 w-4 icon-primary" />
            <h3 className="font-semibold text-[var(--color-text-primary)]">Filters</h3>
          </div>
          <div className="tile-body space-y-3">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">Search</label>
              <div className="flex items-center gap-2 mt-1">
                <div className="p-2 rounded border border-[var(--color-divider-gray)] bg-[var(--color-background-default)]">
                  <Search className="h-4 w-4 icon-muted" />
                </div>
                <input className="input flex-1" placeholder="Search ads..." value={query} onChange={(e)=>{ setQuery(e.target.value); setPage(1); }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">Status</label>
                <select className="input mt-1 w-full" value={status} onChange={(e)=>{ setStatus(e.target.value as any); setPage(1); }}>
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">Category</label>
                <select className="input mt-1 w-full" value={category} onChange={(e)=>{ setCategory(e.target.value as any); setPage(1); }}>
                  <option value="all">All</option>
                  <option value="blog_general">Blog</option>
                  <option value="dashboard_personalized">Dashboard</option>
                  <option value="newsletter_general">Newsletter</option>
                </select>
              </div>
            </div>
            <button className="btn-outline w-full px-3 py-2 rounded" onClick={()=>{ setQuery(''); setStatus('all'); setCategory('all'); setPage(1); }}>Reset</button>
          </div>
        </div>

        <div className="tile">
          <div className="tile-header">
            <h3 className="font-semibold text-[var(--color-text-primary)]">Bulk Actions</h3>
          </div>
          <div className="tile-body space-y-2">
            <button className="btn-outline w-full px-3 py-2 rounded flex items-center gap-2" onClick={()=>{ try { navigator.clipboard.writeText(JSON.stringify(ads, null, 2)); } catch {} }}><Download className="h-4 w-4"/> Export JSON</button>
            <button className="btn-outline w-full px-3 py-2 rounded flex items-center gap-2" onClick={()=>{ setPromptModal({ isOpen: true, title: 'Import Ads', message: 'Paste the JSON data for ads:', placeholder: 'Paste JSON here...', onConfirm: (pasted) => { setPromptModal(prev => ({ ...prev, isOpen: false })); if (!pasted) return; try { const arr = JSON.parse(pasted) as DemoAd[]; saveAds(arr); setAlertModal({ isOpen: true, title: 'Success', message: `${arr.length} ad(s) imported successfully`, variant: 'success' }); } catch { setAlertModal({ isOpen: true, title: 'Error', message: 'Invalid JSON format', variant: 'error' }); } } }); }}><Upload className="h-4 w-4"/> Import JSON</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <section className="lg:col-span-3 space-y-4">
        <div className="tile">
          <div className="tile-header flex items-center gap-2">
            <h3 className="font-semibold text-[var(--color-text-primary)]">Ads</h3>
            <span className="text-xs text-[var(--color-text-secondary)]">{filtered.length} results</span>
            <button className="ml-auto btn-primary px-3 py-2 rounded flex items-center gap-2" onClick={()=> setEditing(defaultAd())}><Plus className="h-4 w-4"/> New Ad</button>
          </div>
          <div className="tile-body">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--color-text-secondary)]">
                    <th className="py-2 pr-3">Title</th>
                    <th className="py-2 pr-3">Advertiser</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map(a => (
                    <tr key={a.id} className="border-t border-[var(--color-divider-gray)]">
                      <td className="py-2 pr-3">
                        <div className="font-medium text-[var(--color-text-primary)]">{a.title || '(Untitled)'}</div>
                        <div className="text-xs text-[var(--color-text-secondary)]">Placements: {a.placements.join(', ')}</div>
                      </td>
                      <td className="py-2 pr-3">{a.advertiser||'-'}</td>
                      <td className="py-2 pr-3">{a.category}</td>
                      <td className="py-2 pr-3">
                        <select className="input py-1 px-2 text-xs" value={a.status||'draft'} onChange={(e)=>{
                          const next = ads.map(x => x.id===a.id ? { ...x, status: e.target.value as any } : x);
                          saveAds(next);
                        }}>
                          <option value="active">active</option>
                          <option value="paused">paused</option>
                          <option value="draft">draft</option>
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <button className="btn-outline px-2 py-1 rounded" onClick={()=> setEditing(a)}><Pencil className="h-4 w-4"/></button>
                          <button className="btn-outline px-2 py-1 rounded" onClick={()=>{ setConfirmModal({ isOpen: true, adId: a.id, title: 'Delete Ad', message: `Are you sure you want to delete "${a.title || 'this ad'}"? This action cannot be undone.`, variant: 'danger', onConfirm: () => { saveAds(ads.filter(x=>x.id!==a.id)); setConfirmModal(prev => ({ ...prev, isOpen: false })); } }); }}><Trash2 className="h-4 w-4"/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button className="btn-outline px-2 py-1 rounded" onClick={()=> setPage(p => Math.max(1, p-1))}><ChevronLeft className="h-4 w-4"/></button>
              <span className="text-xs text-[var(--color-text-secondary)]">Page {safePage} / {totalPages}</span>
              <button className="btn-outline px-2 py-1 rounded" onClick={()=> setPage(p => Math.min(totalPages, p+1))}><ChevronRight className="h-4 w-4"/></button>
            </div>
          </div>
        </div>
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=> setEditing(null)} />
          <div className="relative bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] rounded-xl w-full max-w-3xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{editing.id ? 'Edit Ad' : 'New Ad'}</h3>
              <button className="btn-outline px-2 py-1 rounded" onClick={()=> setEditing(null)}>Close</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input" placeholder="Title" value={editing.title} onChange={e=> setEditing(prev => prev? { ...prev, title: e.target.value } : prev)} />
              <input className="input" placeholder="Advertiser" value={editing.advertiser||''} onChange={e=> setEditing(prev => prev? { ...prev, advertiser: e.target.value } : prev)} />
              <input className="input md:col-span-2" placeholder="Image URL" value={editing.imageUrl} onChange={e=> setEditing(prev => prev? { ...prev, imageUrl: e.target.value } : prev)} />
              <input className="input" placeholder="CTA Text" value={editing.ctaText} onChange={e=> setEditing(prev => prev? { ...prev, ctaText: e.target.value } : prev)} />
              <input className="input" placeholder="Target URL" value={editing.targetUrl} onChange={e=> setEditing(prev => prev? { ...prev, targetUrl: e.target.value } : prev)} />
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">Category</label>
                <select className="input mt-1 w-full" value={editing.category} onChange={(e)=> setEditing(prev => prev? { ...prev, category: e.target.value as any } : prev)}>
                  <option value="blog_general">Blog</option>
                  <option value="dashboard_personalized">Dashboard</option>
                  <option value="newsletter_general">Newsletter</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">Placements</label>
                <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                  {(['blog_top','blog_inline','newsletter','dashboard_sidebar','dashboard_inline'] as AdPlacement[]).map(pl => (
                    <label key={pl} className="flex items-center gap-2">
                      <input type="checkbox" checked={editing.placements.includes(pl)} onChange={(e)=> setEditing(prev => prev? { ...prev, placements: e.target.checked ? [...prev.placements, pl] : prev.placements.filter(x=>x!==pl) } : prev)} />
                      <span>{pl}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 flex items-center justify-end gap-2">
                <button className="btn-outline px-3 py-2 rounded" onClick={()=> setEditing(null)}>Cancel</button>
                <button className="btn-primary px-3 py-2 rounded flex items-center gap-2" onClick={()=>{
                  const next = ads.some(a=>a.id===editing.id)
                    ? ads.map(a => a.id===editing.id ? editing : a)
                    : [...ads, { ...editing, id: 'ad-'+Date.now() }];
                  saveAds(next);
                  setEditing(null);
                }}><Save className="h-4 w-4"/> Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title="Delete Ad"
        message={confirmModal.adId ? `Are you sure you want to delete this ad? This action cannot be undone.` : 'Are you sure you want to delete this ad?'}
        variant="danger"
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

export default AdsManagerDashboard; 