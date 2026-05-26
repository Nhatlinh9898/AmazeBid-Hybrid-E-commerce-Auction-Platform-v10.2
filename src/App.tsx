import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Sparkles, 
  Tv, 
  ShieldAlert, 
  HelpCircle, 
  Wallet, 
  Coins, 
  Gavel, 
  ArrowRight, 
  User as UserIcon, 
  Search, 
  Plus, 
  Trash2, 
  Flame, 
  FileText, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Eye, 
  Store, 
  Receipt, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  LineChart,
  Clock,
  Send,
  Lock,
  Compass,
  FileCheck2,
  LockKeyholeOpen
} from 'lucide-react';
import { io } from 'socket.io-client';
import { Product, LiveStream, Order, BlogPost, User } from './types.js';

// Premium Modular Components Imports
import SellerDashboard from '../components/SellerDashboard';
import AdminDashboard from '../components/AdminDashboard';
import KOLStreamStudio from '../components/KOLStreamStudio';
import ContentStudioModal from '../components/ContentStudioModal';
import ChatWidget from '../components/ChatWidget';
import { AuthProvider } from '../context/AuthProvider';
import { WorkSessionProvider } from '../context/WorkSessionContext';

// Lazy loading or fallback Socket
const socket = io();

export function InnerApp() {
  // General App View States
  const [activeTab, setActiveTab] = useState<'catalog' | 'studio' | 'stream' | 'seller' | 'admin' | 'p2p'>('catalog');
  
  // Database States
  const [products, setProducts] = useState<Product[]>([]);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal / Selection States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [helpTab, setHelpTab] = useState<'guides' | 'payment' | 'shipping' | 'tax' | 'agreement'>('guides');
  const [agreementAgreed, setAgreementAgreed] = useState<boolean>(false);

  // Toast State for sandboxed environments where window.alert is blocked
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Creative Studio States
  const [studioProductName, setStudioProductName] = useState<string>('');
  const [studioKeywords, setStudioKeywords] = useState<string>('');
  const [studioTone, setStudioTone] = useState<string>('Chuyên gia');
  const [studioPost, setStudioPost] = useState<BlogPost | null>(null);
  const [studioGenerating, setStudioGenerating] = useState<boolean>(false);
  const [mediaGeneratingImage, setMediaGeneratingImage] = useState<boolean>(false);
  const [mediaGeneratingVideo, setMediaGeneratingVideo] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

  // Seller States
  const [newStoreName, setNewStoreName] = useState<string>('');
  const [newStoreDesc, setNewStoreDesc] = useState<string>('');
  const [isStoreRegistered, setIsStoreRegistered] = useState<boolean>(false);
  const [newProdTitle, setNewProdTitle] = useState<string>('');
  const [newProdDesc, setNewProdDesc] = useState<string>('');
  const [newProdType, setNewProdType] = useState<'BUY_NOW' | 'AUCTION'>('BUY_NOW');
  const [newProdPrice, setNewProdPrice] = useState<string>('');
  const [newProdBuyNow, setNewProdBuyNow] = useState<string>('');

  // Admin and Safety Systems States
  const [blockedIPs, setBlockedIPs] = useState<string[]>(['103.284.11.23', '194.22.41.109']);
  const [ipInput, setIpInput] = useState<string>('');
  const [systemLogs, setSystemLogs] = useState<string[]>([]);

  // Livestream active simulation states
  const [activeLiveStream, setActiveLiveStream] = useState<LiveStream | null>(null);
  const [liveChat, setLiveChat] = useState<{ user: string; text: string }[]>([
    { user: 'Bảo Linh', text: 'Sản phẩm này cực kỳ hiếm luôn!' },
    { user: 'Hùng Anh', text: 'Chờ xíu mình bid thêm' },
    { user: 'Ngọc Mai', text: 'Đẹp quá, tí mua ngay' }
  ]);
  const [chatInput, setChatInput] = useState<string>('');

  // P2P Mesh Node Operator & Compute Sharing States
  const [isNodeActive, setIsNodeActive] = useState<boolean>(false);
  const [shareCompute, setShareCompute] = useState<boolean>(false);
  const [computeCredits, setComputeCredits] = useState<number>(0);
  const [p2pLogs, setP2pLogs] = useState<string[]>([
    'Peering: Đã kết nối với Node gốc (Relay Root) qua 0.0.0.0:3000',
    'Ledger: Đồng bộ hóa cơ sở dữ liệu đấu giá P2P thành công.',
    'Consensus: Thuật toán Proof of Auction (PoA) đang ở chế độ chờ...'
  ]);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);

  // AI Appraisal & Interactive Streaming Cohost States
  const [appraisalResult, setAppraisalResult] = useState<{
    rating: string;
    valuation: string;
    confidence: number;
    markers: string[];
    verdict: string;
  } | null>(null);
  const [appraisalLoading, setAppraisalLoading] = useState<boolean>(false);
  const [liveCohostEnabled, setLiveCohostEnabled] = useState<boolean>(true);
  const [liveCohostHistory, setLiveCohostHistory] = useState<{ sender: 'Cohost AI' | 'You' | 'Viewers'; message: string; timestamp: string }[]>([
    { sender: 'Cohost AI', message: 'Dạ xin chào cả nhà! Em là trợ lý Stream Co-host AI của Sàn AmazeBid, hôm nay rực lửa đấu thầu nha ae ơi!', timestamp: new Date().toLocaleTimeString() }
  ]);
  const [cohostDraftText, setCohostDraftText] = useState<string>('');
  const [cohostThinking, setCohostThinking] = useState<boolean>(false);
  const [isKolStudioOpen, setIsKolStudioOpen] = useState<boolean>(false);
  const [isContentStudioOpen, setIsContentStudioOpen] = useState<boolean>(false);

  // Dynamic P2P Simulation Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isNodeActive && shareCompute) {
      interval = setInterval(() => {
        setComputeCredits(prev => parseFloat((prev + 0.12).toFixed(2)));
        
        // Increase balance logically by reward
        setMe(prevMe => {
          if (!prevMe) return null;
          return {
            ...prevMe,
            walletBalance: parseFloat((prevMe.walletBalance + 0.85).toFixed(2))
          };
        });

        // Push new ledger log
        const timestamp = new Date().toLocaleTimeString();
        const gpuTasks = [
          'Phân tích chữ ký số mật mã cho Đơn hàng Escrow #' + Math.floor(Math.random() * 900 + 100),
          'Xác thực và chuyển phát bản ghi block liên minh',
          'Tối ưu hóa hình ảnh quảng bá AI Studio cho Đại lý Sàn',
          'Đồng thuận phi tập trung giải quyết độ lệch bước giá'
        ];
        const randomTask = gpuTasks[Math.floor(Math.random() * gpuTasks.length)];
        setP2pLogs(prev => [`[${timestamp}] CPU/GPU Node Task: ${randomTask} (Tìm thấy mật mã, cộng +0.85 USD)`, ...prev.slice(0, 19)]);
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isNodeActive, shareCompute]);

  // Initialize Data
  useEffect(() => {
    // Fetch state from REST API
    const loadInitData = async () => {
      try {
        const authRes = await fetch('/api/auth/me');
        const user = await authRes.json();
        setMe(user);

        const prodRes = await fetch('/api/products');
        const prods = await prodRes.json();
        setProducts(prods);

        const streamRes = await fetch('/api/streams');
        const streamsData = await streamRes.json();
        setStreams(streamsData);

        const orderRes = await fetch('/api/orders');
        const ordersData = await orderRes.json();
        setOrders(ordersData);

        // Check Help Center Agreement with standard sandboxed-environment try/catch block
        let agreed = 'false';
        try {
          agreed = localStorage.getItem('amazebid_agreement_agreed') || 'false';
        } catch (err) {
          console.warn('LocalStorage is disabled inside the preview iframe, defaulting to component state.', err);
        }
        if (agreed === 'true') {
          setAgreementAgreed(true);
        }

        addLog('Hệ thống AmazeBid khởi động hoàn tất thành công.');
        setLoading(false);
      } catch (e) {
        console.error(e);
        addLog('Cảnh báo: Lỗi kết nối máy chủ dữ liệu.');
        setLoading(false);
      }
    };

    loadInitData();

    // Sockets listeners for real-time updates
    socket.on('bid:updated', (data: { productId: string; product: Product }) => {
      setProducts(prev => prev.map(p => p.id === data.productId ? data.product : p));
      if (selectedProduct && selectedProduct.id === data.productId) {
        setSelectedProduct(data.product);
      }
      addLog(`Cập nhật: Có lượt Bid mới cho sản phẩm "${data.product.title}" - mốc mới: ${data.product.currentBid} USD.`);
    });

    socket.on('product:added', (newProduct: Product) => {
      setProducts(prev => [newProduct, ...prev]);
      addLog(`Hệ thống: Sản phẩm mới "${newProduct.title}" đã được đăng lên Sàn.`);
    });

    return () => {
      socket.off('bid:updated');
      socket.off('product:added');
    };
  }, [selectedProduct]);

  // Helper utility to write system and audit logs
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSystemLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  // Bid logic
  const handlePlaceBid = async () => {
    if (!selectedProduct || !bidAmount) return;
    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          amount: Number(bidAmount),
          userId: me?.id,
          userName: me?.name
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Lỗi đặt thầu.', 'error');
        return;
      }
      setSelectedProduct(data.product);
      setBidAmount('');
      addLog(`Thành công: Đã đặt giá đấu thầu ${bidAmount} USD.`);
      showToast('Đặt giá thầu thành công!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Không thể kết nối đến máy chủ.', 'error');
    }
  };

  // Buy now / Escrow checkout logic
  const handleBuyNow = async (product: Product) => {
    const amount = product.type === 'BUY_NOW' ? product.price || 0 : product.buyNowPrice || 0;
    if (me && me.walletBalance < amount) {
      showToast('Số dư ví không đủ để thực hiện giao dịch mua ngay này.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          amount
        })
      });
      const data = await res.json();
      if (res.ok) {
        // Reduct user balance inside local state
        if (me) {
          setMe({ ...me, walletBalance: me.walletBalance - amount });
        }
        
        // Refresh products list
        const prodRes = await fetch('/api/products');
        setProducts(await prodRes.json());
        
        // Refresh orders list
        const orderRes = await fetch('/api/orders');
        setOrders(await orderRes.json());

        showToast(`Đặt mua thành công! Số tiền ${amount} USD đã phong tỏa trong ví Escrow.`, 'success');
        addLog(`Giao dịch: Đơn mua ngay sản phẩm "${product.title}" trị giá ${amount} USD đã khóa trong ví phong tỏa Escrow.`);
        setSelectedProduct(null);
      }
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi đặt mua sản phẩm.', 'error');
    }
  };

  // Release block Escrow payment
  const handleEscrowAction = async (orderId: string, action: 'RELEASE' | 'REFUND') => {
    try {
      const res = await fetch('/api/orders/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action })
      });
      if (res.ok) {
        // Refresh orders list
        const orderRes = await fetch('/api/orders');
        setOrders(await orderRes.json());

        const label = action === 'RELEASE' ? 'giải ngân' : 'hoàn tiền';
        showToast(`Xác nhận ${label} thành quả thành công!`, 'success');
        addLog(`Escrow ID ${orderId}: Đã được phê duyệt thực thi lệnh ${action}.`);
      }
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi thực hiện thao tác Escrow.', 'error');
    }
  };

  // Creative Studio SEO generation
  const handleGenerateSEOContent = async () => {
    if (!studioProductName) {
      showToast('Vui lòng nhập tên sản phẩm.', 'warning');
      return;
    }
    setStudioGenerating(true);
    try {
      const res = await fetch('/api/ai/seo-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: studioProductName,
          keywords: studioKeywords,
          tone: studioTone
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStudioPost({
          id: `blog-${Date.now()}`,
          title: `Đánh giá chi tiết độc quyền: ${studioProductName}`,
          content: data.content,
          productName: studioProductName,
          createdAt: Date.now()
        });
        addLog(`AI: Viết bài SEO hoàn hảo với từ khóa nổi bật cho "${studioProductName}".`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStudioGenerating(false);
    }
  };

  // Generate AI mockup images and video
  const handleGenerateImage = async () => {
    if (!studioProductName) return;
    setMediaGeneratingImage(true);
    try {
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: studioProductName })
      });
      const data = await res.json();
      setGeneratedImage(data.imageUrl);
      addLog(`AI: Sử dụng mô hình Image Generator thiết kế hình ảnh 800x800 cho "${studioProductName}".`);
    } catch (e) {
      console.error(e);
    } finally {
      setMediaGeneratingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!studioProductName) return;
    setMediaGeneratingVideo(true);
    try {
      const res = await fetch('/api/ai/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: studioProductName })
      });
      const data = await res.json();
      setGeneratedVideo(data.videoUrl);
      addLog(`AI: Mô hình Veo đã kết xuất thành công clip quảng bá sản phẩm cho "${studioProductName}".`);
    } catch (e) {
      console.error(e);
    } finally {
      setMediaGeneratingVideo(false);
    }
  };

  // AI Appraise Product Handler
  const handleAppraiseProduct = async (product: Product) => {
    setAppraisalLoading(true);
    setAppraisalResult(null);
    try {
      const res = await fetch('/api/ai/appraise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product.title,
          description: product.description
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAppraisalResult(data);
        addLog(`AI: Thực hiện thẩm định chất lượng và ước lượng định giá cho sản phẩm "${product.title}" thành công.`);
        showToast('Thẩm định sản phẩm hoàn tất bằng AI!', 'success');
      } else {
        showToast(data.error || 'Lỗi thẩm định chất lượng.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi gửi yêu cầu tới trạm AI thẩm định.', 'error');
    } finally {
      setAppraisalLoading(false);
    }
  };

  // AI Live Stream Co-host interactive Handler
  const handleSendStreamCohostQuery = async (activeProd: Product | null) => {
    if (!cohostDraftText.trim()) return;
    const userMsg = cohostDraftText;
    const timestamp = new Date().toLocaleTimeString();
    
    setLiveCohostHistory(prev => [...prev, { sender: 'You', message: userMsg, timestamp }]);
    setCohostDraftText('');
    setCohostThinking(true);

    try {
      const res = await fetch('/api/ai/stream-cohost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamTitle: activeLiveStream?.title || 'Buổi đấu giá kịch tính',
          productTitle: activeProd ? activeProd.title : 'Sản phẩm tuyệt hảo trên Sàn',
          userMessage: userMsg
        })
      });
      const data = await res.json();
      if (res.ok) {
        setLiveCohostHistory(prev => [...prev, {
          sender: 'Cohost AI',
          message: data.reply,
          timestamp: new Date().toLocaleTimeString()
        }]);
      } else {
        showToast('Co-host AI bận chút, xin vui lòng thử lại sau.', 'warning');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCohostThinking(false);
    }
  };

  // Store Registration Logic
  const handleRegisterStore = () => {
    if (!newStoreName) return;
    setIsStoreRegistered(true);
    addLog(`Đăng ký: Cửa hàng "${newStoreName}" đã sẵn sàng đón tiếp khách mua.`);
  };

  // Add seller product logic
  const handleAddProduct = async () => {
    if (!newProdTitle || !newProdPrice) {
      showToast('Vui lòng nhập đầy đủ thông tin tiêu đề và giá trị.', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProdTitle,
          description: newProdDesc,
          price: newProdPrice,
          currentBid: newProdType === 'AUCTION' ? newProdPrice : undefined,
          buyNowPrice: newProdType === 'AUCTION' && newProdBuyNow ? newProdBuyNow : undefined,
          type: newProdType,
          imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=400',
          sellerName: newStoreName || me?.name
        })
      });
      if (res.ok) {
        // Refresh products
        const prodRes = await fetch('/api/products');
        setProducts(await prodRes.json());
        
        showToast('Đăng bán sản phẩm lên sàn AmazeBid thành công!', 'success');
        setNewProdTitle('');
        setNewProdDesc('');
        setNewProdPrice('');
        setNewProdBuyNow('');
      }
    } catch (e) {
      console.error(e);
      showToast('Gặp lỗi khi thêm sản phẩm.', 'error');
    }
  };

  // Safety block IP logic
  const handleBlockIp = () => {
    if (!ipInput) return;
    setBlockedIPs([...blockedIPs, ipInput]);
    addLog(`An ninh: Thiết lập chặn IP độc hại "${ipInput}" thành công.`);
    setIpInput('');
  };

  const handleUnblockIp = (ip: string) => {
    setBlockedIPs(blockedIPs.filter(item => item !== ip));
    addLog(`An ninh: Giải phóng chặn cho địa chỉ IP "${ip}".`);
  };

  // Help center agreement persistence
  const handleAcceptAgreement = () => {
    try {
      localStorage.setItem('amazebid_agreement_agreed', 'true');
    } catch (err) {
      console.warn('LocalStorage blocked inside the preview iframe during persistence.', err);
    }
    setAgreementAgreed(true);
    showToast('Cảm ơn bạn đã đồng ý với chính sách vận hành của AmazeBid!', 'success');
  };

  // Join simulated livestream channel
  const handleSelectStream = (stream: LiveStream) => {
    setActiveLiveStream(stream);
    socket.emit('join:stream', stream.id);
  };

  // Send live chat inside Stream room
  const handleSendChat = () => {
    if (!chatInput) return;
    setLiveChat([...liveChat, { user: me?.name || 'Ngự Lâm', text: chatInput }]);
    setChatInput('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-xl shadow-lg shadow-indigo-500/10">
              <Gavel className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">AmazeBid</h1>
              <span className="text-xs text-indigo-400 font-mono">Sàn Đấu Giá Hybrid P2P AI</span>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex flex-wrap items-center gap-1 bg-zinc-900/60 p-1 rounded-lg border border-zinc-800">
            <button 
              onClick={() => { setActiveTab('catalog'); setActiveLiveStream(null); }} 
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'catalog' ? 'bg-indigo-500 shadow-sm text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Chợ mua sắm & Đấu giá
            </button>
            <button 
              onClick={() => { setActiveTab('studio'); setActiveLiveStream(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'studio' ? 'bg-indigo-500 shadow-sm text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Studio Sáng tạo (AI)
            </button>
            <button 
              onClick={() => setActiveTab('stream')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'stream' || activeLiveStream ? 'bg-indigo-500 shadow-sm text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Tv className="w-3.5 h-3.5" /> Kênh Phát sóng
            </button>
            <button 
              onClick={() => { setActiveTab('seller'); setActiveLiveStream(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'seller' ? 'bg-indigo-500 shadow-sm text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Store className="w-3.5 h-3.5" /> Cửa hàng
            </button>
            <button 
              onClick={() => { setActiveTab('admin'); setActiveLiveStream(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'admin' ? 'bg-indigo-500 shadow-sm text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <ShieldAlert className="w-3.5 h-3.5" /> An ninh & Admin
            </button>
            <button 
              onClick={() => { setActiveTab('p2p'); setActiveLiveStream(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'p2p' ? 'bg-indigo-500 shadow-sm text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Mạng lưới P2P
            </button>
          </nav>

          {/* User Profile and Balance Tracker */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-indigo-300">
              <Wallet className="w-4 h-4" />
              <span className="text-xs font-mono font-bold">{me?.walletBalance || 0} USD</span>
            </div>
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
              title="Trung tâm hướng dẫn"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-mono text-zinc-300 font-medium">ADMIN</span>
            </div>
          </div>
        </div>
      </header>

      {/* SYSTEM WARNING BANNER FOR USER COMPLIANCE */}
      {!agreementAgreed && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-bounce" />
          <span>Bạn chưa phê duyệt Thỏa thuận sử dụng AmazeBid. Vui lòng phê duyệt để được đầy đủ tính năng ưu đãi.</span>
          <button 
            onClick={() => { setIsHelpOpen(true); setHelpTab('agreement'); }} 
            className="underline font-bold hover:text-amber-100 cursor-pointer ml-1"
          >
            Đến Thỏa thuận ngay
          </button>
        </div>
      )}

      {/* MAIN LAYOUT FRAME */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-20">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-zinc-400">Đang tải cấu trúc dữ liệu AmazeBid...</p>
          </div>
        ) : (
          <>
            {/* VIEW S1: CATALOG */}
            {activeTab === 'catalog' && !activeLiveStream && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Sàn Giao Dịch Đáng Giá</h2>
                    <p className="text-xs text-zinc-400">Kết hợp giữa mô hình mua ngay nhanh chóng và đấu giá sôi động</p>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-850 px-3 py-1.5 rounded-lg max-w-sm w-full">
                    <Search className="w-4 h-4 text-zinc-500" />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm sản phẩm, từ khóa..." 
                      className="bg-transparent text-xs w-full focus:outline-none placeholder-zinc-500"
                    />
                  </div>
                </div>

                {/* Product Grid Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((prod) => (
                    <div 
                      key={prod.id} 
                      className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-xl overflow-hidden shadow-md flex flex-col transition-all cursor-pointer"
                      onClick={() => setSelectedProduct(prod)}
                    >
                      <div className="aspect-video w-full bg-zinc-950 relative overflow-hidden">
                        <img 
                          src={prod.imageUrl} 
                          alt={prod.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 left-2 flex gap-1.5">
                          {prod.type === 'AUCTION' ? (
                            <span className="bg-purple-600/90 text-white font-semibold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <Gavel className="w-3 h-3" /> Đấu giá
                            </span>
                          ) : (
                            <span className="bg-emerald-600/90 text-white font-semibold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <ShoppingBag className="w-3 h-3" /> Mua ngay
                            </span>
                          )}
                          {prod.status !== 'ACTIVE' && (
                            <span className="bg-zinc-800 text-zinc-400 font-semibold text-[10px] px-2 py-0.5 rounded-full uppercase">
                              {prod.status === 'SOLD' ? 'Đã bán' : 'Kết thúc'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 flex flex-col flex-grow">
                        <span className="text-[10px] font-mono text-zinc-500 mb-1 block uppercase">{prod.sellerName}</span>
                        <h3 className="font-semibold text-sm text-zinc-100 group-hover:text-indigo-400 line-clamp-1 transition-colors">{prod.title}</h3>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 min-h-[2rem]">{prod.description}</p>
                        
                        <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-end">
                          <div>
                            <span className="text-[10px] text-zinc-500 block">
                              {prod.type === 'AUCTION' ? 'Giá Thầu Hiện Tại' : 'Giá Mua Ngay'}
                            </span>
                            <span className="font-mono text-lg font-black text-indigo-300">
                              {prod.type === 'AUCTION' ? `${prod.currentBid} USD` : `${prod.price} USD`}
                            </span>
                          </div>
                          <span className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-xs font-semibold">
                            Xem chi tiết <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* MY BUYER DEALS & ESCROW LEDGER (Danh Sách Giao Dịch Của Tôi) */}
                <div className="h-px bg-zinc-800/80 my-10" />
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Lock className="w-5 h-5 text-indigo-400 animate-pulse" /> Hồ Sơ Ví Escrow & Giao Dịch Của Tôi
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">Đảm bảo dòng tiền thông suốt 100% nhờ giải pháp phong tỏa an toàn trung lập. Chỉ giải ngân khi bạn đã xác nhận nhận hàng đầy đủ.</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-[11px] font-mono flex items-center gap-1.5 self-start text-zinc-400">
                      <Receipt className="w-4 h-4 text-emerald-400" /> Hệ thống ký quỹ Blockchain Active
                    </div>
                  </div>

                  {orders.length === 0 ? (
                    <div className="bg-zinc-900 border border-zinc-850 p-8 rounded-xl text-center text-xs text-zinc-500 italic space-y-1">
                      <FileCheck2 className="w-8 h-8 text-zinc-700 mx-auto mb-2 animate-bounce" />
                      <p>Bạn chưa thực hiện giao dịch hoặc đặt mua ký quỹ nào.</p>
                      <p className="text-[10px] text-zinc-650">Bấm nút "Mua Ngay" hoặc chiến thắng "Đấu Giá" sản phẩm bất kỳ để tạo hợp đồng ký quỹ.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {orders.map((order) => {
                        const productLinked = products.find(p => p.id === order.productId);
                        return (
                          <div key={order.id} className="bg-zinc-900 border border-zinc-850 hover:border-indigo-500/30 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-zinc-750 transition-all shadow-lg">
                            <div className="flex justify-between items-start border-b border-zinc-800 pb-2">
                              <div>
                                <span className="text-[9px] font-mono text-zinc-500 block animate-pulse">HỢP ĐỒNG ESCROW ACTIVE</span>
                                <span className="text-xs font-mono font-black text-indigo-400">{order.id}</span>
                              </div>
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                                order.escrowStatus === 'SECURED' 
                                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-400 animate-pulse' 
                                  : order.escrowStatus === 'RELEASED' 
                                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                                    : 'bg-red-500/10 border-red-500/25 text-red-400'
                              }`}>
                                {order.escrowStatus === 'SECURED' ? '🔒 ĐANG PHONG TỎA' : order.escrowStatus === 'RELEASED' ? '✅ ĐÃ GIẢI NGÂN' : '⏪ ĐÃ HOÀN TIỀN'}
                              </span>
                            </div>

                            <div className="flex gap-3 text-xs items-center">
                              {productLinked && (
                                <img 
                                  src={productLinked.imageUrl} 
                                  alt={order.productTitle} 
                                  className="w-12 h-12 rounded-lg object-cover border border-zinc-800" 
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              <div className="flex-grow">
                                <h4 className="font-bold text-zinc-200 line-clamp-1 text-xs">{order.productTitle}</h4>
                                <span className="text-[10px] text-indigo-400 block font-mono">ID sản phẩm: {order.productId}</span>
                                <span className="text-[10px] text-zinc-500 block font-mono mt-0.5">Thời gian: {new Date(order.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="text-right font-mono self-center">
                                <span className="text-sm font-black text-indigo-300 block">{order.amount} USD</span>
                                <span className="text-[9px] text-zinc-500 block leading-none">Phí sàn: 1.5%</span>
                              </div>
                            </div>

                            <div className="flex gap-2 justify-end pt-2 border-t border-zinc-800">
                              <button 
                                onClick={() => setActiveInvoiceOrder(order)}
                                className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all"
                              >
                                <FileText className="w-3.5 h-3.5 text-indigo-400" /> Xem Biên Lai
                              </button>
                              
                              {order.escrowStatus === 'SECURED' && (
                                <>
                                  <button
                                    onClick={() => handleEscrowAction(order.id, 'REFUND')}
                                    className="border border-red-500/30 hover:border-red-500/50 hover:bg-red-500/5 text-red-400 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-all"
                                  >
                                    Yêu cầu hoàn trả
                                  </button>
                                  <button
                                    onClick={() => handleEscrowAction(order.id, 'RELEASE')}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" /> Giải Ngân ngay
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW S2: CREATIVE STUDIO (AI) */}
            {activeTab === 'studio' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Studio Sáng Tạo AI</h2>
                    <p className="text-xs text-zinc-400">Thiết lập nội dung SEO xuất sắc, tạo mô hình mô phỏng video quảng bá chuyên nghiệp sử dụng Gemini và Veo.</p>
                  </div>
                  <button 
                    onClick={() => setIsContentStudioOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-black font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-black animate-spin" /> Mở Bản Content Studio Chuyên nghiệp (AI)
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Studio Control Form */}
                  <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4">
                    <h3 className="font-bold text-sm text-zinc-200 border-b border-zinc-850 pb-3">Cấu hình Sáng tạo</h3>
                    
                    <div className="space-y-1">
                      <label className="text-xs text-zinc-400 font-medium">Tên sản phẩm muốn giới thiệu</label>
                      <input 
                        type="text" 
                        value={studioProductName}
                        onChange={(e) => setStudioProductName(e.target.value)}
                        placeholder="Ví dụ: Đồng Hồ Thông Minh Pro 2026"
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 p-2.5 rounded-lg text-xs placeholder-zinc-600 font-medium focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-zinc-400 font-medium">Từ khóa chuẩn SEO (mỗi từ cách nhau bằng dấu phẩy)</label>
                      <input 
                        type="text" 
                        value={studioKeywords}
                        onChange={(e) => setStudioKeywords(e.target.value)}
                        placeholder="Ví dụ: smartwatch, đồng hồ giá rẻ, thiết bị đeo tay"
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 p-2.5 rounded-lg text-xs placeholder-zinc-600 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 font-medium block">Giọng văn AI</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Chuyên gia', 'Hài hước', 'Sang trọng'].map(tone => (
                          <button
                            key={tone}
                            onClick={() => setStudioTone(tone)}
                            className={`p-2 rounded-lg text-xs font-semibold border transition-all ${studioTone === tone ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'}`}
                          >
                            {tone}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Generate SEO Post Button */}
                    <button
                      onClick={handleGenerateSEOContent}
                      disabled={studioGenerating}
                      className="w-full bg-indigo-500 text-white font-bold p-3 rounded-lg text-xs flex items-center justify-center gap-2 hover:bg-indigo-400 transition-all disabled:opacity-50"
                    >
                      {studioGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Đang soạn thảo bài SEO...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" /> Viết Bài Viết Chuẩn SEO (AI Writer)
                        </>
                      )}
                    </button>

                    {/* Media tools section */}
                    <div className="pt-4 border-t border-zinc-800 space-y-2">
                      <h4 className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2">Đồ họa & Phim quảng cáo (AI)</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleGenerateImage}
                          disabled={mediaGeneratingImage || !studioProductName}
                          className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 p-3 rounded-lg text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <ImageIcon className="w-4 h-4 text-emerald-400" /> Image Gen
                        </button>
                        <button
                          onClick={handleGenerateVideo}
                          disabled={mediaGeneratingVideo || !studioProductName}
                          className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 p-3 rounded-lg text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <VideoIcon className="w-4 h-4 text-purple-400" /> Clip Gen (Veo)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Studio Result Output */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Media Assets Preview Panel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Image Preview Case */}
                      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl min-h-[220px] flex flex-col justify-between">
                        <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                          <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> Khung Hình Mô Phỏng
                          </span>
                        </div>
                        <div className="flex-1 flex items-center justify-center py-4">
                          {mediaGeneratingImage ? (
                            <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                          ) : generatedImage ? (
                            <img 
                              src={generatedImage} 
                              alt="AI generated artwork" 
                              className="max-h-[160px] rounded-lg border border-zinc-800"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <p className="text-xs text-zinc-500 italic">Nhập tên và click Image Gen để tạo sản phẩm hình ảnh.</p>
                          )}
                        </div>
                      </div>

                      {/* Video Preview Case */}
                      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl min-h-[220px] flex flex-col justify-between">
                        <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                          <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                            <VideoIcon className="w-3.5 h-3.5 text-purple-400" /> Clip Quảng Quả (Veo AI Model)
                          </span>
                        </div>
                        <div className="flex-1 flex items-center justify-center py-4">
                          {mediaGeneratingVideo ? (
                            <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
                          ) : generatedVideo ? (
                            <video 
                              src={generatedVideo} 
                              controls 
                              autoPlay 
                              loop 
                              muted 
                              className="max-h-[160px] rounded-lg border border-zinc-800 w-full object-cover"
                            />
                          ) : (
                            <p className="text-xs text-zinc-500 italic">Nhập tên và click Clip Gen (Veo) để kết xuất hoạt cảnh.</p>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* SEO Blog Post Editor / View */}
                    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl min-h-[300px] flex flex-col justify-between">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
                        <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-indigo-400" /> Trình Soạn Bài Viết SEO
                        </span>
                        {studioPost && (
                          <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                            Mô hình: gemini-2.5-flash
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 py-4">
                        {studioPost ? (
                          <div className="prose prose-invert max-w-none text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed space-y-4">
                            <h3 className="text-sm font-bold text-white border-l-2 border-indigo-500 pl-2">{studioPost.title}</h3>
                            <p>{studioPost.content}</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs py-12 gap-2">
                            <Sparkles className="w-6 h-6 text-zinc-600 animate-pulse" />
                            <p className="italic">Chưa có bài viết SEO. Hãy nhập cấu hình bên trái và tạo mới.</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            )}

            {/* VIEW S3: LIVESTREAM SPACE */}
            {activeTab === 'stream' && !activeLiveStream && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Kênh Phát Sóng Bán Hàng Trực Tiếp</h2>
                    <p className="text-xs text-zinc-400">Tham gia rạp livestream và cùng đặt bid thầu kịch tính với cộng đồng.</p>
                  </div>
                  <button 
                    onClick={() => setIsKolStudioOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-purple-500/10 cursor-pointer"
                  >
                    <Tv className="w-4 h-4 text-white animate-bounce" /> Mở KOL Studio Phát Sóng (AI co-host)
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {streams.map((stream) => (
                    <div 
                      key={stream.id}
                      onClick={() => handleSelectStream(stream)}
                      className="group bg-zinc-900 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl overflow-hidden cursor-pointer shadow-md transition-all flex flex-col"
                    >
                      <div className="aspect-video w-full bg-zinc-950 relative">
                        {/* Simulation Stream Overlay */}
                        <div className="absolute inset-0 bg-zinc-950/80 group-hover:bg-zinc-950/50 flex items-center justify-center transition-all">
                          <Compass className="w-12 h-12 text-indigo-400 animate-pulse" />
                        </div>
                        <div className="absolute top-2 left-2 bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span> Live
                        </div>
                        <div className="absolute top-2 right-2 bg-black/60 text-zinc-200 text-[10px] px-2 py-0.5 rounded-md">
                          👀 {stream.viewerCount} đang xem
                        </div>
                      </div>
                      <div className="p-4 flex flex-col">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">{stream.hostName}</span>
                        <h3 className="font-semibold text-sm text-zinc-100 group-hover:text-indigo-300 mt-1 line-clamp-1">{stream.title}</h3>
                        <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Đang đấu: <strong className="text-indigo-300">Bàn phím custom vintage</strong></span>
                          <span className="text-indigo-400 font-bold group-hover:underline">Tham gia ngay</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LIVE STREAM ROOM SCREEN (ACTIVE) */}
            {activeLiveStream && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <button 
                      onClick={() => setActiveLiveStream(null)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold mb-1"
                    >
                      &larr; Quay lại danh sách Live
                    </button>
                    <h2 className="text-lg font-bold tracking-tight">{activeLiveStream.title}</h2>
                    <span className="text-xs text-zinc-400">Host: {activeLiveStream.hostName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-red-600 text-white font-bold text-[10px] px-2.5 py-1 rounded">LIVE</span>
                    <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs px-2.5 py-1 rounded">👀 {activeLiveStream.viewerCount + 10} người xem</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Streaming Player View */}
                  <div className="lg:col-span-8 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden relative flex flex-col justify-between min-h-[420px]">
                    
                    {/* Simulated stream video loop with nice futuristic feel */}
                    <video 
                      src="https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-cybernetic-woman-with-neon-wiring-44163-large.mp4" 
                      controls 
                      autoPlay 
                      loop 
                      muted 
                      className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />

                    {/* Overlay info */}
                    <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg border border-zinc-800/80 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                      <div>
                        <span className="text-[10px] text-zinc-400 block uppercase">Đấu giá trực tiếp</span>
                        <span className="text-xs font-bold text-zinc-100">Bàn Phím Cơ Custom Vintage 75%</span>
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-4 z-10 bg-black/60 backdrop-blur-md px-4 py-3 rounded-xl border border-zinc-850 flex items-center gap-4">
                      <div>
                        <span className="text-[10px] text-zinc-400 block uppercase">Đặt thầu tối thiểu</span>
                        <span className="text-sm font-mono font-black text-indigo-400">190 USD</span>
                      </div>
                      <div className="h-8 w-px bg-zinc-800"></div>
                      <button 
                        onClick={() => {
                          const prod = products.find(p => p.id === 'prod-2');
                          if (prod) setSelectedProduct(prod);
                        }}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md transition-all"
                      >
                        Đặt thầu ngay
                      </button>
                    </div>

                    <div className="relative flex-1"></div>
                  </div>

                  {/* Chat Box and Community bid Logs */}
                  <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col h-[420px]">
                    <div className="p-1 border-b border-zinc-850 flex items-center justify-between bg-zinc-950/40 rounded-t-xl">
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setLiveCohostEnabled(false)}
                          className={`text-xs font-bold px-3 py-2 rounded-t-lg transition-all cursor-pointer ${!liveCohostEnabled ? 'bg-zinc-800 text-white border-b-2 border-indigo-500' : 'text-zinc-400 hover:text-zinc-200'}`}
                        >
                          Cộng đồng
                        </button>
                        <button 
                          onClick={() => setLiveCohostEnabled(true)}
                          className={`text-xs font-bold px-3 py-2 rounded-t-lg transition-all flex items-center gap-1 cursor-pointer ${liveCohostEnabled ? 'bg-zinc-800 text-white border-b-2 border-indigo-500' : 'text-zinc-400 hover:text-zinc-200'}`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Co-host AI
                        </button>
                      </div>
                      <span className="text-[10px] pr-2 font-mono text-zinc-500">AmazeStream v2</span>
                    </div>

                    {!liveCohostEnabled ? (
                      <>
                        {/* Chat Messages */}
                        <div className="flex-1 p-3 overflow-y-auto space-y-2.5 max-h-[300px] scrollbar">
                          {liveChat.map((msg, i) => (
                            <div key={i} className="text-xs">
                              <strong className="text-indigo-400 mr-1.5">{msg.user}:</strong>
                              <span className="text-zinc-350 leading-relaxed">{msg.text}</span>
                            </div>
                          ))}
                        </div>

                        {/* Chat Input */}
                        <div className="p-3 border-t border-zinc-850 flex gap-2">
                          <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
                            placeholder="Bình luận công khai..."
                            className="flex-grow bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none focus:border-indigo-500"
                          />
                          <button 
                            onClick={handleSendChat}
                            className="bg-indigo-500 text-white p-2 rounded-lg hover:bg-indigo-400 transition-all cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* AI Cohost Dialogue */}
                        <div className="flex-1 p-3 overflow-y-auto space-y-3 max-h-[300px] scrollbar text-xs">
                          {liveCohostHistory.map((msg, i) => (
                            <div 
                              key={i} 
                              className={`p-2 rounded-lg leading-relaxed ${
                                msg.sender === 'Cohost AI' 
                                  ? 'bg-indigo-950/20 border border-indigo-900/40 text-indigo-200' 
                                  : msg.sender === 'You'
                                  ? 'bg-zinc-950 border border-zinc-850 text-zinc-300'
                                  : 'bg-zinc-900 text-zinc-400'
                              }`}
                            >
                              <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 mb-1">
                                <span className={msg.sender === 'Cohost AI' ? 'text-amber-400 font-bold' : ''}>{msg.sender}</span>
                                <span>{msg.timestamp}</span>
                              </div>
                              <p className="text-xs">{msg.message}</p>
                            </div>
                          ))}
                          {cohostThinking && (
                            <div className="flex items-center gap-2 p-2 bg-indigo-950/10 border border-indigo-950 text-zinc-400 rounded-lg italic text-[11px]">
                              <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                              <span>Trợ lý Co-host AI đang phân tích bình luận...</span>
                            </div>
                          )}
                        </div>

                        {/* Cohost Input */}
                        <div className="p-3 border-t border-zinc-850 flex gap-2">
                          <input 
                            type="text" 
                            value={cohostDraftText}
                            onChange={(e) => setCohostDraftText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSendStreamCohostQuery(products.find(p => p.id === 'prod-2') || null); }}
                            placeholder="Hỏi Co-host hoặc yêu cầu PR sản phẩm..."
                            className="flex-grow bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs placeholder-zinc-650 text-zinc-200 focus:outline-none focus:border-indigo-500"
                          />
                          <button 
                            onClick={() => handleSendStreamCohostQuery(products.find(p => p.id === 'prod-2') || null)}
                            disabled={cohostThinking}
                            className="bg-indigo-500 text-white p-2 rounded-lg hover:bg-indigo-400 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* VIEW S4: SELLER MANAGEMENT */}
            {activeTab === 'seller' && (
              <SellerDashboard 
                isOpen={true} 
                onClose={() => setActiveTab('catalog')} 
                products={products} 
                currentUserId={me?.id || 'currentUser'} 
                onRefreshProducts={async () => {
                  try {
                    const prodRes = await fetch('/api/products');
                    const updated = await prodRes.json();
                    setProducts(updated);
                  } catch (err) {
                    console.error("Failed to refresh products:", err);
                  }
                }}
              />
            )}

            {/* VIEW S5: ADMIN CONTROLS AND SYSTEM SAFETY */}
            {activeTab === 'admin' && (
              <AdminDashboard 
                isOpen={true} 
                onClose={() => setActiveTab('catalog')} 
                products={products} 
              />
            )}

            {/* VIEW S6: P2P MESH CONSOLE & COMPUTE HUB */}
            {activeTab === 'p2p' && (
              <div className="space-y-6 animate-in fade-in duration-550">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Mạng Lưới Thao Tác Node P2P & Đại Lý Sức Mạnh AI</h2>
                  <p className="text-xs text-zinc-400">Trở thành một mảnh đóng góp cho mạng lưới phân quyền AmazeBid, chia sẻ năng lực tính toán GPU/CPU dư thừa để tăng thu nhập ví Escrow trực tiếp.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left panel: Node control Status & Rewards */}
                  <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between space-y-4 shadow-lg">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                        <h3 className="font-bold text-sm text-zinc-200 flex items-center gap-1.5">
                          <RefreshCw className={`w-4 h-4 text-indigo-400 ${isNodeActive ? 'animate-spin' : ''}`} /> Thiết Lập Trạm Node P2P
                        </h3>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${isNodeActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                          {isNodeActive ? '● ĐANG HOẠT ĐỘNG' : '○ NGOẠI TUYẾN'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <p className="text-zinc-400 leading-relaxed">Khi khởi tạo trạm (Node Node), thiết bị của bạn sẽ tham gia cấu mã hóa khối Escrow, đồng thuật liên minh bước giá, giúp giảm thiểu độ trễ cho mạng lưới đấu giá AmazeBid.</p>
                      </div>

                      {/* Control form */}
                      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-300 font-semibold">Tình trạng Node</span>
                          <button
                            onClick={() => {
                              setIsNodeActive(!isNodeActive);
                              if (isNodeActive) setShareCompute(false);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${isNodeActive ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                          >
                            {isNodeActive ? 'Tắt Trạm Node' : 'Kích Hoạt Trạm'}
                          </button>
                        </div>

                        {isNodeActive && (
                          <div className="flex items-center justify-between border-t border-zinc-900 pt-2.5">
                            <span className="text-xs text-zinc-300 font-semibold">Chia sẻ GPU/CPU AI</span>
                            <button
                              onClick={() => {
                                setShareCompute(!shareCompute);
                                showToast(
                                  !shareCompute 
                                    ? 'Kích hoạt GPU Share AI thành công! Bạn nhận +0.85 USD mỗi 4 giây.' 
                                    : 'Ngừng chia sẻ tài nguyên tính toán.',
                                  'info'
                                );
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${shareCompute ? 'bg-amber-650 hover:bg-amber-500 text-white animate-pulse' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}
                            >
                              {shareCompute ? 'Đang Khai Thác...' : 'Chia Sẻ Tài Nguyên'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rewards Counter */}
                    <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400 uppercase font-mono tracking-wider">Hiệu suất Đóng Góp</span>
                        <span className="text-indigo-400 font-mono font-bold animate-pulse">Mesh Net Reward</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-[10px] text-zinc-505 block leading-none mb-1">Cường độ điện toán</span>
                          <span className="text-2xl font-mono font-black text-white">{computeCredits.toFixed(2)} GFLOPS</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-505 block leading-none mb-1">Thu nhập tích lũy</span>
                          <span className="text-base font-mono font-bold text-emerald-400">+{parseFloat((computeCredits * 7.08).toFixed(2))} USD</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Middle panel: Live connection map & peer list (SVG) */}
                  <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between space-y-4 shadow-lg">
                    <div className="space-y-3">
                      <h3 className="font-bold text-sm text-zinc-200 border-b border-zinc-850 pb-3">Sơ Đồ Kết Nối Cluster Peers</h3>
                      <p className="text-xs text-zinc-400">Bản đồ luồng truy vấn kết nối ngang hàng P2P giữa trạm của bạn và các điểm thầu toàn cầu.</p>
                    </div>

                    {/* SVG Peer Map Simulation */}
                    <div className="h-44 w-full bg-zinc-950 rounded-xl border border-zinc-850 relative flex items-center justify-center overflow-hidden">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
                        {/* Connecting mesh lines */}
                        {isNodeActive ? (
                          <>
                            <line x1="100" y1="50" x2="30" y2="30" stroke="#6366f1" strokeWidth="0.8" strokeDasharray="3,3" />
                            <line x1="100" y1="50" x2="170" y2="40" stroke="#a855f7" strokeWidth="0.8" strokeDasharray="3,3" />
                            <line x1="100" y1="50" x2="60" y2="80" stroke="#6366f1" strokeWidth="0.8" strokeDasharray="3,3" />
                            <line x1="100" y1="50" x2="140" y2="80" stroke="#a855f7" strokeWidth="0.8" strokeDasharray="3,3" />
                            
                            {/* Moving packets */}
                            {shareCompute && (
                              <>
                                <circle r="2.5" fill="#f59e0b">
                                  <animateMotion dur="3s" repeatCount="indefinite" path="M 100,50 L 30,30" />
                                </circle>
                                <circle r="2" fill="#10b981">
                                  <animateMotion dur="2.5s" repeatCount="indefinite" path="M 170,40 L 100,50" />
                                </circle>
                                <circle r="2" fill="#10b981">
                                  <animateMotion dur="4s" repeatCount="indefinite" path="M 60,80 L 100,50" />
                                </circle>
                                <circle r="2.5" fill="#f59e0b">
                                  <animateMotion dur="2s" repeatCount="indefinite" path="M 100,50 L 140,80" />
                                </circle>
                              </>
                            )}
                          </>
                        ) : null}

                        {/* Node dots */}
                        <circle cx="100" cy="50" r="7" fill={isNodeActive ? "#6366f1" : "#ef4444"} className={isNodeActive ? "animate-pulse" : ""} />
                        <text x="100" y="38" fill="#ffffff" fontSize="7" textAnchor="middle" fontWeight="bold">Trạm Của Bạn</text>

                        <circle cx="30" cy="30" r="4" fill="#10b981" />
                        <text x="24" y="22" fill="#a1a1aa" fontSize="6">Keycap Node</text>

                        <circle cx="170" cy="40" r="4" fill="#10b981" />
                        <text x="170" y="32" fill="#a1a1aa" fontSize="6">Rider Node</text>

                        <circle cx="60" cy="80" r="4" fill="#a855f7" />
                        <text x="60" y="90" fill="#a1a1aa" fontSize="6">Peer Zone-2</text>

                        <circle cx="140" cy="80" r="4" fill="#a855f7" />
                        <text x="140" y="90" fill="#a1a1aa" fontSize="6">Peer Tokyo</text>
                      </svg>
                      
                      {!isNodeActive && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                          <span className="text-zinc-500 font-mono text-xs">VUI LÒNG KÍCH HOẠT NODE TRẠM ĐỂ XEM BẢN ĐỒ PEERS</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-zinc-950 p-2.5 border border-zinc-850 rounded-lg">
                      <div className="text-zinc-400">Độ trễ (Ping): <span className="text-white font-bold">{isNodeActive ? '27 ms' : '---'}</span></div>
                      <div className="text-zinc-400">Mã hóa Hash: <span className="text-emerald-400 font-bold">{isNodeActive ? 'SHA-256' : '---'}</span></div>
                      <div className="text-zinc-400">Cổng truy cập: <span className="text-white font-bold">{isNodeActive ? '3000' : '---'}</span></div>
                      <div className="text-zinc-400">Peer liên kêt: <span className="text-indigo-400 font-bold">{isNodeActive ? '4 active' : '0'}</span></div>
                    </div>

                  </div>

                  {/* Right panel: Ledger Consensuses logs */}
                  <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between space-y-3 shadow-lg">
                    <div>
                      <h3 className="font-bold text-sm text-zinc-200 border-b border-zinc-850 pb-3">Sách Lệnh Đồng Thuận P2P</h3>
                      <p className="text-[11px] text-zinc-400 mt-1">Hoạt động thời gian thực được xác minh tại biên:</p>
                    </div>

                    <div className="flex-1 bg-zinc-950 rounded-lg p-3 overflow-y-auto h-[260px] space-y-2.5 font-mono text-[10px] text-zinc-400 scrollbar border border-zinc-850">
                      {p2pLogs.map((log, i) => (
                        <div key={i} className="leading-relaxed border-b border-zinc-900/40 pb-1.5 text-zinc-400">{log}</div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

          </>
        )}

      </main>

      {/* FOOTER METADATA CONTROLS */}
      <footer className="bg-[#09090b]/40 border-t border-zinc-900 py-6 px-4 text-center text-xs text-zinc-600 font-mono mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p>© 2026 AmazeBid Technologies. Kiến trúc Hybrid P2P & Blockchain Escrow</p>
          <div className="flex flex-wrap justify-center gap-4 text-zinc-500">
            <span>An toàn tối mật (SSL & TLS)</span>
            <span>•</span>
            <span>Hợp đồng thông minh Ethereum</span>
          </div>
        </div>
      </footer>

      {/* SELECTED PRODUCT DETAILS / BID / CHECKOUT MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            
            <button 
              onClick={() => { setSelectedProduct(null); setBidAmount(''); setAppraisalResult(null); }}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/40 border border-zinc-800/60 text-zinc-400 hover:text-white transition-all cursor-pointer z-10"
            >
              &times;
            </button>

            <div className="overflow-y-auto">
              {/* Product Visual */}
              <div className="aspect-video w-full bg-zinc-950 relative">
                <img 
                  src={selectedProduct.imageUrl} 
                  alt={selectedProduct.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Product Specifications */}
              <div className="p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">{selectedProduct.sellerName}</span>
                  <h3 className="text-base font-bold text-white mt-1">{selectedProduct.title}</h3>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{selectedProduct.description}</p>
                </div>

                <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-850 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">
                      {selectedProduct.type === 'AUCTION' ? 'Thầu hiện tại' : 'Giá mua'}
                    </span>
                    <div className="text-xl font-mono font-black text-indigo-400">
                      {selectedProduct.type === 'AUCTION' ? `${selectedProduct.currentBid} USD` : `${selectedProduct.price} USD`}
                    </div>
                  </div>
                  {selectedProduct.type === 'AUCTION' && selectedProduct.buyNowPrice && (
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Mua luôn tức khắc</span>
                      <div className="text-sm font-mono font-bold text-zinc-300">
                        {selectedProduct.buyNowPrice} USD
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Appraiser Segment */}
                <div className="border border-zinc-805 bg-zinc-950/45 rounded-xl p-4 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <h4 className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">Trợ lý Thẩm định AI AmazeBid</h4>
                    </div>
                    <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 font-mono px-2 py-0.5 rounded uppercase leading-none">
                      Gemini Co-pilot Verified
                    </span>
                  </div>
                  
                  {!appraisalResult ? (
                    <div className="space-y-2">
                      <p className="text-[11px] text-zinc-400 leading-relaxed">Kiểm tra tính nguyên bản, truy quét vết xước trầy sước vật lý và ước toán định giá thị trường nội địa bằng hạt nhân AI.</p>
                      <button
                        onClick={() => handleAppraiseProduct(selectedProduct)}
                        disabled={appraisalLoading}
                        className="w-full py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-750 text-indigo-300 hover:text-indigo-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {appraisalLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                            Đang chạy máy thẩm định & so phổ khối...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            Khởi động Trợ lý Thẩm định AI
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs animate-in fade-in duration-300">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                          <span className="text-[9px] text-zinc-500 block uppercase font-mono">Cấp chất lượng</span>
                          <span className="font-bold text-emerald-400 text-[11px] font-sans">{appraisalResult.rating}</span>
                        </div>
                        <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                          <span className="text-[9px] text-zinc-500 block uppercase font-mono">Giá thực tế đề xuất</span>
                          <span className="font-bold text-indigo-400 font-mono text-[11px]">{appraisalResult.valuation}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 p-2.5 bg-zinc-950/60 rounded-lg border border-zinc-900">
                        <span className="text-[9px] text-zinc-500 block uppercase font-mono">Bảo chứng nguồn gốc</span>
                        <ul className="space-y-1 text-[10px]">
                          {appraisalResult.markers && appraisalResult.markers.map((m, idx) => (
                            <li key={idx} className="text-zinc-300 flex items-center gap-1.5 font-sans leading-relaxed">
                              <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="text-[10.5px] italic text-zinc-400 border-l-2 border-indigo-500 pl-2 leading-relaxed">
                        &ldquo;{appraisalResult.verdict}&rdquo;
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-2 font-mono border-t border-zinc-900">
                        <span>Độ tin cậy: <strong className="text-zinc-400">{appraisalResult.confidence || 98.2}%</strong></span>
                        <button 
                          onClick={() => setAppraisalResult(null)}
                          className="text-indigo-400 hover:text-indigo-300 cursor-pointer"
                        >
                          Xóa thẩm định
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* BID SYSTEM INPUT FOR AUCTIONS */}
                {selectedProduct.type === 'AUCTION' ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-grow bg-zinc-950 border border-zinc-800 rounded-lg flex items-center px-3 gap-2">
                        <span className="text-zinc-500 font-mono text-xs">Bid $</span>
                        <input 
                          type="number" 
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder={`Tối thiểu ${(selectedProduct.currentBid || 0) + 10}`}
                          className="bg-transparent text-xs text-white p-2.5 w-full focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={handlePlaceBid}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs px-6 rounded-lg transition-all"
                      >
                        Đặt thầu
                      </button>
                    </div>
                    {selectedProduct.buyNowPrice && (
                      <button
                        onClick={() => handleBuyNow(selectedProduct)}
                        className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-750 text-indigo-300 font-bold p-2.5 rounded-lg text-xs transition-all"
                      >
                        Mua Ngay Lập Tức (${selectedProduct.buyNowPrice} USD)
                      </button>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => handleBuyNow(selectedProduct)}
                    className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-black py-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    MUA NGAY - AN TOÀN QUA ESCROW <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {/* AUCTION TIME-LINE & BIDDING TREND SVG CHART */}
                {selectedProduct.type === 'AUCTION' && (
                  <div className="border border-zinc-800/85 p-4 rounded-xl bg-zinc-950/45 space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-zinc-300 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                        <LineChart className="w-3.5 h-3.5 text-indigo-400" /> Xu hướng gia tăng bước giá đấu thầu
                      </h4>
                      <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono px-2 py-0.5 rounded leading-none">
                        PoA Verified
                      </span>
                    </div>

                    {selectedProduct.bidHistory && selectedProduct.bidHistory.length > 0 ? (
                      <div className="space-y-3.5">
                        {/* Custom SVG Line Chart representation */}
                        <div className="h-28 w-full border border-zinc-850 bg-[#09090b]/40 rounded-lg p-1.5 relative flex items-end justify-between overflow-hidden">
                          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {/* Guideline grid background ticks */}
                            <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                            <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                            <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                            
                            {/* Filled under shade curve path */}
                            <path
                              d={`M 0,100 ${selectedProduct.bidHistory.map((b, idx) => {
                                const x = (idx / (selectedProduct.bidHistory!.length - 1)) * 100;
                                const minBid = selectedProduct.bidHistory![0].amount;
                                const maxBid = selectedProduct.bidHistory![selectedProduct.bidHistory!.length - 1].amount;
                                const range = maxBid - minBid || 100;
                                const y = 92 - ((b.amount - minBid) / range) * 75;
                                return `L ${x},${y}`;
                              }).join(' ')} L 100,100 Z`}
                              fill="url(#trend-fade)"
                              opacity="0.25"
                            />
                            {/* Top Curve line outline */}
                            <path
                              d={selectedProduct.bidHistory.map((b, idx) => {
                                const x = (idx / (selectedProduct.bidHistory!.length - 1)) * 100;
                                const minBid = selectedProduct.bidHistory![0].amount;
                                const maxBid = selectedProduct.bidHistory![selectedProduct.bidHistory!.length - 1].amount;
                                const range = maxBid - minBid || 100;
                                const y = 92 - ((b.amount - minBid) / range) * 75;
                                return `${idx === 0 ? 'M' : 'L'} ${x},${y}`;
                              }).join(' ')}
                              fill="none"
                              stroke="#6366f1"
                              strokeWidth="1.6"
                            />
                            {/* Dynamic dot trackers */}
                            {selectedProduct.bidHistory.map((b, idx) => {
                              const x = (idx / (selectedProduct.bidHistory!.length - 1)) * 100;
                              const minBid = selectedProduct.bidHistory![0].amount;
                              const maxBid = selectedProduct.bidHistory![selectedProduct.bidHistory!.length - 1].amount;
                              const range = maxBid - minBid || 100;
                              const y = 92 - ((b.amount - minBid) / range) * 75;
                              return (
                                <circle 
                                  key={idx} 
                                  cx={x} 
                                  cy={y} 
                                  r="2" 
                                  fill="#818cf8" 
                                  className="transition-all hover:r-3 cursor-pointer"
                                />
                              );
                            })}
                            <defs>
                              <linearGradient id="trend-fade" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.45"/>
                                <stop offset="100%" stopColor="#818cf8" stopOpacity="0"/>
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute top-1 left-2 text-[8px] font-mono text-zinc-600 tracking-wider">LŨY TIẾN ĐĂNG THẾ ($)</div>
                          <div className="absolute bottom-1 right-2 text-[8px] font-mono text-zinc-400 bg-zinc-950/80 px-1.5 py-0.5 rounded border border-zinc-900 leading-none">
                            Hiện tại: {selectedProduct.currentBid} USD
                          </div>
                        </div>

                        {/* Bid list ledger scroll */}
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1.5 scrollbar">
                          {selectedProduct.bidHistory.slice().reverse().map((bid, i) => (
                            <div key={bid.id} className="flex justify-between items-center bg-zinc-950 border border-zinc-900 hover:border-zinc-850 p-2 rounded-lg text-xs font-mono transition-all">
                              <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-indigo-500 animate-ping' : 'bg-zinc-750'}`} />
                                <span className="text-zinc-300 font-bold">{bid.userName}</span>
                                {i === 0 && (
                                  <span className="text-[8px] font-sans font-extrabold bg-indigo-500/15 text-indigo-400 px-1 py-0.5 rounded tracking-wide uppercase scale-95">
                                    Thầu tối cao
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="text-emerald-400 font-black">+{bid.amount} USD</span>
                                <span className="text-[9px] text-zinc-600 block leading-none mt-0.5">
                                  {new Date(bid.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-zinc-500 text-xs italic">
                        Chưa có giá đề thầu nào được nộp cho sản phẩm đấu giá này. Hãy khai pháo thầu đầu tiên!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* HELP CENTER & POLICY AGREEMENT MODAL */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-3xl w-full min-h-[420px] shadow-2xl overflow-hidden flex flex-col md:flex-row">
            
            {/* Modal Navigation Sidebar */}
            <div className="md:w-1/3 bg-zinc-950 border-r border-zinc-850 p-4 space-y-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-3">Thông tin AmazeBid</span>
              <button
                onClick={() => setHelpTab('guides')}
                className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-all ${helpTab === 'guides' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 border' : 'text-zinc-400 hover:text-white'}`}
              >
                <Compass className="w-4 h-4" /> 1. Hướng dẫn Mua / Đấu
              </button>
              <button
                onClick={() => setHelpTab('payment')}
                className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-all ${helpTab === 'payment' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 border' : 'text-zinc-400 hover:text-white'}`}
              >
                <Wallet className="w-4 h-4" /> 2. Chính Sách Ví Escrow
              </button>
              <button
                onClick={() => setHelpTab('shipping')}
                className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-all ${helpTab === 'shipping' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 border' : 'text-zinc-400 hover:text-white'}`}
              >
                <ShoppingBag className="w-4 h-4" /> 3. Đóng Gói / Vận chuyển
              </button>
              <button
                onClick={() => setHelpTab('tax')}
                className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-all ${helpTab === 'tax' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 border' : 'text-zinc-400 hover:text-white'}`}
              >
                <Coins className="w-4 h-4" /> 4. Thuế & Quy định phí
              </button>
              <div className="h-px bg-zinc-800 my-4"></div>
              <button
                onClick={() => setHelpTab('agreement')}
                className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-all ${helpTab === 'agreement' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 border animate-pulse' : 'text-zinc-400 hover:text-white'}`}
              >
                <FileCheck2 className="w-4 h-4 text-emerald-400" /> Thỏa Thuận Sử Dụng
              </button>
            </div>

            {/* Content Segment */}
            <div className="flex-grow p-6 flex flex-col justify-between relative md:w-2/3">
              <button 
                onClick={() => setIsHelpOpen(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white font-bold text-lg"
              >
                &times;
              </button>

              <div className="flex-grow overflow-y-auto max-h-[300px] text-xs leading-relaxed text-zinc-300 space-y-4 pr-1">
                
                {helpTab === 'guides' && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide border-b border-zinc-850 pb-2">Hướng dẫn Mua sắm & Đấu thầu</h3>
                    <p>Chào mừng bạn đã gia nhập mô hình hybrid AmazeBid. Tại đây:</p>
                    <ul className="list-disc pl-4 space-y-2 text-zinc-400">
                      <li><strong>Mua Ngay:</strong> Thực hiện chuyển khoản thanh toán trực tuyến ngay. Hàng hóa lập tức được phong tỏa và sẵn sàng chuyển phát.</li>
                      <li><strong>Đấu Giá:</strong> Người dùng đưa ra chiến lược giá bid. Mỗi nấc thầu mới cần cộng tối thiểu 10 USD so với thầu trước đó.</li>
                    </ul>
                  </div>
                )}

                {helpTab === 'payment' && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white uppercase border-b border-zinc-850 pb-2">Hệ Thống Escrow Thanh Toán</h3>
                    <p>Hệ thống thanh toán AmazeBid hoạt động qua công nghệ trung gian bảo bảo phong tỏa Escrow hoàn hải.</p>
                    <p className="text-zinc-400">Khi bạn mua hàng thành công, số tiền mua sắm của bạn được chuyển vào quỹ ký quỹ phong tỏa trung lập. Người bán hàng sẽ không được giải ngân tiền cho đến khi bạn xác nhận nhận thành phẩm an toàn 100%.</p>
                  </div>
                )}

                {helpTab === 'shipping' && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white uppercase border-b border-zinc-850 pb-2">Chính Sách Đăng Tải / Vận chuyển</h3>
                    <p>Các gói sản phẩm của bạn đều được thiết lập quy chuẩn đóng gói chuyên môn cao từ người bán do hệ thống chỉ định.</p>
                    <p className="text-zinc-400 font-mono text-[11px]">Vận chuyển nội địa mất 1-3 ngày làm việc. Quá trình vận chuyển được giám sát bởi hệ thống an ninh và gắn mã blockchain an toàn kiểm soát thông tin hành trình.</p>
                  </div>
                )}

                {helpTab === 'tax' && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white uppercase border-b border-zinc-850 pb-2">Chính Sách Tự Khai Báo Thuế</h3>
                    <p className="font-bold text-amber-300">Lưu ý quan trọng đối với Nghĩa vụ tài chính:</p>
                    <p className="text-zinc-400">Toàn bộ hoạt động giao dịch kinh tế trên sàn AmazeBid đều theo cơ chế **Tự Khai Báo Thuế** cho Cơ quan Thuế nước sở tại. AmazeBid chỉ phụ trách thu phí nền tảng vận hành tối đa 1.5% và hỗ trợ cấp phát hóa đơn giao dịch điện tử đầy đủ.</p>
                  </div>
                )}

                {helpTab === 'agreement' && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white uppercase border-b border-zinc-850 pb-2">Thỏa Thuận Người Dùng & Điều Khoản Pháp Lý</h3>
                    <p>Khi tiến hành kích hoạt tài khoản của sàn, người dùng tự động thừa nhận các cam kết hoạt động:</p>
                    <ul className="list-disc pl-4 space-y-1 text-zinc-400">
                      <li>Không đăng tải văn hóa phẩm độc hại, sản phẩm cấm theo pháp luật nước sở tại.</li>
                      <li>Chấp nhận các hoạt động truy quét của an ninh Blockchain đối với hành vi phá thầu hoặc rửa tiền.</li>
                    </ul>
                  </div>
                )}

              </div>

              {/* Action Buttons for User Agreement Form */}
              <div className="pt-4 border-t border-zinc-850 flex justify-end gap-2 mt-4">
                {helpTab === 'agreement' && !agreementAgreed ? (
                  <button
                    onClick={handleAcceptAgreement}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all"
                  >
                    Tôi Đồng Ý Điều Khoản
                  </button>
                ) : (
                  <button
                    onClick={() => setIsHelpOpen(false)}
                    className="bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold px-4 py-2 rounded-lg text-xs transition-all"
                  >
                    Đóng
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ACTIVE INVOICE DETAIL & TAX DECLARATION RECEIPT MODAL */}
      {activeInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col p-6 space-y-5 relative">
            
            <button 
              onClick={() => setActiveInvoiceOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-black/40 border border-zinc-805 text-zinc-400 hover:text-white transition-all cursor-pointer z-10"
              title="Đóng biên lai"
            >
              &times;
            </button>

            {/* Receipt Header Badge */}
            <div className="text-center space-y-1">
              <div className="mx-auto w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">Hóa Đơn Chứng Từ Giao Dịch</h3>
              <p className="text-[10px] text-zinc-500 font-mono">Xác thực hệ thống Escrow • Mã bưu điện #10000</p>
            </div>

            {/* Interactive Escrow Delivery Progress Timeline */}
            <div className="bg-zinc-950 p-4 border border-zinc-850 rounded-xl space-y-3">
              <span className="text-[10px] font-mono text-zinc-500 block uppercase tracking-wider text-left">Hành trình bảo lãnh ký quỹ & Giao vận</span>
              
              {activeInvoiceOrder.escrowStatus === 'REFUNDED' ? (
                <div className="bg-red-500/10 border border-red-500/25 p-2 rounded-lg flex items-center gap-2 text-red-400 text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Giao dịch này đã bị hủy bỏ. Toàn bộ tiền đã hoàn về ví người mua.</span>
                </div>
              ) : (
                <div className="flex items-center justify-between relative pt-2">
                  {/* Timeline bar */}
                  <div className="absolute top-[21px] left-4 right-4 h-0.5 bg-zinc-850 z-0">
                    <div 
                      className="h-full bg-indigo-505 transition-all duration-1000" 
                      style={{ 
                        width: activeInvoiceOrder.escrowStatus === 'RELEASED' 
                          ? '100%' 
                          : '66%' 
                      }} 
                    />
                  </div>

                  {/* Node 1: Secured */}
                  <div className="flex flex-col items-center z-10 space-y-1">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-[10px] text-emerald-400 font-bold font-mono">
                      ✓
                    </div>
                    <span className="text-[9px] font-bold text-zinc-300">Nhập ký quỹ</span>
                  </div>

                  {/* Node 2: Packaged */}
                  <div className="flex flex-col items-center z-10 space-y-1">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-[10px] text-emerald-400 font-bold font-mono">
                      ✓
                    </div>
                    <span className="text-[9px] font-bold text-zinc-300">Đóng gói AI</span>
                  </div>

                  {/* Node 3: Transit */}
                  <div className="flex flex-col items-center z-10 space-y-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono border-2 ${
                      activeInvoiceOrder.escrowStatus === 'RELEASED'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                        : 'bg-indigo-500/20 border-indigo-450 text-indigo-400 animate-pulse'
                    }`}>
                      {activeInvoiceOrder.escrowStatus === 'RELEASED' ? '✓' : '3'}
                    </div>
                    <span className="text-[9px] font-bold text-zinc-300">Giao vận (P2P)</span>
                  </div>

                  {/* Node 4: Release */}
                  <div className="flex flex-col items-center z-10 space-y-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono border-2 ${
                      activeInvoiceOrder.escrowStatus === 'RELEASED'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 font-black'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                    }`}>
                      {activeInvoiceOrder.escrowStatus === 'RELEASED' ? '✓' : '4'}
                    </div>
                    <span className="text-[9px] font-bold text-zinc-300">Giải ngân</span>
                  </div>
                </div>
              )}
            </div>

            {/* Certificate Ledger Metadata details */}
            <div className="bg-zinc-950 p-4 border border-zinc-850 rounded-xl space-y-3.5 text-xs">
              <div className="flex justify-between font-mono text-[10px] text-zinc-500 border-b border-zinc-900 pb-2">
                <span>Số tham chiếu giao dịch:</span>
                <span className="text-indigo-400 font-bold">{activeInvoiceOrder.id}</span>
              </div>

              <div className="space-y-2 border-b border-zinc-900 pb-3">
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-medium">Sản phẩm:</span>
                  <span className="text-zinc-200 font-bold max-w-[180px] text-right truncate">{activeInvoiceOrder.productTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-medium">Khách hàng liên kết:</span>
                  <span className="text-zinc-200 font-mono">{me?.email || 'Nhatlinhckm2016@gmail.com'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-medium">Ngày hạch toán:</span>
                  <span className="text-zinc-200 font-mono">{new Date(activeInvoiceOrder.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Price calculations */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Giá gốc sản phẩm:</span>
                  <span className="font-mono text-zinc-300">{parseFloat((activeInvoiceOrder.amount * 0.985).toFixed(2))} USD</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Phí nền tảng AmazeBid (1.5%):</span>
                  <span className="font-mono text-zinc-300">+{parseFloat((activeInvoiceOrder.amount * 0.015).toFixed(2))} USD</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Nghĩa vụ Thuế VAT (Thuế tự khai):</span>
                  <span className="font-mono text-amber-400">Tự khai báo (0%)</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-zinc-900 pt-2.5">
                  <span className="text-white">Tổng cộng (Đã bao gồm phí):</span>
                  <span className="font-mono text-indigo-300">{activeInvoiceOrder.amount} USD</span>
                </div>
              </div>
            </div>

            {/* Cryptographic consensus stamp */}
            <div className="border border-indigo-500/10 bg-indigo-500/5 p-3 rounded-xl space-y-1.5 text-center text-[10px] font-mono text-indigo-300">
              <p className="font-bold flex items-center justify-center gap-1.5 uppercase tracking-wide">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Đã ký số bảo an liên minh
              </p>
              <p className="text-zinc-500 text-[9px] truncate">CheckSum: {activeInvoiceOrder.id}_SECURE_SHA_HASH_K256_STAMP</p>
            </div>

            {/* Controls */}
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  window.print();
                  showToast('Đang kết nối hệ thống điều phối biên lai nội bộ...', 'info');
                }}
                className="bg-[#6366f1] hover:bg-opacity-90 text-white font-black px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer max-sm:w-full justify-center"
              >
                In hóa đơn giao dịch
              </button>
              <button
                onClick={() => setActiveInvoiceOrder(null)}
                className="bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Toast Notification for Iframe Sandbox Compliance */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-zinc-900 border border-zinc-850 text-zinc-100 px-4 py-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom duration-300 animate-[bounce_1s_ease-in-out_1]">
          <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-500 animate-pulse' : toast.type === 'error' ? 'bg-red-500 animate-bounce' : toast.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
          <span className="text-xs font-semibold leading-none">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-zinc-500 hover:text-white font-black text-sm leading-none ml-1 cursor-pointer">&times;</button>
        </div>
      )}

      {/* Premium Modular Component Overlays */}
      {isKolStudioOpen && (
        <KOLStreamStudio 
          isOpen={isKolStudioOpen} 
          onClose={() => setIsKolStudioOpen(false)} 
          onPostToFeed={(content) => {
            showToast('Đã đăng lịch phát sóng lên bảng tin cộng đồng!', 'success');
          }} 
          products={products} 
        />
      )}

      {isContentStudioOpen && (
        <ContentStudioModal 
          isOpen={isContentStudioOpen} 
          onClose={() => setIsContentStudioOpen(false)} 
          myProducts={products} 
          onSavePost={(post) => {
            showToast(`Đã lưu bài viết SEO của sản phẩm thành công!`, 'success');
            setIsContentStudioOpen(false);
          }} 
        />
      )}

      {/* Floating Chat assistance / Customers service with other users and AI */}
      <ChatWidget currentUserId={me?.id || 'currentUser'} />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WorkSessionProvider>
        <InnerApp />
      </WorkSessionProvider>
    </AuthProvider>
  );
}
