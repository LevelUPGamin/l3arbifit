import { Layout } from '@/components/layout/Layout';

export default function Privacy() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <header className="mb-12 text-center">
          <h1 className="headline-xl mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: December 2025</p>
        </header>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="headline-md mb-4">1. Information We Collect</h2>
            <p className="body-base text-muted-foreground mb-4">
              We collect information you provide directly to us, such as when you create an account, 
              subscribe to our newsletter, submit a contact form, or interact with our articles.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Account information (email address, name)</li>
              <li>Content you provide (comments, messages)</li>
              <li>Usage data (articles read, bookmarks)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="headline-md mb-4">2. How We Use Your Information</h2>
            <p className="body-base text-muted-foreground mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide, maintain, and improve our services</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Personalize your experience on our platform</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="headline-md mb-4">3. Information Sharing</h2>
            <p className="body-base text-muted-foreground mb-4">
              We do not sell, trade, or otherwise transfer your personal information to third parties. 
              We may share information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="headline-md mb-4">4. Data Security</h2>
            <p className="body-base text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="headline-md mb-4">5. Cookies</h2>
            <p className="body-base text-muted-foreground">
              We use cookies and similar technologies to enhance your experience, analyze site traffic, 
              and understand how our services are used. You can control cookies through your browser settings.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="headline-md mb-4">6. Your Rights</h2>
            <p className="body-base text-muted-foreground mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
            </ul>
          </section>

          <section>
            <h2 className="headline-md mb-4">7. Contact Us</h2>
            <p className="body-base text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us through our{' '}
              <a href="/contact" className="underline hover:text-foreground">contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
