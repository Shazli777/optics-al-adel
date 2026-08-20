import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_CONTENT, DEFAULT_TEXT_COLORS, siteContentSchema } from "./siteContent";

describe("site content schema", () => {
  it("accepts the complete default content configuration", () => {
    expect(siteContentSchema.parse(DEFAULT_SITE_CONTENT)).toMatchObject({
      branding: { name: "بصريات العادل", primaryColor: "#F28C1B" },
      hero: { mediaKind: "image" },
      textColors: { heroTitleAccent: DEFAULT_TEXT_COLORS.heroTitleAccent },
    });
  });

  it("rejects an invalid theme color", () => {
    const invalid = structuredClone(DEFAULT_SITE_CONTENT);
    invalid.branding.primaryColor = "orange";
    expect(siteContentSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects an invalid individual text color while accepting independent color changes", () => {
    const customized = structuredClone(DEFAULT_SITE_CONTENT);
    customized.textColors.heroTitleStart = "#113355";
    expect(siteContentSchema.safeParse(customized).success).toBe(true);
    customized.textColors.heroTitleStart = "blue";
    expect(siteContentSchema.safeParse(customized).success).toBe(false);
  });

  it("supplies default text colors to legacy saved content", () => {
    const legacy = structuredClone(DEFAULT_SITE_CONTENT);
    delete (legacy as Partial<typeof legacy>).textColors;
    const parsed = siteContentSchema.parse(legacy);
    expect(parsed.textColors.heroTitleAccent).toBe(DEFAULT_TEXT_COLORS.heroTitleAccent);
  });

  it("persists independent section button colors", () => {
    const customized = structuredClone(DEFAULT_SITE_CONTENT);
    customized.textColors.collectionAction = "#AA3300";
    customized.textColors.offerAction = "#004477";
    const parsed = siteContentSchema.parse(customized);
    expect(parsed.textColors).toMatchObject({ collectionAction: "#AA3300", offerAction: "#004477" });
  });

  it("supports frame filters and WhatsApp ordering while preserving legacy content", () => {
    const legacy = structuredClone(DEFAULT_SITE_CONTENT);
    delete (legacy.collection.items[0] as Partial<typeof legacy.collection.items[number]>).frameType;
    delete (legacy.collection.items[0] as Partial<typeof legacy.collection.items[number]>).frameColor;
    delete (legacy.collection.items[0] as Partial<typeof legacy.collection.items[number]>).whatsappMessage;
    delete (legacy.contact as Partial<typeof legacy.contact>).whatsappNumber;
    const parsedLegacy = siteContentSchema.parse(legacy);
    expect(parsedLegacy.collection.items[0]).toMatchObject({ frameType: "طبي", frameColor: "محايد", whatsappMessage: "" });
    expect(parsedLegacy.contact.whatsappNumber).toBe("");

    const customized = structuredClone(DEFAULT_SITE_CONTENT);
    customized.collection.items[0].frameType = "شمسي";
    customized.collection.items[0].frameColor = "ذهبي";
    customized.collection.items[0].whatsappMessage = "أرغب بطلب هذا الفريم الذهبي.";
    customized.contact.whatsappNumber = "966500000000";
    expect(siteContentSchema.parse(customized)).toMatchObject({
      collection: { items: expect.arrayContaining([expect.objectContaining({ frameType: "شمسي", frameColor: "ذهبي", whatsappMessage: "أرغب بطلب هذا الفريم الذهبي." })]) },
      contact: { whatsappNumber: "966500000000" },
    });
  });
});
