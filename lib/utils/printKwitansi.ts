import type { PembayaranDetail } from '@/lib/services/pembayaran.service';

function escapeHtml(s: string | number | null | undefined) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function printKwitansi(detail: PembayaranDetail) {
  try {
    const profil = detail.profilSantri;
    const info = detail.informasiInvoice;

    const rows = (detail.tagihanKustom || []).map((t) => {
      return `<tr><td style="padding:6px">${escapeHtml(t.nama)}</td><td style="padding:6px;text-align:right">${new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(t.nominal)}</td></tr>`;
    }).join('');

    const riwayat = (detail.riwayatPembayaran || []).map((r) => {
      return `<tr><td style="padding:6px">${escapeHtml(r.tanggal)} · ${escapeHtml(r.metode)}</td><td style="padding:6px;text-align:right">${new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(r.nominal)}</td></tr>`;
    }).join('');

    const total = info.total || (detail.tagihanKustom || []).reduce((s, t) => s + (t.nominal || 0), 0);

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Kwitansi - ${escapeHtml(info.nomorInvoice)}</title>
        <meta name="viewport" content="width=device-width,initial-scale:1" />
        <style>
          body { font-family: Arial, Helvetica, sans-serif; color:#111; }
          .page { width:210mm; max-width:100%; margin:0 auto; padding:20px; }
          .header { text-align:center; }
          .box { border:1px solid #000; padding:12px; margin-top:12px; }
          table { width:100%; border-collapse:collapse; }
          th, td { border-bottom:1px dashed #ddd; }
          .right { text-align:right; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <h2 style="margin:0">MA'HAD AL-AUSATH KARANGANYAR</h2>
            <div style="font-size:12px; margin-top:4px">Kwitansi Pembayaran</div>
          </div>

          <div class="box">
            <table>
              <tr>
                <td style="width:60%">
                  <div><strong>Penerima</strong></div>
                  <div>${escapeHtml(profil.namaLengkap)}</div>
                  <div style="font-family:monospace">NIS: ${escapeHtml(profil.nomorInduk)}</div>
                </td>
                <td style="width:40%">
                  <div><strong>Nomor</strong></div>
                  <div style="font-family:monospace">${escapeHtml(info.nomorInvoice)}</div>
                  <div style="margin-top:8px">Tanggal: ${escapeHtml(info.tanggal)}</div>
                </td>
              </tr>
            </table>
          </div>

          <div style="margin-top:12px">
            <table>
              <thead>
                <tr><th style="text-align:left;padding:6px">Rincian</th><th style="text-align:right;padding:6px">Jumlah</th></tr>
              </thead>
              <tbody>
                ${rows || '<tr><td style="padding:6px">Pembayaran</td><td style="padding:6px;text-align:right">' + new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(total) + '</td></tr>'}
                ${riwayat}
              </tbody>
              <tfoot>
                <tr><td style="padding:8px"><strong>Total</strong></td><td style="padding:8px;text-align:right"><strong>${new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(total)}</strong></td></tr>
              </tfoot>
            </table>
          </div>

          <div style="display:flex;justify-content:space-between;margin-top:36px;font-size:13px">
            <div>
              <div>Petugas Verifikasi</div>
              <div style="margin-top:48px">(_________________)</div>
            </div>
            <div style="text-align:right">
              <div>Mengetahui</div>
              <div style="margin-top:48px">(_________________)</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const w = window.open('', '_blank');
    if (!w) {
      throw new Error('Tidak dapat membuka jendela baru untuk mencetak kwitansi.');
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    // Delay to ensure resources render before printing
    setTimeout(() => {
      try {
        w.print();
      } catch (e) {
        console.error('Print failed', e);
      }
    }, 600);
  } catch (err) {
    console.error('Gagal membuat kwitansi:', err);
    throw err;
  }
}

export default printKwitansi;
