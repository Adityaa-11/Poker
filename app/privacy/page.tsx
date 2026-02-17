import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl space-y-8">
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <p className="text-muted-foreground">Last updated: February 2026</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p className="text-muted-foreground">
            PokerPals (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, and safeguard your information when you use 
            our mobile application and website (collectively, the &quot;Service&quot;).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Information We Collect</h2>
          <p className="text-muted-foreground">We collect the following types of information:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Account Information:</strong> When you create an account, we collect your email address and display name.</li>
            <li><strong>Game Data:</strong> We store poker game records you create, including buy-in amounts, cash-out amounts, game stakes, and settlement information.</li>
            <li><strong>Group Data:</strong> Information about groups you create or join, including group names and membership.</li>
            <li><strong>Usage Data:</strong> We may collect information about how you interact with the Service, such as pages viewed and features used.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
          <p className="text-muted-foreground">We use your information to:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Provide, maintain, and improve the Service</li>
            <li>Track your poker game history and calculate balances</li>
            <li>Facilitate group management and game settlements</li>
            <li>Send you notifications about game activity (if enabled)</li>
            <li>Respond to your requests and support inquiries</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Data Storage and Security</h2>
          <p className="text-muted-foreground">
            Your data is stored securely using Supabase, a trusted cloud database provider. 
            We implement appropriate technical and organizational measures to protect your personal 
            information against unauthorized access, alteration, disclosure, or destruction. All data 
            is transmitted over encrypted connections (HTTPS/TLS).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Data Sharing</h2>
          <p className="text-muted-foreground">
            We do not sell, trade, or rent your personal information to third parties. Your game data 
            is only visible to members of the groups you belong to. We may share information only in the 
            following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>With your consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights or the safety of our users</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Your Rights</h2>
          <p className="text-muted-foreground">You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Access:</strong> View all data associated with your account through the app</li>
            <li><strong>Update:</strong> Modify your profile information at any time</li>
            <li><strong>Delete:</strong> Permanently delete your account and all associated data through Settings &gt; Data &gt; Delete Account</li>
            <li><strong>Export:</strong> Request a copy of your data by contacting us</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Children&apos;s Privacy</h2>
          <p className="text-muted-foreground">
            The Service is not intended for use by anyone under the age of 18. We do not knowingly 
            collect personal information from children under 18. If we become aware that we have 
            collected data from a child under 18, we will take steps to delete that information.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Changes to This Policy</h2>
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. We will notify you of any changes by 
            posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Contact Us</h2>
          <p className="text-muted-foreground">
            If you have any questions about this Privacy Policy, please contact us through the 
            Support section in the app settings.
          </p>
        </section>
      </div>
    </div>
  )
}
