import { PublicSharePage } from "@/components/share/public-share-page";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PublicSharePage token={token} />;
}
