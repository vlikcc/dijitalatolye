import Link from "next/link";
import { learningEnabled } from "@/server/learning-feature";
import { AuthForm } from "@/components/auth-form";
import { RecoveryLayout } from "@/components/recovery-layout";
export default function Page() {
  return (
    <RecoveryLayout
      title="Hesabına yeniden ulaş."
      description="E-posta adresine bir yenileme bağlantısı gönderelim."
    >
      <AuthForm mode="reset" />
      {learningEnabled() && (
        <div className="recovery-help">
          <h2>Öğrenci hesabın mı var?</h2>
          <p>Öğretmeninden bir yenileme kodu iste.</p>
          <Link href="/ogrenci/parola">Yenileme kodunu kullan</Link>
        </div>
      )}
    </RecoveryLayout>
  );
}
