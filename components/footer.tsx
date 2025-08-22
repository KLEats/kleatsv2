import Logo from "./logo"
import { Instagram, Github, Send } from "lucide-react"
import Link from 'next/link';



export default function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur-sm">
      <div className="container px-4 py-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <Logo className="mb-2" />
            <p className="text-xs text-muted-foreground">
              Pre-order your favorite campus food and skip the lines.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="mb-2 font-medium">Quick Links</h3>
              <ul className="space-y-1.5">
                <li><Link href="/" className="text-muted-foreground hover:text-primary">Home</Link></li>
                <li><Link href="/canteens" className="text-muted-foreground hover:text-primary">Canteens</Link></li>
                <li><Link href="/orders" className="text-muted-foreground hover:text-primary">My Orders</Link></li>
                <li><Link href="/account" className="text-muted-foreground hover:text-primary">Account</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium">Learn More</h3>
              <ul className="space-y-1.5">
                <li><Link href="/terms" className="text-muted-foreground hover:text-primary">Terms</Link></li>
                <li><Link href="/refund-policy" className="text-muted-foreground hover:text-primary">Refunds</Link></li>
                <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-primary">Privacy</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-primary">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="md:text-right">
            <h3 className="mb-2 text-sm font-medium">Follow Us</h3>
            <div className="flex space-x-3 md:justify-end">
              <a href="https://t.me/+X0n_azyktiVmMzI0" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Send className="h-5 w-5" /><span className="sr-only">Telegram</span></a>
              <a href="https://www.instagram.com/kleats.official?igsh=MTZna3N0Y3U1bmRudA==" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Instagram className="h-5 w-5" /><span className="sr-only">Instagram</span></a>
              <a href="https://github.com/KLEats/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Github className="h-5 w-5" /><span className="sr-only">GitHub</span></a>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t pt-4 text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} KL Eats (A Unit of Equitech Labs Pvt. Ltd.). Licensed under <a href="https://github.com/KLEats/kleatsv2/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GNU GPL V3</a>.</p>
        </div>
      </div>
    </footer>
  )
}
