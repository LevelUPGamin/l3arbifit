import { Layout } from "@/components/layout/Layout";

const About = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="headline-xl mb-4">About L3arbiFit</h1>
          <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
            A sanctuary for thoughtful reading in a world of endless scrolling.
          </p>
        </header>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="headline-lg mb-4">Our Mission</h2>
            <p className="body-md text-muted-foreground leading-relaxed">
              L3arbiFit was born from a simple belief: that fitness deserves a beautiful home.
              In an age of information overload, we've created a space where fitness takes center stage,
              where health is celebrated, and where users can immerse themselves in fitness content
              without distraction.
            </p>
          </section>

          <div className="newspaper-rule my-12" />

          <section className="mb-12">
            <h2 className="headline-lg mb-4">Design Philosophy</h2>
            <p className="body-md text-muted-foreground leading-relaxed mb-6">
              Our design draws inspiration from the golden age of print journalism—clean lines, 
              generous whitespace, and typography that guides the eye naturally through each piece. 
              We offer two distinct reading experiences:
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-6 border border-border rounded-lg">
                <h3 className="headline-md mb-2">Paper Theme</h3>
                <p className="body-sm text-muted-foreground">
                  Warm, off-white tones reminiscent of aged newsprint. Perfect for extended 
                  reading sessions that feel as comfortable as your favorite book.
                </p>
              </div>
              <div className="p-6 bg-foreground text-background rounded-lg">
                <h3 className="headline-md mb-2">Ink Theme</h3>
                <p className="body-sm opacity-80">
                  High-contrast black and white for those who prefer bold, striking visuals. 
                  Ideal for late-night reading or reducing eye strain.
                </p>
              </div>
            </div>
          </section>

          <div className="newspaper-rule my-12" />

          <section className="mb-12">
            <h2 className="headline-lg mb-4">Features</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">→</span>
                <div>
                  <strong className="headline-sm">Distraction-Free Reading</strong>
                  <p className="body-sm text-muted-foreground">Clean layouts that let content breathe.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">→</span>
                <div>
                  <strong className="headline-sm">Bookmarks & Collections</strong>
                  <p className="body-sm text-muted-foreground">Save articles for later and build your personal library.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">→</span>
                <div>
                  <strong className="headline-sm">PDF Export</strong>
                  <p className="body-sm text-muted-foreground">Take your reading offline with beautifully formatted exports.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">→</span>
                <div>
                  <strong className="headline-sm">Smart Search</strong>
                  <p className="body-sm text-muted-foreground">Find exactly what you're looking for across all content.</p>
                </div>
              </li>
            </ul>
          </section>

          <div className="newspaper-rule my-12" />

          <section className="text-center">
            <h2 className="headline-lg mb-4">Join Our Community</h2>
            <p className="body-md text-muted-foreground mb-6">
              Whether you're a casual fitness enthusiast or a devoted athlete, L3arbiFit welcomes you.
              Create an account to unlock bookmarks, personalized recommendations, and more.
            </p>
            <a 
              href="/auth" 
              className="btn-editorial-filled inline-block"
            >
              Get Started
            </a>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default About;
