import { Layout } from '@/components/layout/Layout';

export default function Terms() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <header className="mb-12 text-center">
          <h1 className="headline-xl mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: December 2025</p>
        </header>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="headline-md mb-4">1. Acceptance of Terms</h2>
            <p className="body-base text-muted-foreground">
              By accessing and using L3arbiFit, you accept and agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="headline-md mb-4">2. Use of Service</h2>
            <p className="body-base text-muted-foreground mb-4">
              You agree to use L3arbiFit only for lawful purposes and in accordance with these Terms.
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Use the service in any way that violates applicable laws or regulations</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Attempt to gain unauthorized access to any part of the service</li>
              <li>Use automated systems to access the service without permission</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="headline-md mb-4">3. User Accounts</h2>
            <p className="body-base text-muted-foreground">
              When you create an account with us, you must provide accurate and complete information. 
              You are responsible for maintaining the confidentiality of your account credentials and 
              for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="headline-md mb-4">4. Intellectual Property</h2>
            <p className="body-base text-muted-foreground">
              All content published on L3arbiFit, including articles, images, and design elements,
              is protected by copyright and other intellectual property laws. You may not reproduce,
              distribute, or create derivative works without explicit permission.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="headline-md mb-4">5. User Content</h2>
            <p className="body-base text-muted-foreground mb-4">
              By posting comments or other content on L3arbiFit, you grant us a non-exclusive,
              royalty-free license to use, display, and distribute your content. You represent that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You own or have the right to post the content</li>
              <li>Your content does not infringe on others' rights</li>
              <li>Your content is not defamatory, obscene, or otherwise objectionable</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="headline-md mb-4">6. Disclaimer of Warranties</h2>
            <p className="body-base text-muted-foreground">
              L3arbiFit is provided "as is" without warranties of any kind. We do not guarantee that
              the service will be uninterrupted, secure, or error-free. We are not responsible for
              the accuracy or reliability of any content published on the platform.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="headline-md mb-4">7. Limitation of Liability</h2>
            <p className="body-base text-muted-foreground">
              To the fullest extent permitted by law, L3arbiFit shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from your use of
              or inability to use the service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="headline-md mb-4">8. Changes to Terms</h2>
            <p className="body-base text-muted-foreground">
              We reserve the right to modify these Terms at any time. We will notify users of 
              significant changes by posting a notice on our website. Continued use of the service 
              after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="headline-md mb-4">9. Contact Information</h2>
            <p className="body-base text-muted-foreground">
              For questions about these Terms of Service, please contact us through our{' '}
              <a href="/contact" className="underline hover:text-foreground">contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
