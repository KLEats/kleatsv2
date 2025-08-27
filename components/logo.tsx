import Image from "next/image"
import Link from "next/link"

type LogoProps = {
  className?: string
  // imgClassName is allowed for visual tweaks, but size is controlled by container to avoid CLS
  imgClassName?: string
}

export default function Logo({ className = "", imgClassName = "" }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center ${className}`}>
      {/* Fixed-size slot to prevent layout shift (140x36) */}
      <div className="relative w-[140px] h-[36px] shrink-0">
        <Image
          src="/logo.svg"
          alt="KL Eats Logo"
          fill
          priority
          sizes="140px"
          className={`object-contain ${imgClassName}`}
        />
      </div>
    </Link>
  )
}
