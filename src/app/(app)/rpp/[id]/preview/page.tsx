import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RppPreviewRedirectPage({ params }: PageProps) {
  const resolvedParams = await params;
  redirect(`/modul-ajar/${resolvedParams.id}/preview`);
}
