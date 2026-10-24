import { getMerchant } from "@/lib/session";

export async function POST(req: Request) {
  const merchant = await getMerchant();
  if (!merchant) return Response.json({ error: "Not signed in" }, { status: 401 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "No speech-to-text key configured" }, { status: 501 });
  }

  const form = await req.formData();
  const audio = form.get("audio");
  if (!(audio instanceof File)) {
    return Response.json({ error: "No audio provided" }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append("file", audio, "audio.webm");
  upstream.append("model_id", "scribe_v1");

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: upstream,
  });

  if (!res.ok) {
    return Response.json({ error: "Transcription failed" }, { status: 502 });
  }

  const data = (await res.json()) as { text?: string };
  return Response.json({ text: data.text ?? "" });
}
