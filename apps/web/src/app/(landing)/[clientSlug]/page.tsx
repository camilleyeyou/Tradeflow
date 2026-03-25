interface Props {
  params: Promise<{ clientSlug: string }>
}

export default async function LandingPage({ params }: Props) {
  const { clientSlug } = await params
  return (
    <main>
      <p>Landing page for: {clientSlug}</p>
    </main>
  )
}
