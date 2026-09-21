export const CATEGORIES = [
  { key: 'TODAS', label: 'Todas' },
  { key: 'BEBIDAS', label: 'Bebidas' },
  { key: 'SNACKS', label: 'Snacks & Mecato' },
  { key: 'ASEO', label: 'Aseo Personal' },
  { key: 'TIENDA', label: 'Tienda General' },
  { key: 'LENCERIA', label: 'Lencería y Blancos' },
  { key: 'OTROS', label: 'Otros' }
];

export type ProductFormData = {
  name: string;
  category: string;
  price: number | '';
  description: string;
  quantity: number | '';
  minStock: number | '';
  location: string;
};

export const INITIAL_FORM: ProductFormData = {
  name: '',
  category: 'BEBIDAS',
  price: '',
  description: '',
  quantity: 0,
  minStock: 5,
  location: ''
};

export type StockFilter = 'ALL' | 'NORMAL' | 'LOW' | 'OUT';