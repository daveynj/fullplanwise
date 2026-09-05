/**
 * Lesson images are served from App Storage via a URL (imageUrl).
 * Older lessons may still carry an inline Base64 payload (imageBase64),
 * so renderers resolve whichever form is present.
 */
export interface LessonImageLike {
  imageUrl?: string | null;
  imageBase64?: string | null;
}

export function lessonImageSrc(
  image: LessonImageLike | null | undefined,
): string | null {
  if (!image) return null;
  if (image.imageUrl) return image.imageUrl;
  if (image.imageBase64) return `data:image/png;base64,${image.imageBase64}`;
  return null;
}
