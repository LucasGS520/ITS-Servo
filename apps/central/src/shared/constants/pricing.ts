export const PRICING = {
  MATRICULA: 40,
  MATERIAL: 150,
  get TOTAL() { return this.MATRICULA + this.MATERIAL; },
} as const;
