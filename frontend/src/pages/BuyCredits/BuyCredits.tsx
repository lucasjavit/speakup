import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { paymentService, creditService } from '@/services';
import { BackButton, Card, Tooltip } from '@/components/ui';
import type { Product, ProductList, CreditWallet } from '@/types';
import stripeLogo from '@/assets/stripe.png';
import styles from './BuyCredits.module.css';

export function BuyCredits() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'conversations' ? 'conversations' : 'sessions';

  const [products, setProducts] = useState<ProductList | null>(null);
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [activeTab, setActiveTab] = useState<'sessions' | 'conversations'>(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      const [productsData, walletData] = await Promise.all([
        paymentService.getProducts(),
        creditService.getWallet(),
      ]);
      setProducts(productsData);
      setWallet(walletData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }

  const handlePurchase = async (productId: string) => {
    try {
      setPurchaseLoading(productId);
      setError(null);
      const checkout = await paymentService.createCheckout(productId);
      // Redirect to Stripe Checkout
      window.location.href = checkout.url;
    } catch (err) {
      console.error('Error creating checkout:', err);
      setError('Failed to start checkout. Please try again.');
      setPurchaseLoading(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const currentProducts = activeTab === 'sessions'
    ? products?.sessionProducts || []
    : products?.conversationProducts || [];

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <BackButton to="/credits" label="My Credits" />
        <h1 className={styles.pageTitle}>Buy Credits</h1>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Current Balance Card */}
      <div className={styles.balanceCard}>
        <div className={styles.balanceContent}>
          <div className={styles.balanceInfo}>
            <div className={styles.balanceIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
              </svg>
            </div>
            <div className={styles.balanceText}>
              <span className={styles.balanceLabel}>Current Balance</span>
              <span className={styles.balanceValue}>{wallet?.conversationCredits || 0}</span>
              <span className={styles.balanceUnit}>conversations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'sessions' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
          Session Packs
          <span className={styles.tabBadge}>Best Value</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'conversations' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('conversations')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
          </svg>
          Individual
        </button>
      </div>

      {/* Tab Description */}
      <div className={styles.tabDescription}>
        {activeTab === 'sessions' ? (
          <p>
            <strong>Session packs</strong> give you 6 conversations per session - perfect for regular practice!
          </p>
        ) : (
          <p>
            <strong>Individual conversations</strong> - buy exactly what you need, no commitment.
          </p>
        )}
      </div>

      {/* Security Notice */}
      <div className={styles.securityNoticeWrapper}>
        <Tooltip content="Click to learn more about Stripe" position="top">
          <a
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.securityNotice}
          >
            <div className={styles.securityIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
            </div>
            <div className={styles.securityText}>
              <strong>Secure payment powered by Stripe</strong>
              <span>We never store your credit card information. All payments are processed securely by Stripe.</span>
            </div>
            <img src={stripeLogo} alt="Stripe" className={styles.stripeLogo} />
          </a>
        </Tooltip>
      </div>

      {/* Products Grid */}
      <div className={styles.productsGrid}>
        {currentProducts.map((product: Product) => (
          <ProductCard
            key={product.id}
            product={product}
            isLoading={purchaseLoading === product.id}
            onPurchase={() => handlePurchase(product.id)}
            formatCurrency={formatCurrency}
          />
        ))}
      </div>

      {/* Benefits Section */}
      <div className={styles.benefitsSection}>
        <h3 className={styles.benefitsTitle}>Why buy credits?</h3>
        <div className={styles.benefitsGrid}>
          <div className={styles.benefitItem}>
            <div className={styles.benefitIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className={styles.benefitText}>
              <strong>No subscription</strong>
              <span>Pay only for what you use</span>
            </div>
          </div>
          <div className={styles.benefitItem}>
            <div className={styles.benefitIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
            </div>
            <div className={styles.benefitText}>
              <strong>Never expires</strong>
              <span>Use your credits anytime</span>
            </div>
          </div>
          <div className={styles.benefitItem}>
            <div className={styles.benefitIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
            </div>
            <div className={styles.benefitText}>
              <strong>Secure payment</strong>
              <span>We don't store your card data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  isLoading: boolean;
  onPurchase: () => void;
  formatCurrency: (value: number) => string;
}

function ProductCard({ product, isLoading, onPurchase, formatCurrency }: ProductCardProps) {
  const conversations = product.creditType === 'SESSION' ? product.credits * 6 : product.credits;

  return (
    <Card className={`${styles.productCard} ${product.popular ? styles.popular : ''} ${product.bestValue ? styles.bestValue : ''}`}>
      {product.popular && (
        <span className={styles.badge}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
          Most Popular
        </span>
      )}
      {product.bestValue && (
        <span className={styles.badge}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Best Value
        </span>
      )}

      <div className={styles.productHeader}>
        <h3 className={styles.productName}>{product.name}</h3>
        {product.discount && (
          <span className={styles.discount}>-{product.discount}</span>
        )}
      </div>

      <div className={styles.productCredits}>
        <span className={styles.creditsValue}>{conversations}</span>
        <span className={styles.creditsLabel}>conversations</span>
      </div>

      <div className={styles.productPrice}>
        <span className={styles.price}>{formatCurrency(product.price)}</span>
        <span className={styles.pricePerCredit}>
          {formatCurrency(product.price / conversations)}/conversation
        </span>
      </div>

      <button
        onClick={onPurchase}
        disabled={isLoading}
        className={styles.purchaseButton}
      >
        {isLoading ? (
          <>
            <span className={styles.spinner} />
            Processing...
          </>
        ) : (
          'Buy Now'
        )}
      </button>
    </Card>
  );
}
