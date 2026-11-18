/** CNPJ alfanumérico (IN RFB 2.229/2024): 12 caracteres A–Z/0–9 + 2 dígitos verificadores. */
export function limparCnpj(v: string) { return v.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 14); }
export function mascaraCnpj(v: string) {
  const s = limparCnpj(v); const p = [s.slice(0, 2), s.slice(2, 5), s.slice(5, 8), s.slice(8, 12), s.slice(12, 14)];
  let out = p[0]!; if (p[1]) out += `.${p[1]}`; if (p[2]) out += `.${p[2]}`; if (p[3]) out += `/${p[3]}`; if (p[4]) out += `-${p[4]}`; return out;
}
function dv(base: string) {
  let soma = 0; let peso = 2;
  for (let i = base.length - 1; i >= 0; i--) { soma += (base.charCodeAt(i) - 48) * peso; peso = peso === 9 ? 2 : peso + 1; }
  const r = soma % 11; return r < 2 ? 0 : 11 - r;
}
export function validarCnpj(v: string): boolean {
  const s = limparCnpj(v); if (!/^[0-9A-Z]{12}\d{2}$/.test(s) || /^(\d)\1{13}$/.test(s)) return false;
  const d1 = dv(s.slice(0, 12)); const d2 = dv(s.slice(0, 12) + d1); return s.slice(12) === `${d1}${d2}`;
}
