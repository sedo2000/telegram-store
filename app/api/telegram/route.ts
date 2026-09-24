import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

type TelegramMessage = {
  message_id: number;
  chat?: {
    id: number;
    username?: string;
    title?: string;
  };
  text?: string;
  caption?: string;
  photo?: {
    file_id: string;
  }[];
};

type TelegramUpdate = {
  message?: TelegramMessage;
  channel_post?: TelegramMessage;
};

function extractPrice(text: string): number | null {
  const match = text.match(
    /(?:السعر|سعر|price)\s*[:：]?\s*([\d٠-٩٬,.\s]+)/
  );

  if (!match) return null;

  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  const normalized = match[1]
    .replace(/[٠-٩]/g, (digit) =>
      String(arabicDigits.indexOf(digit))
    )
    .replace(/[٬,\s.]/g, "");

  const price = Number(normalized);

  return Number.isFinite(price) ? price : null;
}

function extractProductKey(text: string): string | null {
  const match = text.match(
    /#product\s*[:：]?\s*([a-zA-Z0-9_-]+)/
  );

  return match ? match[1] : null;
}

function extractProductName(text: string): string {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (
      !line.match(/^(?:السعر|سعر|price)\s*[:：]?/i) &&
      !line.match(/^#product/i)
    ) {
      return line.replace(/^[🍎🍊🍋🍌🍉🍇🥬🥒🥕🌶️🥔🧅🧄🍅📦]\s*/u, "");
    }
  }

  return "منتج جديد";
}

async function telegramGetFileUrl(
  fileId: string
): Promise<string | null> {
  if (!BOT_TOKEN) return null;

  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
  );

  if (!response.ok) return null;

  const data = await response.json();

  if (!data.ok || !data.result?.file_path) {
    return null;
  }

  return `https://api.telegram.org/file/bot${BOT_TOKEN}/${data.result.file_path}`;
}

export async function POST(request: NextRequest) {
  try {
    // حماية الـWebhook
    if (WEBHOOK_SECRET) {
      const secret =
        request.headers.get("x-telegram-bot-api-secret-token");

      if (secret !== WEBHOOK_SECRET) {
        return NextResponse.json(
          { ok: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    const update =
      (await request.json()) as TelegramUpdate;

    // منشور القناة
    const message =
      update.channel_post || update.message;

    if (!message) {
      return NextResponse.json({
        ok: true,
        ignored: true
      });
    }

    const text =
      message.text ||
      message.caption ||
      "";

    if (!text.trim()) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: "No text"
      });
    }

    const telegramChatId = message.chat?.id;

    if (!telegramChatId) {
      return NextResponse.json({
        ok: true,
        ignored: true
      });
    }

    const telegramMessageId =
      message.message_id;

    const productKey =
      extractProductKey(text);

    const price =
      extractPrice(text);

    const name =
      extractProductName(text);

    if (price === null) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: "Price not found"
      });
    }

    // الحصول على صورة المنشور
    let imageUrl: string | null = null;

    if (
      message.photo &&
      message.photo.length > 0
    ) {
      const largestPhoto =
        message.photo[
          message.photo.length - 1
        ];

      imageUrl =
        await telegramGetFileUrl(
          largestPhoto.file_id
        );
    }

    /*
     * 1️⃣ البحث باستخدام product_key
     */
    let existingProduct = null;

    if (productKey) {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("product_key", productKey)
        .maybeSingle();

      existingProduct = data;
    }

    /*
     * 2️⃣ إذا لم نجد المنتج نبحث
     *    عن منشور Telegram نفسه
     */
    if (!existingProduct) {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq(
          "telegram_chat_id",
          telegramChatId
        )
        .eq(
          "telegram_message_id",
          telegramMessageId
        )
        .maybeSingle();

      existingProduct = data;
    }

    /*
     * تحديث المنتج الموجود
     */
    if (existingProduct) {
      const { data, error } =
        await supabase
          .from("products")
          .update({
            name,
            price,
            image_url:
              imageUrl ||
              existingProduct.image_url,
            telegram_chat_id:
              telegramChatId,
            telegram_message_id:
              telegramMessageId,
            updated_at:
              new Date().toISOString()
          })
          .eq("id", existingProduct.id)
          .select()
          .single();

      if (error) {
        console.error(
          "Update product error:",
          error
        );

        return NextResponse.json(
          {
            ok: false,
            error: error.message
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        action: "updated",
        product: data
      });
    }

    /*
     * إنشاء منتج جديد
     */
    const { data, error } =
      await supabase
        .from("products")
        .insert({
          product_key:
            productKey || null,

          name,

          price,

          image_url:
            imageUrl,

          telegram_chat_id:
            telegramChatId,

          telegram_message_id:
            telegramMessageId
        })
        .select()
        .single();

    if (error) {
      console.error(
        "Create product error:",
        error
      );

      return NextResponse.json(
        {
          ok: false,
          error: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      action: "created",
      product: data
    });
  } catch (error) {
    console.error(
      "Telegram webhook error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error"
      },
      { status: 500 }
    );
  }
}
