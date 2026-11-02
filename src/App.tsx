import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  CreditCard,
  FileCheck,
  Heart,
  LockKeyhole,
  LogIn,
  Menu,
  MessageCircle,
  Package,
  Plus,
  Receipt,
  Search,
  Send,
  Shield,
  ShoppingBag,
  Sparkles,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';

export type Creator = {
  id: string;
  user_id: string;
  display_name: string;
  handle: string;
  bio: string;
  avatar_url: string | null;
  is_published: boolean;
  creator_tiers?: Tier[];
};



export type Tier = {
  id: string;
  creator_id: string;
  name: string;
  amount: number;
  description: string;
};

type Post = {
  id: string;
  creator_id: string;
  title: string;
  body: string;
  image_url: string | null;
  visibility: 'public' | 'supporters';
  created_at: string;
  creator_profiles?: Pick<Creator, 'display_name' | 'handle'>;
};

export type Product = {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  creator_profiles?: Pick<Creator, 'display_name' | 'handle'>;
};

type Mandate = {
  id: string;
  creator_id: string;
  tier_id: string;
  monthly_amount: number;
  status: 'pending_mfi' | 'approved' | 'active' | 'rejected' | 'cancelled';
  created_at: string;
  creator_profiles?: Pick<Creator, 'display_name' | 'handle'>;
  creator_tiers?: Pick<Tier, 'name'>;
};

type Order = {
  id: string;
  product_id: string;
  creator_id: string;
  quantity: number;
  status: string;
  created_at: string;
  creator_products?: Pick<Product, 'name'>;
};

type SalaryApplication = {
  id: string;
  applicant_first_name: string;
  applicant_last_name: string;
  employment_number: string;
  payslip_url: string | null;
  context_type: 'creator_support' | 'shop_order';
  context_ref_id: string;
  context_label: string;
  amount: number;
  status: 'pending_mfi' | 'approved' | 'rejected';
  created_at: string;
  reviewer_notes?: string | null;
};

type PaymentMethod = 'salary' | 'instapay';

export type SalaryAccount = {
  firstName: string;
  lastName: string;
  nrcNumber: string;
  employmentNumber: string;
  employer: string;
  monthlySalary: number;
  phone: string;
  payslipUrl: string | null;
  status: 'linked' | 'pending_mfi' | 'unlinked';
  linkedAt?: string;
};

export type PendingIntent =
  | { type: 'donate'; tier: Tier; creator?: Creator }
  | { type: 'buy'; product: Product }
  | null;

export type DirectPayment = {
  id: string;
  title: string;
  recipient: string;
  recipientPhone?: string;
  note: string;
  amount: number;
  method: 'salary' | 'instapay';
  status: 'pending_mfi' | 'completed' | 'approved';
  created_at: string;
};

export type PaySubTab = 'salary' | 'direct' | 'pledges' | 'history';

type Tab = 'discover' | 'library' | 'shop' | 'pay' | 'studio';

/* ---------- preview data ---------- */
const previewCreators: Creator[] = [
  { id: 'preview-1', user_id: '', display_name: 'Nala Makes', handle: 'nalamakes', bio: 'A little color for your everyday. Art, prints & the stories behind them.', avatar_url: null, is_published: true, creator_tiers: [{ id: 'preview-tier-1', creator_id: 'preview-1', name: 'Studio friend', amount: 35, description: 'Studio notes, early looks, and a little thank-you.' }] },
  { id: 'preview-2', user_id: '', display_name: 'The Sunday Table', handle: 'sundaytable', bio: 'Recipes from home, made slowly and shared generously.', avatar_url: null, is_published: true, creator_tiers: [{ id: 'preview-tier-2', creator_id: 'preview-2', name: 'At the table', amount: 50, description: 'Monthly recipes and the stories behind them.' }] },
  { id: 'preview-3', user_id: '', display_name: 'Mwamba Sounds', handle: 'mwambasounds', bio: 'Independent music and notes from the studio in Lusaka.', avatar_url: null, is_published: true, creator_tiers: [{ id: 'preview-tier-3', creator_id: 'preview-3', name: 'Backstage pass', amount: 75, description: 'Demo drops, studio diaries, and early listens.' }] },
];
const previewPosts: Post[] = [
  { id: 'preview-post-1', creator_id: 'preview-1', title: 'Color from this morning', body: "A little sketch from the first quiet hour of the day. I've been thinking about how a small patch of sunlight can change a whole room.", image_url: null, visibility: 'public', created_at: '2026-10-28T08:30:00Z', creator_profiles: { display_name: 'Nala Makes', handle: 'nalamakes' } },
  { id: 'preview-post-2', creator_id: 'preview-2', title: 'The recipe I keep coming back to', body: 'Soft, warm, and made for sharing. This one has been on our table every Sunday lately.', image_url: null, visibility: 'public', created_at: '2026-10-27T10:00:00Z', creator_profiles: { display_name: 'The Sunday Table', handle: 'sundaytable' } },
  { id: 'preview-post-3', creator_id: 'preview-3', title: 'A note from the studio', body: "The new set is finding its shape. Here's a small behind-the-scenes listen while I put the last pieces together.", image_url: null, visibility: 'supporters', created_at: '2026-10-26T14:15:00Z', creator_profiles: { display_name: 'Mwamba Sounds', handle: 'mwambasounds' } },
];
const previewProducts: Product[] = [
  { id: 'preview-product-1', creator_id: 'preview-1', name: 'Little sunshine print', description: 'A warm, signed A4 art print for your favorite wall.', price: 180, image_url: null, creator_profiles: { display_name: 'Nala Makes', handle: 'nalamakes' } },
  { id: 'preview-product-2', creator_id: 'preview-2', name: 'Sunday recipe cards', description: 'A set of handwritten favorites, ready to share around.', price: 120, image_url: null, creator_profiles: { display_name: 'The Sunday Table', handle: 'sundaytable' } },
  { id: 'preview-product-3', creator_id: 'preview-3', name: 'Studio sessions vol. 1', description: 'A small-batch cassette of live room recordings.', price: 250, image_url: null, creator_profiles: { display_name: 'Mwamba Sounds', handle: 'mwambasounds' } },
];

const initials = (name = 'S') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
const money = (value: number) => `ZMW ${Number(value).toFixed(0)}`;

/* ===================================================================
   ROOT APP
   =================================================================== */
import CreatorSharePage from './CreatorSharePage';

export default function App() {
  const [tab, setTab] = useState<Tab>('discover');
  const [user, setUser] = useState<User | null>(null);
  const [creators, setCreators] = useState<Creator[]>(previewCreators);
  const [posts, setPosts] = useState<Post[]>(isSupabaseConfigured ? [] : previewPosts);
  const [products, setProducts] = useState<Product[]>(isSupabaseConfigured ? [] : previewProducts);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [salaryApplications, setSalaryApplications] = useState<SalaryApplication[]>([]);
  const [myCreator, setMyCreator] = useState<Creator | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [creatorFormOpen, setCreatorFormOpen] = useState(false);
  const [tierFormOpen, setTierFormOpen] = useState(false);
  const [postFormOpen, setPostFormOpen] = useState(false);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);

  /* ---------- pay tab & salary account state ---------- */
  const [paySubTab, setPaySubTab] = useState<PaySubTab>('salary');

  // --- Shareable creator page routing (hash based) ---
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#c\/(.+)$/);
      setShareSlug(match ? match[1] : null);
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const [salaryAccount, setSalaryAccount] = useState<SalaryAccount | null>(() => {
    try {
      const raw = localStorage.getItem('sumthin_salary_account');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [pendingIntent, setPendingIntent] = useState<PendingIntent>(null);
  const [directPayments, setDirectPayments] = useState<DirectPayment[]>(() => {
    try {
      const raw = localStorage.getItem('sumthin_direct_payments');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const refreshData = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setError('');
    const [creatorResult, tierResult, postResult, productResult] = await Promise.all([
      supabase.from('creator_profiles').select('*').eq('is_published', true).order('created_at', { ascending: false }),
      supabase.from('creator_tiers').select('*').eq('active', true),
      supabase.from('creator_posts').select('*, creator_profiles(display_name,handle)').order('created_at', { ascending: false }),
      supabase.from('creator_products').select('*, creator_profiles(display_name,handle)').eq('active', true).order('created_at', { ascending: false }),
    ]);

    const dataError = creatorResult.error || tierResult.error || postResult.error || productResult.error;
    if (dataError) throw dataError;

    const tiers = (tierResult.data || []) as Tier[];
    setCreators((creatorResult.data || []).map((creator) => ({
      ...creator,
      creator_tiers: tiers.filter((tier) => tier.creator_id === creator.id),
    })) as Creator[]);
    setPosts((postResult.data || []) as Post[]);
    setProducts((productResult.data || []) as Product[]);

    if (user) {
      const [profileResult, mandateResult, orderResult, salaryResult] = await Promise.all([
        supabase.from('creator_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('creator_support_mandates').select('*, creator_profiles(display_name,handle), creator_tiers(name)').order('created_at', { ascending: false }),
        supabase.from('creator_orders').select('*, creator_products(name)').order('created_at', { ascending: false }),
        supabase.from('salary_applications').select('*').order('created_at', { ascending: false }),
      ]);
      const accountError = profileResult.error || mandateResult.error || orderResult.error || salaryResult.error;
      if (accountError) throw accountError;
      setMyCreator(profileResult.data as Creator | null);
      setMandates((mandateResult.data || []) as Mandate[]);
      setOrders((orderResult.data || []) as Order[]);
      const apps = (salaryResult.data || []) as SalaryApplication[];
      setSalaryApplications(apps);

      // Restore or derive salary account from user profile/applications
      const userStoredRaw = localStorage.getItem(`sumthin_salary_account_${user.id}`) || localStorage.getItem('sumthin_salary_account');
      if (userStoredRaw) {
        try {
          setSalaryAccount(JSON.parse(userStoredRaw));
        } catch {
          // ignore
        }
      } else if (apps.length > 0) {
        const latest = apps[0];
        const derived: SalaryAccount = {
          firstName: latest.applicant_first_name,
          lastName: latest.applicant_last_name,
          nrcNumber: 'NRC on file',
          employmentNumber: latest.employment_number,
          employer: 'Civil Service / Public Sector',
          monthlySalary: Number(latest.amount) || 5000,
          phone: '',
          payslipUrl: latest.payslip_url,
          status: latest.status === 'rejected' ? 'unlinked' : latest.status === 'approved' ? 'linked' : 'pending_mfi',
          linkedAt: latest.created_at,
        };
        setSalaryAccount(derived);
        localStorage.setItem(`sumthin_salary_account_${user.id}`, JSON.stringify(derived));
      }
    } else {
      setMyCreator(null);
      setMandates([]);
      setOrders([]);
      setSalaryApplications([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) setError(sessionError.message);
      setUser(data.session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setLoading(Boolean(supabase));
    refreshData().catch((loadError: Error) => {
      setError(loadError.message);
      setLoading(false);
    });
  }, [refreshData]);

  useEffect(() => {
    if (!supabase || !user) return;
    const client = supabase;
    const channel = client
      .channel(`salary-applications-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'salary_applications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        refreshData().catch((loadError: Error) => setError(loadError.message));
      })
      .subscribe();
    return () => { void client.removeChannel(channel); };
  }, [user, refreshData]);

  const visibleCreators = useMemo(() => creators.filter((creator) => (
    `${creator.display_name} ${creator.handle} ${creator.bio}`.toLowerCase().includes(search.toLowerCase())
  )), [creators, search]);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 4500);
  };

  const requireLogin = () => {
    if (user) return true;
    setAuthMode('signin');
    setAuthOpen(true);
    return false;
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
    else flash('You are signed out.');
  };

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '');
    const password = String(form.get('password') || '');
    setBusy(true);
    setError('');
    const result = authMode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setAuthOpen(false);
    if (authMode === 'signup' && !result.data.session) {
      flash('Check your email to confirm your account, then come back to sign in.');
    } else {
      flash(authMode === 'signup' ? 'Welcome to sumthin!' : "You're back. Good to have you.");
    }
  };

  /* ---------- legacy instapay support flow ---------- */
  const requestSupport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !selectedTier || !requireLogin()) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    const { error: requestError } = await supabase.rpc('request_creator_support', {
      p_tier_id: selectedTier.id,
      p_borrower_phone: String(form.get('borrower_phone') || ''),
      p_consent: form.get('consent') === 'on',
    });
    setBusy(false);
    if (requestError) {
      setError(requestError.message);
      return;
    }
    setSelectedTier(null);
    setSelectedCreator(null);
    flash('Request sent. MFI will verify it and set up payroll before deductions begin.');
    refreshData().catch((loadError: Error) => setError(loadError.message));
  };

  /* ---------- salary application handler (both tier support & shop) ---------- */
  const submitSalaryApplication = async (params: {
    firstName: string;
    lastName: string;
    employmentNumber: string;
    payslipFile: File | null;
    contextType: 'creator_support' | 'shop_order';
    contextRefId: string;
    contextLabel: string;
    amount: number;
  }) => {
    if (!supabase || !user) return false;
    setBusy(true);
    setError('');

    let payslipUrl: string | null = null;

    if (params.payslipFile) {
      const ext = params.payslipFile.name.split('.').pop() || 'jpg';
      const filePath = `payslips/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('salary-payslips')
        .upload(filePath, params.payslipFile, { upsert: false });
      if (uploadError) {
        setError(`Payslip upload failed: ${uploadError.message}`);
        setBusy(false);
        return false;
      }
      const { data: urlData } = supabase.storage.from('salary-payslips').getPublicUrl(filePath);
      payslipUrl = urlData?.publicUrl ?? null;
    }

    const { error: insertError } = await supabase.from('salary_applications').insert({
      user_id: user.id,
      applicant_first_name: params.firstName,
      applicant_last_name: params.lastName,
      employment_number: params.employmentNumber,
      payslip_url: payslipUrl,
      context_type: params.contextType,
      context_ref_id: params.contextRefId,
      context_label: params.contextLabel,
      amount: params.amount,
      status: 'pending_mfi',
    });

    setBusy(false);
    if (insertError) {
      setError(insertError.message);
      return false;
    }
    refreshData().catch((loadError: Error) => setError(loadError.message));
    return true;
  };

  const createCreator = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !user) return;
    const form = new FormData(event.currentTarget);
    const displayName = String(form.get('display_name') || '').trim();
    const handle = String(form.get('handle') || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    setBusy(true);
    const { error: createError } = await supabase.from('creator_profiles').insert({
      user_id: user.id,
      display_name: displayName,
      handle,
      bio: String(form.get('bio') || '').trim(),
      is_published: true,
    });
    setBusy(false);
    if (createError) {
      setError(createError.message);
      return;
    }
    setCreatorFormOpen(false);
    flash('Your creator page is live.');
    refreshData().catch((loadError: Error) => setError(loadError.message));
  };

  const createTier = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !user || !myCreator) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    const { error: tierError } = await supabase.from('creator_tiers').insert({
      creator_id: myCreator.id,
      name: String(form.get('name') || '').trim(),
      amount: Number(form.get('amount')),
      description: String(form.get('description') || '').trim(),
    });
    setBusy(false);
    if (tierError) setError(tierError.message);
    else {
      setTierFormOpen(false);
      flash('Support tier added.');
      refreshData().catch((loadError: Error) => setError(loadError.message));
    }
  };

  const createPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !myCreator) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    const { error: postError } = await supabase.from('creator_posts').insert({
      creator_id: myCreator.id,
      title: String(form.get('title') || '').trim(),
      body: String(form.get('body') || '').trim(),
      visibility: String(form.get('visibility') || 'supporters'),
      image_url: String(form.get('image_url') || '').trim() || null,
    });
    setBusy(false);
    if (postError) {
      setError(postError.message);
      return;
    }
    setPostFormOpen(false);
    flash('Your post is published.');
    refreshData().catch((loadError: Error) => setError(loadError.message));
  };

  const createProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !myCreator) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    const { error: productError } = await supabase.from('creator_products').insert({
      creator_id: myCreator.id,
      name: String(form.get('name') || '').trim(),
      description: String(form.get('description') || '').trim(),
      price: Number(form.get('price')),
      image_url: String(form.get('image_url') || '').trim() || null,
    });
    setBusy(false);
    if (productError) {
      setError(productError.message);
      return;
    }
    setProductFormOpen(false);
    flash('Your item is in the shop.');
    refreshData().catch((loadError: Error) => setError(loadError.message));
  };

  const hasValidAccount = useCallback(() => {
    return Boolean(user && salaryAccount && salaryAccount.status !== 'unlinked');
  }, [user, salaryAccount]);

  const handleDonate = (tier: Tier) => {
    if (!hasValidAccount()) {
      const creator = creators.find((c) => c.id === tier.creator_id) || selectedCreator || undefined;
      setPendingIntent({ type: 'donate', tier, creator });
      setPaySubTab('salary');
      setTab('pay');
      setSelectedCreator(null);
      flash('Please link your salary account to donate to creators.');
      return;
    }
    setSelectedTier(tier);
  };

  const handleBuy = (product: Product) => {
    if (!hasValidAccount()) {
      setPendingIntent({ type: 'buy', product });
      setPaySubTab('salary');
      setTab('pay');
      setSelectedCreator(null);
      flash('Please link your salary account to buy items from creators.');
      return;
    }
    setPendingProduct(product);
  };

  const handleRegisterSalary = async (details: {
    firstName: string;
    lastName: string;
    nrcNumber: string;
    employmentNumber: string;
    employer: string;
    monthlySalary: number;
    phone: string;
    payslipFile: File | null;
  }) => {
    setBusy(true);
    setError('');

    let payslipUrl: string | null = null;
    if (details.payslipFile && supabase && user) {
      try {
        const ext = details.payslipFile.name.split('.').pop() || 'jpg';
        const filePath = `payslips/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('salary-payslips')
          .upload(filePath, details.payslipFile, { upsert: false });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('salary-payslips').getPublicUrl(filePath);
          payslipUrl = urlData?.publicUrl ?? null;
        }
      } catch (uploadErr) {
        console.warn('Payslip upload failed:', uploadErr);
      }
    }

    if (supabase && user) {
      const { error: insertError } = await supabase.from('salary_applications').insert({
        user_id: user.id,
        applicant_first_name: details.firstName,
        applicant_last_name: details.lastName,
        employment_number: details.employmentNumber,
        payslip_url: payslipUrl,
        context_type: 'creator_support',
        context_ref_id: 'salary_registration',
        context_label: `Salary Registration — ${details.employer}`,
        amount: details.monthlySalary,
        status: 'pending_mfi',
      });
      if (insertError) {
        console.warn('Salary application insert notice:', insertError.message);
      }
    }

    const newAccount: SalaryAccount = {
      firstName: details.firstName,
      lastName: details.lastName,
      nrcNumber: details.nrcNumber,
      employmentNumber: details.employmentNumber,
      employer: details.employer,
      monthlySalary: details.monthlySalary,
      phone: details.phone,
      payslipUrl,
      status: user ? 'pending_mfi' : 'linked',
      linkedAt: new Date().toISOString(),
    };

    setSalaryAccount(newAccount);
    const storageKey = user ? `sumthin_salary_account_${user.id}` : 'sumthin_salary_account';
    localStorage.setItem(storageKey, JSON.stringify(newAccount));
    localStorage.setItem('sumthin_salary_account', JSON.stringify(newAccount));
    setBusy(false);
    flash('Salary account linked successfully! Submitted to MFI for verification.');
    await refreshData();
  };

  const handleDirectPayment = async (params: {
    recipientName: string;
    recipientPhone?: string;
    amount: number;
    note: string;
    method: 'salary' | 'instapay';
  }) => {
    setBusy(true);
    setError('');

    if (params.method === 'salary') {
      if (!hasValidAccount()) {
        setBusy(false);
        setPaySubTab('salary');
        flash('Please link your salary account before paying with salary deduction.');
        return;
      }
      if (supabase && user) {
        await supabase.from('salary_applications').insert({
          user_id: user.id,
          applicant_first_name: salaryAccount!.firstName,
          applicant_last_name: salaryAccount!.lastName,
          employment_number: salaryAccount!.employmentNumber,
          payslip_url: salaryAccount!.payslipUrl,
          context_type: 'creator_support',
          context_ref_id: 'direct_payment',
          context_label: `Payment to ${params.recipientName}: ${params.note || 'Direct payment'}`,
          amount: params.amount,
          status: 'pending_mfi',
        });
      }
    }

    const paymentRecord: DirectPayment = {
      id: `pay-${Date.now()}`,
      title: `Payment to ${params.recipientName}`,
      recipient: params.recipientName,
      recipientPhone: params.recipientPhone,
      note: params.note,
      amount: params.amount,
      method: params.method,
      status: params.method === 'salary' ? 'pending_mfi' : 'completed',
      created_at: new Date().toISOString(),
    };

    const updatedPayments = [paymentRecord, ...directPayments];
    setDirectPayments(updatedPayments);
    localStorage.setItem('sumthin_direct_payments', JSON.stringify(updatedPayments));
    setBusy(false);
    flash(params.method === 'salary'
      ? `Deduction request of ${money(params.amount)} sent to MFI for ${params.recipientName}.`
      : `InstaPay transfer of ${money(params.amount)} to ${params.recipientName} initiated.`
    );
    refreshData().catch(() => {});
  };

  const handleCancelMandate = async (mandateId: string) => {
    if (!supabase || !user) return;
    setBusy(true);
    const { error: cancelError } = await supabase
      .from('creator_support_mandates')
      .update({ status: 'cancelled' })
      .eq('id', mandateId)
      .eq('supporter_id', user.id);
    setBusy(false);
    if (cancelError) {
      setError(cancelError.message);
    } else {
      flash('Creator support pledge cancelled.');
      await refreshData();
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'accepted' | 'declined') => {
    if (!supabase) return;
    setBusy(true);
    setError('');
    const { data, error: updateError } = await supabase
      .from('creator_orders')
      .update({ status })
      .eq('id', orderId)
      .eq('status', 'requested')
      .select('id')
      .maybeSingle();
    setBusy(false);
    if (updateError) setError(updateError.message);
    else if (!data) setError('This order request is no longer waiting for a response.');
    else {
      flash(status === 'accepted' ? 'Order request accepted.' : 'Order request declined.');
      refreshData().catch((loadError: Error) => setError(loadError.message));
    }
  };

  const navItems: { id: Tab; label: string; icon: typeof Compass }[] = [
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'library', label: 'Your people', icon: Heart },
    { id: 'shop', label: 'Shop', icon: ShoppingBag },
    { id: 'pay', label: 'Pay', icon: CreditCard },
    { id: 'studio', label: 'Studio', icon: Sparkles },
  ];

  /* ---- pending salary apps count for library badge ---- */
  const pendingSalaryCount = salaryApplications.filter((a) => a.status === 'pending_mfi').length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="wordmark" onClick={() => { setTab('discover'); setSelectedCreator(null); }} aria-label="sumthin home">
          sumthin<span className="wordmark-dot">.</span>
        </button>
        <div className="top-search">
          <Search size={17} />
          <input aria-label="Search creators" placeholder="Find your next favorite..." value={search} onChange={(event) => setSearch(event.target.value)} />
          <span className="search-shortcut">/</span>
        </div>
        <div className="top-actions">
          <button className="icon-button notification-button" aria-label="Updates"><Bell size={19} /><i /></button>
          {user ? (
            <button className="account-button" onClick={signOut}>
              <span className="avatar avatar-small">{initials(user.email || 'You')}</span>
              <span className="account-name">{user.email?.split('@')[0]}</span>
              <ChevronDown size={15} />
            </button>
          ) : (
            <button className="sign-in-button" onClick={() => { setAuthMode('signin'); setAuthOpen(true); }}>Log in <ArrowRight size={15} /></button>
          )}
        </div>
      </header>

      <div className="mobile-search">
        <Search size={17} />
        <input aria-label="Search creators" placeholder="Find your next favorite..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      <div className="app-layout">
        <aside className="sidebar">
          <div className="side-label">YOUR SPACE</div>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`side-link ${tab === id ? 'selected' : ''}`} onClick={() => { setTab(id); setSelectedCreator(null); }}>
              <Icon size={18} strokeWidth={tab === id ? 2.4 : 1.8} /><span>{label}</span>
              {id === 'library' && (mandates.some((item) => item.status === 'active') || pendingSalaryCount > 0) && (
                <span className="side-count">{mandates.filter((item) => item.status === 'active').length + pendingSalaryCount}</span>
              )}
              {id === 'pay' && !salaryAccount && (
                <span className="side-count pay-link-pill">Link</span>
              )}
              {id === 'pay' && salaryAccount && pendingSalaryCount > 0 && (
                <span className="side-count">{pendingSalaryCount}</span>
              )}
            </button>
          ))}
          <div className="sidebar-divider" />
          <button className="side-link creator-link" onClick={() => { setTab('studio'); setSelectedCreator(null); }}>
            <Plus size={18} /><span>Start creating</span>
          </button>
          <div className="sidebar-note">
            <div className="note-icon"><Heart size={16} fill="currentColor" /></div>
            <p>Good things happen when we show up for each other.</p>
            <button onClick={() => setTab('discover')}>Meet the community <ArrowRight size={13} /></button>
          </div>
          <div className="sidebar-bottom">
            <CircleHelp size={15} /> Made for the people who make things.
          </div>
        </aside>

        <main className="main-content">
          {!isSupabaseConfigured && (
            <div className="preview-banner">
              <Sparkles size={16} /><span>Preview mode — connect Supabase to sign in and save changes.</span>
              <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Setup <ArrowRight size={13} /></a>
            </div>
          )}
          {error && <div className="error-banner" role="alert"><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError('')}><X size={15} /></button></div>}
          {loading ? (
            <div className="loading-state"><div className="spinner" /><p>Making a little space...</p></div>
          ) : (
            <>
              {shareSlug ? (
                <CreatorSharePage slug={shareSlug} />
              ) : (
              <>
                {tab === 'discover' && (
                  selectedCreator ? (
                    <CreatorPage creator={selectedCreator} posts={posts.filter((post) => post.creator_id === selectedCreator.id)} onBack={() => setSelectedCreator(null)} onSupport={handleDonate} user={user} />
                  ) : (
                    <DiscoverPage creators={visibleCreators} posts={posts.filter((post) => post.visibility === 'public' || mandates.some((item) => item.creator_id === post.creator_id && item.status === 'active'))} onSelect={setSelectedCreator} onSupport={handleDonate} user={user} />
                  )
                )}
                {tab === 'library' && (
                  <LibraryPage mandates={mandates} salaryApplications={salaryApplications} posts={posts.filter((post) => post.visibility === 'supporters' && mandates.some((item) => item.creator_id === post.creator_id && item.status === 'active'))} onDiscover={() => setTab('discover')} />
                )}
                {tab === 'shop' && (
                  <ShopPage products={products} onOrder={handleBuy} configured={isSupabaseConfigured} />
                )}
                {tab === 'pay' && (
                  <PayPage
                    user={user}
                    salaryAccount={salaryAccount}
                    mandates={mandates}
                    salaryApplications={salaryApplications}
                    orders={orders}
                    directPayments={directPayments}
                    creators={creators}
                    configured={isSupabaseConfigured}
                    busy={busy}
                    subTab={paySubTab}
                    onSubTabChange={setPaySubTab}
                    pendingIntent={pendingIntent}
                    onClearPendingIntent={() => setPendingIntent(null)}
                    onCompletePendingIntent={() => {
                      if (!pendingIntent) return;
                      if (pendingIntent.type === 'donate') {
                        setSelectedTier(pendingIntent.tier);
                        setSelectedCreator(pendingIntent.creator || null);
                      } else {
                        setPendingProduct(pendingIntent.product);
                      }
                      setPendingIntent(null);
                    }}
                    onRegisterSalary={handleRegisterSalary}
                    onDirectPayment={handleDirectPayment}
                    onCancelMandate={handleCancelMandate}
                    onLogin={requireLogin}
                    hasValidAccount={hasValidAccount()}
                  />
                )}
                {tab === 'studio' && (
                  <StudioPage
                    user={user}
                    creator={myCreator}
                    busy={busy}
                    posts={posts.filter((post) => post.creator_id === myCreator?.id)}
                    products={products.filter((product) => product.creator_id === myCreator?.id)}
                    orders={orders}
                    onLogin={requireLogin}
                    onCreateProfile={() => setCreatorFormOpen(true)}
                    onCreatePost={() => setPostFormOpen(true)}
                    onCreateProduct={() => setProductFormOpen(true)}
                    onCreateTier={() => setTierFormOpen(true)}
                    onOrderStatusChange={updateOrderStatus}
                  />
                )}
              </>
            )}
            </>
          )}
        </main>
      </div>

      <nav className="mobile-nav">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setSelectedCreator(null); }}>
            <Icon size={20} /><span>{label}</span>
          </button>
        ))}
      </nav>

      {notice && <div className="toast"><span className="toast-check"><Check size={14} /></span>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button></div>}

      {/* ── Auth modal ── */}
      {authOpen && <Modal onClose={() => setAuthOpen(false)}>
        <div className="modal-icon"><LogIn size={21} /></div>
        <h2>{authMode === 'signin' ? 'Good to have you back.' : 'Make yourself at home.'}</h2>
        <p className="modal-copy">{authMode === 'signin' ? 'Log in to find your people and support the work you love.' : 'Create an account to follow creators and share your own work.'}</p>
        <form className="form-stack" onSubmit={handleAuth}>
          <label>Email address<input name="email" type="email" placeholder="you@example.com" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" minLength={8} placeholder="At least 8 characters" autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'} required /></label>
          <button className="button button-dark full-button" disabled={busy}>{busy ? 'One moment…' : authMode === 'signin' ? 'Log in' : 'Create account'} <ArrowRight size={16} /></button>
        </form>
        <div className="auth-switch">{authMode === 'signin' ? 'New around here?' : 'Already part of the crew?'} <button onClick={() => { setError(''); setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); }}>{authMode === 'signin' ? 'Create an account' : 'Log in'}</button></div>
        {!isSupabaseConfigured && <div className="form-message">Add your Supabase URL and anon key to enable accounts.</div>}
      </Modal>}

      {/* ── Creator support payment modal ── */}
      {selectedTier && (
        <PaymentModal
          onClose={() => setSelectedTier(null)}
          title={`Show up for ${selectedCreator?.display_name || creators.find((c) => c.id === selectedTier.creator_id)?.display_name}.`}
          subtitle={`You're choosing ${selectedTier.name} — ${money(Number(selectedTier.amount))} per month.`}
          amount={selectedTier.amount}
          busy={busy}
          configured={isSupabaseConfigured}
          initialSalaryAccount={salaryAccount}
          onInstapay={async (phone, consent) => {
            if (!supabase || !requireLogin()) return;
            setBusy(true);
            setError('');
            const { error: requestError } = await supabase.rpc('request_creator_support', {
              p_tier_id: selectedTier.id,
              p_borrower_phone: phone,
              p_consent: consent,
            });
            setBusy(false);
            if (requestError) { setError(requestError.message); return; }
            setSelectedTier(null);
            setSelectedCreator(null);
            flash('Request sent. MFI will verify and set up payroll before deductions begin.');
            refreshData().catch((e: Error) => setError(e.message));
          }}
          onSalary={async (firstName, lastName, employmentNumber, payslipFile) => {
            const ok = await submitSalaryApplication({
              firstName, lastName, employmentNumber, payslipFile,
              contextType: 'creator_support',
              contextRefId: selectedTier.id,
              contextLabel: `${selectedCreator?.display_name || 'Creator'} — ${selectedTier.name}`,
              amount: selectedTier.amount,
            });
            if (ok) {
              setSelectedTier(null);
              setSelectedCreator(null);
              flash('Salary application submitted. MFI will review your payslip and activate your support.');
            }
          }}
        />
      )}

      {/* ── Shop order payment modal ── */}
      {pendingProduct && (
        <PaymentModal
          onClose={() => setPendingProduct(null)}
          title={`Get "${pendingProduct.name}".`}
          subtitle={`One-time payment of ${money(Number(pendingProduct.price))} to ${pendingProduct.creator_profiles?.display_name || 'this creator'}.`}
          amount={pendingProduct.price}
          busy={busy}
          configured={isSupabaseConfigured}
          initialSalaryAccount={salaryAccount}
          onInstapay={async () => {
            if (!supabase) return;
            if (!user) {
              requireLogin();
              return;
            }
            const { error: orderError } = await supabase.from('creator_orders').insert({
              requester_id: user.id,
              product_id: pendingProduct.id,
              creator_id: pendingProduct.creator_id,
              quantity: 1,
              status: 'requested',
            });
            if (orderError) { setError(orderError.message); return; }
            setPendingProduct(null);
            flash('Order request sent to the creator.');
            refreshData().catch((e: Error) => setError(e.message));
          }}
          onSalary={async (firstName, lastName, employmentNumber, payslipFile) => {
            const ok = await submitSalaryApplication({
              firstName, lastName, employmentNumber, payslipFile,
              contextType: 'shop_order',
              contextRefId: pendingProduct.id,
              contextLabel: `${pendingProduct.name} — ${pendingProduct.creator_profiles?.display_name || 'Creator'}`,
              amount: pendingProduct.price,
            });
            if (ok) {
              setPendingProduct(null);
              flash('Salary application submitted. MFI will review your payslip and confirm your order.');
            }
          }}
        />
      )}

      {/* ── Creator profile form ── */}
      {creatorFormOpen && <Modal onClose={() => setCreatorFormOpen(false)}>
        <div className="modal-icon violet"><Sparkles size={20} /></div><h2>Your corner of the internet.</h2><p className="modal-copy">A name, a handle, and a little about what you make.</p>
        <form className="form-stack" onSubmit={createCreator}>
          <label>Creator name<input name="display_name" maxLength={70} required /></label>
          <label>Handle<input name="handle" pattern="[A-Za-z0-9_]{3,30}" minLength={3} maxLength={30} placeholder="yourname" required /></label>
          <label>What do you make?<textarea name="bio" maxLength={400} rows={3} required /></label>
          <button className="button button-dark full-button" disabled={busy || !isSupabaseConfigured}>{busy ? 'Setting up…' : 'Publish my page'} <ArrowRight size={16} /></button>
        </form>
      </Modal>}

      {/* ── Tier form ── */}
      {tierFormOpen && <Modal onClose={() => setTierFormOpen(false)}>
        <div className="modal-icon peach"><Heart size={20} /></div><h2>Make room for your people.</h2><p className="modal-copy">Set a monthly amount for supporters. The MFI reviews each deduction request.</p>
        <form className="form-stack" onSubmit={createTier}>
          <label>Tier name<input name="name" maxLength={70} placeholder="Studio friend" required /></label>
          <label>Monthly amount (ZMW)<input name="amount" type="number" min="1" step="0.01" required /></label>
          <label>What do supporters get?<textarea name="description" maxLength={400} rows={3} required /></label>
          <button className="button button-dark full-button" disabled={busy || !isSupabaseConfigured}>{busy ? 'Saving…' : 'Publish support tier'} <ArrowRight size={16} /></button>
        </form>
      </Modal>}

      {/* ── Post form ── */}
      {postFormOpen && <Modal onClose={() => setPostFormOpen(false)}>
        <div className="modal-icon violet"><BookOpen size={20} /></div><h2>Share something good.</h2>
        <form className="form-stack" onSubmit={createPost}>
          <label>Post title<input name="title" maxLength={120} required /></label>
          <label>Your post<textarea name="body" maxLength={6000} rows={5} required /></label>
          <label>Image URL <span className="optional">(optional)</span><input name="image_url" type="url" placeholder="https://" /></label>
          <label>Who can see it?<select name="visibility"><option value="supporters">Supporters only</option><option value="public">Everyone</option></select></label>
          <button className="button button-dark full-button" disabled={busy || !isSupabaseConfigured}>{busy ? 'Publishing…' : 'Publish post'} <ArrowRight size={16} /></button>
        </form>
      </Modal>}

      {/* ── Product form ── */}
      {productFormOpen && <Modal onClose={() => setProductFormOpen(false)}>
        <div className="modal-icon peach"><Package size={20} /></div><h2>Put a little something in the shop.</h2>
        <form className="form-stack" onSubmit={createProduct}>
          <label>Item name<input name="name" maxLength={100} required /></label>
          <label>Description<textarea name="description" maxLength={1000} rows={3} required /></label>
          <label>Price (ZMW)<input name="price" type="number" min="1" step="0.01" required /></label>
          <label>Image URL <span className="optional">(optional)</span><input name="image_url" type="url" placeholder="https://" /></label>
          <button className="button button-dark full-button" disabled={busy || !isSupabaseConfigured}>{busy ? 'Adding…' : 'Add to shop'} <ArrowRight size={16} /></button>
        </form>
      </Modal>}
    </div>
  );
}

/* ===================================================================
   PAYMENT MODAL — used for both creator support and shop orders
   Lets the user choose between Salary or InstaPay (legacy) payment.
   =================================================================== */
function PaymentModal({
  onClose, title, subtitle, amount, busy, configured,
  onInstapay, onSalary, initialSalaryAccount,
}: {
  onClose: () => void;
  title: string;
  subtitle: string;
  amount: number;
  busy: boolean;
  configured: boolean;
  onInstapay: (phone: string, consent: boolean) => void;
  onSalary: (firstName: string, lastName: string, employmentNumber: string, payslipFile: File | null) => void;
  initialSalaryAccount?: SalaryAccount | null;
}) {
  const [method, setMethod] = useState<PaymentMethod>('salary');

  /* salary form state prefilled from linked salary account if present */
  const [firstName, setFirstName] = useState(initialSalaryAccount?.firstName || '');
  const [lastName, setLastName] = useState(initialSalaryAccount?.lastName || '');
  const [employmentNumber, setEmploymentNumber] = useState(initialSalaryAccount?.employmentNumber || '');
  const [payslipFile, setPayslipFile] = useState<File | null>(null);
  const [payslipPreview, setPayslipPreview] = useState<string | null>(initialSalaryAccount?.payslipUrl || null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPayslipFile(file);
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPayslipPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPayslipPreview(null);
    }
  };

  const handleSalarySubmit = (e: FormEvent) => {
    e.preventDefault();
    onSalary(firstName, lastName, employmentNumber, payslipFile);
  };

  const handleInstapaySubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onInstapay(String(form.get('borrower_phone') || ''), form.get('consent') === 'on');
  };

  return (
    <Modal onClose={onClose}>
      <div className="modal-icon peach"><Heart size={20} /></div>
      <h2>{title}</h2>
      <p className="modal-copy">{subtitle}</p>

      {/* Payment method tabs */}
      <div className="payment-tabs">
        <button
          className={`payment-tab ${method === 'salary' ? 'active' : ''}`}
          onClick={() => setMethod('salary')}
          type="button"
        >
          <Briefcase size={14} /> Salary Deduction
        </button>
        <button
          className={`payment-tab ${method === 'instapay' ? 'active' : ''}`}
          onClick={() => setMethod('instapay')}
          type="button"
        >
          <LockKeyhole size={14} /> InstaPay
        </button>
      </div>

      {/* ── Salary form ── */}
      {method === 'salary' && (
        <form className="form-stack" onSubmit={handleSalarySubmit}>
          <div className="salary-intro">
            <Briefcase size={15} />
            <span>
              {initialSalaryAccount?.status === 'linked'
                ? `Using linked payroll profile (${initialSalaryAccount.employer}). Trustea MFI verifies deductions prior to payout.`
                : "We'll send your details to the MFI. Your support activates once they verify your payslip."}
            </span>
          </div>
          <div className="form-row-two">
            <label>
              First name
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Chanda"
                required
              />
            </label>
            <label>
              Last name
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Mulenga"
                required
              />
            </label>
          </div>
          <label>
            Employment / Payroll number
            <input
              value={employmentNumber}
              onChange={(e) => setEmploymentNumber(e.target.value)}
              placeholder="e.g. ZCS/EMP/00429"
              required
            />
          </label>
          <div className="payslip-upload-area">
            <div className="payslip-label">Latest payslip <span className="optional">(photo or PDF)</span></div>
            {payslipPreview ? (
              <div className="payslip-preview-wrap">
                <img src={payslipPreview} alt="Payslip preview" className="payslip-preview" />
                <button type="button" className="payslip-change" onClick={() => { setPayslipFile(null); setPayslipPreview(null); if (fileRef.current) fileRef.current.value = ''; }}>
                  <X size={13} /> Change
                </button>
              </div>
            ) : payslipFile ? (
              <div className="payslip-file-chip">
                <Package size={13} /> {payslipFile.name}
                <button type="button" onClick={() => { setPayslipFile(null); if (fileRef.current) fileRef.current.value = ''; }}><X size={12} /></button>
              </div>
            ) : (
              <button type="button" className="payslip-drop-btn" onClick={() => fileRef.current?.click()}>
                <Upload size={17} />
                <span>Tap to upload your latest payslip</span>
                <small>JPG, PNG or PDF · max 10 MB</small>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
          <div className="salary-amount-row">
            <span>Amount</span>
            <strong>{money(amount)}</strong>
          </div>
          <button className="button button-dark full-button" disabled={busy || !configured || !firstName || !lastName || !employmentNumber}>
            {busy ? 'Submitting…' : 'Submit to MFI for review'} <ArrowRight size={16} />
          </button>
          {!configured && <div className="form-message">Connect Supabase to submit applications.</div>}
          <div className="secure-note"><LockKeyhole size={13} /> No money is taken now. Your MFI reviews your payslip first.</div>
        </form>
      )}

      {/* ── InstaPay / legacy phone form ── */}
      {method === 'instapay' && (
        <form className="form-stack" onSubmit={handleInstapaySubmit}>
          <label>MFI-registered phone number<input name="borrower_phone" type="tel" inputMode="tel" placeholder="e.g. 0977123456" pattern="[0-9+() -]{7,20}" required /></label>
          <label className="consent-row"><input name="consent" type="checkbox" required /><span>I authorize my MFI to review this recurring deduction request. I understand it stays inactive until my MFI verifies it, approves it, and sets up payroll deductions. I can cancel future deductions through my MFI.</span></label>
          <button className="button button-dark full-button" disabled={busy || !configured}>{busy ? 'Sending request…' : 'Request MFI approval'} <ArrowRight size={16} /></button>
          <div className="secure-note"><LockKeyhole size={13} /> No money is taken now. Your MFI must approve and set up payroll first.</div>
        </form>
      )}
    </Modal>
  );
}

/* ===================================================================
   PAGE COMPONENTS
   =================================================================== */
function DiscoverPage({ creators, posts, onSelect, onSupport, user }: {
  creators: Creator[]; posts: Post[]; onSelect: (creator: Creator) => void; onSupport: (tier: Tier) => void; user: User | null;
}) {
  return <div className="page-wrap">
    <div className="hero-panel">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-line" /> A LITTLE MORE HUMAN</div>
        <h1>Good things<br />grow <em>together.</em></h1>
        <p>A place to find your people, back what they make, and get a little closer to the things you love.</p>
        <button className="button button-dark" onClick={() => document.getElementById('creator-list')?.scrollIntoView({ behavior: 'smooth' })}>Find your people <ArrowDownRight size={16} /></button>
        <div className="hero-proof"><div className="proof-avatars"><span>N</span><span>S</span><span>M</span><b>+</b></div><span>Made for people who make things.</span></div>
      </div>
      <div className="hero-art" aria-label="Illustration of the creator community">
        <div className="art-sun" /><div className="art-shape shape-one" /><div className="art-shape shape-two" /><div className="art-shape shape-three" />
        <div className="art-sticker sticker-top"><Sparkles size={17} /> made with love</div>
        <div className="art-sticker sticker-bottom"><Heart size={17} fill="currentColor" /> good people, good work</div>
        <div className="art-figure"><div className="figure-hair" /><div className="figure-face" /><div className="figure-body" /><div className="figure-arm" /></div>
        <div className="art-leaf leaf-a" /><div className="art-leaf leaf-b" /><div className="art-leaf leaf-c" />
      </div>
    </div>
    <div className="section-heading" id="creator-list">
      <div><div className="eyebrow">YOUR NEW FAVORITES</div><h2>People worth showing up for.</h2><p>Meet the makers putting a little more good into the world.</p></div>
      <button className="text-button">See everyone <ArrowRight size={15} /></button>
    </div>
    {creators.length ? <div className="creator-grid">
      {creators.slice(0, 6).map((creator, index) => <CreatorCard key={creator.id} creator={creator} index={index} onClick={() => onSelect(creator)} onSupport={onSupport} />)}
    </div> : <EmptyState title="No creators just yet." detail="Try a different search, or be the first to make a page." />}
    <div className="community-strip"><div className="strip-icon"><MessageCircle size={21} /></div><div><strong>Not just a follow. A real connection.</strong><p>Creator memberships are reviewed by your MFI before any payroll deduction starts.</p></div><span className="strip-mark">s.</span></div>
    {posts.length > 0 && <section className="latest-section"><div className="section-heading"><div><div className="eyebrow">FRESH FROM THE FEED</div><h2>Little things, lately.</h2></div></div><PostGrid posts={posts.slice(0, 3)} creators={creators} /></section>}
    {!user && <div className="footer-cta"><div><div className="eyebrow">YOUR PEOPLE ARE HERE</div><h2>Come on in.</h2><p>It's better when we make it together.</p></div><span className="footer-illustration">☺</span></div>}
  </div>;
}

function CreatorCard({ creator, index, onClick, onSupport }: { creator: Creator; index: number; onClick: () => void; onSupport: (tier: Tier) => void }) {
  const tones = ['card-peach', 'card-lilac', 'card-yellow', 'card-green', 'card-blue'];
  const tier = creator.creator_tiers?.[0];
  return <article className="creator-card">
    <button className={`creator-cover ${tones[index % tones.length]}`} onClick={onClick} aria-label={`View ${creator.display_name}`}>
      <span className="cover-stamp">{['a little joy', 'made slowly', 'from the heart', 'good stuff'][index % 4]}</span>
      <span className="cover-shape cover-shape-a" /><span className="cover-shape cover-shape-b" />
      <span className="creator-avatar">{creator.avatar_url ? <img src={creator.avatar_url} alt="" /> : initials(creator.display_name)}</span>
    </button>
    <div className="creator-card-body">
      <button className="creator-name" onClick={onClick}>{creator.display_name}<BadgeCheck size={14} fill="#b9d9c2" stroke="#28563a" /></button>
      <div className="creator-handle">@{creator.handle}</div>
      <p>{creator.bio || 'Making good things and sharing them with you.'}</p>
      <div className="creator-card-bottom"><span><Heart size={13} /> {creator.creator_tiers?.length ? 'Community is growing' : 'New here'}</span><button onClick={onClick}>Say hi <ArrowRight size={14} /></button></div>
      {tier && <button className="quick-support" onClick={() => onSupport(tier)}>Back from {money(Number(tier.amount))}/mo <Heart size={13} /></button>}
    </div>
  </article>;
}

function CreatorPage({ creator, posts, onBack, onSupport, user }: { creator: Creator | null; posts: Post[]; onBack: () => void; onSupport: (tier: Tier) => void; user: User | null }) {
  if (!creator) {
    // Guard against null creator (e.g., route mismatch). Render nothing or a fallback.
    return <div className="p-4">Creator not found.</div>;
  }

  return <div className="page-wrap creator-page">
    <button className="back-button" onClick={onBack}>← All creators</button>
    <div className="creator-profile-banner">
      <div className="creator-profile-avatar">{creator.avatar_url ? <img src={creator.avatar_url} alt="" /> : initials(creator.display_name)}</div>
      <div className="creator-profile-copy"><div className="eyebrow">@{creator.handle}</div><h1>{creator.display_name}</h1><p>{creator.bio}</p></div>
      <div className="creator-profile-actions"><button className="button button-dark" onClick={() => creator.creator_tiers?.[0] && onSupport(creator.creator_tiers[0])}><Heart size={16} /> Show support</button><span><LockKeyhole size={13} /> MFI-reviewed monthly support</span></div>
    </div>
    <div className="creator-detail-grid">
      <section><div className="section-heading compact"><div><div className="eyebrow">FROM THE CREATOR</div><h2>A little look behind the scenes.</h2></div></div><PostGrid posts={posts} creators={[creator]} /></section>
      <aside className="tier-panel"><div className="eyebrow">BE PART OF IT</div><h2>Come closer.</h2><p>Choose a monthly tier to get supporter-only posts and show up for this work.</p>
        {creator.creator_tiers?.length ? creator.creator_tiers.map((tier) => <div className="tier-card" key={tier.id}><div className="tier-price">{money(Number(tier.amount))}<small>/ month</small></div><strong>{tier.name}</strong><p>{tier.description}</p><button className="button button-dark full-button" onClick={() => onSupport(tier)}>Choose this tier <ArrowRight size={15} /></button></div>) : <div className="empty-note">This creator is setting up their first support tier.</div>}
        {!user && <div className="secure-note"><LockKeyhole size={13} /> MFI approval required before deductions.</div>}
      </aside>
    </div>
  </div>;
}

function LibraryPage({ mandates, salaryApplications, posts, onDiscover }: {
  mandates: Mandate[];
  salaryApplications: SalaryApplication[];
  posts: Post[];
  onDiscover: () => void;
}) {
  const active = mandates.filter((item) => item.status === 'active');
  const pending = mandates.filter((item) => item.status === 'pending_mfi');
  const approved = mandates.filter((item) => item.status === 'approved');
  const pendingSalary = salaryApplications.filter((a) => a.status === 'pending_mfi');
  const approvedSalary = salaryApplications.filter((a) => a.status === 'approved');
  const rejectedSalary = salaryApplications.filter((a) => a.status === 'rejected');

  return <div className="page-wrap">
    <div className="page-title-block"><div className="eyebrow">YOUR CORNER</div><h1>Your people.</h1><p>The creators you're backing, and the good things they've shared with you.</p></div>

    {/* Salary applications pending */}
    {pendingSalary.length > 0 && (
      <div className="pending-card salary-pending-card">
        <div className="pending-icon salary-icon"><Briefcase size={17} /></div>
        <div>
          <strong>Salary applications in review</strong>
          <p>{pendingSalary.length} payslip {pendingSalary.length === 1 ? 'application is' : 'applications are'} waiting for MFI review. Your support or order activates once approved.</p>
          <div className="salary-app-list">
            {pendingSalary.map((app) => (
              <div className="salary-app-row" key={app.id}>
                <Briefcase size={12} />
                <span className="salary-app-label">{app.context_label}</span>
                <span className="salary-app-amount">{money(app.amount)}</span>
                <span className="status-pill pending">Pending MFI</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    {approvedSalary.length > 0 && (
      <div className="pending-card approved-card">
        <div className="pending-icon"><Clock3 size={17} /></div>
        <div>
          <strong>Salary applications approved</strong>
          <p>{approvedSalary.length} salary {approvedSalary.length === 1 ? 'application is approved' : 'applications are approved'} by your MFI. Check back for next steps on your support or order.</p>
          <div className="salary-app-list">
            {approvedSalary.map((app) => (
              <div className="salary-app-row approved-row" key={app.id}>
                <Briefcase size={12} />
                <span className="salary-app-label">{app.context_label}</span>
                <span className="salary-app-amount">{money(app.amount)}</span>
                <span className="status-pill approved">Approved</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    {rejectedSalary.length > 0 && (
      <div className="pending-card rejected-card">
        <div className="pending-icon"><X size={17} /></div>
        <div>
          <strong>Salary applications not approved</strong>
          <p>Your MFI reviewed these applications. Contact them if you have questions or want to apply again.</p>
          <div className="salary-app-list">
            {rejectedSalary.map((app) => (
              <div className="salary-app-row rejected-row" key={app.id}>
                <Briefcase size={12} />
                <span className="salary-app-label">{app.context_label}</span>
                <span className="salary-app-amount">{money(app.amount)}</span>
                <span className="status-pill rejected">Not approved</span>
                {app.reviewer_notes && <span className="salary-app-note">{app.reviewer_notes}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {pending.length > 0 && <div className="pending-card"><div className="pending-icon"><LockKeyhole size={17} /></div><div><strong>Waiting on your MFI</strong><p>{pending.length} support {pending.length === 1 ? 'request is' : 'requests are'} in review. Your salary deduction starts only after approval.</p></div><span className="status-pill pending">MFI review</span></div>}
    {approved.length > 0 && <div className="pending-card approved-card"><div className="pending-icon"><Clock3 size={17} /></div><div><strong>Payroll setup in progress</strong><p>{approved.length} support {approved.length === 1 ? 'request is approved' : 'requests are approved'}, but not active yet. Your MFI must finish setting up the deduction first.</p></div><span className="status-pill approved">Setup needed</span></div>}

    <div className="section-heading"><div><div className="eyebrow">YOUR MEMBERSHIPS</div><h2>People you show up for.</h2></div></div>
    {active.length ? <div className="membership-list">{active.map((item) => <article className="membership-card" key={item.id}><div className="membership-avatar">{initials(item.creator_profiles?.display_name)}</div><div className="membership-copy"><strong>{item.creator_profiles?.display_name || 'Creator'}</strong><span>{item.creator_tiers?.name || 'Supporter'} · {money(Number(item.monthly_amount))}/mo</span></div><span className="status-pill active"><Check size={12} /> Active</span></article>)}</div> : <EmptyState title="Your people are waiting." detail="Find a creator who makes your day a little better." action="Discover creators" onAction={onDiscover} />}
    {posts.length > 0 && <section className="latest-section"><div className="section-heading"><div><div className="eyebrow">JUST FOR YOU</div><h2>From the people you back.</h2></div></div><PostGrid posts={posts} creators={[]} /></section>}
  </div>;
}

function ShopPage({ products, onOrder, configured }: { products: Product[]; onOrder: (product: Product) => void; configured: boolean }) {
  return <div className="page-wrap">
    <div className="page-title-block"><div className="eyebrow">THE GOOD STUFF</div><h1>Little things to keep.</h1><p>One-of-a-kind things made by the creators you love.</p></div>
    {products.length ? <div className="product-grid">{products.map((product, index) => <article className="product-card" key={product.id}>
      <div className={`product-image product-tone-${index % 4}`}>{product.image_url ? <img src={product.image_url} alt={product.name} /> : <><Package size={38} strokeWidth={1.2} /><span>{product.name}</span></>}</div>
      <div className="product-details"><div><h3>{product.name}</h3><span>by {product.creator_profiles?.display_name}</span></div><strong>{money(Number(product.price))}</strong></div>
      <p className="product-description">{product.description}</p>
      <button className="button button-outline full-button" disabled={!configured} onClick={() => onOrder(product)}>{configured ? 'Get this item' : 'Connect Supabase to buy'} <ArrowRight size={14} /></button>
    </article>)}</div> : <EmptyState title="The shop is getting ready." detail="Creator-made things will show up here soon." />}
    <div className="shop-notice"><CircleHelp size={16} /><span>Orders are fulfilled by the creator. Choose Salary or InstaPay at checkout.</span></div>
  </div>;
}

/* ===================================================================
   PAY PAGE — handles all payments, salary linking, direct pay, pledges,
   and payroll deduction schedules backed by Trustea MFI & InstaPay.
   =================================================================== */
function PayPage({
  user,
  salaryAccount,
  mandates,
  salaryApplications,
  orders,
  directPayments,
  creators,
  configured,
  busy,
  subTab,
  onSubTabChange,
  pendingIntent,
  onClearPendingIntent,
  onCompletePendingIntent,
  onRegisterSalary,
  onDirectPayment,
  onCancelMandate,
  onLogin,
  hasValidAccount,
}: {
  user: User | null;
  salaryAccount: SalaryAccount | null;
  mandates: Mandate[];
  salaryApplications: SalaryApplication[];
  orders: Order[];
  directPayments: DirectPayment[];
  creators: Creator[];
  configured: boolean;
  busy: boolean;
  subTab: PaySubTab;
  onSubTabChange: (tab: PaySubTab) => void;
  pendingIntent: PendingIntent;
  onClearPendingIntent: () => void;
  onCompletePendingIntent: () => void;
  onRegisterSalary: (details: {
    firstName: string;
    lastName: string;
    nrcNumber: string;
    employmentNumber: string;
    employer: string;
    monthlySalary: number;
    phone: string;
    payslipFile: File | null;
  }) => Promise<void>;
  onDirectPayment: (params: {
    recipientName: string;
    recipientPhone?: string;
    amount: number;
    note: string;
    method: 'salary' | 'instapay';
  }) => Promise<void>;
  onCancelMandate: (mandateId: string) => Promise<void>;
  onLogin: () => boolean;
  hasValidAccount: boolean;
}) {
  const [panel, setPanel] = useState<PaySubTab | null>(
    pendingIntent ? subTab : null
  );
  const [salaryFormOpen, setSalaryFormOpen] = useState(!salaryAccount || salaryAccount.status === 'unlinked');
  const [payslipFile, setPayslipFile] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'salary' | 'instapay'>('salary');

  const openPanel = (nextPanel: PaySubTab) => {
    setPanel(nextPanel);
    onSubTabChange(nextPanel);
  };

  const handleSalarySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await onRegisterSalary({
      firstName: String(form.get('firstName') || '').trim(),
      lastName: String(form.get('lastName') || '').trim(),
      nrcNumber: String(form.get('nrcNumber') || '').trim(),
      employmentNumber: String(form.get('employmentNumber') || '').trim(),
      employer: String(form.get('employer') || '').trim(),
      monthlySalary: Number(form.get('monthlySalary')),
      phone: String(form.get('phone') || '').trim(),
      payslipFile,
    });
    setSalaryFormOpen(false);
    setPayslipFile(null);
    if (pendingIntent) onCompletePendingIntent();
  };

  const handleDirectPaymentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      onLogin();
      return;
    }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const amount = Number(form.get('amount'));
    if (!Number.isFinite(amount) || amount <= 0) return;
    await onDirectPayment({
      recipientName: String(form.get('recipientName') || '').trim(),
      recipientPhone: String(form.get('recipientPhone') || '').trim() || undefined,
      amount,
      note: String(form.get('note') || '').trim(),
      method: paymentMethod,
    });
    formElement.reset();
  };

  const historyEntries = [
    ...directPayments.map((payment) => ({
      id: payment.id,
      label: payment.title,
      detail: payment.note || payment.recipient,
      amount: payment.amount,
      status: payment.status === 'pending_mfi' ? 'Pending MFI' : 'Initiated',
      method: payment.method === 'salary' ? 'Salary' : 'InstaPay',
      createdAt: payment.created_at,
    })),
    ...salaryApplications
      .filter((application) => application.context_ref_id !== 'salary_registration' && application.context_ref_id !== 'direct_payment')
      .map((application) => ({
        id: application.id,
        label: application.context_label,
        detail: application.context_type === 'shop_order' ? 'Shop order' : 'Creator support',
        amount: application.amount,
        status: application.status === 'pending_mfi' ? 'Pending MFI' : application.status === 'approved' ? 'Approved' : 'Not approved',
        method: 'Salary',
        createdAt: application.created_at,
      })),
    ...orders.map((order) => ({
      id: order.id,
      label: order.creator_products?.name || 'Creator shop order',
      detail: `Quantity ${order.quantity}`,
      amount: 0,
      status: order.status,
      method: 'Shop',
      createdAt: order.created_at,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const intentLabel = pendingIntent?.type === 'donate'
    ? `${pendingIntent.tier.name} for ${pendingIntent.creator?.display_name || 'a creator'}`
    : pendingIntent?.type === 'buy'
      ? pendingIntent.product.name
      : '';

  return (
    <div className="page-wrap pay-page">
      <div className="page-title-block">
        <div className="eyebrow">YOUR PAYMENTS</div>
        <h1>A little goes a long way.</h1>
        <p>Manage your salary account, support creators, and keep track of your requests.</p>
      </div>

      {pendingIntent && (
        <div className="pending-intent-banner">
          <div className="pending-intent-content">
            <Heart className="intent-icon" size={19} />
            <div className="intent-copy">
              <h3>Almost there.</h3>
              <p>{hasValidAccount ? `Continue with ${intentLabel}.` : `Link your salary account to continue with ${intentLabel}.`}</p>
            </div>
          </div>
          <div className="pending-intent-actions">
            <button className="button button-dark" onClick={() => hasValidAccount ? onCompletePendingIntent() : openPanel('salary')}>
              {hasValidAccount ? 'Continue' : 'Link account'} <ArrowRight size={14} />
            </button>
            <button className="icon-close-intent" onClick={onClearPendingIntent} aria-label="Dismiss pending payment"><X size={15} /></button>
          </div>
        </div>
      )}

      {!user && (
        <div className="pending-card">
          <div className="pending-icon"><LockKeyhole size={17} /></div>
          <div><strong>Log in to manage payments</strong><p>Your salary account, creator pledges, and payment history are available after you log in.</p></div>
          <button className="button button-dark" onClick={onLogin}>Log in <ArrowRight size={14} /></button>
        </div>
      )}

      {salaryAccount && (
        <section className="pay-summary-card">
          <div className="pay-summary-top">
            <span className="eyebrow">SALARY ACCOUNT</span>
            <span className={`status-pill ${salaryAccount.status === 'linked' ? 'active' : 'pending'}`}>
              {salaryAccount.status === 'linked' ? 'Verified' : 'MFI review'}
            </span>
          </div>
          <div className="pay-summary-name">{salaryAccount.firstName} {salaryAccount.lastName}</div>
          <div className="pay-summary-employer">{salaryAccount.employer || 'Employer not provided'} · {salaryAccount.employmentNumber}</div>
          <div className="pay-summary-figures">
            <div><small>Monthly salary</small><strong>{money(salaryAccount.monthlySalary)}</strong></div>
            <div><small>Account status</small><strong className="highlight-green">{salaryAccount.status === 'linked' ? 'Ready to use' : 'Awaiting review'}</strong></div>
          </div>
        </section>
      )}

      <div className="pay-action-grid">
        <button className="pay-action-tile" onClick={() => openPanel('salary')}>
          <span className="tile-icon green"><Briefcase size={18} /></span><strong>Salary account</strong><span>{salaryAccount ? 'View or update details' : 'Link your account'}</span>
          {!salaryAccount && <span className="tile-badge">Set up</span>}
        </button>
        <button className="pay-action-tile" onClick={() => openPanel('direct')}>
          <span className="tile-icon blue"><CreditCard size={18} /></span><strong>Direct payment</strong><span>Pay someone directly</span>
        </button>
        <button className="pay-action-tile" onClick={() => openPanel('pledges')}>
          <span className="tile-icon peach"><Heart size={18} /></span><strong>My pledges</strong><span>Manage creator support</span>
          {mandates.length > 0 && <span className="tile-count">{mandates.length}</span>}
        </button>
        <button className="pay-action-tile" onClick={() => openPanel('history')}>
          <span className="tile-icon lilac"><Clock3 size={18} /></span><strong>Payment history</strong><span>See recent activity</span>
        </button>
      </div>

      {panel === 'salary' && (
        <section className="pay-section salary-form-card">
          <div className="section-intro">
            <span className="intro-icon"><Briefcase size={18} /></span>
            <div><h2>{salaryAccount ? 'Your salary account' : 'Link your salary account'}</h2><p>Your MFI reviews your details before payroll deductions begin.</p></div>
          </div>
          {salaryAccount && !salaryFormOpen ? (
            <div className="salary-card-verified">
              <div className="salary-card-main">
                <div className="salary-user-info"><h2>{salaryAccount.firstName} {salaryAccount.lastName}</h2><div className="salary-meta-row">{salaryAccount.employer} · {salaryAccount.employmentNumber}</div></div>
                <span className="mfi-partner-chip"><BadgeCheck size={14} /> {salaryAccount.status === 'linked' ? 'MFI verified' : 'Awaiting MFI'}</span>
              </div>
              <div className="salary-card-details-grid">
                <label>Monthly salary<span>{money(salaryAccount.monthlySalary)}</span></label>
                <label>Phone<span>{salaryAccount.phone || 'Not provided'}</span></label>
                <label>NRC number<span>{salaryAccount.nrcNumber || 'Not provided'}</span></label>
              </div>
              <div className="salary-card-actions"><button className="button button-outline" onClick={() => setSalaryFormOpen(true)}>Update account</button></div>
            </div>
          ) : (
            <form className="form-stack" onSubmit={handleSalarySubmit}>
              <div className="form-info-strip"><LockKeyhole size={14} /> Your payslip is shared with your MFI for verification. No deductions start until it is approved.</div>
              <div className="form-row-two">
                <label>First name<input name="firstName" defaultValue={salaryAccount?.firstName || ''} autoComplete="given-name" required /></label>
                <label>Last name<input name="lastName" defaultValue={salaryAccount?.lastName || ''} autoComplete="family-name" required /></label>
              </div>
              <div className="form-row-two">
                <label>NRC number<input name="nrcNumber" defaultValue={salaryAccount?.nrcNumber || ''} required /></label>
                <label>Employment number<input name="employmentNumber" defaultValue={salaryAccount?.employmentNumber || ''} required /></label>
              </div>
              <div className="form-row-two">
                <label>Employer<input name="employer" defaultValue={salaryAccount?.employer || ''} required /></label>
                <label>Monthly salary (ZMW)<input name="monthlySalary" type="number" min="1" step="0.01" defaultValue={salaryAccount?.monthlySalary || ''} required /></label>
              </div>
              <label>Phone number<input name="phone" type="tel" defaultValue={salaryAccount?.phone || ''} autoComplete="tel" required /></label>
              <div className="payslip-upload-area">
                <div className="payslip-label">Latest payslip <span className="optional">(photo or PDF)</span></div>
                <label className="payslip-drop-btn">
                  <Upload size={17} /><span>{payslipFile?.name || 'Choose a payslip to upload'}</span><small>JPG, PNG or PDF · max 10 MB</small>
                  <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(event) => setPayslipFile(event.currentTarget.files?.[0] || null)} />
                </label>
              </div>
              <div className="form-actions-row">
                <button className="button button-dark" disabled={busy || !configured}>{busy ? 'Submitting…' : 'Submit for MFI review'} <ArrowRight size={15} /></button>
                {salaryAccount && <button type="button" className="button button-outline" onClick={() => setSalaryFormOpen(false)}>Cancel</button>}
              </div>
              {!configured && <div className="form-message">Connect Supabase to submit salary account details.</div>}
            </form>
          )}
        </section>
      )}

      {panel === 'direct' && (
        <section className="pay-section direct-pay-card">
          <div className="section-intro">
            <span className="intro-icon"><CreditCard size={18} /></span>
            <div><h2>Make a direct payment</h2><p>Send a payment by InstaPay or request an MFI-reviewed salary deduction.</p></div>
          </div>
          <form className="form-stack" onSubmit={handleDirectPaymentSubmit}>
            <label>Recipient name<input name="recipientName" maxLength={100} required /></label>
            <label>Recipient phone <span className="optional">(optional)</span><input name="recipientPhone" type="tel" /></label>
            <label>Amount (ZMW)<input name="amount" type="number" min="1" step="0.01" required /></label>
            <label>Payment note <span className="optional">(optional)</span><textarea name="note" maxLength={240} rows={2} /></label>
            <div className="payment-method-choices">
              <button type="button" className={`method-choice-card ${paymentMethod === 'salary' ? 'selected' : ''}`} onClick={() => setPaymentMethod('salary')}>
                <span className="choice-header"><Briefcase size={16} /> Salary deduction</span>
                <p>Send a request to your MFI for review.</p>
                <span className={`choice-pill ${hasValidAccount ? 'active' : 'warning'}`}>{hasValidAccount ? 'Account ready' : 'Link salary account first'}</span>
              </button>
              <button type="button" className={`method-choice-card ${paymentMethod === 'instapay' ? 'selected' : ''}`} onClick={() => setPaymentMethod('instapay')}>
                <span className="choice-header"><CreditCard size={16} /> InstaPay</span>
                <p>Initiate a direct InstaPay transfer.</p>
              </button>
            </div>
            {paymentMethod === 'salary' && !hasValidAccount && <div className="form-message">Link a salary account before requesting a salary deduction.</div>}
            <button className="button button-dark" disabled={busy || !configured || (paymentMethod === 'salary' && !hasValidAccount)}>{busy ? 'Sending…' : 'Continue'} <ArrowRight size={15} /></button>
            {!configured && <div className="form-message">Connect Supabase to make payments.</div>}
          </form>
        </section>
      )}

      {panel === 'pledges' && (
        <section className="pay-section">
          <div className="section-intro"><span className="intro-icon"><Heart size={18} /></span><div><h2>Creator pledges</h2><p>See the people you support and manage recurring commitments.</p></div></div>
          {mandates.length ? (
            <div className="pledge-list">
              {mandates.map((mandate) => (
                <article className="pledge-card" key={mandate.id}>
                  <div className="pledge-main">
                    <div className="pledge-avatar">{initials(mandate.creator_profiles?.display_name)}</div>
                    <div className="pledge-info"><strong>{mandate.creator_profiles?.display_name || 'Creator'}</strong><span>{mandate.creator_tiers?.name || 'Creator support'} · {mandate.status.replace('_', ' ')}</span></div>
                  </div>
                  <div className="pledge-schedule"><span>Monthly support</span><strong>{money(Number(mandate.monthly_amount))}</strong></div>
                  <span className="status-pill">{mandate.status.replace('_', ' ')}</span>
                  {mandate.status === 'active' && <button className="pledge-cancel-btn" disabled={busy} onClick={() => onCancelMandate(mandate.id)}>Cancel</button>}
                </article>
              ))}
            </div>
          ) : <EmptyState title="No pledges yet." detail="Find a creator to support and your memberships will appear here." />}
        </section>
      )}

      {panel === 'history' && (
        <section className="pay-section">
          <div className="section-intro"><span className="intro-icon"><Clock3 size={18} /></span><div><h2>Payment history</h2><p>Recent payments, salary requests, and shop orders.</p></div></div>
          {historyEntries.length ? (
            <div className="history-ledger">
              {historyEntries.map((entry) => (
                <article className="history-row-item" key={`${entry.method}-${entry.id}`}>
                  <div className="history-icon-col">{entry.method === 'Salary' ? <Briefcase size={17} /> : entry.method === 'Shop' ? <ShoppingBag size={17} /> : <CreditCard size={17} />}</div>
                  <div className="history-info-col"><strong>{entry.label}</strong><span>{entry.detail} · {new Date(entry.createdAt).toLocaleDateString()}</span></div>
                  <div className="history-amount-col">{entry.amount > 0 && <strong>{money(Number(entry.amount))}</strong>}<span>{entry.status}</span></div>
                  <div className="history-method-col"><span className="method-pill">{entry.method}</span></div>
                </article>
              ))}
            </div>
          ) : <EmptyState title="Nothing to show just yet." detail="Your payment and order activity will appear here." />}
        </section>
      )}
    </div>
  );
}

function StudioPage({ user, creator, posts, products, orders, busy, onLogin, onCreateProfile, onCreatePost, onCreateProduct, onCreateTier, onOrderStatusChange }: {
  user: User | null; creator: Creator | null; posts: Post[]; products: Product[]; orders: Order[]; onLogin: () => boolean;
  busy: boolean;
  onCreateProfile: () => void; onCreatePost: () => void; onCreateProduct: () => void; onCreateTier: () => void;
  onOrderStatusChange: (orderId: string, status: 'accepted' | 'declined') => void;
}) {
  if (!user) return <div className="page-wrap"><div className="page-title-block"><div className="eyebrow">YOUR WORK, YOUR WAY</div><h1>Make a little something.</h1><p>Build your page, share the process, and find people who care.</p></div><div className="studio-welcome"><div className="studio-welcome-icon"><Sparkles size={28} /></div><h2>Your audience is out there.</h2><p>Log in or make an account to open your creator studio.</p><button className="button button-dark" onClick={onLogin}>Log in to get started <ArrowRight size={15} /></button></div></div>;
  if (!creator) return <div className="page-wrap"><div className="page-title-block"><div className="eyebrow">YOUR WORK, YOUR WAY</div><h1>Make a little something.</h1><p>Build your page, share the process, and find people who care.</p></div><div className="studio-welcome"><div className="studio-welcome-icon"><Sparkles size={28} /></div><h2>Start your creator page.</h2><p>Set up your page in a minute. You can add supporter tiers and posts whenever you're ready.</p><button className="button button-dark" onClick={onCreateProfile}>Create my page <ArrowRight size={15} /></button></div></div>;
  const profilePosts = posts.filter((post) => post.creator_id === creator.id);
  const profileProducts = products.filter((product) => product.creator_id === creator.id);
  return <div className="page-wrap">
    <div className="studio-header"><div><div className="eyebrow">CREATOR STUDIO</div><h1>Your little corner.</h1><p>Say something. Make something. Let your people in.</p></div><span className="creator-live"><i /> Your page is live</span></div>
    <div className="studio-metrics"><div><span>Posts</span><strong>{profilePosts.length}</strong><small>little things shared</small></div><div><span>Shop items</span><strong>{profileProducts.length}</strong><small>made by you</small></div><div><span>Order requests</span><strong>{orders.length}</strong><small>check in with your people</small></div></div>
    <div className="studio-actions"><button className="button button-dark" onClick={onCreatePost}><Plus size={16} /> Write a post</button><button className="button button-outline" onClick={onCreateProduct}><ShoppingBag size={16} /> Add something to shop</button><button className="button button-outline" onClick={onCreateTier}><Heart size={16} /> Add a support tier</button></div>
    {orders.length > 0 && <section className="studio-section"><div className="section-heading compact"><div><div className="eyebrow">FROM YOUR SHOP</div><h2>Order requests</h2></div></div><div className="order-list">{orders.map((order) => <div className="order-row" key={order.id}><Package size={17} /><strong>{order.creator_products?.name || 'Your item'}</strong><span>Qty {order.quantity}</span><span className={`status-pill ${order.status === 'accepted' || order.status === 'fulfilled' ? 'active' : 'pending'}`}>{order.status}</span>{order.status === 'requested' && <div className="order-actions"><button disabled={busy} onClick={() => onOrderStatusChange(order.id, 'accepted')}>Accept</button><button disabled={busy} onClick={() => onOrderStatusChange(order.id, 'declined')}>Decline</button></div>}</div>)}</div></section>}
    <section className="studio-section"><div className="section-heading compact"><div><div className="eyebrow">YOUR LATEST</div><h2>Posts you've shared.</h2></div></div>{profilePosts.length ? <PostGrid posts={profilePosts} creators={[creator]} /> : <EmptyState title="Your feed is a blank page." detail="Write the first post to say hello to your supporters." action="Write a post" onAction={onCreatePost} />}</section>
  </div>;
}

function PostGrid({ posts, creators }: { posts: Post[]; creators: Creator[] }) {
  if (!posts.length) return <EmptyState title="Nothing here just yet." detail="Come back soon for something good." />;
  return <div className="post-grid">{posts.map((post, index) => {
    const creator = creators.find((item) => item.id === post.creator_id);
    const authorName = post.creator_profiles?.display_name || creator?.display_name || 'Creator';
    const locked = post.visibility === 'supporters';
    return <article className="post-card" key={post.id}>
      <div className={`post-art post-art-${index % 4}`}>{post.image_url ? <img src={post.image_url} alt="" /> : <><span className="post-art-sun" /><span className="post-art-text">{['a thought for today', 'work in progress', 'made with care', 'from the studio'][index % 4]}</span><span className="post-art-mark">✳</span></>}</div>
      <div className="post-card-body"><div className="post-meta"><span>{authorName}</span><span>·</span><span>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>{locked && <span className="locked-label"><LockKeyhole size={11} /> supporters</span>}</div><h3>{post.title}</h3><p>{post.body}</p></div>
    </article>;
  })}</div>;
}

function EmptyState({ title, detail, action, onAction }: { title: string; detail: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state"><div className="empty-doodle"><Sparkles size={21} /></div><strong>{title}</strong><p>{detail}</p>{action && onAction && <button onClick={onAction}>{action} <ArrowRight size={14} /></button>}</div>;
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card" role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button>{children}</section></div>;
}