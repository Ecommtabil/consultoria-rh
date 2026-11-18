import { describe, it, expect } from 'vitest';
import { mascaraCnpj, validarCnpj } from '@/lib/cnpj';
describe('CNPJ', () => {
  it('valida numérico', () => { expect(validarCnpj('11.222.333/0001-81')).toBe(true); expect(validarCnpj('11.222.333/0001-82')).toBe(false); });
  it('valida alfanumérico (exemplo RFB)', () => expect(validarCnpj('12.ABC.345/01DE-35')).toBe(true));
  it('aplica máscara', () => expect(mascaraCnpj('12abc34501de35')).toBe('12.ABC.345/01DE-35'));
});
