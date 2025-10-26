import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield, Zap, DollarSign, Globe, BarChart3, CheckCircle2, Clock, X, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { RatePreview } from '../components/RatePreview';
import { useToast } from '../hooks/use-toast';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Landing = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [showPlaidModal, setShowPlaidModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  
  // State management
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [balance, setBalance] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  // Configure axios to send cookies
  axios.defaults.withCredentials = true;

  // Load state on mount
  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const { data } = await axios.get(`${API}/state`);
      
      // Load accounts and transactions if they exist
      if (data.accounts && data.accounts.length > 0) {
        setAccounts(data.accounts);
        setIsConnected(true);
        // Calculate balance from first checking account
        const checking = data.accounts.find(acc => acc.subtype === 'checking');
        if (checking) {
          setBalance(checking.balances.current);
        }
      }
      
      if (data.transactions && data.transactions.length > 0) {
        setTransactions(data.transactions.slice(0, 3));
      }
      
      if (data.activity && data.activity.length > 0) {
        setActivity(data.activity);
      }
    } catch (error) {
      console.error('Error loading state:', error);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await axios.post(`${API}/leads`, { email });
      
      if (data.status === 'ok') {
        toast({
          title: 'Success!',
          description: "You're on the early access list. We'll notify you soon.",
        });
        setEmail('');
      } else if (data.status === 'already_subscribed') {
        toast({
          title: 'Already subscribed',
          description: 'This email is already on our list.',
        });
      } else if (data.status === 'invalid_email') {
        toast({
          title: 'Invalid email',
          description: 'Please enter a valid email address',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error submitting email:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit email. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnectBank = async () => {
    setShowPlaidModal(true);
  };

  const handleBankSelect = async (bankName) => {
    setIsLoadingAccounts(true);
    setShowPlaidModal(false);
    
    try {
      // 1. Create link token
      await axios.post(`${API}/plaid/mock/create-link-token`);
      
      // 2. Exchange token (simulated)
      await axios.post(`${API}/plaid/mock/exchange`, {
        public_token: 'public-sandbox-mock'
      });
      
      // 3. Get accounts
      const { data: accountsData } = await axios.get(`${API}/plaid/mock/accounts`);
      setAccounts(accountsData.accounts);
      setIsConnected(true);
      
      // Calculate balance
      const checking = accountsData.accounts.find(acc => acc.subtype === 'checking');
      if (checking) {
        setBalance(checking.balances.current);
      }
      
      // 4. Get transactions
      const { data: txData } = await axios.get(`${API}/plaid/mock/transactions?limit=3`);
      setTransactions(txData.transactions);
      
      toast({
        title: 'Bank connected (sandbox)',
        description: `Connected to ${bankName} - demo mode`
      });
    } catch (error) {
      console.error('Error connecting bank:', error);
      toast({
        title: 'Connection failed',
        description: 'Failed to connect bank. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handlePreviewClick = (data) => {
    setPreviewData(data);
    setShowPreview(true);
  };

  const handleConfirmTransfer = async () => {
    if (!previewData) return;
    
    try {
      const destType = previewData.destination.includes('GCash') ? 'GCash' : 'PH_BANK';
      const destTag = destType === 'GCash' ? '+63-917-XXX-XXXX' : 'BPI-XXXXXXXX';
      
      const { data } = await axios.post(`${API}/circle/sendFunds`, {
        amountUSD: previewData.amount,
        destinationType: destType,
        destinationTag: destTag
      });
      
      // Add to activity at the top
      const newActivity = {
        id: data.transactionId,
        amount: previewData.amount,
        recipient: previewData.destination,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        estPhp: data.estPhp
      };
      setActivity([newActivity, ...activity]);
      
      toast({
        title: 'Transfer initiated (sandbox)',
        description: `Transaction ${data.transactionId} - demo mode`
      });
      
      setShowPreview(false);
      setPreviewData(null);
    } catch (error) {
      console.error('Error sending funds:', error);
      toast({
        title: 'Transfer failed',
        description: 'Failed to initiate transfer. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleResetDemo = async () => {
    try {
      await axios.post(`${API}/state/clear`);
      
      // Reset all state
      setAccounts([]);
      setTransactions([]);
      setActivity([]);
      setBalance(0);
      setIsConnected(false);
      setDemoAmount('');
      
      toast({
        title: 'Demo reset',
        description: 'All demo data has been cleared'
      });
      
      // Reload state
      loadState();
    } catch (error) {
      console.error('Error resetting demo:', error);
      toast({
        title: 'Reset failed',
        description: 'Failed to reset demo. Please refresh the page.',
        variant: 'destructive'
      });
    }
  };

  const PlaidModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowPlaidModal(false)}>
      <Card className="relative w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setShowPlaidModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="h-5 w-5" />
        </button>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4">Connect your bank</h3>
          <p className="text-sm text-slate-600 mb-6">This is a sandbox demo. In production, Plaid securely connects your bank in seconds.</p>
          <div className="space-y-3">
            {['Chase Bank', 'Bank of America', 'Wells Fargo', 'Citibank'].map(bank => (
              <button
                key={bank}
                className="w-full text-left p-4 rounded-lg border-2 border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all"
                onClick={() => handleBankSelect(bank)}
              >
                <div className="font-medium">{bank}</div>
                <div className="text-xs text-slate-500">Sandbox account</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const PreviewModal = () => {
    if (!previewData) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
        <Card className="relative w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setShowPreview(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">Transfer preview</h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-500">You send</div>
                <div className="text-2xl font-bold">${previewData.amount.toFixed(2)} USD</div>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-slate-400" />
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-500">They receive (estimated)</div>
                <div className="text-2xl font-bold">₱{previewData.php.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">Rate: ₱{previewData.fx} per USD (demo)</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination</span>
                  <span className="font-medium">{previewData.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fee</span>
                  <span className="font-medium">${previewData.fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery</span>
                  <span className="font-medium">~5 minutes</span>
                </div>
                <div className="pt-2 border-t flex justify-between font-semibold">
                  <span>Total cost</span>
                  <span>${(previewData.amount + previewData.fee).toFixed(2)}</span>
                </div>
              </div>
              <Button className="w-full bg-sky-600 hover:bg-sky-700" onClick={handleConfirmTransfer} data-cta="confirm-transfer">
                Confirm transfer (sandbox)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <>
      {/* Skip to content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] rounded bg-sky-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        Skip to content
      </a>

      <main id="main-content" className="min-h-screen bg-white text-slate-800 selection:bg-yellow-200">
        {showPlaidModal && <PlaidModal />}
        {showPreview && <PreviewModal />}
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 via-red-500 to-yellow-400" aria-hidden="true" />
            <span className="text-xl font-bold tracking-tight">PBX</span>
            <span className="ml-2 hidden sm:inline text-slate-500 text-sm">Philippine Bayani Exchange</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#how" className="hover:text-slate-900 text-slate-600 transition-colors">How it works</a>
            <a href="#features" className="hover:text-slate-900 text-slate-600 transition-colors">Features</a>
            <a href="#faq" className="hover:text-slate-900 text-slate-600 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="hidden sm:inline-flex" onClick={() => {
              document.querySelector('#demo-section')?.scrollIntoView({ behavior: 'smooth' });
            }} data-cta="see-demo">See demo</Button>
            <Button className="bg-sky-600 hover:bg-sky-700" onClick={() => {
              document.querySelector('#join')?.scrollIntoView({ behavior: 'smooth' });
            }} data-cta="get-early-access">Get early access</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" id="demo-section">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-sky-50 via-white to-white" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-16 md:pt-24 md:pb-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              For the Heroes Who Build Home from Afar.
            </h1>
            <p className="mt-4 text-xl sm:text-2xl text-sky-600 font-semibold leading-tight">
              Every transfer carries more than money—it carries love, dreams, and family.
            </p>
            <p className="mt-5 text-lg text-slate-600">
              Philippine Bayani Exchange (PBX) empowers every modern hero to care for family with speed, security, and heart. Seamless cross-border transfers built for Filipinos worldwide.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="bg-sky-600 hover:bg-sky-700" onClick={() => {
                document.querySelector('#join')?.scrollIntoView({ behavior: 'smooth' });
              }} data-cta="hero-get-early-access">
                Get early access
              </Button>
              <Button variant="outline" data-cta="hero-watch-demo">Watch a 90‑sec demo</Button>
            </div>
            <p className="mt-4 text-xs text-slate-500">MVP demo uses sandbox data—no real funds move.</p>
          </div>

          {/* Interactive Demo */}
          <div className="relative">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">PBX • Demo</span>
                    {isConnected && (
                      <button 
                        onClick={handleResetDemo}
                        className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1"
                        title="Reset demo"
                        data-cta="reset-demo"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="rounded-lg bg-gradient-to-br from-sky-50 to-sky-100 p-4 border border-sky-200">
                    <div className="text-sm text-slate-600">Balance</div>
                    <div className="text-3xl font-bold">${balance.toFixed(2)}</div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 text-xs"
                      onClick={handleConnectBank}
                      disabled={isLoadingAccounts || isConnected}
                      data-cta="connect-bank"
                    >
                      {isLoadingAccounts ? 'Connecting...' : isConnected ? 'Connected' : 'Connect bank (sandbox)'}
                    </Button>
                  </div>

                  {isConnected && (
                    <>
                      <Card className="border-2 border-slate-200">
                        <CardContent className="p-4">
                          <div className="text-sm font-medium mb-3">Send USD → PHP</div>
                          <RatePreview onPreviewClick={handlePreviewClick} />
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-slate-200">
                        <CardContent className="p-4">
                          <div className="text-sm font-medium mb-2">Recent activity</div>
                          {activity.length === 0 && transactions.length === 0 ? (
                            <p className="text-sm text-slate-500">No activity yet</p>
                          ) : (
                            <ul className="space-y-2 text-sm">
                              {activity.slice(0, 2).map(tx => (
                                <li key={tx.id} className="flex items-center gap-2 text-slate-600">
                                  <Clock className="h-4 w-4 text-yellow-500" />
                                  ${tx.amount} → {tx.recipient} • {tx.status}
                                </li>
                              ))}
                              {transactions.slice(0, 3 - activity.length).map(tx => (
                                <li key={tx.transaction_id} className="flex items-center gap-2 text-slate-600">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  {tx.name} • ${Math.abs(tx.amount)}
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {!isConnected && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      Connect a bank to start demo
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="pointer-events-none absolute -top-6 -right-6 h-28 w-28 rounded-full bg-yellow-300/40 blur-2xl" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-8 border-y border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs uppercase tracking-widest text-slate-500 mb-4">Built on trusted infrastructure</p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600">
            <span className="text-sm font-medium">Plaid (Bank connections)</span>
            <span className="text-slate-300">•</span>
            <span className="text-sm font-medium">Circle (USDC rails)</span>
            <span className="text-slate-300">•</span>
            <span className="text-sm font-medium">Secure Cloud</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight">How PBX works</h2>
          <p className="mt-2 text-slate-600">Three simple steps. Our MVP uses sandbox data while we onboard partners.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { n: '01', t: 'Connect your bank', d: 'Link a U.S. bank account via Plaid in seconds (sandbox in MVP).', icon: Shield },
              { n: '02', t: 'Convert to stablecoin', d: 'We illustrate USDC conversion on Circle rails for speed and transparency.', icon: Zap },
              { n: '03', t: 'Deliver to PH', d: 'Send to GCash or PH bank accounts. Track status in real time.', icon: Globe },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.n} className="border-2 border-slate-200 hover:border-sky-300 transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-slate-400">{s.n}</div>
                      <Icon className="h-5 w-5 text-sky-600" />
                    </div>
                    <div className="text-xl font-bold mb-2">{s.t}</div>
                    <p className="text-slate-600 text-sm">{s.d}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight">Why teams choose PBX</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { t: 'Fast transfers', d: 'Move value quickly with an instant, modern UX.', icon: Zap, color: 'text-yellow-600' },
              { t: 'Transparent fees', d: 'No surprises—clear preview before you send.', icon: DollarSign, color: 'text-sky-600' },
              { t: 'Global-grade security', d: 'Best-practice encryption, tokenization, and audit logs.', icon: Shield, color: 'text-red-600' },
              { t: 'KYC-ready design', d: 'Built to integrate with identity providers when we go live.', icon: CheckCircle2, color: 'text-green-600' },
              { t: 'Multi-destination', d: 'GCash, bank accounts, and more to come.', icon: Globe, color: 'text-sky-600' },
              { t: 'Admin insights', d: 'View volumes, user activity, and risk flags at a glance.', icon: BarChart3, color: 'text-yellow-600' },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.t} className="bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <Icon className={`h-6 w-6 ${f.color} mb-3`} />
                    <div className="text-lg font-bold mb-2">{f.t}</div>
                    <p className="text-slate-600 text-sm">{f.d}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="join" className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold">Be first to try PBX</h3>
          <p className="mt-2 text-slate-600">Join the early access list. We'll notify you when the live pilot opens.</p>
          <form onSubmit={handleEmailSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full sm:w-80"
              disabled={isSubmitting}
            />
            <Button type="submit" className="bg-sky-600 hover:bg-sky-700 px-6" disabled={isSubmitting} data-cta="submit-email">
              {isSubmitting ? 'Submitting...' : 'Request access'}
            </Button>
          </form>
          <p className="mt-3 text-xs text-slate-500">We'll only email about PBX launch and updates. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 border-t border-slate-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold mb-6">FAQs</h3>
          <div className="space-y-4">
            {[
              { q: 'Is the MVP moving real money?', a: 'No. The demo runs in a sandbox with mock data. No real funds move until compliance is complete.' },
              { q: 'Which partners are involved?', a: 'Bank connectivity via Plaid (sandbox in MVP) and settlement rails modeled on Circle USDC. Additional Philippine payout partners will be added in pilot.' },
              { q: 'Can I try it today?', a: 'Yes—use the demo link to explore the flow with test data, or join the waitlist for early pilot access.' },
              { q: 'What are the fees?', a: 'In production, we plan for transparent flat fees around $2.99 per transfer. No hidden charges, ever.' },
            ].map((faq, i) => (
              <details key={i} className="group rounded-xl border-2 border-slate-200 p-4 bg-white hover:border-sky-300 transition-colors">
                <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <ArrowRight className="h-4 w-4 text-slate-400 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-10 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-sky-500 via-red-500 to-yellow-400" aria-hidden="true" />
            <span className="font-semibold">PBX</span>
            <span className="text-slate-400">•</span>
            <span className="text-sm text-slate-500">Philippine Bayani Exchange</span>
          </div>
          <p className="text-xs text-slate-500 text-center md:text-right max-w-2xl">
            © {new Date().getFullYear()} PBX. Demo experience using sandbox data; no real funds move.
            PBX is not currently providing money transmission or virtual asset services.
            "Plaid" and "Circle" are trademarks of their respective owners.
          </p>
        </div>
      </footer>
      </main>
    </>
  );
};
