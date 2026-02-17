import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl space-y-8">
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Terms of Service</h1>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <p className="text-muted-foreground">Last updated: February 2026</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By accessing or using PokerPals (&quot;the Service&quot;), you agree to be bound by these 
            Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Description of Service</h2>
          <p className="text-muted-foreground">
            PokerPals is a poker game tracking application that allows users to record home poker 
            games, manage groups of players, track buy-ins and cash-outs, and calculate settlements 
            between players. The Service is a tracking tool only and does not facilitate real-money 
            gambling or wagering of any kind.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. User Accounts</h2>
          <p className="text-muted-foreground">To use certain features, you must create an account. You agree to:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
            <li>Accept responsibility for all activity that occurs under your account</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Acceptable Use</h2>
          <p className="text-muted-foreground">You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to the Service or its systems</li>
            <li>Interfere with or disrupt the Service or its infrastructure</li>
            <li>Impersonate another person or entity</li>
            <li>Use the Service to facilitate illegal gambling activities</li>
            <li>Upload malicious code or attempt to compromise the security of the Service</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. User Content</h2>
          <p className="text-muted-foreground">
            You retain ownership of any data you submit to the Service (game records, group names, etc.). 
            By using the Service, you grant us a limited license to store and display this data as 
            necessary to provide the Service to you and your group members.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Disclaimer</h2>
          <p className="text-muted-foreground">
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, 
            either express or implied. We do not guarantee that the Service will be uninterrupted, 
            secure, or error-free. PokerPals is a record-keeping tool and we are not responsible 
            for the accuracy of game data entered by users or for any financial disputes between players.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Limitation of Liability</h2>
          <p className="text-muted-foreground">
            To the fullest extent permitted by law, PokerPals shall not be liable for any indirect, 
            incidental, special, consequential, or punitive damages arising out of or relating to your 
            use of the Service, including but not limited to financial losses resulting from inaccurate 
            game tracking or settlement calculations.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Account Termination</h2>
          <p className="text-muted-foreground">
            You may delete your account at any time through the Settings page. We reserve the right 
            to suspend or terminate accounts that violate these Terms. Upon termination, your data 
            will be permanently deleted.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Changes to Terms</h2>
          <p className="text-muted-foreground">
            We may modify these Terms at any time. Continued use of the Service after changes 
            constitutes acceptance of the modified Terms. We will make reasonable efforts to notify 
            users of significant changes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Governing Law</h2>
          <p className="text-muted-foreground">
            These Terms shall be governed by and construed in accordance with the laws of the 
            United States, without regard to conflict of law provisions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">11. Contact</h2>
          <p className="text-muted-foreground">
            If you have any questions about these Terms, please contact us through the 
            Support section in the app settings.
          </p>
        </section>
      </div>
    </div>
  )
}
