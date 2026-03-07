-- Insert initial pages for CMS
INSERT INTO public.pages (slug, title, sections, updated_by)
VALUES
('about', 'About', '[{"id":"sec1","heading":"About L3arbiFit","content":"<p>Empowering your fitness journey with expert guidance, personalized workouts, and a supportive community.</p>","bgColor":"#ffffff"}]', null)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.pages (slug, title, sections, updated_by)
VALUES
('contact', 'Contact', '[{"id":"sec1","heading":"Get in Touch","content":"<p>Have a question, suggestion, or just want to say hello? We'd love to hear from you.</p>","bgColor":"#ffffff"}]', null)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.pages (slug, title, sections, updated_by)
VALUES
('privacy', 'Privacy Policy', '[{"id":"sec1","heading":"Privacy Policy","content":"<p>Your privacy is important to us. It is L3arbiFit''s policy to respect your privacy regarding any information we may collect...</p>","bgColor":"#ffffff"}]', null)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.pages (slug, title, sections, updated_by)
VALUES
('terms', 'Terms of Service', '[{"id":"sec1","heading":"Terms of Service","content":"<p>By accessing and using L3arbiFit, you agree to be bound by the following terms and conditions. Please read them carefully.</p>","bgColor":"#ffffff"}]', null)
ON CONFLICT (slug) DO NOTHING;
