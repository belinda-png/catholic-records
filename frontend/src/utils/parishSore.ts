import { Parish } from '../types/records';

let current: Parish[] = [];
export const setParishStore = (p: Parish[]) => { current = p; };
export const getParishStore = () => current;