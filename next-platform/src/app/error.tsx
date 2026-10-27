"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty" style={{ marginTop: 48 }}>
      <h1>Bu sayfa yüklenemedi.</h1>
      <p>Bağlantıyı kontrol edip yeniden deneyebilirsiniz.</p>
      <Button onClick={reset}>Yeniden dene</Button>
    </div>
  );
}
