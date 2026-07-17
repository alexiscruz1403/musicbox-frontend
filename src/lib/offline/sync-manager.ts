import {
  apiCreateReview,
  apiUpdateReview,
  apiDeleteReview,
  apiPatchMe,
  apiUploadAvatar,
  apiUploadCover,
  apiUpdateNotificationPrefs,
  ApiError,
} from "@/lib/api";
import { listMutations, removeMutation, bumpMutationRetry } from "./mutation-queue";
import type { MutationQueueItem } from "./db";
import type {
  CreateReviewDto,
  UpdateReviewDto,
  NotificationPrefsUpdate,
} from "@/types/api";

interface CreateReviewPayload {
  review: CreateReviewDto;
}
interface UpdateReviewPayload {
  reviewId: string;
  review: UpdateReviewDto;
}
interface DeleteReviewPayload {
  reviewId: string;
}
interface PatchProfilePayload {
  updates: { handle?: string; displayName?: string; bio?: string; isPrivate?: boolean };
}
interface UploadAvatarPayload {
  file: File;
}
interface UploadCoverPayload {
  file: File;
}
interface UpdateNotifPrefsPayload {
  updates: NotificationPrefsUpdate;
}

async function processMutation(
  accessToken: string,
  mutation: MutationQueueItem,
): Promise<void> {
  switch (mutation.kind) {
    case "CREATE_REVIEW": {
      const { review } = mutation.payload as CreateReviewPayload;
      await apiCreateReview(accessToken, review, mutation.id);
      return;
    }
    case "UPDATE_REVIEW": {
      const { reviewId, review } = mutation.payload as UpdateReviewPayload;
      await apiUpdateReview(accessToken, reviewId, review, mutation.id);
      return;
    }
    case "DELETE_REVIEW": {
      const { reviewId } = mutation.payload as DeleteReviewPayload;
      await apiDeleteReview(accessToken, reviewId, mutation.id);
      return;
    }
    case "PATCH_PROFILE": {
      const { updates } = mutation.payload as PatchProfilePayload;
      await apiPatchMe(accessToken, updates, mutation.id);
      return;
    }
    case "UPLOAD_AVATAR": {
      const { file } = mutation.payload as UploadAvatarPayload;
      await apiUploadAvatar(accessToken, file, mutation.id);
      return;
    }
    case "UPLOAD_COVER": {
      const { file } = mutation.payload as UploadCoverPayload;
      await apiUploadCover(accessToken, file, mutation.id);
      return;
    }
    case "UPDATE_NOTIF_PREFS": {
      const { updates } = mutation.payload as UpdateNotifPrefsPayload;
      await apiUpdateNotificationPrefs(accessToken, updates, mutation.id);
      return;
    }
  }
}

// Contrato documentado en docs/fase-8-features.md:
// - DELETE de una reseña ya borrada por su dueño → 204 no-op (no lanza, se
//   remueve de la cola como cualquier éxito).
// - PATCH sobre una reseña borrada mientras tanto → 404, se descarta (el
//   propio backend documenta esto como "el cliente debe interpretarlo como
//   descartar la acción encolada").
// - 403 sobre una reseña ajena → nunca se va a resolver reintentando, se
//   descarta también.
// Cualquier otro error dejar la mutación en la cola para el próximo flush.
function isPermanentFailure(mutation: MutationQueueItem, apiErr: ApiError): boolean {
  if (mutation.kind === "UPDATE_REVIEW" || mutation.kind === "DELETE_REVIEW") {
    return apiErr.statusCode === 404 || apiErr.statusCode === 403;
  }
  return false;
}

export async function flushMutationQueue(accessToken: string): Promise<void> {
  const mutations = await listMutations();
  for (const mutation of mutations) {
    try {
      await processMutation(accessToken, mutation);
      await removeMutation(mutation.id);
    } catch (err) {
      const apiErr = err as ApiError;
      if (isPermanentFailure(mutation, apiErr)) {
        await removeMutation(mutation.id);
        continue;
      }
      await bumpMutationRetry(mutation.id);
    }
  }
}
