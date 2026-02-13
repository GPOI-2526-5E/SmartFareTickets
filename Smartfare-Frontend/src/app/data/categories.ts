export interface Category {
  id: string;
  name: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  {
    id: 'parks',
    name: 'Parchi',
    icon: 'bi-tree',
  },
  {
    id: 'fligts',
    name: 'Voli',
    icon: 'bi-airplane',
  },
  {
    id: 'trains',
    name: 'Treni',
    icon: 'bi-train-front',
  }
];
