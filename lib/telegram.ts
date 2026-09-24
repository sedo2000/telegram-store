const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error(
    "TELEGRAM_BOT_TOKEN is missing"
  );
}

const API_URL =
  `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function telegram<T = any>(
  method: string,
  params?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(
    `${API_URL}/${method}`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify(
        params || {}
      ),
      cache: "no-store"
    }
  );

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(
      data?.description ||
        `Telegram API error: ${method}`
    );
  }

  return data.result as T;
}

export async function getMe() {
  return telegram("getMe");
}

export async function getChat(
  chatId: string | number
) {
  return telegram("getChat", {
    chat_id: chatId
  });
}

export async function sendMessage(
  chatId: string | number,
  text: string
) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text
  });
}

export async function setWebhook(
  url: string,
  secretToken?: string
) {
  return telegram("setWebhook", {
    url,
    ...(secretToken
      ? {
          secret_token: secretToken
        }
      : {})
  });
}

export async function deleteWebhook() {
  return telegram("deleteWebhook");
}

export async function getWebhookInfo() {
  return telegram(
    "getWebhookInfo"
  );
}
