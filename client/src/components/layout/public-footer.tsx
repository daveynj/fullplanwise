import { Link } from 'wouter';
import { footer } from '@shared/homepage-content';
import { publicNav } from '@shared/marketing-pages';

/** Footer for public information pages; same links and wording as the homepage footer. */
export function PublicFooter() {
  return (
    <footer className="bg-brand-navy text-white py-12">
      <div className="container mx-auto px-6 grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="font-nunito font-bold text-xl mb-3">PlanWise ESL</p>
          <p className="text-white/60 text-sm max-w-md leading-relaxed">{footer.brandLine}</p>
        </div>
        <ul className="space-y-2 text-sm">
          {[
            ...publicNav,
            { label: 'For Online Tutors', href: '/for/online-tutors' },
            { label: 'For Freelance Teachers', href: '/for/freelance-esl-teachers' },
            { label: 'For Language Schools', href: '/for/language-schools' },
            { label: 'Blog', href: '/blog' },
            { label: 'Start Free Trial', href: '/auth?register=true' },
          ].map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-white/60 hover:text-white">{l.label}</Link>
            </li>
          ))}
        </ul>
      </div>
      <p className="container mx-auto px-6 mt-8 text-white/40 text-sm">{footer.copyright}</p>
    </footer>
  );
}
