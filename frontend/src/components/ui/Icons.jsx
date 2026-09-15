const Icon = ({ children, className = 'h-5 w-5', strokeWidth = 1.6, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
    {children}
  </svg>
);

export const SearchIcon = (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>;
export const HeartIcon = ({ filled, ...p }) => <Icon {...p} fill={filled ? 'currentColor' : 'none'}><path d="M19.5 12.6 12 20l-7.5-7.4A4.8 4.8 0 0 1 12 6.3a4.8 4.8 0 0 1 7.5 6.3Z" /></Icon>;
export const BagIcon = (p) => <Icon {...p}><path d="M6 7h12l1 13H5L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" /></Icon>;
export const UserIcon = (p) => <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>;
export const MenuIcon = (p) => <Icon {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>;
export const CloseIcon = (p) => <Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>;
export const ChevronDown = (p) => <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>;
export const ChevronRight = (p) => <Icon {...p}><path d="m9 6 6 6-6 6" /></Icon>;
export const ChevronLeft = (p) => <Icon {...p}><path d="m15 6-6 6 6 6" /></Icon>;
export const FilterIcon = (p) => <Icon {...p}><path d="M4 6h16M7 12h10M10 18h4" /></Icon>;
export const TrashIcon = (p) => <Icon {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Icon>;
export const StarIcon = ({ filled, ...p }) => <Icon {...p} fill={filled ? 'currentColor' : 'none'}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></Icon>;
export const TruckIcon = (p) => <Icon {...p}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></Icon>;
export const ShieldIcon = (p) => <Icon {...p}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></Icon>;
export const RefreshIcon = (p) => <Icon {...p}><path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4" /></Icon>;
export const GemIcon = (p) => <Icon {...p}><path d="M6 3h12l3 6-9 12L3 9l3-6Z" /><path d="M3 9h18M12 21 8 9l4-6 4 6-4 12" /></Icon>;
export const CheckIcon = (p) => <Icon {...p}><path d="m5 12 5 5L20 7" /></Icon>;
export const PlusIcon = (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;
export const MinusIcon = (p) => <Icon {...p}><path d="M5 12h14" /></Icon>;
export const TagIcon = (p) => <Icon {...p}><path d="M3 12V3h9l9 9-9 9-9-9Z" /><circle cx="7.5" cy="7.5" r="1.5" /></Icon>;
export const LogoutIcon = (p) => <Icon {...p}><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" /></Icon>;
export const MapPinIcon = (p) => <Icon {...p}><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.5" /></Icon>;
export const PackageIcon = (p) => <Icon {...p}><path d="m3 7 9-4 9 4v10l-9 4-9-4V7Z" /><path d="m3 7 9 4 9-4M12 11v10" /></Icon>;
