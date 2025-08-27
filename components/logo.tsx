import Image from "next/image"
import Link from "next/link"

type LogoProps = {
  className?: string
  imgClassName?: string
}

export default function Logo({ className = "", imgClassName = "h-9 w-auto" }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center ${className}`}>
      {/* Render horizontal SVG logo only, no adjacent text */}
      <Image
        src="/logo.svg"
        alt="KL Eats Logo"
        width={140}
        height={36}
        priority
  sizes="(max-width: 768px) 112px, 140px"
        className={imgClassName}
      />
    </Link>
  )
}
