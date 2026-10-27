import { AuthForm } from "@/components/auth-form";
import { RecoveryLayout } from "@/components/recovery-layout";
export default function Page() {
  return (
    <RecoveryLayout
      title="Yeni parolanı belirle."
      description="Hesabın için en az 12 karakterli bir parola seç."
    >
      <AuthForm mode="new-password" />
    </RecoveryLayout>
  );
}
