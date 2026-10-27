import { notFound } from "next/navigation";
import { learningEnabled } from "@/server/learning-feature";
import { StudentAuthForm } from "@/components/learning-forms";
import { RecoveryLayout } from "@/components/recovery-layout";
export default function Page() {
  if (!learningEnabled()) notFound();
  return (
    <RecoveryLayout
      title="Parolanı yenile."
      description="Hesap kurtarmadan sorumlu öğretmeninden 15 dakika geçerli yenileme kodu iste."
    >
      <ol className="recovery-steps" aria-label="Parola yenileme adımları">
        <li>Öğretmeninden kod al</li>
        <li>Yeni parolanı belirle</li>
      </ol>
      <StudentAuthForm mode="reset" />
    </RecoveryLayout>
  );
}
