import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, ArrowUpRight, Check, Loader2, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Logo } from '../components/Navbar';
import { FadeUp, MaskTitle } from '../components/Reveal';
import { FOOTER_LINKS, NAV_LINKS, SITE } from '../data/site';

type Status = 'idle' | 'sending' | 'sent' | 'mailto' | 'error';

interface FormState {
  name: string;
  email: string;
  topic: string;
  message: string;
}

const TOPICS = ['Estratégia de marketing', 'Social media e conteúdo', 'Tráfego pago', 'Branding e site', 'Outro assunto'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(f: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (f.name.trim().length < 2) errors.name = 'Informe seu nome.';
  if (!EMAIL_RE.test(f.email.trim())) errors.email = 'Informe um e-mail válido.';
  if (f.message.trim().length < 10) errors.message = 'Conte um pouco mais (mínimo de 10 caracteres).';
  return errors;
}

function mailtoHref(f: FormState) {
  const subject = `[${f.topic}] Contato de ${f.name}`;
  const body = `${f.message}\n\n— ${f.name} (${f.email})`;
  return `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function ContactSection() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', topic: TOPICS[0], message: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<Status>('idle');

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      document.getElementById(`contact-${first}`)?.focus();
      return;
    }
    // sem endpoint configurado: abre o app de e-mail com a mensagem pronta
    if (!SITE.contactEndpoint) {
      window.location.href = mailtoHref(form);
      setStatus('mailto');
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch(SITE.contactEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('sent');
      setForm({ name: '', email: '', topic: TOPICS[0], message: '' });
    } catch (err) {
      console.warn('[contato] Falha no envio:', err);
      setStatus('error');
    }
  };

  const fieldError = (k: keyof FormState) =>
    errors[k] ? (
      <p id={`contact-${k}-error`} className="mt-1.5 text-xs text-amber-300">
        {errors[k]}
      </p>
    ) : null;

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative overflow-hidden pt-28 sm:pt-36">
      <div
        className="pointer-events-none absolute left-1/2 top-40 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-volt-500/10 blur-[120px]"
        aria-hidden
      />
      <div className="container-x relative">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <FadeUp className="eyebrow mb-6">Contact</FadeUp>
            <MaskTitle
              id="contact-title"
              lines={["Let's build", "what's next."]}
              className="display text-[clamp(2.4rem,3.6vw,3.2rem)]"
              lineClassName={(i) => (i === 1 ? 'text-ink-mute' : 'text-ink')}
            />
            <FadeUp delay={0.1}>
              <p className="mt-8 max-w-md text-lg font-normal leading-[1.4] text-ink-soft">
                Conte seu objetivo de marketing. Respondemos com um diagnóstico inicial, perguntas certas e um plano possível.
              </p>
              <a href={`mailto:${SITE.contactEmail}`} className="group mt-8 inline-flex items-center gap-3 text-lg text-ink">
                <Mail className="h-5 w-5 text-ink-mute" aria-hidden />
                <span className="border-b border-cork pb-0.5 transition-colors group-hover:border-ink">{SITE.contactEmail}</span>
              </a>
            </FadeUp>
          </div>

          <FadeUp>
            <form onSubmit={submit} noValidate className="surface-outline p-6 sm:p-8" aria-describedby="contact-status">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="eyebrow mb-2 block">
                    Nome
                  </label>
                  <input
                    id="contact-name"
                    className="field"
                    value={form.name}
                    onChange={set('name')}
                    autoComplete="name"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'contact-name-error' : undefined}
                  />
                  {fieldError('name')}
                </div>
                <div>
                  <label htmlFor="contact-email" className="eyebrow mb-2 block">
                    E-mail
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    className="field"
                    value={form.email}
                    onChange={set('email')}
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'contact-email-error' : undefined}
                  />
                  {fieldError('email')}
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="contact-topic" className="eyebrow mb-2 block">
                  Assunto
                </label>
                <select id="contact-topic" className="field" value={form.topic} onChange={set('topic')}>
                  {TOPICS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="mt-4">
                <label htmlFor="contact-message" className="eyebrow mb-2 block">
                  Mensagem
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  className="field resize-y"
                  value={form.message}
                  onChange={set('message')}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                />
                {fieldError('message')}
              </div>
              <button type="submit" className="btn-primary mt-6 w-full" disabled={status === 'sending'}>
                {status === 'sending' ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                )}
                {status === 'sending' ? 'Enviando…' : 'Enviar mensagem'}
              </button>
              <div id="contact-status" aria-live="polite" className="min-h-[1.5rem]">
                <AnimatePresence mode="wait">
                  {status !== 'idle' && status !== 'sending' && (
                    <motion.p
                      key={status}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 flex items-start gap-2 text-sm text-ink-soft"
                    >
                      {status === 'sent' && (
                        <>
                          <Check className="mt-0.5 h-4 w-4 text-amber-glow" aria-hidden /> Mensagem enviada. Obrigado!
                        </>
                      )}
                      {status === 'mailto' && (
                        <>
                          <Check className="mt-0.5 h-4 w-4 text-amber-glow" aria-hidden />
                          <span>
                            Abrimos seu aplicativo de e-mail com a mensagem pronta. Se nada abriu,{' '}
                            <a className="underline decoration-ink/40 underline-offset-4 hover:text-ink" href={mailtoHref(form)}>
                              clique aqui
                            </a>
                            .
                          </span>
                        </>
                      )}
                      {status === 'error' && (
                        <span>
                          Não foi possível enviar agora.{' '}
                          <a className="underline decoration-ink/40 underline-offset-4 hover:text-ink" href={mailtoHref(form)}>
                            Envie por e-mail
                          </a>
                          .
                        </span>
                      )}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </FadeUp>
        </div>
      </div>

      <Footer />
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative mt-28 border-t border-cork">
      <div className="container-x">
        <p
          className="select-none py-10 text-center text-[clamp(3.5rem,17vw,17rem)] font-medium uppercase leading-none text-ink/[0.05]"
          aria-hidden
        >
          Nova / Digital
        </p>
        <div className="flex flex-col gap-8 border-t border-cork py-10 md:flex-row md:items-center md:justify-between">
          <Logo />
          <nav aria-label="Rodapé">
            <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-mute">
              {[...NAV_LINKS, ...FOOTER_LINKS].map((l) => (
                <li key={l.id}>
                  <a href={`#${l.id}`} className="transition-colors hover:text-ink">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <a href="#home" className="btn-ghost min-h-[44px] self-start px-5 md:self-auto">
            Voltar ao topo <ArrowUp className="h-4 w-4" aria-hidden />
          </a>
        </div>
        <div className="flex flex-col gap-2 pb-10 text-xs text-ink-mute md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} NOVA / DIGITAL.</p>
          <p>Texturas da Terra: NASA Blue Marble e Black Marble (domínio público), via pacote three-globe. Fronteiras: Natural Earth.</p>
        </div>
      </div>
    </footer>
  );
}
