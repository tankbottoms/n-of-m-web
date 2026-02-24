export type LayoutType = 'full-page';

export interface LayoutConfig {
  label: string;
  description: string;
  cardsPerPage: number;
  cardWidth: string;
  cardHeight: string;
  qrSize: number;
  orientation: 'portrait' | 'landscape';
  fontSize: number;
}

export const LAYOUTS: Record<LayoutType, LayoutConfig> = {
  'full-page': {
    label: 'Full Page',
    description: 'One share card per page with large, highly scannable QR code',
    cardsPerPage: 1,
    cardWidth: '100%',
    cardHeight: '100%',
    qrSize: 252, // 150% enlarged for mobile/desktop scanning reliability
    orientation: 'portrait',
    fontSize: 11,
  },
};
