import { redirect } from 'next/navigation'

export const revalidate = 3600

interface Props {
  params: Promise<{ clientSlug: string }>
}

export default async function ClientLandingRedirect({ params }: Props) {
  const { clientSlug } = await params
  redirect(`/${clientSlug}/ac-repair`)
}
