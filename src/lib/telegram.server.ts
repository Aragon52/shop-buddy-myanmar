const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

export type TelegramSendResult = { ok: true } | { ok: false; error: string };

/**
 * Sends a Telegram message to the seller.
 * Works either through the Lovable Telegram connector or, as a fallback,
 * with a bot token stored as TELEGRAM_BOT_TOKEN.
 */
export const sendTelegramMessage = async (
  chatId: string,
  text: string,
): Promise<TelegramSendResult> => {
  if (!chatId) return { ok: false, error: "No Telegram chat is connected yet." };

  const lovableApiKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["TELEGRAM_API_KEY"];
  const botToken = process.env["TELEGRAM_BOT_TOKEN"];

  const body = JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true });

  let response: Response;
  if (lovableApiKey && connectionKey) {
    response = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "X-Connection-Api-Key": connectionKey,
        "Content-Type": "application/json",
      },
      body,
    });
  } else if (botToken) {
    response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } else {
    return { ok: false, error: "Telegram is not connected for this app yet." };
  }

  const payload = (await response.json().catch(() => null)) as {
    ok?: boolean;
    description?: string;
  } | null;

  if (!response.ok || payload?.ok === false) {
    return {
      ok: false,
      error: payload?.description ?? `Telegram request failed [${response.status}]`,
    };
  }

  return { ok: true };
};
