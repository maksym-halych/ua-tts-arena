export function formatPercent(share: number | null | undefined): string {
  return share === null || share === undefined ? "—" : `${(share * 100).toFixed(1)}%`;
}

/** A real-time factor, such as 0.42: the synthesis time divided by the audio length. */
export function formatRtf(rtf: number | null | undefined): string {
  return rtf === null || rtf === undefined ? "—" : rtf.toFixed(2);
}

export function formatSeconds(ms: number | null | undefined): string {
  return ms === null || ms === undefined ? "—" : `${(ms / 1000).toFixed(1)} s`;
}

/** UTC, to minute precision. Admin pages only. */
export function formatDate(iso: string): string {
  return `${iso.slice(0, 16).replace("T", " ")} UTC`;
}
