import { SacramentType } from '../types/records';

export interface ImportColumn {
  key: string;     // header with only lowercase letters, e.g. "Reg No" -> "regno"
  header: string;  // what the person sees and what the template contains
  required?: boolean;
}
export const importColumns: Partial<Record<SacramentType, ImportColumn[]>> = {
  baptism: [
    { key: 'regno', header: 'Reg No', required: true },
    { key: 'dateofbaptism', header: 'Date of baptism', required: true },
    { key: 'christianname', header: 'Christian name', required: true },
    { key: 'surname', header: 'Surname', required: true },
    { key: 'dateofbirth', header: 'Date of birth' },
    { key: 'father', header: 'Father' },
    { key: 'mother', header: 'Mother' },
    { key: 'godparent', header: 'Godparent' },
    { key: 'residence', header: 'Residence' },
    { key: 'minister', header: 'Minister' },
    { key: 'phone', header: 'Phone' },
    { key: 'parish', header: 'Parish' },
  ],
  conversion: [
  { key: 'regno', header: 'Reg No', required: true },
  { key: 'dateofbaptism', header: 'Date of baptism', required: true },
  { key: 'christianname', header: 'Christian name', required: true },
  { key: 'surname', header: 'Surname', required: true },
  { key: 'dateofbirth', header: 'Date of birth' },
  { key: 'father', header: 'Father' },
  { key: 'mother', header: 'Mother' },
  { key: 'godparent', header: 'Godparent' },
  { key: 'residence', header: 'Residence' },
  { key: 'minister', header: 'Minister' },
  { key: 'phone', header: 'Phone' },
  { key: 'parish', header: 'Parish' },
  { key: 'previousreligion', header: 'Previous religion' },
],
  communion: [
    { key: 'regno', header: 'Reg No', required: true },
    { key: 'name', header: 'Name' },
    { key: 'date', header: 'Date', required: true },
    { key: 'minister', header: 'Minister' },
    { key: 'parish', header: 'Parish' },
  ],
  confirmation: [
    { key: 'regno', header: 'Reg No', required: true },
    { key: 'name', header: 'Name' },
    { key: 'date', header: 'Date', required: true },
    { key: 'minister', header: 'Minister' },
    { key: 'parish', header: 'Parish' },
  ],
  matrimony: [
    { key: 'regno', header: 'Reg No', required: true },
    { key: 'name', header: 'Name' },
    { key: 'spouse', header: 'Spouse' },
    { key: 'date', header: 'Date', required: true },
    { key: 'minister', header: 'Minister' },
    { key: 'parish', header: 'Parish' },
  ],
};