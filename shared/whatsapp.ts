export function createWhatsAppLink(number: string, message: string, fallback: string) {
  const normalizedNumber = number.replace(/\D/g, "");
  return normalizedNumber.length >= 7 ? `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}` : fallback;
}
