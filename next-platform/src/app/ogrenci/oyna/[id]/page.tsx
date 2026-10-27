import { notFound } from "next/navigation";
import { learningEnabled } from "@/server/learning-feature";
import { pageUser } from "@/server/page-access";
import { StudentPlayer } from "@/components/student-player";
export default async function Play({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ odev?: string }>;
}) {
  if (!learningEnabled()) notFound();
  await pageUser(["student"]);
  return (
    <StudentPlayer
      contentId={(await params).id}
      assignmentId={(await searchParams).odev}
    />
  );
}
