const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function isValidYouTubeEmbedUrl(value: string): boolean {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
      return false;
    }

    const match = url.pathname.match(/^\/embed\/([^/]+)\/?$/);
    return match ? VIDEO_ID_PATTERN.test(match[1]) : false;
  } catch {
    return false;
  }
}

export function getYouTubeWatchUrl(embedUrl: string, portrait: boolean): string | null {
  if (!isValidYouTubeEmbedUrl(embedUrl)) {
    return null;
  }

  const id = new URL(embedUrl).pathname.split("/")[2];
  return portrait ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`;
}

/** 11-char video id of a valid embed URL, else null. */
export function getYouTubeId(embedUrl: string | null | undefined): string | null {
  if (!embedUrl || !isValidYouTubeEmbedUrl(embedUrl)) {
    return null;
  }

  return new URL(embedUrl).pathname.split("/")[2];
}

/** `https://i.ytimg.com/vi/<id>/hqdefault.jpg` for a valid embed URL, else null. */
export function getYouTubeThumbnailUrl(embedUrl: string | null | undefined): string | null {
  const id = getYouTubeId(embedUrl);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
