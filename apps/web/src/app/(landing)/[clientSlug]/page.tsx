import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ clientSlug: string }>
}

export default async function ClientLandingRedirect({ params }: Props) {
  const { clientSlug } = await params
  redirect(`/${clientSlug}/ac-repair`)
}
