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
import { usePpdbPortalSubmitTesJawab, usePpdbPortalTesStatus } from '@/hooks/ppdb/santri';
import { transliterateText } from '@/lib/utils/arabic-transliterate';

const getMultipleChoiceValue = (optionIndex: number) => `option-${optionIndex}`;

const formatMultipleChoiceAnswer = (answerValue: string, options?: string[]) => {
  const match = /^option-(\d+)$/.exec(answerValue);
  if (!match) return answerValue;

  const optionIndex = Number(match[1]);
  const optionLabel = String.fromCharCode(65 + optionIndex);
  const optionText = options?.[optionIndex] ?? '';
  return `${optionLabel}. ${optionText}`.trim();
};

// Construct full image URL from backend path
const getImageUrl = (path?: string): string | null => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;

  // Get base URL from API_URL (e.g., http://localhost:8000/api → http://localhost:8000)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const base = apiUrl.replace(/\/api\/?$/, '');

  // Handle both relative paths (ppdb/tes_soal/img.jpg) and /storage/ prefixes
  const cleanPath = path.replace(/^\/storage\/?/, '').replace(/^\//, '');
  return `${base}/storage/${cleanPath}`;
};

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

        // Jika tes sudah selesai dikerjakan, langsung ke halaman pembayaran
        if (response.tesSubmitted) {
          router.replace('/ppdb/dashboard/pembayaran');
          return;
        }

        // Jika tidak bisa akses tes, arahkan berdasarkan step backend
        if (!response.canAccessTes) {
          toast({
            title: 'Tes belum tersedia',
            description: response.message || 'Silakan menunggu pengumuman berikutnya.',
          });

          if (response.step === 'menunggu-pengumuman' || response.step === 'pengumuman') {
            router.replace('/ppdb/dashboard/pengumuman');
          } else if (response.step === 'pembayaran-ppdb') {
            router.replace('/ppdb/dashboard/pembayaran');
          } else if (response.step === 'infaq') {
            router.replace('/ppdb/dashboard/infaq');
          } else {
            router.replace('/ppdb/dashboard');
          }
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
        const rawAnswer = answersMap[q.id] || '';
        const ans = rawAnswer
          ? q.type === 'multiple_choice'
            ? formatMultipleChoiceAnswer(rawAnswer, q.options)
            : rawAnswer
          : '(Kosong)';
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
        description: 'Jawaban tes berhasil dikirim. Mengarahkan ke halaman pembayaran...',
      });

      // Setelah submit tes, langsung ke pembayaran (sesuai flow)
      router.replace('/ppdb/dashboard/pembayaran');
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
                          <Label className={`text-base font-medium flex items-start gap-2 ${q.bahasa === 'ar' ? 'flex-row-reverse text-right' : ''}`}
                            dir={q.bahasa === 'ar' ? 'rtl' : 'ltr'}>
                            <span>{idx + 1}.</span> <span>{q.question}</span>
                          </Label>
                          {q.image_url && getImageUrl(q.image_url) && (
                            <div className={q.bahasa === 'ar' ? 'flex justify-end' : ''}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getImageUrl(q.image_url) || ''}
                                alt={`Gambar soal ${idx + 1}`}
                                className="max-h-48 rounded-lg border border-border/50 object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            </div>
                          )}
                          <div className="pl-6">
                            {q.type === 'multiple_choice' && q.options ? (
                              <RadioGroup
                                disabled={submitLoading || data.tesSubmitted}
                                value={answersMap[q.id] || ''}
                                onValueChange={(val) => setAnswersMap(prev => ({ ...prev, [q.id]: val }))}
                                className="space-y-2"
                                dir={q.bahasa === 'ar' ? 'rtl' : 'ltr'}
                              >
                                {q.options.map((opt, i) => {
                                  const optLabel = String.fromCharCode(65 + i);
                                  const optionValue = getMultipleChoiceValue(i);
                                  const isSelected = answersMap[q.id] === optionValue;
                                  return (
                                    <div
                                      key={i}
                                      onClick={() => {
                                        if (!submitLoading && !data.tesSubmitted) {
                                          setAnswersMap(prev => ({ ...prev, [q.id]: optionValue }));
                                        }
                                      }}
                                      className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 cursor-pointer transition-all select-none
                                        ${q.bahasa === 'ar' ? 'flex-row-reverse' : ''}
                                        ${isSelected
                                          ? 'border-primary bg-primary/5 shadow-sm'
                                          : 'border-border bg-background hover:border-primary/40 hover:bg-muted/30'
                                        }
                                        ${(submitLoading || data.tesSubmitted) ? 'opacity-60 cursor-not-allowed' : ''}
                                      `}
                                    >
                                      <span className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors
                                        ${isSelected ? 'border-primary bg-primary text-white' : 'border-muted-foreground/40 text-muted-foreground'}
                                      `}>
                                        {optLabel}
                                      </span>
                                      <RadioGroupItem
                                        value={optionValue}
                                        id={`q-${q.id}-opt-${i}`}
                                        className="sr-only"
                                      />
                                      <Label
                                        htmlFor={`q-${q.id}-opt-${i}`}
                                        className={`flex-1 font-normal cursor-pointer text-sm leading-relaxed
                                          ${q.bahasa === 'ar' ? 'text-right' : ''}
                                          ${isSelected ? 'text-primary font-medium' : 'text-foreground'}
                                        `}
                                        dir={q.bahasa === 'ar' ? 'rtl' : 'ltr'}
                                      >
                                        {opt}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </RadioGroup>
                            ) : (
                              <Textarea
                                disabled={submitLoading || data.tesSubmitted}
                                value={answersMap[q.id] || ''}
                                onChange={(e) => {
                                  let value = e.target.value;
                                  // Auto-transliterasi jawaban jika bahasa Arab
                                  if (q.bahasa === 'ar' && /[a-zA-Z]/.test(value)) {
                                    value = transliterateText(value);
                                  }
                                  setAnswersMap(prev => ({ ...prev, [q.id]: value }));
                                }}
                                placeholder={q.bahasa === 'ar' ? 'اكتب إجابتك هنا...' : 'Ketik jawaban Anda...'}
                                className={`min-h-[100px] ${q.bahasa === 'ar' ? 'text-right' : ''}`}
                                dir={q.bahasa === 'ar' ? 'rtl' : 'ltr'}
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
