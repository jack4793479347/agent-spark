'use client';

import { create } from 'zustand';

type SidebarSection = 'browse' | 'workspace' | 'creator';

interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
  expandedSections: Set<SidebarSection>;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  toggleSection: (section: SidebarSection) => void;
  expandSection: (section: SidebarSection) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,
  mobileOpen: false,
  expandedSections: new Set<SidebarSection>(['browse', 'workspace']),
  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
  setMobileOpen: (mobileOpen) => set({ mobileOpen }),
  toggleSection: (section) =>
    set((s) => {
      const next = new Set(s.expandedSections);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return { expandedSections: next };
    }),
  expandSection: (section) =>
    set((s) => {
      if (s.expandedSections.has(section)) return s;
      const next = new Set(s.expandedSections);
      next.add(section);
      return { expandedSections: next };
    }),
}));
