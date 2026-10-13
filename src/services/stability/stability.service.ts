import { fetch } from "undici";

type ReplicateGenerateOptions = {
  prompt: string;
  aspectRatio?: string;
  outputFormat?: "webp" | "png" | "jpeg";
  safetyTolerance?: number;
};

export class StabilityService {
  /**
   * NOTE: Despite the class name, this implementation uses Replicate API.
   * Model: black-forest-labs/flux-2-pro
   * Docs: https://replicate.com/black-forest-labs/flux-2-pro
   */
  static async generateImage(opts: ReplicateGenerateOptions): Promise<Buffer> {
    const token =
      process.env.REPLICATE_API_TOKEN ??
      process.env.REPLICATE_API_KEY ??
      process.env.REPLICATE_TOKEN ??
      "";
    if (!token) {
      throw new Error("Missing Replicate API token (set REPLICATE_API_TOKEN)");
    }

    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
        Prefer: "wait",
      },
      body: JSON.stringify({
        version: "black-forest-labs/flux-2-pro",
        input: {
          prompt: opts.prompt,
          aspect_ratio: opts.aspectRatio ?? "1:1",
          safety_tolerance: opts.safetyTolerance ?? 2,
          output_format: opts.outputFormat ?? "webp",
          output_quality: 90,
        },
      }),
    });

    const createText = await createRes.text().catch(() => "");
    if (!createRes.ok) {
      throw new Error(
        `Replicate API error: ${createRes.status} ${createRes.statusText} ${createText}`.trim()
      );
    }

    const prediction = (() => {
      try {
        return JSON.parse(createText) as any;
      } catch {
        return null;
      }
    })();

    if (!prediction?.id || !prediction?.urls?.get) {
      throw new Error(`Replicate API error: unexpected response (${createText})`);
    }

    let current = prediction;
    const startedAt = Date.now();
    while (current?.status === "starting" || current?.status === "processing") {
      if (Date.now() - startedAt > 120_000) {
        throw new Error(`Replicate API error: timeout waiting for prediction ${prediction.id}`);
      }
      await new Promise((r) => setTimeout(r, 1000));
      const pollRes = await fetch(String(prediction.urls.get), {
        headers: { Authorization: `Token ${token}` },
      });
      if (!pollRes.ok) {
        const t = await pollRes.text().catch(() => "");
        throw new Error(`Replicate poll error: ${pollRes.status} ${pollRes.statusText} ${t}`.trim());
      }
      current = await pollRes.json().catch(() => null);
    }

    if (current?.status !== "succeeded") {
      throw new Error(`Replicate prediction failed: ${JSON.stringify(current)}`);
    }

    const output = current?.output;
    const imageUrl =
      typeof output === "string"
        ? output
        : Array.isArray(output) && typeof output[0] === "string"
          ? output[0]
          : null;

    if (!imageUrl) {
      throw new Error(`Replicate API error: missing output url (${JSON.stringify(current)})`);
    }

    const imgRes = await fetch(imageUrl, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!imgRes.ok) {
      const text = await imgRes.text().catch(() => "");
      throw new Error(
        `Replicate image download error: ${imgRes.status} ${imgRes.statusText} ${text}`.trim()
      );
    }
    const arrayBuffer = await imgRes.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

