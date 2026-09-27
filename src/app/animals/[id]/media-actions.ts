"use server";

import { userSafeErrorMessage } from "@/lib/user-errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cleanFileName, isImageFile } from "@/lib/files";
import { getCurrentFarm } from "@/lib/farm-server";
import { createClient } from "@/lib/supabase/server";

function go(path: string): never {
  redirect(path as never);
}

export async function uploadAnimalPhoto(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const animalId = String(formData.get("animalId") ?? "");
  const caption = String(formData.get("caption") ?? "").trim() || null;
  const file = formData.get("photo");

  if (!animalId || !(file instanceof File) || file.size === 0) {
    go(`/animals/${animalId}?message=${encodeURIComponent("Choose an animal photo to upload.")}`);
  }

  if (!isImageFile(file)) {
    go(`/animals/${animalId}?message=${encodeURIComponent("Please upload an image file.")}`);
  }

  const { data: animal } = await supabase
    .from("animals")
    .select("id")
    .eq("id", animalId)
    .eq("farm_id", farm.id)
    .maybeSingle();

  if (!animal) {
    go("/animals");
  }

  const path = `${farm.id}/${animalId}/${Date.now()}-${cleanFileName(file.name)}`;
  const { count: existingPhotos } = await supabase
    .from("animal_media")
    .select("id", { count: "exact", head: true })
    .eq("animal_id", animalId)
    .eq("media_type", "photo");

  const { error: uploadError } = await supabase.storage.from("animal-media").upload(path, file, {
    contentType: file.type,
    upsert: false
  });

  if (uploadError) {
    go(`/animals/${animalId}?message=${encodeURIComponent(userSafeErrorMessage(uploadError))}`);
  }

  const { error } = await supabase.from("animal_media").insert({
    animal_id: animalId,
    media_type: "photo",
    storage_path: path,
    caption,
    is_profile: (existingPhotos ?? 0) === 0
  });

  if (error) {
    go(`/animals/${animalId}?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath(`/animals/${animalId}`);
  revalidatePath("/marketplace");
  go(`/animals/${animalId}?message=${encodeURIComponent("Animal photo uploaded.")}`);
}

export async function setAnimalProfilePhoto(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const animalId = String(formData.get("animalId") ?? "");
  const mediaId = String(formData.get("mediaId") ?? "");

  if (!animalId || !mediaId) {
    go(`/animals/${animalId}`);
  }

  const { data: media } = await supabase
    .from("animal_media")
    .select("id, animal_id, animals!inner(farm_id)")
    .eq("id", mediaId)
    .eq("animal_id", animalId)
    .eq("animals.farm_id", farm.id)
    .maybeSingle();

  if (!media) {
    go(`/animals/${animalId}?message=${encodeURIComponent("Photo not found for this animal.")}`);
  }

  const { error: clearError } = await supabase
    .from("animal_media")
    .update({ is_profile: false })
    .eq("animal_id", animalId)
    .eq("media_type", "photo");

  if (clearError) {
    go(`/animals/${animalId}?message=${encodeURIComponent(userSafeErrorMessage(clearError))}`);
  }

  const { error } = await supabase
    .from("animal_media")
    .update({ is_profile: true })
    .eq("id", mediaId);

  if (error) {
    go(`/animals/${animalId}?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath(`/animals/${animalId}`);
  revalidatePath("/marketplace");
  go(`/animals/${animalId}?message=${encodeURIComponent("Animal profile photo changed.")}`);
}

export async function deleteAnimalPhoto(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const animalId = String(formData.get("animalId") ?? "");
  const mediaId = String(formData.get("mediaId") ?? "");

  if (!animalId || !mediaId) {
    go(`/animals/${animalId}`);
  }

  const { data: media } = await supabase
    .from("animal_media")
    .select("id, storage_path, is_profile, animals!inner(farm_id)")
    .eq("id", mediaId)
    .eq("animal_id", animalId)
    .eq("animals.farm_id", farm.id)
    .maybeSingle();

  if (!media) {
    go(`/animals/${animalId}?message=${encodeURIComponent("Photo not found for this animal.")}`);
  }

  const { error } = await supabase.from("animal_media").delete().eq("id", mediaId);

  if (error) {
    go(`/animals/${animalId}?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  await supabase.storage.from("animal-media").remove([media.storage_path]);

  if (media.is_profile) {
    const { data: nextPhoto } = await supabase
      .from("animal_media")
      .select("id")
      .eq("animal_id", animalId)
      .eq("media_type", "photo")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextPhoto) {
      await supabase.from("animal_media").update({ is_profile: true }).eq("id", nextPhoto.id);
    }
  }

  revalidatePath(`/animals/${animalId}`);
  revalidatePath("/marketplace");
  go(`/animals/${animalId}?message=${encodeURIComponent("Animal photo deleted.")}`);
}
