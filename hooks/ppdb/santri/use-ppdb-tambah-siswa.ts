import { useMutation } from "@tanstack/react-query";
import { ppdbPortalApi } from "@/lib/ppdb/portal-api";

export interface TambahSiswaPayload {
  namaCalon?: string;
  nama_calon?: string;
  program?: string;
  jenjang?: string;
}

export interface TambahSiswaResponse {
  id_pendaftaran: string;
  no_pendaftaran: string;
  message: string;
}

export function usePpdbTambahSiswa() {
  const mutation = useMutation({
    mutationFn: async (payload: TambahSiswaPayload) => {
      const namaCalon = payload.namaCalon || payload.nama_calon || "";
      const program = payload.program || payload.jenjang || "";
      return ppdbPortalApi.tambahSiswaPpdb(namaCalon, program);
    },
  });

  return {
    tambahSiswa: mutation.mutate,
    tambahSiswaAsync: mutation.mutateAsync,
    loading: mutation.isPending,
    error: mutation.error as Error | null,
    success: mutation.isSuccess,
    reset: mutation.reset,
    data: mutation.data,
  };
}
