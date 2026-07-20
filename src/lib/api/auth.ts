import type {
  ApiSuccessResponse,
  AuthResponse,
  MessageResponse,
  RefreshResponse,
} from "@/types/api";
import { apiFetch } from "./client";

export async function apiRegister(payload: {
  handle: string;
  displayName: string;
  email: string;
  password: string;
  consent: true;
  idempotencyKey: string;
}): Promise<ApiSuccessResponse<AuthResponse>> {
  const { idempotencyKey, ...body } = payload;
  return apiFetch<ApiSuccessResponse<AuthResponse>>("/auth/register", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(body),
  });
}

export async function apiLogin(
  email: string,
  password: string,
): Promise<ApiSuccessResponse<AuthResponse>> {
  return apiFetch<ApiSuccessResponse<AuthResponse>>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function apiForgotPassword(
  email: string,
): Promise<ApiSuccessResponse<MessageResponse>> {
  return apiFetch<ApiSuccessResponse<MessageResponse>>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function apiResetPassword(
  userId: string,
  token: string,
  newPassword: string,
): Promise<ApiSuccessResponse<MessageResponse>> {
  return apiFetch<ApiSuccessResponse<MessageResponse>>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ userId, token, newPassword }),
  });
}

export async function apiChangeEmail(
  accessToken: string,
  newEmail: string,
): Promise<ApiSuccessResponse<MessageResponse>> {
  return apiFetch<ApiSuccessResponse<MessageResponse>>("/auth/change-email", {
    method: "POST",
    accessToken,
    body: JSON.stringify({ newEmail }),
  });
}

export async function apiConfirmChangeEmail(
  userId: string,
  token: string,
): Promise<ApiSuccessResponse<MessageResponse>> {
  return apiFetch<ApiSuccessResponse<MessageResponse>>("/auth/confirm-change-email", {
    method: "POST",
    body: JSON.stringify({ userId, token }),
  });
}

export async function apiRefresh(
  refreshToken: string,
): Promise<ApiSuccessResponse<RefreshResponse>> {
  return apiFetch<ApiSuccessResponse<RefreshResponse>>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function apiLogout(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  return apiFetch<void>("/auth/logout", {
    method: "POST",
    accessToken,
    body: JSON.stringify({ refreshToken }),
  });
}
