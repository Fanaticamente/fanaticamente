import { supabase } from "@/integrations/supabase/client";

export type ProfessionalUploadTarget = "avatar" | "crp-front" | "crp-back" | "degree-front" | "degree-back";

type UploadResult = {
  url: string;
  path: string;
};

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
};

const getExtension = (fileName: string) => fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";

const blobToBase64 = async (blob: Blob) => {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
};

const convertImageToJpeg = (file: File): Promise<File> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Não foi possível preparar a imagem."));
        return;
      }

      context.drawImage(image, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error("Não foi possível converter a imagem."));
            return;
          }
          resolve(new File([blob], "upload.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.9,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível ler essa imagem. Envie em JPG, PNG ou WEBP."));
    };

    image.src = objectUrl;
  });

const prepareFile = async (file: File, target: ProfessionalUploadTarget) => {
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error(target === "avatar" ? "A imagem deve ter no máximo 5MB" : "O arquivo deve ter no máximo 5MB");
  }

  const extension = getExtension(file.name);
  const inferredType = MIME_BY_EXTENSION[extension] ?? "";
  const contentType = file.type || inferredType;
  const acceptsPdf = target !== "avatar";

  if (acceptsPdf && (contentType === "application/pdf" || extension === "pdf")) {
    return {
      file: file.type ? file : new File([file], file.name || "documento.pdf", { type: "application/pdf" }),
      contentType: "application/pdf",
      extension: "pdf",
    };
  }

  const isImage = contentType.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(extension);
  if (!isImage) {
    throw new Error(target === "avatar" ? "Por favor, selecione uma imagem" : "Selecione uma imagem ou PDF");
  }

  if (contentType === "image/jpeg" || extension === "jpg" || extension === "jpeg") {
    return {
      file: file.type ? file : new File([file], file.name || "imagem.jpg", { type: "image/jpeg" }),
      contentType: "image/jpeg",
      extension: "jpg",
    };
  }

  if (contentType === "image/png" || extension === "png") {
    return {
      file: file.type ? file : new File([file], file.name || "imagem.png", { type: "image/png" }),
      contentType: "image/png",
      extension: "png",
    };
  }

  if (contentType === "image/webp" || extension === "webp") {
    return {
      file: file.type ? file : new File([file], file.name || "imagem.webp", { type: "image/webp" }),
      contentType: "image/webp",
      extension: "webp",
    };
  }

  const jpeg = await convertImageToJpeg(file);
  return { file: jpeg, contentType: "image/jpeg", extension: "jpg" };
};

export const uploadProfessionalFile = async (file: File, target: ProfessionalUploadTarget): Promise<UploadResult> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Sua sessão expirou. Faça login novamente.");
  }

  const prepared = await prepareFile(file, target);
  const fileBase64 = await blobToBase64(prepared.file);

  const { data, error } = await supabase.functions.invoke<UploadResult>("upload-professional-file", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: {
      target,
      fileBase64,
      contentType: prepared.contentType,
      extension: prepared.extension,
    },
  });

  if (error) {
    throw new Error(error.message || "Erro ao enviar arquivo.");
  }

  if (!data?.url) {
    throw new Error("Arquivo enviado, mas a URL não foi retornada.");
  }

  return data;
};