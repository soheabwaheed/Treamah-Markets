import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { 
  Home, 
  Car, 
  Map, 
  PlusCircle, 
  User, 
  LogOut, 
  Phone, 
  Camera, 
  X,
  ChevronLeft,
  Search,
  Building2,
  LandPlot,
  MessageCircle,
  Info,
  Globe,
  Trees,
  History,
  ShieldCheck,
  Mail,
  Send,
  Wrench,
  Bike,
  Share2
} from 'lucide-react';

type Category = 'all' | 'real_estate' | 'land' | 'car' | 'motorcycle' | 'equipment';
type View = 'market' | 'about' | 'about_us' | 'privacy' | 'terms' | 'contact' | 'deploy';

interface Ad {
  id: number;
  user_id: number;
  category: Category;
  title: string;
  description: string;
  price: number;
  contact_phone: string;
  image_url: string; // Will store comma-separated URLs
  rooms?: number;
  area?: number;
  car_type?: string;
  car_model?: string;
  car_year?: number;
  created_at: string;
  status: 'active' | 'sold';
}

interface UserData {
  id: number;
  identifier: string;
  name: string;
  auth_provider?: 'email' | 'google';
}

function AdImageCarousel({ images, adId, adTitle, isFullSize = false }: { images: string[], adId: number, adTitle: string, isFullSize?: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const validImages = images.filter(img => img && img.trim() !== '');
  
  const placeholder = `https://picsum.photos/seed/${adId}/800/600`;

  if (validImages.length === 0) {
    return (
      <img 
        src={placeholder} 
        alt={adTitle}
        className={`w-full h-full object-cover ${!isFullSize ? 'group-hover:scale-110 transition-transform duration-500' : ''}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className="relative w-full h-full group/carousel">
      <img 
        src={validImages[currentIndex]} 
        alt={adTitle}
        className={`w-full h-full ${isFullSize ? 'object-contain bg-stone-900' : 'object-cover group-hover:scale-110 transition-transform duration-500'}`}
        referrerPolicy="no-referrer"
      />
      
      {validImages.length > 1 && (
        <>
          <div className={`absolute inset-0 flex items-center justify-between px-4 ${isFullSize ? 'opacity-100' : 'opacity-0 group-hover/carousel:opacity-100'} transition-opacity`}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
              }}
              className="p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white text-stone-800 shadow-lg transition-all"
            >
              <ChevronLeft size={20} className="rotate-180" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
              }}
              className="p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white text-stone-800 shadow-lg transition-all"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {validImages.map((_, i) => (
              <button 
                key={i} 
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(i);
                }}
                className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [activeView, setActiveView] = useState<View>('market');
  const [ads, setAds] = useState<Ad[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showPostAd, setShowPostAd] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);

  // Filters State
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
    rooms: '',
    carType: '',
    carModel: '',
    minYear: '',
    maxYear: ''
  });

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');

  // Post Ad Form State
  const [newAd, setNewAd] = useState({
    category: 'real_estate' as Category,
    title: '',
    description: '',
    price: '',
    contact_phone: '',
    image_urls: ['', '', ''], // Support up to 3 images
    rooms: '',
    area: '',
    car_type: '',
    car_model: '',
    car_year: ''
  });

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: ''
  });
  const [sendingContact, setSendingContact] = useState(false);

  useEffect(() => {
    fetchAds();
    const savedUser = localStorage.getItem('tremseh_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, [activeCategory, filters]);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('action', 'get_ads');
      if (activeCategory !== 'all') params.append('category', activeCategory);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value as string);
      });

      const res = await fetch(`api.php?${params.toString()}`);
      if (!res.ok) throw new Error('Backend unavailable');
      const data = await res.json();
      setAds(data);
    } catch (err) {
      console.log('Falling back to local storage for ads');
      const localAds = JSON.parse(localStorage.getItem('tremseh_local_ads') || '[]');
      let filtered = localAds.map((ad: any) => ({ ...ad, status: ad.status || 'active' }));
      if (activeCategory !== 'all') {
        filtered = filtered.filter((ad: Ad) => ad.category === activeCategory);
      }
      // Simple client-side filtering for demo purposes
      if (filters.minPrice) filtered = filtered.filter((ad: Ad) => ad.price >= Number(filters.minPrice));
      if (filters.maxPrice) filtered = filtered.filter((ad: Ad) => ad.price <= Number(filters.maxPrice));
      
      setAds(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('api.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'بيانات الدخول غير صحيحة');
      }
      const userData = await res.json();
      setUser(userData);
      localStorage.setItem('tremseh_user', JSON.stringify(userData));
      setShowLogin(false);
      setLoginPassword('');
    } catch (err: any) {
      alert(err.message || 'فشل تسجيل الدخول');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('api.php?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier, name: loginName, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التسجيل');
      
      if (data.debug_code) {
        alert(`${data.message}\n\n(ملاحظة: إذا لم تجد الرسالة في صندوق الوارد، يرجى التحقق من ملف البريد المزعج/Spam. تعذر إرسال البريد حالياً، رمز التأكيد الخاص بك هو: ${data.debug_code})`);
      } else {
        alert(data.message + "\n\n(يرجى التحقق من صندوق الوارد أو البريد المزعج)");
      }
      setShowVerify(true);
    } catch (err: any) {
      alert(err.message || 'فشل التسجيل');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('api.php?action=verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier, code: verifyCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التأكيد');
      
      alert(data.message);
      setShowVerify(false);
      setIsRegistering(false);
    } catch (err: any) {
      alert(err.message || 'فشل التأكيد');
    }
  };

  const handleDeleteAd = async (adId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    try {
      const res = await fetch('api.php?action=delete_ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad_id: adId, user_id: user?.id })
      });
      if (res.ok) fetchAds();
    } catch (err) {
      alert('فشل حذف الإعلان');
    }
  };

  const handleMarkSold = async (adId: number) => {
    try {
      const res = await fetch('api.php?action=mark_sold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad_id: adId, user_id: user?.id })
      });
      if (res.ok) fetchAds();
    } catch (err) {
      alert('فشل تحديث حالة الإعلان');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const decoded: any = jwtDecode(credentialResponse.credential);
      const res = await fetch('api.php?action=google_login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: decoded.email, name: decoded.name })
      });
      if (!res.ok) throw new Error('فشل تسجيل الدخول عبر جوجل');
      const userData = await res.json();
      setUser(userData);
      localStorage.setItem('tremseh_user', JSON.stringify(userData));
      setShowLogin(false);
    } catch (err: any) {
      alert(err.message || 'فشل تسجيل الدخول عبر جوجل');
    }
  };

  const googleClientId = '871939628702-ksr4bvt1shac8p32ms7kp5i3s5ud9pmh.apps.googleusercontent.com';

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('tremseh_user');
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return setShowLogin(true);
    
    setSendingContact(true);
    try {
      const res = await fetch('api.php?action=contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contactForm,
          name: user.name,
          identifier: user.identifier
        })
      });
      if (res.ok) {
        alert('تم إرسال رسالتك بنجاح. شكراً لتواصلك معنا.');
        setContactForm({ subject: '', message: '' });
      } else {
        throw new Error('Backend failed');
      }
    } catch (err) {
      console.log('Simulating contact message success for demo mode');
      alert('شكراً لتواصلك معنا! تم استلام رسالتك (وضع التجربة).');
      setContactForm({ subject: '', message: '' });
    } finally {
      setSendingContact(false);
    }
  };

  const handlePostAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return setShowLogin(true);

    const adData = { 
      ...newAd, 
      user_id: user.id,
      id: Date.now(),
      created_at: new Date().toISOString(),
      price: Number(newAd.price),
      image_url: newAd.image_urls.filter(url => url).join('|') // Use pipe separator for base64 safety
    };

    try {
      const res = await fetch('api.php?action=post_ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adData)
      });
      if (res.ok) {
        setShowPostAd(false);
        fetchAds();
        resetNewAdForm();
      } else {
        throw new Error('Backend failed');
      }
    } catch (err) {
      try {
        console.log('Saving ad to local storage');
        const localAds = JSON.parse(localStorage.getItem('tremseh_local_ads') || '[]');
        localStorage.setItem('tremseh_local_ads', JSON.stringify([adData, ...localAds]));
        setShowPostAd(false);
        fetchAds();
        resetNewAdForm();
        alert('تم حفظ الإعلان بنجاح في متصفحك (وضع التجربة).');
      } catch (storageErr) {
        alert('عذراً، ذاكرة المتصفح ممتلئة. يرجى حذف بعض الإعلانات القديمة أو تقليل حجم الصور.');
      }
    }
  };

  const resetNewAdForm = () => {
    setNewAd({
      category: 'real_estate',
      title: '',
      description: '',
      price: '',
      contact_phone: '',
      image_urls: ['', '', ''],
      rooms: '',
      area: '',
      car_type: '',
      car_model: '',
      car_year: ''
    });
  };

  const handleShare = () => {
    const shareData = {
      title: 'أسواق تريمسة والقرى المحيطة بها',
      text: 'تصفح أحدث الإعلانات في تريمسة والقرى المحيطة بها',
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.title + ' ' + shareData.url)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const DeployCenter = () => {
    const [copied, setCopied] = useState<string | null>(null);

    const files = [
      {
        name: 'api.php',
        description: 'ملف البرمجة الخاص بالسيرفر (PHP)',
        content: `<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

\$host = 'sql100.infinityfree.com';
\$db   = 'if0_41270364_tremsahdata';
\$user = 'if0_41270364';
\$pass = 's0955563603';
\$charset = 'utf8mb4';

\$dsn = "mysql:host=\$host;dbname=\$db;charset=\$charset";
\$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     \$pdo = new PDO(\$dsn, \$user, \$pass, \$options);
     \$pdo->exec("set names utf8mb4");
} catch (\\PDOException \$e) {
     echo json_encode(['error' => 'Connection failed: ' . \$e->getMessage()]);
     exit;
}

\$action = \$_GET['action'] ?? '';

if (\$action == 'login' && \$_SERVER['REQUEST_METHOD'] == 'POST') {
    \$input = json_decode(file_get_contents('php://input'), true);
    \$stmt = \$pdo->prepare("SELECT * FROM users WHERE identifier = ?");
    \$stmt->execute([\$input['identifier']]);
    \$user = \$stmt->fetch();
    if (\$user && password_verify(\$input['password'], \$user['password'])) {
        unset(\$user['password']);
        echo json_encode(\$user);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'بيانات الدخول غير صحيحة']);
    }
}

if (\$action == 'get_ads' && \$_SERVER['REQUEST_METHOD'] == 'GET') {
    \$stmt = \$pdo->query("SELECT * FROM ads ORDER BY created_at DESC");
    echo json_encode(\$stmt->fetchAll());
}

if (\$action == 'post_ad' && \$_SERVER['REQUEST_METHOD'] == 'POST') {
    \$input = json_decode(file_get_contents('php://input'), true);
    \$sql = "INSERT INTO ads (user_id, category, title, description, price, contact_phone, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')";
    \$stmt = \$pdo->prepare(\$sql);
    \$stmt->execute([\$input['user_id'], \$input['category'], \$input['title'], \$input['description'], \$input['price'], \$input['contact_phone'], \$input['image_url']]);
    echo json_encode(['status' => 'success']);
}
?>`
      },
      {
        name: 'index.html',
        description: 'الملف الرئيسي للموقع',
        content: `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>أسواق تريمسة</title>
    <script type="module" crossorigin src="./index.js"></script>
    <link rel="stylesheet" crossorigin href="./index.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`
      },
      {
        name: '.htaccess',
        description: 'ملف إعدادات السيرفر',
        content: `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>`
      }
    ];

    const copyToClipboard = (text: string, name: string) => {
      navigator.clipboard.writeText(text);
      setCopied(name);
      setTimeout(() => setCopied(null), 2000);
    };

    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-3xl shadow-xl border border-stone-100 my-10">
        <div className="flex items-center gap-4 mb-8 border-b pb-6">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-stone-800">مركز الرفع (Deploy Center)</h2>
            <p className="text-stone-500">انسخ الأكواد التالية وضعها في ملفاتك الخاصة بالاستضافة</p>
          </div>
        </div>

        <div className="space-y-8">
          {files.map((file) => (
            <div key={file.name} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-800 flex items-center gap-2">
                    <span className="text-emerald-600">{file.name}</span>
                    <span className="text-xs font-normal text-stone-400">({file.description})</span>
                  </h3>
                </div>
                <button
                  onClick={() => copyToClipboard(file.content, file.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    copied === file.name ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {copied === file.name ? 'تم النسخ!' : 'نسخ الكود'}
                </button>
              </div>
              <pre className="bg-stone-900 text-stone-300 p-4 rounded-2xl text-xs overflow-x-auto font-mono leading-relaxed max-h-60">
                {file.content}
              </pre>
            </div>
          ))}

          <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl">
            <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
              <Info size={18} />
              ملاحظة هامة بخصوص ملفات البرمجة (JS/CSS)
            </h3>
            <p className="text-sm text-amber-700 leading-relaxed">
              بسبب حجم ملفات الجافا سكريبت والتصميم الكبير، يرجى البحث عنها في المجلد الرئيسي للمشروع المحمل (خارج مجلد src).
              <br />
              ابحث عن الملفات: <code className="bg-amber-100 px-1 rounded">index.js.txt</code> و <code className="bg-amber-100 px-1 rounded">index.css.txt</code>.
              <br />
              قم بتغيير امتدادها إلى <code className="bg-amber-100 px-1 rounded">.js</code> و <code className="bg-amber-100 px-1 rounded">.css</code> ورفعها بجانب ملف <code className="bg-amber-100 px-1 rounded">index.html</code>.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 5 ميجابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedUrls = [...newAd.image_urls];
        updatedUrls[index] = reader.result as string;
        setNewAd({ ...newAd, image_urls: updatedUrls });
      };
      reader.readAsDataURL(file);
    }
  };

  const categories = [
    { id: 'all', label: 'الكل', icon: Home },
    { id: 'real_estate', label: 'عقارات', icon: Building2 },
    { id: 'land', label: 'أراضي', icon: LandPlot },
    { id: 'car', label: 'سيارات', icon: Car },
    { id: 'motorcycle', label: 'دراجات نارية', icon: Bike },
    { id: 'equipment', label: 'قطع ومعدات', icon: Wrench },
  ];

  const resetFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      minArea: '',
      maxArea: '',
      rooms: '',
      carType: '',
      carModel: '',
      minYear: '',
      maxYear: ''
    });
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId || ''}>
      <div className="min-h-screen font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <Home size={18} />
              </div>
              <h1 className="text-base font-bold text-stone-800">أسواق تريمسة</h1>
            </div>

            <nav className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => setActiveView('market')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeView === 'market' ? 'bg-emerald-50 text-emerald-700' : 'text-stone-500 hover:bg-stone-50'}`}
              >
                السوق
              </button>
              <button 
                onClick={() => setActiveView('about')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeView === 'about' ? 'bg-emerald-50 text-emerald-700' : 'text-stone-500 hover:bg-stone-50'}`}
              >
                حول تريمسة
              </button>
              <button 
                onClick={() => setActiveView('about_us')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeView === 'about_us' ? 'bg-emerald-50 text-emerald-700' : 'text-stone-500 hover:bg-stone-50'}`}
              >
                من نحن
              </button>
              <button 
                onClick={() => setActiveView('contact')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeView === 'contact' ? 'bg-emerald-50 text-emerald-700' : 'text-stone-500 hover:bg-stone-50'}`}
              >
                اتصل بنا
              </button>
              <button 
                onClick={() => setActiveView('deploy')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeView === 'deploy' ? 'bg-amber-50 text-amber-700' : 'text-stone-500 hover:bg-stone-50'}`}
              >
                مركز الرفع
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleShare}
              className="p-2 text-stone-500 hover:text-emerald-600 transition-colors"
              title="مشاركة الموقع"
            >
              <Share2 size={20} />
            </button>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-sm font-medium text-stone-600">
                  أهلاً، {user.name && !user.name.includes('?') ? user.name : user.identifier.split('@')[0]}
                </span>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-stone-500 hover:text-red-600 transition-colors"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-full text-sm font-semibold transition-all"
              >
                <User size={18} />
                <span>تسجيل الدخول</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {activeView === 'market' ? (
        <>
          {/* Hero Section */}
          <section className="relative py-8 overflow-hidden bg-emerald-900 text-white">
            <div className="absolute inset-0 opacity-20">
              <img 
                src="https://picsum.photos/seed/village/1920/1080?blur=5" 
                alt="Background" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="relative max-w-7xl mx-auto px-4 text-center">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-5xl font-serif font-bold mb-4 leading-tight"
              >
                ربيع تريمسة واسواقها بين يديك
              </motion.h2>
              <p className="text-emerald-100 text-base max-w-2xl mx-auto mb-6">
                المنصة الأولى لبيع وشراء العقارات والأراضي والسيارات في قرية تريمسة والقرى المحيطة بها. تواصل مباشرة مع البائعين.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <button 
                  onClick={() => setShowPostAd(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-900 rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform"
                >
                  <PlusCircle size={20} />
                  <span>أضف إعلانك الآن</span>
                </button>
              </div>
            </div>
          </section>

          {/* Categories Bar */}
          <div className="sticky top-16 z-30 bg-white border-b border-stone-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between py-4">
                <div className="flex overflow-x-auto no-scrollbar gap-4">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id as Category);
                        resetFilters();
                      }}
                      className={`flex items-center gap-2 px-6 py-2 rounded-full whitespace-nowrap transition-all ${
                        activeCategory === cat.id 
                          ? 'bg-emerald-600 text-white shadow-md' 
                          : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <cat.icon size={18} />
                      <span className="font-semibold">{cat.label}</span>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                    showFilters ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-stone-200 text-stone-600'
                  }`}
                >
                  <Search size={18} />
                  <span className="font-medium">تصفية متقدمة</span>
                </button>
              </div>

              {/* Advanced Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-stone-100"
                  >
                    <div className="py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Common: Price */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-500 uppercase">السعر</label>
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            placeholder="من" 
                            value={filters.minPrice}
                            onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                          />
                          <input 
                            type="number" 
                            placeholder="إلى" 
                            value={filters.maxPrice}
                            onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Category Specific Filters */}
                      {(activeCategory === 'real_estate' || activeCategory === 'land') && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-500 uppercase">المساحة (م²)</label>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              placeholder="من" 
                              value={filters.minArea}
                              onChange={(e) => setFilters({...filters, minArea: e.target.value})}
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                            />
                            <input 
                              type="number" 
                              placeholder="إلى" 
                              value={filters.maxArea}
                              onChange={(e) => setFilters({...filters, maxArea: e.target.value})}
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      )}

                      {activeCategory === 'real_estate' && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-500 uppercase">عدد الغرف</label>
                          <select 
                            value={filters.rooms}
                            onChange={(e) => setFilters({...filters, rooms: e.target.value})}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                          >
                            <option value="">الكل</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5+</option>
                          </select>
                        </div>
                      )}

                      {(activeCategory === 'car' || activeCategory === 'motorcycle') && (
                        <>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase">النوع والموديل</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="النوع" 
                                value={filters.carType}
                                onChange={(e) => setFilters({...filters, carType: e.target.value})}
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                              />
                              <input 
                                type="text" 
                                placeholder="الموديل" 
                                value={filters.carModel}
                                onChange={(e) => setFilters({...filters, carModel: e.target.value})}
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase">السنة</label>
                            <div className="flex gap-2">
                              <input 
                                type="number" 
                                placeholder="من" 
                                value={filters.minYear}
                                onChange={(e) => setFilters({...filters, minYear: e.target.value})}
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                              />
                              <input 
                                type="number" 
                                placeholder="إلى" 
                                value={filters.maxYear}
                                onChange={(e) => setFilters({...filters, maxYear: e.target.value})}
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {activeCategory === 'equipment' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase">الصنف والنوع</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="الصنف" 
                                value={filters.carModel}
                                onChange={(e) => setFilters({...filters, carModel: e.target.value})}
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                              />
                              <input 
                                type="text" 
                                placeholder="النوع" 
                                value={filters.carType}
                                onChange={(e) => setFilters({...filters, carType: e.target.value})}
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      <div className="flex items-end">
                        <button 
                          onClick={resetFilters}
                          className="w-full px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          إعادة تعيين
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 py-8">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                  <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-stone-100" />
                ))}
              </div>
            ) : ads.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {ads.map((ad) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={ad.id}
                    onClick={() => setSelectedAd(ad)}
                    className="group bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="relative h-40 overflow-hidden group/img">
                      <AdImageCarousel images={(ad.image_url || '').split('|')} adId={ad.id} adTitle={ad.title} />
                      <div className="absolute top-2 right-2 flex flex-col gap-1 pointer-events-none">
                        <div className="bg-white/90 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 shadow-sm">
                          {categories.find(c => c.id === ad.category)?.label}
                        </div>
                        {ad.status === 'sold' && (
                          <div className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                            تم البيع
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="mb-1">
                        <h3 className={`text-sm font-bold text-stone-800 line-clamp-1 ${ad.status === 'sold' ? 'opacity-50' : ''}`}>{ad.title}</h3>
                        <span className="text-emerald-600 font-bold text-sm">{ad.price.toLocaleString()} ل.س</span>
                      </div>
                      
                      {/* Detailed Info Badges */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {ad.category === 'real_estate' && (
                          <>
                            <span className="px-1.5 py-0.5 bg-stone-100 rounded text-[9px] font-bold text-stone-600">{ad.rooms} غرف</span>
                            <span className="px-1.5 py-0.5 bg-stone-100 rounded text-[9px] font-bold text-stone-600">{ad.area} م²</span>
                          </>
                        )}
                        {ad.category === 'land' && (
                          <span className="px-1.5 py-0.5 bg-stone-100 rounded text-[9px] font-bold text-stone-600">{ad.area} م²</span>
                        )}
                        {(ad.category === 'car' || ad.category === 'motorcycle') && (
                          <>
                            <span className="px-1.5 py-0.5 bg-stone-100 rounded text-[9px] font-bold text-stone-600">{ad.car_type}</span>
                            <span className="px-1.5 py-0.5 bg-stone-100 rounded text-[9px] font-bold text-stone-600">{ad.car_year}</span>
                          </>
                        )}
                      </div>

                      <p className="text-stone-500 text-[11px] line-clamp-2 mb-3 h-8">
                        {ad.description}
                      </p>

                      {/* User Management Buttons */}
                      {user && user.id === ad.user_id && (
                        <div className="flex gap-1 mb-3">
                          {ad.status !== 'sold' && (
                            <button 
                              onClick={() => handleMarkSold(ad.id)}
                              className="flex-1 py-1.5 bg-stone-800 text-white text-[10px] font-bold rounded-lg hover:bg-stone-700 transition-colors"
                            >
                              بيع
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteAd(ad.id)}
                            className="px-2 py-1.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg hover:bg-red-100 transition-colors"
                          >
                            حذف
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-stone-50">
                        <div className="flex items-center gap-1 text-stone-600">
                          <Phone size={12} />
                          <span className="text-[11px] font-medium">{ad.contact_phone}</span>
                        </div>
                        <a 
                          href={`https://wa.me/${ad.contact_phone.replace(/\s/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                        >
                          <MessageCircle size={16} />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-stone-100 rounded-full text-stone-400 mb-4">
                  <Search size={32} />
                </div>
                <h3 className="text-xl font-bold text-stone-800">لا توجد إعلانات تطابق بحثك</h3>
                <p className="text-stone-500">جرب تغيير الفلاتر أو كن أول من ينشر إعلاناً</p>
              </div>
            )}
          </main>
        </>
      ) : activeView === 'deploy' ? (
        <DeployCenter />
      ) : activeView === 'about' ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto px-4 py-16"
        >
          <div className="text-center mb-16">
            <h2 className="text-5xl font-serif font-bold text-stone-800 mb-4">حول تريمسة</h2>
            <div className="w-24 h-1 bg-emerald-600 mx-auto rounded-full mb-6" />
            <p className="text-xl text-stone-600 max-w-2xl mx-auto font-medium leading-relaxed">
              موقع متخصص في إعلانات بيع وشراء العقارات والسيارات والأراضي في منطقة تريمسة وما حولها.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <Globe size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-800 mb-2">الموقع والجغرافيا</h3>
                  <p className="text-stone-600 leading-relaxed">
                    التريمسة قرية تقع في حماه على الضفة اليمنى لنهر العاصي، وتتبع ناحية مركز محردة في منطقة محردة بمحافظة حماة شمال سوريا. في سنة 2009 بلغ عدد سكانها 8103 نسمة.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <Trees size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-800 mb-2">أصل التسمية</h3>
                  <p className="text-stone-600 leading-relaxed">
                    الرواية الأكثر تداولًا بين أهالي القرية تشير إلى أن التسمية تعود إلى انتشار شجر الترمس فيها قديمًا، فارتبط الاسم بالمكان وبقي حتى اليوم.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] md:aspect-auto min-h-[300px] bg-stone-100 flex items-center justify-center">
              <img 
                src="https://storage.googleapis.com/applet-assets/ziyhdtsneazrhopfneafh2/image_1740759816656.png" 
                alt="Tremseh Landscape" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/tremseh/800/600';
                }}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="bg-stone-100 rounded-[3rem] p-8 md:p-12 mb-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-red-100 text-red-700 rounded-2xl">
                <History size={24} />
              </div>
              <h3 className="text-2xl font-bold text-stone-800">لمحة تاريخية</h3>
            </div>
            <div className="space-y-6 text-stone-700 leading-relaxed">
              <p>
                لقيت التريمسة اهتماماً إعلامياً عالمياً بعد أن وقعت فيها معركة التريمسة يوم الخميس 12 يوليو 2012. وفق إحدى روايات المعارضة، حوصرت القرية وقطعت عنها الكهرباء وكافة وسائل الاتصالات وتعرضت لهجوم من قِبل قوات جيش نظام الأسد استخدم فيه المروحيات وقام بقصف القرية بشكل عنيف ومتواصل راح ضحيته 250 شخصاً على الأقل كما صرح بذلك المركز الإعلامي السوري.
              </p>
              <div className="p-6 bg-white rounded-2xl border-r-4 border-emerald-600 italic">
                "في التريمسة، القرية الوادعة بريف حماة ، ذات الماضي الدامي، عاد آلاف السكان المُهجرين إلى ديارهم. وبعد أن اجتمعوا مجدداً مع أصدقائهم القدامى، بدأوا العمل على إعادة بناء مجتمعهم ومداواة الندوب القديمة."
              </div>
            </div>
          </div>
        </motion.div>
      ) : activeView === 'about_us' ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto px-4 py-16"
        >
          <div className="text-center mb-16">
            <div className="inline-flex p-4 bg-emerald-100 text-emerald-700 rounded-3xl mb-6">
              <User size={40} />
            </div>
            <h2 className="text-5xl font-serif font-bold text-stone-800 mb-4">من نحن</h2>
            <div className="w-24 h-1 bg-emerald-600 mx-auto rounded-full mb-6" />
          </div>

          <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-stone-100 shadow-sm space-y-8 text-center">
            <p className="text-2xl text-stone-800 font-bold leading-relaxed">
              نحن مجموعة من الشباب التطوعي الطموح من أبناء تريمسة.
            </p>
            <p className="text-lg text-stone-600 leading-relaxed max-w-3xl mx-auto">
              نسعى من خلال هذه المنصة إلى تحويل الخدمات التقليدية إلى خدمات إلكترونية حديثة وسهلة الوصول. هدفنا هو تجميع كافة الخدمات والاحتياجات في مكان واحد ليكون مرجعاً مفيداً وسهلاً للجميع في تريمسة والقرى المحيطة بها.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm mx-auto mb-4">
                  <Globe size={24} />
                </div>
                <h4 className="font-bold text-stone-800 mb-2">رؤيتنا</h4>
                <p className="text-sm text-stone-500">مجتمع رقمي متكامل يسهل حياة الناس اليومية.</p>
              </div>
              <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm mx-auto mb-4">
                  <PlusCircle size={24} />
                </div>
                <h4 className="font-bold text-stone-800 mb-2">رسالتنا</h4>
                <p className="text-sm text-stone-500">توفير منصة آمنة وموثوقة للتبادل التجاري والخدمي.</p>
              </div>
              <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm mx-auto mb-4">
                  <ShieldCheck size={24} />
                </div>
                <h4 className="font-bold text-stone-800 mb-2">قيمنا</h4>
                <p className="text-sm text-stone-500">الشفافية، التطوع، وخدمة المجتمع فوق كل اعتبار.</p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : activeView === 'privacy' ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-4xl mx-auto px-4 py-16"
        >
          <div className="text-center mb-16">
            <div className="inline-flex p-4 bg-emerald-100 text-emerald-700 rounded-3xl mb-6">
              <ShieldCheck size={40} />
            </div>
            <h2 className="text-5xl font-serif font-bold text-stone-800 mb-4">سياسة الخصوصية</h2>
            <p className="text-stone-500">خصوصيتك هي أولويتنا القصوى</p>
          </div>

          <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-stone-100 shadow-sm space-y-10">
            <section>
              <h3 className="text-2xl font-bold text-stone-800 mb-4 flex items-center gap-3">
                <div className="w-2 h-8 bg-emerald-600 rounded-full" />
                جمع المعلومات
              </h3>
              <p className="text-stone-600 leading-relaxed">
                نقوم بجمع معلومات محدودة عند استخدامك لموقعنا، مثل الاسم ورقم الهاتف والبريد الإلكتروني، وذلك لغرض تفعيل الحساب وتمكين التواصل بين المعلنين والمتصفحين.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-stone-800 mb-4 flex items-center gap-3">
                <div className="w-2 h-8 bg-emerald-600 rounded-full" />
                ملفات تعريف الارتباط (Cookies)
              </h3>
              <p className="text-stone-600 leading-relaxed">
                نستخدم ملفات تعريف الارتباط لتحسين تجربتك على الموقع. كما قد نستخدم خدمات طرف ثالث مثل Google AdSense التي تستخدم ملفات تعريف الارتباط لعرض الإعلانات بناءً على زياراتك السابقة لموقعنا أو مواقع أخرى.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-stone-800 mb-4 flex items-center gap-3">
                <div className="w-2 h-8 bg-emerald-600 rounded-full" />
                إعلانات جوجل (Google Ads)
              </h3>
              <p className="text-stone-600 leading-relaxed">
                يستخدم موردو الطرف الثالث، بمن فيهم جوجل، ملفات تعريف ارتباط لعرض الإعلانات بناءً على زيارات المستخدم السابقة لموقعنا الإلكتروني أو لمواقع أخرى على الويب. يمكن للمستخدمين اختيار تعطيل استخدام ملف تعريف الارتباط DART بزيارة سياسة الخصوصية الخاصة بإعلانات جوجل وشبكة المحتوى.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-stone-800 mb-4 flex items-center gap-3">
                <div className="w-2 h-8 bg-emerald-600 rounded-full" />
                حماية البيانات
              </h3>
              <p className="text-stone-600 leading-relaxed">
                نحن نتخذ إجراءات أمنية تقنية وإدارية لحماية بياناتك من الوصول غير المصرح به أو التغيير أو الإفصاح.
              </p>
            </section>
          </div>
        </motion.div>
      ) : activeView === 'terms' ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-4xl mx-auto px-4 py-16"
        >
          <div className="text-center mb-16">
            <div className="inline-flex p-4 bg-emerald-100 text-emerald-700 rounded-3xl mb-6">
              <Info size={40} />
            </div>
            <h2 className="text-5xl font-serif font-bold text-stone-800 mb-4">شروط الاستخدام</h2>
            <p className="text-stone-500">القواعد المنظمة لاستخدام منصة أسواق تريمسة</p>
          </div>

          <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-stone-100 shadow-sm space-y-10">
            <section>
              <h3 className="text-2xl font-bold text-stone-800 mb-4 flex items-center gap-3">
                <div className="w-2 h-8 bg-emerald-600 rounded-full" />
                شروط النشر
              </h3>
              <ul className="list-disc list-inside text-stone-600 space-y-3 leading-relaxed">
                <li>يجب أن يكون الإعلان حقيقياً وغير مضلل.</li>
                <li>يمنع نشر أي محتوى مخالف للقوانين أو الأخلاق العامة.</li>
                <li>يتحمل المعلن المسؤولية الكاملة عن محتوى إعلانه.</li>
                <li>يحق لإدارة الموقع حذف أي إعلان تراه غير مناسب دون سابق إنذار.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-stone-800 mb-4 flex items-center gap-3">
                <div className="w-2 h-8 bg-emerald-600 rounded-full" />
                إخلاء المسؤولية
              </h3>
              <p className="text-stone-600 leading-relaxed">
                "أسواق تريمسة" هي منصة وسيطة فقط، ولا نتحمل أي مسؤولية عن جودة السلع المعروضة أو مصداقية الأطراف المتعاملة. ننصح دائماً بالمعاينة الشخصية قبل إتمام أي عملية شراء.
              </p>
            </section>
          </div>
        </motion.div>
      ) : activeView === 'contact' ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-4xl mx-auto px-4 py-16"
        >
          <div className="text-center mb-16">
            <div className="inline-flex p-4 bg-emerald-100 text-emerald-700 rounded-3xl mb-6">
              <Mail size={40} />
            </div>
            <h2 className="text-5xl font-serif font-bold text-stone-800 mb-4">اتصل بنا</h2>
            <p className="text-stone-500">يسعدنا سماع آرائكم واقتراحاتكم</p>
          </div>

          <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-stone-100 shadow-xl max-w-2xl mx-auto">
            {!user ? (
              <div className="text-center py-12">
                <User size={48} className="mx-auto text-stone-300 mb-4" />
                <h3 className="text-xl font-bold text-stone-800 mb-4">يرجى تسجيل الدخول أولاً</h3>
                <button 
                  onClick={() => setShowLogin(true)}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors"
                >
                  تسجيل الدخول
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">الموضوع</label>
                  <input 
                    required
                    type="text" 
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                    placeholder="ما هو موضوع رسالتك؟"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">الرسالة</label>
                  <textarea 
                    required
                    rows={6}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    placeholder="اكتب رسالتك هنا..."
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={sendingContact}
                  className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0"
                >
                  {sendingContact ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={20} />
                      <span>إرسال الرسالة</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      ) : null}

        {/* Footer */}
        <footer className="bg-stone-900 text-stone-400 py-12 mt-20 border-t border-stone-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                    <Home size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-white">أسواق تريمسة</h3>
                </div>
                <p className="text-sm leading-relaxed max-w-md">
                  المنصة الأولى والوحيدة المتخصصة في تجميع كافة الخدمات التجارية والعقارية لأهالي تريمسة والقرى المحيطة بها في مكان واحد، بجهود شبابية تطوعية تسعى للرقي بالخدمات المحلية.
                </p>
              </div>
              <div>
                <h4 className="text-white font-bold mb-6">روابط سريعة</h4>
                <ul className="space-y-4 text-sm">
                  <li><button onClick={() => setActiveView('market')} className="hover:text-emerald-500 transition-colors">السوق</button></li>
                  <li><button onClick={() => setActiveView('about')} className="hover:text-emerald-500 transition-colors">حول تريمسة</button></li>
                  <li><button onClick={() => setActiveView('about_us')} className="hover:text-emerald-500 transition-colors">من نحن</button></li>
                  <li><button onClick={() => setActiveView('contact')} className="hover:text-emerald-500 transition-colors">اتصل بنا</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-6">قانوني</h4>
                <ul className="space-y-4 text-sm">
                  <li><button onClick={() => setActiveView('privacy')} className="hover:text-emerald-500 transition-colors">سياسة الخصوصية</button></li>
                  <li><button onClick={() => setActiveView('terms')} className="hover:text-emerald-500 transition-colors">شروط الاستخدام</button></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
              <p>© {new Date().getFullYear()} أسواق تريمسة. جميع الحقوق محفوظة.</p>
              <p>صنع بكل حب بجهود شباب تريمسة المتطوعين</p>
            </div>
          </div>
        </footer>

        {/* Ad Details Modal */}
        <AnimatePresence>
          {selectedAd && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedAd(null)}
                className="absolute inset-0 bg-stone-900/90 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
              >
                <button 
                  onClick={() => setSelectedAd(null)}
                  className="absolute top-6 right-6 z-10 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white text-stone-800 shadow-lg transition-all"
                >
                  <X size={24} />
                </button>

                <div className="flex flex-col md:flex-row h-full overflow-y-auto">
                  <div className="w-full md:w-3/5 h-[300px] md:h-auto bg-stone-100">
                    <AdImageCarousel 
                      images={(selectedAd.image_url || '').split('|')} 
                      adId={selectedAd.id} 
                      adTitle={selectedAd.title} 
                      isFullSize={true}
                    />
                  </div>
                  
                  <div className="w-full md:w-2/5 p-8 md:p-10 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold mb-2">
                          {categories.find(c => c.id === selectedAd.category)?.label}
                        </span>
                        <h2 className="text-2xl font-bold text-stone-800 leading-tight">{selectedAd.title}</h2>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-xl font-black text-emerald-600 whitespace-nowrap">{selectedAd.price.toLocaleString()}</div>
                        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">ليرة سورية</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {selectedAd.category === 'real_estate' && (
                        <>
                          <div className="px-3 py-1.5 bg-stone-50 rounded-xl border border-stone-100 text-xs font-bold text-stone-600 flex items-center gap-2">
                            <Home size={14} className="text-emerald-500" />
                            {selectedAd.rooms} غرف
                          </div>
                          <div className="px-3 py-1.5 bg-stone-50 rounded-xl border border-stone-100 text-xs font-bold text-stone-600 flex items-center gap-2">
                            <LandPlot size={14} className="text-emerald-500" />
                            {selectedAd.area} م²
                          </div>
                        </>
                      )}
                      {(selectedAd.category === 'car' || selectedAd.category === 'motorcycle') && (
                        <>
                          <div className="px-3 py-1.5 bg-stone-50 rounded-xl border border-stone-100 text-xs font-bold text-stone-600 flex items-center gap-2">
                            <Car size={14} className="text-emerald-500" />
                            {selectedAd.car_type}
                          </div>
                          <div className="px-3 py-1.5 bg-stone-50 rounded-xl border border-stone-100 text-xs font-bold text-stone-600 flex items-center gap-2">
                            <History size={14} className="text-emerald-500" />
                            {selectedAd.car_year}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex-1">
                      <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">الوصف</h4>
                      <p className="text-stone-600 leading-relaxed whitespace-pre-wrap text-sm">
                        {selectedAd.description}
                      </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-stone-100">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
                            <User size={20} />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-stone-400 uppercase">المعلن</div>
                            <div className="text-sm font-bold text-stone-800">صاحب الإعلان</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-stone-400 uppercase">تاريخ النشر</div>
                          <div className="text-xs font-medium text-stone-600">{new Date(selectedAd.created_at).toLocaleDateString('ar-SY')}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <a 
                          href={`tel:${selectedAd.contact_phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-2 py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-200"
                        >
                          <Phone size={18} />
                          <span>اتصال</span>
                        </a>
                        <a 
                          href={`https://wa.me/${selectedAd.contact_phone.replace(/\s/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                        >
                          <MessageCircle size={18} />
                          <span>واتساب</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogin(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-stone-800">{isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</h3>
                  <button onClick={() => setShowLogin(false)} className="p-2 hover:bg-stone-100 rounded-full">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
                  {isRegistering && (
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">الاسم الكامل</label>
                      <input 
                        required
                        type="text" 
                        value={loginName}
                        onChange={(e) => setLoginName(e.target.value)}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        placeholder="أدخل اسمك"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">البريد الإلكتروني</label>
                    <input 
                      required
                      type="email" 
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="example@mail.com"
                    />
                  </div>
                  {!isRegistering && (
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">كلمة السر</label>
                      <input 
                        required
                        type="password" 
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        placeholder="أدخل كلمة السر"
                      />
                    </div>
                  )}
                  {isRegistering && (
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">كلمة السر</label>
                      <input 
                        required
                        type="password" 
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        placeholder="اختر كلمة سر قوية"
                      />
                    </div>
                  )}
                  <button 
                    type="submit"
                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                  >
                    {isRegistering ? 'إنشاء حساب' : 'دخول'}
                  </button>

                  {!isRegistering && (
                    <>
                      <div className="relative flex items-center py-4">
                        <div className="flex-grow border-t border-stone-200"></div>
                        <span className="flex-shrink mx-4 text-stone-400 text-xs">أو</span>
                        <div className="flex-grow border-t border-stone-200"></div>
                      </div>
                      <div className="flex justify-center">
                        {googleClientId ? (
                          <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => alert('فشل تسجيل الدخول عبر جوجل')}
                            useOneTap
                            theme="outline"
                            shape="pill"
                          />
                        ) : (
                          <div className="text-xs text-red-500 text-center bg-red-50 p-2 rounded-lg">
                            خطأ: لم يتم ضبط Google Client ID في ملف .env
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={() => setIsRegistering(!isRegistering)}
                      className="text-sm text-stone-500 hover:text-emerald-600 font-medium"
                    >
                      {isRegistering ? 'لديك حساب بالفعل؟ سجل دخول' : 'ليس لديك حساب؟ أنشئ حساباً جديداً'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Verification Modal */}
      <AnimatePresence>
        {showVerify && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-stone-800">تأكيد الحساب</h3>
                  <p className="text-stone-500 mt-2">أدخل الرمز المكون من 6 أرقام المرسل إلى بريدك</p>
                </div>
                <form onSubmit={handleVerify} className="space-y-6">
                  <div>
                    <input 
                      required
                      type="text" 
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-3xl tracking-[0.5em] font-bold px-4 py-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="000000"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                  >
                    تأكيد الحساب
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowVerify(false)}
                    className="w-full py-2 text-stone-400 text-sm hover:text-stone-600"
                  >
                    إلغاء
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post Ad Modal */}
      <AnimatePresence>
        {showPostAd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPostAd(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-stone-800">نشر إعلان جديد</h3>
                  <button onClick={() => setShowPostAd(false)} className="p-2 hover:bg-stone-100 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                {!user ? (
                  <div className="text-center py-12">
                    <p className="text-stone-600 mb-6 font-medium">يجب عليك تسجيل الدخول أولاً لتتمكن من نشر إعلان</p>
                    <button 
                      onClick={() => { setShowPostAd(false); setShowLogin(true); }}
                      className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold"
                    >
                      تسجيل الدخول
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePostAd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-stone-700 mb-2">القسم</label>
                      <div className="flex gap-4">
                        {categories.filter(c => c.id !== 'all').map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setNewAd({ ...newAd, category: cat.id as Category })}
                            className={`flex-1 py-3 rounded-xl border-2 transition-all font-bold text-sm ${
                              newAd.category === cat.id 
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                                : 'border-stone-100 bg-stone-50 text-stone-500'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-stone-700 mb-2">عنوان الإعلان</label>
                      <input 
                        required
                        type="text" 
                        value={newAd.title}
                        onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="مثال: شقة للبيع في وسط القرية"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-stone-700 mb-2">الوصف</label>
                      <textarea 
                        required
                        rows={4}
                        value={newAd.description}
                        onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        placeholder="أدخل تفاصيل الإعلان..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">السعر (ل.س)</label>
                      <input 
                        required
                        type="number" 
                        value={newAd.price}
                        onChange={(e) => setNewAd({ ...newAd, price: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="مثال: 50000000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">رقم التواصل (واتساب)</label>
                      <input 
                        required
                        type="text" 
                        value={newAd.contact_phone}
                        onChange={(e) => setNewAd({ ...newAd, contact_phone: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="09xxxxxxxx"
                      />
                    </div>

                    {/* Category Specific Fields in Form */}
                    {newAd.category === 'real_estate' && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">عدد الغرف</label>
                          <input 
                            type="number" 
                            value={newAd.rooms}
                            onChange={(e) => setNewAd({ ...newAd, rooms: e.target.value })}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">المساحة (م²)</label>
                          <input 
                            type="number" 
                            value={newAd.area}
                            onChange={(e) => setNewAd({ ...newAd, area: e.target.value })}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </>
                    )}

                    {newAd.category === 'land' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-stone-700 mb-2">المساحة (م²)</label>
                        <input 
                          type="number" 
                          value={newAd.area}
                          onChange={(e) => setNewAd({ ...newAd, area: e.target.value })}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    )}

                    {(newAd.category === 'car' || newAd.category === 'motorcycle') && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">النوع</label>
                          <input 
                            type="text" 
                            value={newAd.car_type}
                            onChange={(e) => setNewAd({ ...newAd, car_type: e.target.value })}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder={newAd.category === 'car' ? "مثال: كيا" : "مثال: هوندا"}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">الموديل</label>
                          <input 
                            type="text" 
                            value={newAd.car_model}
                            onChange={(e) => setNewAd({ ...newAd, car_model: e.target.value })}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder={newAd.category === 'car' ? "مثال: سيراتو" : "مثال: SH"}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-stone-700 mb-2">السنة</label>
                          <input 
                            type="number" 
                            value={newAd.car_year}
                            onChange={(e) => setNewAd({ ...newAd, car_year: e.target.value })}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="مثال: 2010"
                          />
                        </div>
                      </>
                    )}

                    {newAd.category === 'equipment' && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">الصنف</label>
                          <input 
                            type="text" 
                            value={newAd.car_model}
                            onChange={(e) => setNewAd({ ...newAd, car_model: e.target.value })}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="مثال: محرك"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">النوع</label>
                          <input 
                            type="text" 
                            value={newAd.car_type}
                            onChange={(e) => setNewAd({ ...newAd, car_type: e.target.value })}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="مثال: ديزل"
                          />
                        </div>
                      </>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-stone-700 mb-2">صور الإعلان (3 كحد أقصى)</label>
                      <div className="grid grid-cols-3 gap-4">
                        {newAd.image_urls.map((url, index) => (
                          <div key={index} className="relative h-32 bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center overflow-hidden">
                            {url ? (
                              <>
                                <img src={url} className="w-full h-full object-cover" />
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const updated = [...newAd.image_urls];
                                    updated[index] = '';
                                    setNewAd({ ...newAd, image_urls: updated });
                                  }}
                                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                                >
                                  <X size={12} />
                                </button>
                              </>
                            ) : (
                              <>
                                <Camera className="text-stone-300 mb-1" size={24} />
                                <span className="text-[10px] text-stone-400 text-center px-1">صورة {index + 1}</span>
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(e, index)}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2 pt-4">
                      <button 
                        type="submit"
                        className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all"
                      >
                        نشر الإعلان
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                <Home size={18} />
              </div>
              <span className="text-xl font-bold text-white">أسواق تريمسة</span>
            </div>
            <div className="flex gap-8 text-sm">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setActiveView('about'); window.scrollTo(0,0); }}
                className="hover:text-white transition-colors"
              >
                عن الموقع
              </a>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setActiveView('privacy'); window.scrollTo(0,0); }}
                className="hover:text-white transition-colors"
              >
                سياسة الخصوصية
              </a>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setActiveView('contact'); window.scrollTo(0,0); }}
                className="hover:text-white transition-colors"
              >
                اتصل بنا
              </a>
            </div>
            <p className="text-xs">© {new Date().getFullYear()} أسواق تريمسة. جميع الحقوق محفوظة صهيب الوحيد.</p>
          </div>
        </div>
      </footer>
      </div>
    </GoogleOAuthProvider>
  );
}
