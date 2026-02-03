import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  // Sidebar collapse state
  isCollapsed: boolean;
  isHoverExpanded: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
  setHoverExpanded: (expanded: boolean) => void;
  // Category filter (for future use)
  currentCategory: string | undefined;
  setCurrentCategory: (category: string | undefined) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      // Sidebar collapse
      isCollapsed: false,
      isHoverExpanded: false,
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setHoverExpanded: (expanded) => set({ isHoverExpanded: expanded }),
      // Category
      currentCategory: undefined,
      setCurrentCategory: (category) => set({ currentCategory: category }),
    }),
    {
      name: 'sidebar-storage',
    }
  )
);

// Optimized selectors - prevent unnecessary re-renders
export const useIsCollapsed = () => useSidebarStore((s) => s.isCollapsed);
export const useIsHoverExpanded = () => useSidebarStore((s) => s.isHoverExpanded);
export const useCurrentCategory = () => useSidebarStore((s) => s.currentCategory);
export const useSidebarActions = () =>
  useSidebarStore((s) => ({
    setCollapsed: s.setCollapsed,
    toggle: s.toggle,
    setHoverExpanded: s.setHoverExpanded,
    setCurrentCategory: s.setCurrentCategory,
  }));

// Computed: true if sidebar appears expanded (either not collapsed or hover expanded)
export const useIsSidebarExpanded = () =>
  useSidebarStore((s) => !s.isCollapsed || s.isHoverExpanded);

export default useSidebarStore;
