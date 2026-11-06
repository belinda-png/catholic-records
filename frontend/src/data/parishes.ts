// import { Parish } from '../types/records';

// export const parishes: Parish[] = [
// { id: 'holy-family-tororo', name: 'Holy Family Parish, Tororo', deanery: 'Tororo Deanery' },
// { id: 'st-peter-nagongera', name: "St. Peter's Parish, Nagongera", deanery: 'Tororo Deanery' },
// { id: 'our-lady-busia', name: 'Our Lady of Lourdes, Busia', deanery: 'Busia Deanery' },
// { id: 'st-jude-mulanda', name: 'St. Jude Thaddeus, Mulanda', deanery: 'Tororo Deanery' },
// { id: 'sacred-heart-budaka', name: 'Sacred Heart Parish, Budaka', deanery: 'Budaka Deanery' },
// { id: 'st-mary-kidoko', name: "St. Mary's Parish, Kidoko", deanery: 'Tororo Deanery' },
// { id: 'st-joseph-pallisa', name: "St. Joseph's Parish, Pallisa", deanery: 'Pallisa Deanery' }];
import { getParishStore } from './parishStore';
export function parishName(id: string): string {
  return getParishStore().find((p) => p.id === id)?.name ?? '—';
}