import { useQuery } from "@tanstack/react-query";
import { ppdbPortalApi } from "@/lib/ppdb/portal-api";

export interface AvailableKelas {
  id?: string | number;
  kode_kelas?: string;
  nama_kelas?: string;
  tahun_ajaran?: string;
  kuota_sisa?: number;
}

export function usePpdbAvailableKelas(jenjang?: string, enabled: boolean = true) {
  const { data, isFetching: loading, error, refetch, isLoading } = useQuery({
    queryKey: ["ppdb", "available-kelas", jenjang],
    queryFn: async () => ppdbPortalApi.getAvailableKelas({ jenjang }),
    enabled: enabled && Boolean(jenjang),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data: (data || []) as AvailableKelas[],
    loading: loading || isLoading,
    error: error as Error | null,
    refetch,
  };
}
