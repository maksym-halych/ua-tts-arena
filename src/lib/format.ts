export function formatPercent(share: number | null | undefined): string {
  return share === null || share === undefined ? "—" : `${(share * 100).toFixed(1)}%`;
}

export function formatSeconds(ms: number | null | undefined): string {
  return ms === null || ms === undefined ? "—" : `${(ms / 1000).toFixed(1)} s`;
}

/** UTC, to minute precision. Admin pages only. */
export function formatDate(iso: string): string {
  return `${iso.slice(0, 16).replace("T", " ")} UTC`;
}
