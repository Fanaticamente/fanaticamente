import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type UploadTarget = "avatar" | "crp-front" | "crp-back" | "degree-front" | "degree-back";

type UploadPayload = {
  target: UploadTarget;
  fileBase64: string;
  contentType: string;
  extension: string;
};

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const ALLOWED_DOCUMENT_TYPES = new Set([...ALLOWED_IMAGE_TYPES, "application/pdf"]);

const toBytes = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
};

const sanitizeExtension = (extension: string, contentType: string) => {
  const ext = extension.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (contentType === "application/pdf") return "pdf";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return ext === "jpeg" ? "jpg" : ext || "jpg";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization") ?? "";

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !authHeader) {
      return new Response(JSON.stringify({ error: "Upload não autorizado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Sessão expirada. Faça login novamente." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as UploadPayload;
    const isAvatar = payload.target === "avatar";
    const allowedTypes = isAvatar ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;

    if (!allowedTypes.has(payload.contentType)) {
      return new Response(JSON.stringify({ error: isAvatar ? "Envie uma imagem válida." : "Envie uma imagem ou PDF válido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileBytes = toBytes(payload.fileBase64);
    if (fileBytes.byteLength > MAX_UPLOAD_SIZE) {
      return new Response(JSON.stringify({ error: "O arquivo deve ter no máximo 5MB." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extension = sanitizeExtension(payload.extension, payload.contentType);
    const bucket = isAvatar ? "avatars" : "crp-documents";
    const prefix = isAvatar ? "professionals" : userData.user.id;
    const fileLabel = payload.target.replace("crp-", "crp-").replace("degree-", "degree-");
    const path = `${prefix}/${userData.user.id}-${fileLabel}-${Date.now()}.${extension}`;

    const { error: uploadError } = await serviceClient.storage.from(bucket).upload(path, fileBytes, {
      contentType: payload.contentType,
      cacheControl: "3600",
      upsert: true,
    });

    if (uploadError) {
      console.error("upload-professional-file: upload failed", uploadError);
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isAvatar) {
      const { data: publicData } = serviceClient.storage.from(bucket).getPublicUrl(path);
      return new Response(JSON.stringify({ url: publicData.publicUrl, path }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signedData, error: signedError } = await serviceClient.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60 * 24 * 365);

    if (signedError || !signedData?.signedUrl) {
      console.error("upload-professional-file: signed URL failed", signedError);
      return new Response(JSON.stringify({ error: "Arquivo enviado, mas não foi possível gerar acesso seguro." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: signedData.signedUrl, path }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("upload-professional-file: unexpected error", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro ao enviar arquivo." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});