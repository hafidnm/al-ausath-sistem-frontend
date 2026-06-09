export const ppdbQueryKeys = {
  adminList: ['ppdb', 'admin', 'list'] as const,
  adminDetail: (id?: string) => ['ppdb', 'admin', 'detail', id ?? ''] as const,
  portalDashboard: ['ppdb', 'portal', 'dashboard'] as const,
  portalPembayaranStatus: ['ppdb', 'portal', 'pembayaran-status'] as const,
  portalPreviewNomor: ['ppdb', 'portal', 'preview-nomor'] as const,
  portalTesStatus: ['ppdb', 'portal', 'tes-status'] as const,
};
