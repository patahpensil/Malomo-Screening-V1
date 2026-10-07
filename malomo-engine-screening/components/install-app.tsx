'use client';

import {useEffect, useState} from 'react';
import {Smartphone} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
};

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const display = window.matchMedia('(display-mode: standalone)');
    const sync = () => setInstalled(display.matches || Boolean((navigator as Navigator & {standalone?: boolean}).standalone));
    const ready = (event: Event) => { event.preventDefault(); setPrompt(event as InstallEvent); };
    const done = () => { setInstalled(true); setPrompt(null); setOpen(false); };
    sync();
    display.addEventListener('change', sync);
    window.addEventListener('beforeinstallprompt', ready);
    window.addEventListener('appinstalled', done);
    if ('serviceWorker' in navigator) {
      // No financial records, market responses or authenticated pages are cached.
      navigator.serviceWorker.register('/sw.js', {scope: '/', updateViaCache: 'none'}).catch(() => {});
    }
    return () => {
      display.removeEventListener('change', sync);
      window.removeEventListener('beforeinstallprompt', ready);
      window.removeEventListener('appinstalled', done);
    };
  }, []);
  async function install() {
    if (!prompt) return;
    setPending(true);
    try {
      await prompt.prompt();
      await prompt.userChoice;
      // An install event can only be used once. appinstalled confirms success.
      setPrompt(null);
    } catch {
      setPrompt(null);
    } finally { setPending(false); }
  }
  if (installed) return null;
  return <>
    <Button variant="outline" className="install-app-button" onClick={() => setOpen(true)}><Smartphone size={16}/> Pasang di HP</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="install-app-dialog">
        <DialogHeader><DialogTitle>Malomo di layar utama</DialogTitle><DialogDescription>Buka workspace langsung dari ikon Malomo di HP.</DialogDescription></DialogHeader>
        {prompt && <Button disabled={pending} onClick={() => void install()}>{pending ? 'Membuka pemasangan…' : 'Pasang aplikasi'}</Button>}
        <div className="install-steps"><strong>Android · Chrome</strong><p>Buka link ini di Chrome dan masuk dengan akunmu. Ketuk menu ⋮, lalu “Tambahkan ke layar utama” atau “Instal aplikasi”. Konfirmasi Tambahkan atau Instal.</p></div>
        <div className="install-steps"><strong>iPhone · Safari</strong><p>Buka link ini di Safari. Ketuk Bagikan, lalu “Tambah ke Layar Utama”.</p></div>
        <p className="install-note">Jika terbuka di dalam ChatGPT, pilih buka di browser terlebih dahulu. Koneksi internet diperlukan untuk data pasar dan jurnal. Pemindaian berjalan selama aplikasi aktif.</p>
      </DialogContent>
    </Dialog>
  </>;
}
