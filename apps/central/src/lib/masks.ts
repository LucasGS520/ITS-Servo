/**
 * Formata uma string de CPF com máscara visual
 *- String contendo os dígitos do CPF
 * CPF formatado no padrão XXX.XXX.XXX-XX
 */
export function maskCPF(value: string): string {
  return value
    .replace(/\D/g, "") // Remove caracteres não numéricos
    .slice(0, 11) // Limita a 11 dígitos
    .replace(/(\d{3})(\d)/, "$1.$2") // Adiciona primeiro ponto
    .replace(/(\d{3})(\d)/, "$1.$2") // Adiciona segundo ponto
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2"); // Adiciona hífen
}

/**
 * Formata uma string de telefone com máscara visual
 * - String contendo os dígitos do telefone
 *Telefone formatado no padrão (XX) XXXXX-XXXX
 */
export function maskPhone(value: string): string {
  return value
    .replace(/\D/g, "") // Remove caracteres não numéricos
    .slice(0, 11) // Limita a 11 dígitos
    .replace(/(\d{2})(\d)/, "($1) $2") // Adiciona parênteses
    .replace(/(\d{5})(\d)/, "$1-$2"); // Adiciona hífen
}

/**
 * Valida um CPF usando o algoritmo de dígitos verificadores
 * - String contendo o CPF a ser validado
 * true se o CPF é válido, false caso contrário
 */
export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  
  // Verifica se tem 11 dígitos
  if (digits.length !== 11) return false;
  
  // Rejeita CPFs com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // Calcula primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(digits[9])) return false;

  // Calcula segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(digits[10]);
}

/**
 * Remove todos os caracteres não numéricos de uma string
 * - String contendo caracteres a serem removidos
 * String contendo apenas dígitos
 */
export function unmask(value: string): string {
  return value.replace(/\D/g, "");
}
