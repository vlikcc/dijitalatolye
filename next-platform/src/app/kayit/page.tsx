import { RegisterForm } from "@/components/register-form";
import { learningEnabled } from "@/server/learning-feature";
import { AccountLayout } from "@/components/account-layout";
export default function Page() {
  return (
    <AccountLayout
      showcase
      className="account-layout-register"
      title="Atölyeye katıl."
    >
      <RegisterForm learning={learningEnabled()} />
    </AccountLayout>
  );
}
