"use client"

import PageHeader from "@/components/page-header"
import Footer from "@/components/footer"

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen page-transition">
      <PageHeader title="Refund & Cancellation Policy" />

      <section className="container px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 md:p-8 space-y-6 text-sm leading-7 text-muted-foreground">
              <h2 className="text-base font-semibold text-foreground">Refund & Cancellation Policy</h2>
              <p>
                This refund and cancellation policy outlines how you can cancel or seek a refund for a product/service
                purchased through the Platform.
              </p>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Cancellations</h3>
                <p>
                  Cancellations must be made within 2 days of placing the order. If shipping has already begun or the order
                  is out for delivery, cancellation may not be possible. You may reject the product at the doorstep.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Perishable Items</h3>
                <p>
                  Perishable items (e.g., food, flowers, etc.) cannot be cancelled. Refunds/replacements may be provided
                  only if the delivered product is of poor quality.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Damaged or Defective Items</h3>
                <p>
                  Damaged or defective items must be reported within 2 days of receipt to our customer service team. The
                  seller/merchant will verify before approving.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Not as Expected</h3>
                <p>
                  If the product does not match expectations, you must inform customer service within 2 days of receipt.
                  Decisions will be made after review.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Refund Timeline</h3>
                <p>
                  If a refund is approved, it will be processed within 3 business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
