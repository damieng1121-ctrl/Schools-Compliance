import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = { title: "Privacy policy — Schools Compliance" };

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy policy" updated="22 September 2026">
      <p>
        Schools Compliance is operated by Education Lincs (&ldquo;we&rdquo;, &ldquo;us&rdquo;). This policy
        explains what personal data we collect through the app, why, and how it&apos;s protected. If you have
        questions, contact us at{" "}
        <a href="mailto:helpdesk@education-lincs.com">helpdesk@education-lincs.com</a>.
      </p>

      <div>
        <h2>What the app is for</h2>
        <p>
          Schools Compliance lets school staff self-assess their school&apos;s readiness against the
          Department for Education&apos;s digital and technology standards, record evidence and review dates,
          and email themselves progress reports. It is a working self-assessment tool, not an official DfE
          certification.
        </p>
      </div>

      <div>
        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Account information</strong> — your name, work email address, and (for email/password
            accounts) a securely hashed password. If you sign in with Google, we receive your name, email
            address, and Google account identifier from Google instead of storing a password.
          </li>
          <li>
            <strong>School information</strong> — your school&apos;s name, DfE unique reference number (if
            provided), logo (if provided), and time zone.
          </li>
          <li>
            <strong>Compliance records you enter</strong> — the status of each checklist item, any free-text
            notes or evidence links you add, and review due dates. This is intended to be administrative
            information about your school&apos;s IT setup and policies — please don&apos;t enter personal data
            about pupils or other individuals in these fields.
          </li>
          <li>
            <strong>Usage and audit records</strong> — an internal log of actions such as sign-ins and
            checklist updates, tied to your account and timestamped, kept for security and accountability.
          </li>
          <li>
            <strong>Technical data</strong> — standard web server logs (e.g. IP address, timestamps) generated
            by our hosting provider, and a single essential session cookie that keeps you signed in. We don&apos;t
            use advertising, tracking, or analytics cookies.
          </li>
        </ul>
      </div>

      <div>
        <h2>Why we process it</h2>
        <p>
          We process this information to provide the service you or your school signed up for (performance of
          a contract), to keep the platform secure and working correctly (legitimate interests), and, where
          you choose to use Google sign-in, on the basis of your consent to that sign-in method.
        </p>
      </div>

      <div>
        <h2>Who we share it with</h2>
        <p>
          We don&apos;t sell your data or share it with advertisers. We use the following processors to run
          the service:
        </p>
        <ul>
          <li>
            <strong>Neon</strong> — our database provider, hosting your school&apos;s data in a UK/EU (London)
            data centre.
          </li>
          <li>
            <strong>Google Cloud</strong> — hosts the application itself (europe-west2, London), and provides
            optional &ldquo;Sign in with Google&rdquo; authentication.
          </li>
          <li>
            <strong>Google Workspace / Gmail</strong> — sends emails the app generates on your behalf, such as
            new-account emails and the compliance reports you request.
          </li>
        </ul>
        <p>
          Other schools using the platform cannot see your school&apos;s data — every school&apos;s records are
          kept separate and access-controlled. Platform administrators (Education Lincs staff) can access
          school data only as needed to operate and support the service.
        </p>
      </div>

      <div>
        <h2>How long we keep it</h2>
        <p>
          We keep your account and school data for as long as your school&apos;s account is active. If a
          school account is closed, we&apos;ll delete or anonymise the data within a reasonable period, unless
          we&apos;re required to keep it for longer (for example, to resolve a dispute or meet a legal
          obligation). Audit log entries are kept for a limited period for security and accountability
          purposes.
        </p>
      </div>

      <div>
        <h2>Your rights</h2>
        <p>Under UK GDPR and the Data Protection Act 2018, you have the right to:</p>
        <ul>
          <li>Ask for a copy of the personal data we hold about you.</li>
          <li>Ask us to correct inaccurate data, or delete it where there&apos;s no good reason to keep it.</li>
          <li>Object to, or ask us to restrict, certain processing.</li>
          <li>Ask for your data in a portable format.</li>
          <li>
            Complain to the{" "}
            <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noreferrer">
              Information Commissioner&apos;s Office (ICO)
            </a>{" "}
            if you think we&apos;ve mishandled your data.
          </li>
        </ul>
        <p>
          To exercise any of these, email{" "}
          <a href="mailto:helpdesk@education-lincs.com">helpdesk@education-lincs.com</a>. Day-to-day account
          management (adding or removing staff, correcting school details) is also available directly to your
          school&apos;s admin within the app.
        </p>
      </div>

      <div>
        <h2>Children&apos;s data</h2>
        <p>
          Schools Compliance is a staff-facing IT compliance tool. It is not designed or intended to collect
          personal data about pupils, and schools should not enter pupil-identifiable information into it.
        </p>
      </div>

      <div>
        <h2>Security</h2>
        <p>
          Data is encrypted in transit (HTTPS/TLS). Passwords are hashed and never stored in plain text.
          Access to each school&apos;s data is restricted to that school&apos;s own staff and platform
          administrators.
        </p>
      </div>

      <div>
        <h2>Changes to this policy</h2>
        <p>
          We may update this policy from time to time, for example if we add a new feature or processor. The
          &ldquo;last updated&rdquo; date at the top of this page will always reflect the current version.
        </p>
      </div>

      <div>
        <h2>Contact</h2>
        <p>
          Education Lincs, <a href="mailto:helpdesk@education-lincs.com">helpdesk@education-lincs.com</a>
        </p>
      </div>
    </LegalLayout>
  );
}
