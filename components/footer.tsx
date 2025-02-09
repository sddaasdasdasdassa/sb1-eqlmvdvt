import { Sprout, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Footer() {
  return (
    <footer className="border-t bg-muted/50 mt-24">
      <div className="container py-12 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
        
        {/* Brand Section */}
        <div className="space-y-4 md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2">
            <Sprout className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold">Online Nursery</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Bringing nature to your doorstep since 2012
          </p>
          
          {/* Newsletter */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Get Growing Tips</p>
            <div className="flex gap-2">
              <Input placeholder="Your email" className="h-8" />
              <Button size="sm" className="h-8">Subscribe</Button>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/shop" className="hover:text-primary transition-colors">
                Shop Plants
              </Link>
            </li>
            <li>
              <Link href="/care-guides" className="hover:text-primary transition-colors">
                Care Guides
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-primary transition-colors">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-primary transition-colors">
                FAQs
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="font-semibold mb-4">Contact Us</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>(555) 123-4567</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a href="mailto:contact@onlinenursery.store" className="hover:text-primary">
                contact@onlinenursery.store
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>123 Garden Lane, Green Valley</span>
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="font-semibold mb-4">Follow Us</h3>
          <div className="flex gap-4">
            <a href="#" className="p-2 hover:bg-accent rounded-full">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="p-2 hover:bg-accent rounded-full">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="p-2 hover:bg-accent rounded-full">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          © 2024 Online Nursery. All rights reserved.
          <div className="mt-2">
            <Link href="/privacy" className="hover:text-primary px-3">Privacy</Link>
            <Link href="/terms" className="hover:text-primary px-3">Terms</Link>
            <Link href="/cookies" className="hover:text-primary px-3">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
