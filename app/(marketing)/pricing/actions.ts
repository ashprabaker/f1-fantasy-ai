"use server"

export async function getProfile(userId: string | null | undefined) {
  if (!userId) return { isSuccess: false, message: "", data: undefined }
  
  const { getProfileAction } = await import("@/actions/db/profiles-actions")
  return getProfileAction(userId)
} 