import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Plus, Search, Upload, Download, Pencil, Trash2, Save, Shield, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmModal from '../components/ui/ConfirmModal';
import AlertModal from '../components/ui/AlertModal';
import PromptModal from '../components/ui/PromptModal';

export type AppRole = 'super_admin' | 'blog_admin' | 'content_editor' | 'ads_admin';
export type AccountTier = 'free' | 'paid' | 'academic' | 'enterprise';

export type ManagedUser = {
	id: string;
	full_name: string;
	email: string;
	user_type: string;
	account_tier: AccountTier;
	app_roles: AppRole[];
	is_admin?: boolean;
};

const LS_KEY = 'medarionUsers';

const defaultUser = (): ManagedUser => ({
	id: 'u-' + Date.now(),
	full_name: '',
	email: '',
	user_type: 'startup',
	account_tier: 'free',
	app_roles: [],
	is_admin: false,
});

const seedDemoUsers = (): ManagedUser[] => ([
	// Platform control
	{ id: 'u-super', full_name: 'Super Admin', email: 'super@medarion.africa', user_type: 'industry_executives', account_tier: 'enterprise', app_roles: ['super_admin'], is_admin: true },

	// Startup personas
	{ id: 'u-startup-paid', full_name: 'Startup Pro (Paid)', email: 'startup.pro@demo.africa', user_type: 'startup', account_tier: 'paid', app_roles: [], is_admin: false },
	{ id: 'u-startup-free', full_name: 'Startup Free', email: 'startup.free@demo.africa', user_type: 'startup', account_tier: 'free', app_roles: [], is_admin: false },
	{ id: 'u-startup-enterprise', full_name: 'Startup Enterprise', email: 'startup.ent@demo.africa', user_type: 'startup', account_tier: 'enterprise', app_roles: [], is_admin: false },

	// Investor personas
	{ id: 'u-investor-paid', full_name: 'Investor Pro (Paid)', email: 'investor.pro@demo.africa', user_type: 'investors_finance', account_tier: 'paid', app_roles: [], is_admin: false },
	{ id: 'u-investor-free', full_name: 'Investor Free', email: 'investor.free@demo.africa', user_type: 'investors_finance', account_tier: 'free', app_roles: [], is_admin: false },
	{ id: 'u-investor-enterprise', full_name: 'Investor Enterprise', email: 'investor.ent@demo.africa', user_type: 'investors_finance', account_tier: 'enterprise', app_roles: [], is_admin: false },

	// Executives and media
	{ id: 'u-executive-paid', full_name: 'Executive (Paid)', email: 'exec.paid@demo.africa', user_type: 'industry_executives', account_tier: 'paid', app_roles: [], is_admin: false },
	{ id: 'u-media-free', full_name: 'Media Advisor (Free)', email: 'media.free@demo.africa', user_type: 'media_advisors', account_tier: 'free', app_roles: [], is_admin: false },

	// Researchers (academic tier)
	{ id: 'u-researcher-academic', full_name: 'Researcher (Academic)', email: 'research.academic@demo.africa', user_type: 'health_science_experts', account_tier: 'academic', app_roles: [], is_admin: false },

	// Management roles demos (visible only to super admin modules)
	{ id: 'u-ads-manager', full_name: 'Ads Manager', email: 'ads.manager@demo.africa', user_type: 'industry_executives', account_tier: 'paid', app_roles: ['ads_admin'], is_admin: false },
]);

const UsersManagerDashboard: React.FC = () => {
	const { profile } = useAuth();
	const isSuper = !!(profile && (profile.is_admin || (profile as any).app_roles?.includes('super_admin')));

	const [query, setQuery] = useState('');
	const [tier, setTier] = useState<'all'|AccountTier>('all');
	const [role, setRole] = useState<'all'|AppRole>('all');
	const [page, setPage] = useState(1);
	const pageSize = 8;

	const [users, setUsers] = useState<ManagedUser[]>([]);
	const [editing, setEditing] = useState<ManagedUser | null>(null);
	const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; variant?: 'danger' | 'warning' }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'warning' });
	const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; variant?: 'success' | 'error' | 'warning' | 'info' }>({ isOpen: false, title: '', message: '', variant: 'info' });
	const [promptModal, setPromptModal] = useState<{ isOpen: boolean; title: string; message: string; placeholder?: string; onConfirm: (value: string) => void }>({ isOpen: false, title: '', message: '', placeholder: '', onConfirm: () => {} });

	useEffect(() => {
		try { 
			const raw = localStorage.getItem(LS_KEY); 
			const parsed: ManagedUser[] = raw ? JSON.parse(raw) : [];
			if (!parsed || parsed.length === 0) {
				const seeded = seedDemoUsers();
				localStorage.setItem(LS_KEY, JSON.stringify(seeded));
				setUsers(seeded);
			} else {
				setUsers(parsed);
			}
		} catch { setUsers([]); }
	}, []);

	const saveUsers = (arr: ManagedUser[]) => { setUsers(arr); try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch {} };

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return users.filter(u => {
			const okQ = !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.user_type.toLowerCase().includes(q);
			const okT = tier === 'all' || u.account_tier === tier;
			const okR = role === 'all' || (u.app_roles || []).includes(role);
			return okQ && okT && okR;
		});
	}, [users, query, tier, role]);

	const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
	const safePage = Math.min(Math.max(1, page), totalPages);
	const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

	if (!isSuper) {
		return (
			<div className="p-6">
				<div className="text-center text-[var(--color-text-secondary)] border border-[var(--color-divider-gray)] rounded-lg p-6">
					<p>Users Manager is restricted to super admins.</p>
				</div>
			</div>
		);
	}

	return (
		<>
		<div className="grid grid-cols-4 gap-6">
			{/* Sidebar */}
			<aside className="lg:col-span-1 space-y-4">
				<div className="tile">
					<div className="tile-header flex items-center gap-2">
						<Users className="h-4 w-4 icon-primary" />
						<h3 className="font-semibold text-[var(--color-text-primary)]">Filters</h3>
					</div>
					<div className="tile-body space-y-3">
						<div>
							<label className="text-xs text-[var(--color-text-secondary)]">Search</label>
							<div className="flex items-center gap-2 mt-1">
								<div className="p-2 rounded border border-[var(--color-divider-gray)] bg-[var(--color-background-default)]">
									<Search className="h-4 w-4 icon-muted" />
								</div>
								<input className="input flex-1" placeholder="Name, email, role..." value={query} onChange={(e)=>{ setQuery(e.target.value); setPage(1); }} />
							</div>
						</div>
						<div>
							<label className="text-xs text-[var(--color-text-secondary)]">Tier</label>
							<select className="input mt-1 w-full" value={tier} onChange={(e)=>{ setTier(e.target.value as any); setPage(1); }}>
								<option value="all">All</option>
								<option value="free">Free</option>
								<option value="paid">Paid</option>
								<option value="academic">Academic</option>
								<option value="enterprise">Enterprise</option>
							</select>
						</div>
						<div>
							<label className="text-xs text-[var(--color-text-secondary)]">App Role</label>
							<select className="input mt-1 w-full" value={role} onChange={(e)=>{ setRole(e.target.value as any); setPage(1); }}>
								<option value="all">All</option>
								<option value="super_admin">Super Admin</option>
								<option value="blog_admin">Blog Admin</option>
								<option value="content_editor">Content Editor</option>
								<option value="ads_admin">Ads Admin</option>
							</select>
						</div>
					<div className="flex gap-2">
						<button className="btn-outline px-3 py-2 rounded w-full" onClick={()=>{ const seeded = seedDemoUsers(); saveUsers(seeded); setPage(1); }}>Re-seed demo accounts</button>
					</div>
						<div className="flex gap-2">
							<button className="btn-outline px-3 py-2 rounded w-full" onClick={()=>{ setQuery(''); setTier('all'); setRole('all'); setPage(1); }}>Reset</button>
						</div>
					</div>
				</div>

				<div className="tile">
					<div className="tile-header"><h3 className="font-semibold text-[var(--color-text-primary)]">Bulk</h3></div>
					<div className="tile-body space-y-2">
						<button className="btn-outline w-full px-3 py-2 rounded flex items-center gap-2" onClick={()=>{ try { navigator.clipboard.writeText(JSON.stringify(users, null, 2)); } catch {} }}><Download className="h-4 w-4"/> Export JSON</button>
						<button className="btn-outline w-full px-3 py-2 rounded flex items-center gap-2" onClick={()=>{ setPromptModal({ isOpen: true, title: 'Import Users', message: 'Paste the JSON data for users:', placeholder: 'Paste JSON here...', onConfirm: (pasted) => { setPromptModal(prev => ({ ...prev, isOpen: false })); if (!pasted) return; try { const arr = JSON.parse(pasted) as ManagedUser[]; saveUsers(arr); setAlertModal({ isOpen: true, title: 'Success', message: `${arr.length} user(s) imported successfully`, variant: 'success' }); } catch { setAlertModal({ isOpen: true, title: 'Error', message: 'Invalid JSON format', variant: 'error' }); } } }); }}><Upload className="h-4 w-4"/> Import JSON</button>
					</div>
				</div>
			</aside>

			{/* Main */}
			<section className="lg:col-span-3 space-y-4">
				<div className="tile">
					<div className="tile-header flex items-center gap-2">
						<h3 className="font-semibold text-[var(--color-text-primary)]">Users</h3>
						<span className="text-xs text-[var(--color-text-secondary)]">{filtered.length} results</span>
						<button className="ml-auto btn-primary px-3 py-2 rounded flex items-center gap-2" onClick={()=> setEditing(defaultUser())}><Plus className="h-4 w-4"/> New User</button>
					</div>
					<div className="tile-body">
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead>
									<tr className="text-left text-[var(--color-text-secondary)]">
										<th className="py-2 pr-3">Name</th>
										<th className="py-2 pr-3">Email</th>
										<th className="py-2 pr-3">Type</th>
										<th className="py-2 pr-3">Tier</th>
										<th className="py-2 pr-3">Roles</th>
										<th className="py-2 pr-3">Admin</th>
										<th className="py-2 pr-3">Actions</th>
									</tr>
								</thead>
								<tbody>
									{pageItems.map(u => (
										<tr key={u.id} className="border-t border-[var(--color-divider-gray)]">
											<td className="py-2 pr-3 font-medium text-[var(--color-text-primary)]">{u.full_name}</td>
											<td className="py-2 pr-3 flex items-center gap-2 text-[var(--color-text-secondary)]"><Mail className="h-4 w-4"/>{u.email}</td>
											<td className="py-2 pr-3">{u.user_type}</td>
											<td className="py-2 pr-3">
												<select className="input py-1 px-2 text-xs" value={u.account_tier} onChange={(e)=>{ const next=users.map(x=>x.id===u.id?{...x, account_tier: e.target.value as AccountTier}:x); saveUsers(next); }}>
													<option value="free">free</option>
													<option value="paid">paid</option>
													<option value="academic">academic</option>
													<option value="enterprise">enterprise</option>
												</select>
											</td>
											<td className="py-2 pr-3">
												<div className="flex flex-wrap gap-1">
													{(['super_admin','blog_admin','content_editor','ads_admin'] as AppRole[]).map(r => (
														<label key={r} className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded border border-[var(--color-divider-gray)] bg-[var(--color-background-default)]">
															<input type="checkbox" checked={u.app_roles.includes(r)} onChange={(e)=>{ const has=e.target.checked; const next=users.map(x=>x.id===u.id?{...x, app_roles: has? Array.from(new Set([...x.app_roles, r])): x.app_roles.filter(a=>a!==r)}:x); saveUsers(next); }} />
															<span>{r}</span>
														</label>
													))}
												</div>
											</td>
											<td className="py-2 pr-3">
												<label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={!!u.is_admin} onChange={(e)=>{ const next=users.map(x=>x.id===u.id?{...x, is_admin: e.target.checked}:x); saveUsers(next); }} /><Shield className="h-4 w-4"/></label>
											</td>
											<td className="py-2 pr-3">
												<div className="flex items-center gap-2">
													<button className="btn-outline px-2 py-1 rounded" onClick={()=> setEditing(u)}><Pencil className="h-4 w-4"/></button>
													<button className="btn-outline px-2 py-1 rounded" onClick={()=>{ setConfirmModal({ isOpen: true, title: 'Delete User', message: `Are you sure you want to delete "${u.full_name}"? This action cannot be undone.`, variant: 'danger', onConfirm: () => { saveUsers(users.filter(x=>x.id!==u.id)); setConfirmModal(prev => ({ ...prev, isOpen: false })); } }); }}><Trash2 className="h-4 w-4"/></button>
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

			{/* Editor Modal */}
			{editing && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<div className="absolute inset-0 bg-black/40" onClick={()=> setEditing(null)} />
					<div className="relative bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] rounded-xl w-full max-w-3xl p-5">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{editing.id ? 'Edit User' : 'New User'}</h3>
							<button className="btn-outline px-2 py-1 rounded" onClick={()=> setEditing(null)}>Close</button>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<input className="input" placeholder="Full name" value={editing.full_name} onChange={e=> setEditing(prev => prev? { ...prev, full_name: e.target.value } : prev)} />
							<input className="input" placeholder="Email" value={editing.email} onChange={e=> setEditing(prev => prev? { ...prev, email: e.target.value } : prev)} />
							<input className="input" placeholder="User type" value={editing.user_type} onChange={e=> setEditing(prev => prev? { ...prev, user_type: e.target.value } : prev)} />
							<select className="input" value={editing.account_tier} onChange={e=> setEditing(prev => prev? { ...prev, account_tier: e.target.value as AccountTier } : prev)}>
								<option value="free">Free</option>
								<option value="paid">Paid</option>
								<option value="academic">Academic</option>
								<option value="enterprise">Enterprise</option>
							</select>
							<label className="text-sm md:col-span-2">App roles</label>
							<div className="md:col-span-2 flex flex-wrap gap-2">
								{(['super_admin','blog_admin','content_editor','ads_admin'] as AppRole[]).map(r => (
									<label key={r} className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded border border-[var(--color-divider-gray)] bg-[var(--color-background-default)]">
										<input type="checkbox" checked={editing.app_roles.includes(r)} onChange={(e)=> setEditing(prev => prev? { ...prev, app_roles: e.target.checked ? Array.from(new Set([...prev.app_roles, r])) : prev.app_roles.filter(a=>a!==r) } : prev)} />
										<span>{r}</span>
									</label>
								))}
							</div>
							<label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={!!editing.is_admin} onChange={(e)=> setEditing(prev => prev? { ...prev, is_admin: e.target.checked } : prev)} /> Super admin</label>
							<div className="md:col-span-2 flex items-center justify-end gap-2">
								<button className="btn-outline px-3 py-2 rounded" onClick={()=> setEditing(null)}>Cancel</button>
								<button className="btn-primary px-3 py-2 rounded flex items-center gap-2" onClick={()=>{
									const exists = users.some(u=>u.id===editing.id);
									const next = exists ? users.map(u => u.id===editing.id ? editing : u) : [...users, { ...editing, id: 'u-'+Date.now() }];
									saveUsers(next);
									setEditing(null);
								}}><Save className="h-4 w-4"/> Save</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
		
		<ConfirmModal
			isOpen={confirmModal.isOpen}
			onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
			onConfirm={confirmModal.onConfirm}
			title={confirmModal.title}
			message={confirmModal.message}
			variant={confirmModal.variant}
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
	</>
	);
};

export default UsersManagerDashboard; 