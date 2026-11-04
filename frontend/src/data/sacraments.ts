import { SacramentConfig } from '../types/records';

export const sacraments: SacramentConfig[] = [
{
  type: 'baptism',
  label: 'Baptism',
  plural: 'Baptisms',
  short: 'BAP',
  description: 'Record a new baptism in the parish register.',
  ministerLabel: 'Baptising minister',
  sponsorsLabel: 'Godparents',
  sponsorsPlaceholder: 'e.g. Paul Oketcho, Jane Adikin',
  tone: 'gold',
  extraFields: [{ key: 'place', label: 'Church / place of baptism', placeholder: 'e.g. Holy Family Church' }]
},
{
  type: 'communion',
  label: 'First Holy Communion',
  plural: 'First Holy Communion',
  short: 'FHC',
  description: 'Record a first reception of the Holy Eucharist.',
  ministerLabel: 'Celebrant',
  sponsorsLabel: 'Catechist',
  sponsorsPlaceholder: 'e.g. Catechist Martin Owino',
  tone: 'sage',
  extraFields: [{ key: 'class', label: 'Catechism class', placeholder: 'e.g. 2026 Easter class' }]
},
{
  type: 'confirmation',
  label: 'Confirmation',
  plural: 'Confirmations',
  short: 'CNF',
  description: 'Record the sacrament of confirmation.',
  ministerLabel: 'Confirming bishop',
  sponsorsLabel: 'Sponsor',
  sponsorsPlaceholder: 'e.g. Margaret Akumu',
  tone: 'sage',
  extraFields: [{ key: 'confirmationName', label: 'Confirmation name', placeholder: 'e.g. Joseph' }]
},
{
  type: 'matrimony',
  label: 'Holy Matrimony',
  plural: 'Matrimonies',
  short: 'MAT',
  description: 'Record a marriage and link both spouses.',
  ministerLabel: 'Officiating priest',
  sponsorsLabel: 'Witnesses',
  sponsorsPlaceholder: 'e.g. Simon Opio, Lucy Nekesa',
  tone: 'gold',
  extraFields: [{ key: 'marriageRegNo', label: 'Marriage Reg. No.', placeholder: 'e.g. 0019' }]
}];