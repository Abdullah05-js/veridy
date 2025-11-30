export const DATA_CATEGORIES = [
  { id: 'images', label: 'IMAGES', icon: '🖼️' },
  { id: 'videos', label: 'VIDEOS', icon: '🎥' },
  { id: 'documents', label: 'DOCUMENTS', icon: '📄' },
  { id: 'audio', label: 'AUDIO', icon: '🎵' },
  { id: '3d-models', label: '3D MODELS', icon: '🗿' },
  { id: 'datasets', label: 'DATASETS', icon: '📊' },
  { id: 'code', label: 'CODE', icon: '💻' },
  { id: 'other', label: 'OTHER', icon: '📦' },
] as const;

export type DataCategory = typeof DATA_CATEGORIES[number]['id'];

