import Link from 'next/link'

const GOLD = '#D4AF37'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white px-6 flex items-center justify-center">
      <div className="max-w-md text-center">
        <p className="text-6xl font-bold mb-4" style={{ color: GOLD }}>
          404
        </p>
        <h1 className="text-2xl font-bold mb-3">Page not found</h1>
        <p className="text-white/60 text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-bold text-[15px] py-3.5 px-8 rounded-xl transition-all hover:brightness-110 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          style={{ background: GOLD, color: '#000' }}
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
