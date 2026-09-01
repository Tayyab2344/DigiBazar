import { redirect } from "next/navigation";

export default async function LegacyCompanyRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/store/${slug}`);
}
