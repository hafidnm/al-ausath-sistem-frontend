import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RataRataPerKelasSection } from "./rata-rata-per-kelas-section"
import { SantriBerprestasiSection } from "./santri-berprestasi-section"
import { SantriPerluBimbinganSection } from "./santri-perlu-bimbingan-section"
import { StatistikKeseluruhanSection } from "./statistik-keseluruhan-section"
import { TrendPerSemesterSection } from "./trend-per-semester-section"

export function AnalitikSections() {
  return (
    <Tabs defaultValue="statistik-keseluruhan" className="space-y-4">
      <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto bg-muted/50 p-1">
        <TabsTrigger value="statistik-keseluruhan">1. Statistik</TabsTrigger>
        <TabsTrigger value="rata-rata-per-kelas">2. Per Kelas</TabsTrigger>
        <TabsTrigger value="trend-per-semester">3. Trend</TabsTrigger>
        <TabsTrigger value="santri-berprestasi">4. Berprestasi</TabsTrigger>
        <TabsTrigger value="santri-perlu-bimbingan">5. Perlu Bimbingan</TabsTrigger>
      </TabsList>

      <TabsContent value="statistik-keseluruhan">
        <StatistikKeseluruhanSection />
      </TabsContent>
      <TabsContent value="rata-rata-per-kelas">
        <RataRataPerKelasSection />
      </TabsContent>
      <TabsContent value="trend-per-semester">
        <TrendPerSemesterSection />
      </TabsContent>
      <TabsContent value="santri-berprestasi">
        <SantriBerprestasiSection />
      </TabsContent>
      <TabsContent value="santri-perlu-bimbingan">
        <SantriPerluBimbinganSection />
      </TabsContent>
    </Tabs>
  )
}
