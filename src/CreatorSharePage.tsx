import { useEffect, useState } from 'react';
import { ArrowRight, Heart, LockKeyhole, BadgeCheck } from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import type { Creator, Tier, Product } from './App';

// ---- Inline preview data (mirrors App.tsx, no circular dep) ----
const previewCreators: Creator[] = [
  { id: 'preview-1', user_id: '', display_name: 'Nala Makes', handle: 'nalamakes', bio: 'A little color for your everyday. Art, prints & the stories behind them.', avatar_url: null, is_published: true, creator_tiers: [{ id: 'preview-tier-1', creator_id: 'preview-1', name: 'Studio friend', amount: 35, description: 'Studio notes, early looks, and a little thank-you.' }] },
  { id: 'preview-2', user_id: '', display_name: 'The Sunday Table', handle: 'sundaytable', bio: 'Recipes from home, made slowly and shared generously.', avatar_url: null, is_published: true, creator_tiers: [{ id: 'preview-tier-2', creator_id: 'preview-2', name: 'At the table', amount: 50, description: 'Monthly recipes and the stories behind them.' }] },
  { id: 'preview-3', user_id: '', display_name: 'Mwamba Sounds', handle: 'mwambasounds', bio: 'Independent music and notes from the studio in Lusaka.', avatar_url: null, is_published: true, creator_tiers: [{ id: 'preview-tier-3', creator_id: 'preview-3', name: 'Backstage pass', amount: 75, description: 'Demo drops, studio diaries, and early listens.' }] },
];
const previewProducts: Product[] = [
  { id: 'preview-product-1', creator_id: 'preview-1', name: 'Little sunshine print', description: 'A warm, signed A4 art print for your favorite wall.', price: 180, image_url: null },
  { id: 'preview-product-2', creator_id: 'preview-2', name: 'Sunday recipe cards', description: 'A set of handwritten favorites, ready to share around.', price: 120, image_url: null },
  { id: 'preview-product-3', creator_id: 'preview-3', name: 'Studio sessions vol. 1', description: 'A small-batch cassette of live room recordings.', price: 250, image_url: null },
];

const initials = (name = 'S') =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

const money = (value: number) => `ZMW ${Number(value).toFixed(0)}`;

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).catch(() => {});
};

export default function CreatorSharePage({ slug }: { slug: string }) {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // Preview mode — find matching creator by handle
      const found = previewCreators.find((c) => c.handle === slug) ?? null;
      setCreator(found);
      setTiers(found?.creator_tiers ?? []);
      setProducts(found ? previewProducts.filter((p) => p.creator_id === found.id) : []);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const { data: creatorData, error: cErr } = await supabase!
          .from('creator_profiles')
          .select('*')
          .eq('handle', slug)
          .maybeSingle();
        if (cErr) throw cErr;
        if (!creatorData) { setLoading(false); return; }
        setCreator(creatorData as Creator);

        const [tierRes, productRes] = await Promise.all([
          supabase!.from('creator_tiers').select('*').eq('creator_id', creatorData.id),
          supabase!.from('creator_products').select('*').eq('creator_id', creatorData.id),
        ]);
        setTiers((tierRes.data ?? []) as Tier[]);
        setProducts((productRes.data ?? []) as Product[]);
      } catch (e) {
        console.error('CreatorSharePage load error', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  const handleCopy = () => {
    copyToClipboard(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Loading creator page…</p>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="page-wrap" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2>Creator not found.</h2>
        <p style={{ color: 'var(--color-muted)' }}>The link may be wrong or the creator hasn't published yet.</p>
        <a href="/" className="button button-dark" style={{ display: 'inline-flex', marginTop: '1.5rem', gap: '6px' }}>
          Go to sumthin <ArrowRight size={15} />
        </a>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}${window.location.pathname}#c/${slug}`;

  return (
    <div className="page-wrap creator-page">
      {/* Header */}
      <div className="creator-profile-banner">
        <div className="creator-profile-avatar">
          {creator.avatar_url ? <img src={creator.avatar_url} alt="" /> : initials(creator.display_name)}
        </div>
        <div className="creator-profile-copy">
          <div className="eyebrow">@{creator.handle}</div>
          <h1>{creator.display_name} <BadgeCheck size={18} fill="#b9d9c2" stroke="#28563a" /></h1>
          <p>{creator.bio}</p>
        </div>
        <div className="creator-profile-actions">
          <button className="button button-dark" onClick={handleCopy}>
            {copied ? '✓ Link copied!' : '🔗 Share this page'}
          </button>
          <span><LockKeyhole size={13} /> MFI-reviewed monthly support</span>
        </div>
      </div>

      <div className="creator-detail-grid">
        {/* Tiers / Support section */}
        <aside className="tier-panel">
          <div className="eyebrow">BE PART OF IT</div>
          <h2>Support {creator.display_name}.</h2>
          <p>Choose a monthly tier. All payments are MFI-reviewed before any deduction starts.</p>
          {tiers.length ? tiers.map((tier) => (
            <div className="tier-card" key={tier.id}>
              <div className="tier-price">{money(Number(tier.amount))}<small>/ month</small></div>
              <strong>{tier.name}</strong>
              <p>{tier.description}</p>
              <a href="/#pay" className="button button-dark full-button" style={{ display: 'flex', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}>
                Back this tier <Heart size={14} />
              </a>
            </div>
          )) : (
            <div className="empty-note">This creator is setting up their first support tier.</div>
          )}
        </aside>

        {/* Shop section */}
        {products.length > 0 && (
          <section>
            <div className="section-heading compact">
              <div>
                <div className="eyebrow">FROM THE SHOP</div>
                <h2>Things you can take home.</h2>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {products.map((product) => (
                <div key={product.id} className="tier-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <strong>{product.name}</strong>
                    <p style={{ margin: '4px 0 0' }}>{product.description}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="tier-price" style={{ fontSize: '1rem' }}>{money(Number(product.price))}</div>
                    <a href="/#pay" className="button button-dark" style={{ display: 'inline-flex', gap: '6px', textDecoration: 'none', marginTop: '6px', padding: '6px 12px', fontSize: '13px' }}>
                      Buy <ArrowRight size={13} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Shareable link strip */}
      <div className="community-strip" style={{ marginTop: '2rem' }}>
        <div className="strip-icon"><Heart size={21} /></div>
        <div>
          <strong>Share this page.</strong>
          <p style={{ wordBreak: 'break-all', fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>{shareUrl}</p>
        </div>
        <button className="button button-dark" onClick={handleCopy} style={{ flexShrink: 0 }}>
          {copied ? '✓ Copied' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}
