import React from 'react'
import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <Link to="/" className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-6 transition-colors">
          ← Back to Home
        </Link>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Terms and Conditions</h1>
        <p className="text-slate-400 text-sm">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="card p-8 space-y-8 text-slate-300 text-sm leading-relaxed">

        <section>
          <h2 className="font-display font-bold text-white text-lg mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using CreatorHub ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Platform. CreatorHub reserves the right to modify these terms at any time. Continued use of the Platform after changes constitutes acceptance of the new terms.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-white text-lg mb-3">2. Description of Service</h2>
          <p>CreatorHub is a marketplace platform that connects individuals seeking digital creative services with creators, developers, builders, animators, and other digital workers. The Platform allows users to post and browse advertisements for work opportunities in categories including Roblox development, Blender/3D art, and coding.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-white text-lg mb-3">3. User Accounts</h2>
          <ul className="space-y-2 list-disc pl-5">
            <li>You must be at least 13 years of age to create an account.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
            <li>You must provide accurate and complete information when creating your account.</li>
            <li>You may not create accounts for others without their permission.</li>
            <li>CreatorHub reserves the right to suspend or terminate accounts that violate these terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-bold text-white text-lg mb-3">4. User Content and Advertisements</h2>
          <ul className="space-y-2 list-disc pl-5">
            <li>You retain ownership of content you post on the Platform.</li>
            <li>By posting content, you grant CreatorHub a non-exclusive license to display and distribute that content on the Platform.</li>
            <li>You are solely responsible for the accuracy of your advertisements and content.</li>
            <li>CreatorHub does not verify the identity of users or the legitimacy of any job postings.</li>
            <li>You agree not to post false, misleading, or fraudulent advertisements.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-bold text-white text-lg mb-3">5. Prohibited Content</h2>
          <p className="mb-2">You agree not to post, share, or transmit any content that:</p>
          <ul className="space-y-2 list-disc pl-5">
            <li>Is illegal, harmful, threatening, abusive, or harassing</li>
            <li>Is fraudulent, deceptive, or misleading</li>
            <li>Infringes on any intellectual property rights</li>
            <li>Contains malware, viruses, or malicious code</li>
            <li>Is sexually explicit or inappropriate for minors</li>
            <li>Promotes illegal activities or services</li>
            <li>Contains spam or unsolicited commercial messages</li>
            <li>Violates any applicable laws or regulations</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-bold text-white text-lg mb-3">6. Payments and Featured Advertisements</h2>
          <ul className="space-y-2 list-disc pl-5">
            <li>Featured advertisement payments are processed securely through PayPal.</li>
            <li>Featured ads are displayed for 7 days from the time of purchase.</li>
            <li>All payments are final and non-refundable unless required by applicable law.</li>
            <li>CreatorHub is not responsible for any transactions between users conducted outside the Platform.</li>
            <li>CreatorHub does not mediate disputes between employers and workers.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-bold text-white text-lg mb-3">7. Disclaimer of Warranties</h2>
          <p>The Platform is provided "as is" and "as available" without any warranties of any kind, either express or implied. CreatorHub does not warrant that the Platform will be uninterrupted, error-free, or free of viruses or other harmful components. CreatorHub does not endorse, verify, or guarantee any users, advertisements, or services listed on the Platform.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-white text-lg mb-3">8. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, CreatorHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform. CreatorHub's total liability to you shall not exceed the amount you paid to CreatorHub in the 12 months preceding the claim.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-white text-lg mb-3">9. Privacy</h2>
          <p>Your use of the Platform is also governed by our Privacy Policy. By using CreatorHub, you consent to the collection and use of your information as described in the Privacy Policy. We collect only the information necessary to operate the Platform and do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-white text-lg mb-3">10. Account Deletion and Data</h2>
          <p>You may delete your account at any time through your Dashboard under Account Settings. Upon deletion, all your personal data, advertisements, and associated content will be permanently removed from our systems. This process is irreversible.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-white text-lg mb-3">11. Intellectual Property</h2>
          <p>The CreatorHub name, logo, and all related marks, designs, and content are the exclusive property of CreatorHub and are protected by copyright and trademark laws. You may not use, copy, or reproduce any CreatorHub branding without prior written permission.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-white text-lg mb-3">12. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these Terms or your use of the Platform shall be resolved through good-faith negotiation, and if necessary, binding arbitration.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-white text-lg mb-3">13. Contact</h2>
          <p>If you have any questions about these Terms and Conditions, please contact us through the Platform. We are committed to resolving any concerns promptly and fairly.</p>
        </section>

        <div className="pt-4 border-t border-surface-500">
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} CreatorHub. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
