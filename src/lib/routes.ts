export type ProfileSlug = 'startup' | 'investor' | 'executive' | 'researcher' | 'admin' | 'regulator';

export function getProfileSlugFromRole(role: string): ProfileSlug {
  const r = (role || '').toLowerCase();
  if (r === 'admin') return 'admin';
  if (r === 'investor' || r === 'investors_finance') return 'investor';
  if (r === 'startup') return 'startup';
  if (r === 'researcher' || r === 'health_science_experts') return 'researcher';
  if (r === 'regulator') return 'regulator';
  if (r === 'industry_executives' || r === 'executive') return 'executive';
  return 'startup';
}

export function legacyPageForProfile(slug: ProfileSlug): string {
  switch (slug) {
    case 'admin': return 'admin-dashboard';
    case 'investor': return 'investors';
    case 'startup': return 'startup-dashboard';
    case 'researcher': return 'researcher-profile';
    case 'executive': return 'executive-profile';
    case 'regulator': return 'regulator-dashboard';
    default: return 'startup-dashboard';
  }
}

export function isModulePage(page: string): boolean {
  const set = new Set([
    'companies','deals','grants','clinical-trials','nationpulse','glossary','investors','public-markets','regulatory','regulatory-ecosystem','clinical-centers','investigators','fundraising-crm','investor-search','startup-analytics','ai-tools','settings','executive-profile','researcher-profile'
  ]);
  return set.has(page);
}

export function isDashboardPage(page: string): boolean {
  const set = new Set([
    'startup-dashboard','admin-dashboard','ads-manager-dashboard','blog-manager-dashboard','users-manager-dashboard'
  ]);
  return set.has(page);
}

export function parseHashToPage(hash: string): string | null {
  const h = (hash || '').replace(/^#\//, '').trim();
  if (!h) return null;
  if (h.startsWith('profile/')) {
    const slug = h.split('/')[1] as ProfileSlug;
    return legacyPageForProfile(slug);
  }
  if (h.startsWith('module/')) {
    return h.split('/')[1] || null;
  }
  // Back-compat: direct keys
  return h;
}

export function makeHashForPage(page: string): string {
  // If page is a legacy dashboard/profile, convert to profile slug URL
  if (isDashboardPage(page)) {
    switch (page) {
      case 'admin-dashboard': return '#/profile/admin';
      case 'startup-dashboard': return '#/profile/startup';
      case 'ads-manager-dashboard': return '#/profile/admin';
      case 'blog-manager-dashboard': return '#/profile/admin';
      case 'users-manager-dashboard': return '#/profile/admin';
    }
  }
  if (page === 'executive-profile') return '#/profile/executive';
  if (page === 'researcher-profile') return '#/profile/researcher';
  if (page === 'regulator-profile') return '#/profile/regulator';
  if (page === 'regulator-dashboard') return '#/profile/regulator';
  if (page === 'investors') return '#/profile/investor';

  // Modules default
  return `#/module/${page}`;
}


// New: path-based routing helpers
export function parsePathToPage(pathname: string, search?: string): string | null {
  const p = (pathname || '/').replace(/^\/+/, '/');
  if (p === '/' || p === '') return 'home';
  if (p.startsWith('/profile/')) {
    const slug = p.split('/')[2] as ProfileSlug;
    return legacyPageForProfile(slug);
  }
  if (p.startsWith('/module/')) {
    return p.split('/')[2] || null;
  }
  // direct named pages
  const direct = p.replace(/^\//, '');
  // Special mapping for admin route
  if (direct === 'admin') return 'admin-dashboard';
  return direct || null;
}

export function makePathForPage(page: string): string {
  if (isDashboardPage(page)) {
    switch (page) {
      case 'admin-dashboard': return '/profile/admin';
      case 'startup-dashboard': return '/profile/startup';
      case 'ads-manager-dashboard': return '/profile/admin';
      case 'blog-manager-dashboard': return '/profile/admin';
      case 'users-manager-dashboard': return '/profile/admin';
    }
  }
  if (page === 'executive-profile') return '/profile/executive';
  if (page === 'researcher-profile') return '/profile/researcher';
  if (page === 'regulator-profile') return '/profile/regulator';
  if (page === 'regulator-dashboard') return '/profile/regulator';
  if (page === 'investors') return '/profile/investor';
  if (page === 'home') return '/';
  return `/module/${page}`;
}

