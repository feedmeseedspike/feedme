export async function sendWhatsAppText(to: string, message: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN!;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const resp = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { preview_url: false, body: message },
    }),
  });
  if (!resp.ok) {
    throw new Error(`WhatsApp send error: ${await resp.text()}`);
  }
}

export async function sendWhatsAppTemplate(
  to: string,
  name: string,
  lang: string = "en",
  components?: any[]
) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN!;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const resp = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name,
        language: { code: lang },
        ...(components && { components }),
      },
    }),
  });
  if (!resp.ok) {
    throw new Error(`WhatsApp template send error: ${await resp.text()}`);
  }
}
