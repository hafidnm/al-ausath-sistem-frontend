"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardCheck, Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePpdbPortalSubmitTesJawab, usePpdbPortalTesStatus } from '@/hooks/ppdb/santri/use-ppdb-portal';

export default function PpdbTesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { data, loading, fetchTesStatus } = usePpdbPortalTesStatus();
  const { submitTesJawab, loading: submitLoading } = usePpdbPortalSubmitTesJawab();
  const [soalJawab, setSoalJawab] = useState('');
  const [answersMap, setAnswersMap] = useState<Record<string, string>>({});

  useEffect(() => {
    void fetchTesStatus()
      .then((response) => {
        if (!response) return;
        if (!response.canAccessTes) {
          toast({
            title: 'Tes belum tersedia',
            description: response.message || 'Silakan menunggu pengumuman berikutnya.',
          });

          const shouldGoPengumuman =
            response.step === 'menunggu-pengumuman' ||
            response.step === 'pengumuman' ||
            response.tesSubmitted;

          router.replace(shouldGoPengumuman ? '/ppdb/dashboard/pengumuman' : '/ppdb/dashboard');
        }
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Gagal memuat data tes';
        toast({
          title: 'Akses tes gagal',
          description: message,
          variant: 'destructive',
        });
        router.replace('/ppdb/dashboard');
      });
  }, [fetchTesStatus, router, toast]);

  const handleSubmit = async () => {
    let finalAnswer = soalJawab.trim();
    
    // Jika menggunakan formSchema dinamis, format jawabannya menjadi plain text
    if (data?.formSchema && data.formSchema.length > 0) {
      const answeredCount = Object.keys(answersMap).filter(k => answersMap[k].trim()).length;
      if (answeredCount < data.formSchema.length) {
        toast({
          title: 'Jawaban belum lengkap',
          description: 'Silakan isi semua pertanyaan tes terlebih dahulu.',
          variant: 'destructive',
        });
        return;
      }
      
      const formattedLines = data.formSchema.map((q, idx) => {
        const ans = answersMap[q.id] || '(Kosong)';
        return `${idx + 1}. ${q.question}\nJawaban: ${ans}`;
      });
      finalAnswer = formattedLines.join("\n\n");
    } else {
      if (!finalAnswer) {
        toast({
          title: 'Jawaban belum diisi',
          description: 'Silakan isi jawaban tes terlebih dahulu.',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      await submitTesJawab({
        soalJawab: finalAnswer,
        idPendaftaran: '',
      });

      toast({
        title: 'Jawaban tersimpan',
        description: 'Jawaban tes berhasil dikirim ke sistem.',
      });

      router.replace('/ppdb/dashboard/pengumuman');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan jawaban tes';
      toast({
        title: 'Submit jawaban gagal',
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <Link href="/ppdb/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard PPDB
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              Halaman Tes Soal PPDB
            </CardTitle>
            <CardDescription>
              Halaman ini hanya muncul ketika admin mengaktifkan fitur soal tes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memuat status tes...
              </span>
            ) : null}

            {!loading && data && !data.canAccessTes ? (
              <div className="rounded-lg border border-border p-4 bg-muted/30">
                <p className="font-medium text-foreground">Tes belum diaktifkan oleh admin.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Silakan menunggu pengumuman berikutnya.
                </p>
              </div>
            ) : null}

            {!loading && data?.canAccessTes ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-border p-4 bg-muted/30 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Aktif</Badge>
                    {data.fiturSoalAktif ? <Badge>Fitur soal on</Badge> : <Badge variant="secondary">Fitur soal off</Badge>}
                    {data.tesSubmitted ? <Badge variant="secondary">Sudah disubmit</Badge> : null}
                  </div>
                  <p className="font-medium text-foreground">{data.tesTitle || 'Tes Seleksi PPDB'}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.tesDescription || 'Jawab pertanyaan berikut sesuai instruksi admin.'}
                  </p>
                  {(!data?.formSchema || data.formSchema.length === 0) && data.soalTes ? (
                    <div className="rounded-md border border-border bg-background p-4 whitespace-pre-wrap text-sm text-foreground">
                      {data.soalTes}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-6">
                  {(!data?.formSchema || data.formSchema.length === 0) ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Jawaban Tes</p>
                      <Textarea
                        value={soalJawab}
                        onChange={(event) => setSoalJawab(event.target.value)}
                        placeholder="Tulis jawaban Anda di sini"
                        className="min-h-40"
                        disabled={submitLoading || data.tesSubmitted}
                      />
                    </div>
                  ) : (
                    <div className="space-y-6 bg-muted/10 p-4 border rounded-lg">
                      <h3 className="font-semibold border-b pb-2">Lembar Jawaban</h3>
                      {data.formSchema.map((q, idx) => (
                        <div key={q.id} className="space-y-3">
                          <Label className="text-base font-medium flex items-start gap-2">
                            <span>{idx + 1}.</span> <span>{q.question}</span>
                          </Label>
                          <div className="pl-6">
                            {q.type === 'multiple_choice' && q.options ? (
                              <RadioGroup
                                disabled={submitLoading || data.tesSubmitted}
                                value={answersMap[q.id] || ''}
                                onValueChange={(val) => setAnswersMap(prev => ({ ...prev, [q.id]: val }))}
                                className="space-y-2"
                              >
                                {q.options.map((opt, i) => (
                                  <div key={i} className="flex items-center space-x-2">
                                    <RadioGroupItem value={opt} id={`q-${q.id}-opt-${i}`} />
                                    <Label htmlFor={`q-${q.id}-opt-${i}`} className="font-normal cursor-pointer">{opt}</Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            ) : (
                              <Textarea
                                disabled={submitLoading || data.tesSubmitted}
                                value={answersMap[q.id] || ''}
                                onChange={(e) => setAnswersMap(prev => ({ ...prev, [q.id]: e.target.value }))}
                                placeholder="Ketik jawaban Anda..."
                                className="min-h-[100px]"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void handleSubmit()} disabled={submitLoading || data.tesSubmitted}>
                    {submitLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Kirim Jawaban
                  </Button>
                  <Link href="/ppdb/dashboard">
                    <Button variant="outline">Lewati ke Halaman Tunggu</Button>
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="flex gap-2">
              <Link href="/ppdb/dashboard">
                <Button variant="outline">Kembali</Button>
              </Link>
              <Button onClick={() => void fetchTesStatus()}>Refresh Status Tes</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
