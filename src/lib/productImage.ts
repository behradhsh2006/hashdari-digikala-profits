// Free, no-key image generation based on product name
export function getAutoImageUrl(name: string, seed = 1): string {
  const q = encodeURIComponent(
    `product photo of ${name}, studio lighting, white background, e-commerce`
  );
  return `https://image.pollinations.ai/prompt/${q}?width=512&height=512&nologo=true&seed=${seed}`;
}
