export function LanguageSwitcher({ lang, setLang }: { lang: string; setLang: (l: 'en' | 'ur') => void }) {
  return (
    <div className="lang-switch" role="group" aria-label="Language / زبان">
      <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>English</button>
      <button className={lang === 'ur' ? 'active' : ''} onClick={() => setLang('ur')}>اردو</button>
    </div>
  );
}
