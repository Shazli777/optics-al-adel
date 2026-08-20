import { describe, expect, it } from "vitest";
import { createWhatsAppLink } from "./whatsapp";

describe("WhatsApp ordering links", () => {
  it("creates a WhatsApp order URL from an international number and Arabic message", () => {
    expect(createWhatsAppLink("+966 50 000 0000", "أرغب بطلب فريم ذهبي.", "#contact")).toBe("https://wa.me/966500000000?text=%D8%A3%D8%B1%D8%BA%D8%A8%20%D8%A8%D8%B7%D9%84%D8%A8%20%D9%81%D8%B1%D9%8A%D9%85%20%D8%B0%D9%87%D8%A8%D9%8A.");
  });

  it("uses the configured fallback when no usable WhatsApp number exists", () => {
    expect(createWhatsAppLink("0500", "رسالة", "#contact")).toBe("#contact");
  });
});
