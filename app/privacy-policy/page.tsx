"use client"

import { Shield, Mail, FileText, Lock, RefreshCw, Users } from "lucide-react"
import Footer from "@/components/footer"
import PageHeader from "@/components/page-header"

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen page-transition">
      <PageHeader title="Privacy Policy" />

      {/* Intro */}
      <section className="container px-4 pt-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-8 w-8 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-2">Introduction</h2>
                  <p className="text-sm text-muted-foreground">
                    This Privacy Policy describes how EQUITECH LAB PRIVATE LIMITED ("we", "our", "us") collects, uses,
                    shares, protects, or otherwise processes your personal data through our website kleats.in ("Platform").
                  </p>
                  <p className="text-sm text-muted-foreground mt-3">
                    By visiting the Platform or availing services, you expressly agree to be bound by this Privacy Policy,
                    Terms of Use, and applicable laws. If you do not agree, please do not use the Platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="container px-4 pb-12">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* 1. Collection */}
          <article className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-3 mb-3">
                <div className="mt-1 h-8 w-8 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold">1. Collection</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">We may collect personal information including:</p>
              <ul className="list-disc pl-5 text-sm leading-7 text-muted-foreground">
                <li>Name, date of birth, address, contact number, email ID</li>
                <li>Identity/address proof and payment details</li>
                <li>Biometric information (if opted)</li>
                <li>Behavior and technical data related to your use of the Platform</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                You may choose not to provide certain data, but this may restrict your use of services.
              </p>
            </div>
          </article>

          {/* 2. Usage */}
          <article className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-3 mb-3">
                <div className="mt-1 h-8 w-8 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold">2. Usage</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">We use personal data to:</p>
              <ul className="list-disc pl-5 text-sm leading-7 text-muted-foreground">
                <li>Process and fulfill your orders</li>
                <li>Enhance customer experience</li>
                <li>Resolve disputes and troubleshoot issues</li>
                <li>Inform you about offers, services, and updates</li>
                <li>Detect and prevent fraud or illegal activity</li>
                <li>Conduct research, analysis, and surveys</li>
              </ul>
            </div>
          </article>

          {/* 3. Sharing */}
          <article className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-3 mb-3">
                <div className="mt-1 h-8 w-8 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold">3. Sharing</h3>
              </div>
              <ul className="list-disc pl-5 text-sm leading-7 text-muted-foreground">
                <li>Our group entities and affiliates</li>
                <li>Sellers, business partners, logistics providers, and payment service providers</li>
                <li>Government or law enforcement agencies if required</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                We will not share your personal data without legitimate reasons.
              </p>
            </div>
          </article>

          {/* 4. Security Precautions */}
          <article className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-3 mb-3">
                <div className="mt-1 h-8 w-8 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold">4. Security Precautions</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                We follow reasonable security practices to protect your data but cannot guarantee 100% security due to
                inherent risks of internet transmission. Users must keep their login credentials safe.
              </p>
            </div>
          </article>

          {/* 5. Data Deletion & Retention */}
          <article className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-3 mb-3">
                <div className="mt-1 h-8 w-8 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Lock className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold">5. Data Deletion & Retention</h3>
              </div>
              <ul className="list-disc pl-5 text-sm leading-7 text-muted-foreground">
                <li>You may delete your account via profile settings or by writing to us.</li>
                <li>Deletion may be delayed if there are pending grievances or claims.</li>
                <li>Once deleted, account access is lost.</li>
                <li>Data is retained only as long as necessary or required by law.</li>
                <li>Some anonymized data may be retained for analysis.</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                👉 You can also request data deletion by emailing us at
                {" "}
                <a href="mailto:admin@kleats.in" className="text-primary underline underline-offset-4">admin@kleats.in</a>.
              </p>
            </div>
          </article>

          {/* 6. Your Rights */}
          <article className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-3 mb-3">
                <div className="mt-1 h-8 w-8 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold">6. Your Rights</h3>
              </div>
              <p className="text-sm text-muted-foreground">You may access, rectify, or update your personal data using Platform features.</p>
            </div>
          </article>

          {/* 7. Consent */}
          <article className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-3 mb-3">
                <div className="mt-1 h-8 w-8 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Shield className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold">7. Consent</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                By using our Platform, you consent to collection and use of your data as per this Privacy Policy. Withdrawal
                of consent may limit services.
              </p>
            </div>
          </article>

          {/* 8. Changes */}
          <article className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-3 mb-3">
                <div className="mt-1 h-8 w-8 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold">8. Changes</h3>
              </div>
              <p className="text-sm text-muted-foreground">We may update this Privacy Policy. Please review periodically.</p>
            </div>
          </article>

          {/* 9. Grievance Officer */}
          <article className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-3 mb-3">
                <div className="mt-1 h-8 w-8 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Mail className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold">9. Grievance Officer</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><span className="text-foreground font-medium">Name:</span> kleats</p>
                <p><span className="text-foreground font-medium">Address:</span> KL GLUG C424</p>
                <p><span className="text-foreground font-medium">Phone:</span> Mon–Fri, 9 AM – 6 PM</p>
                <p>
                  <span className="text-foreground font-medium">Contact:</span>{" "}
                  <a href="mailto:admin@kleats.in" className="text-primary underline underline-offset-4">admin@kleats.in</a>
                </p>
              </div>
            </div>
          </article>

          <p className="text-center text-xs text-muted-foreground pt-2 pb-4">Thank you for trusting Kleats.</p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
