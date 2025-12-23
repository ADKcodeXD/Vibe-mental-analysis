import { redirect } from 'next/navigation';
import { Locale } from '../../i18n-config';

export default async function IndexPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  redirect(`/${lang}/survey/identity-mirror`);
}
