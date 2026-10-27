import { AuthForm } from "@/components/auth-form";
import { AccountLayout } from "@/components/account-layout";
import { learningEnabled } from "@/server/learning-feature";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const destination = Array.isArray(next) ? next[0] : next;
  const sharing = destination === "/ogretmen/yeni";
  const learning = learningEnabled();
  const student = learning && destination === "/ogrenci";
  return (
    <AccountLayout
      showcase
      title={
        sharing ? "Oyununu paylaşmak için giriş yap." : "Atölyeye hoş geldin."
      }
      description={
        sharing
          ? "Öğretmen hesabına giriş yaptıktan sonra oyun yüklemeye devam edeceksin."
          : student
            ? "Kullanıcı adın ve parolanla giriş yap, sınıfına ve ödevlerine ulaş."
            : learning
              ? "Öğrenciysen kullanıcı adınla, öğretmensen e-posta adresinle giriş yap."
              : "Hesabına gir, kaldığın yerden devam et."
      }
    >
      <AuthForm mode="login" />
    </AccountLayout>
  );
}
