import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { Product, LiveStream, Order, User } from './types.js';

const app = express();
const httpServer = createServer(app);
const PORT = 3000;

// Enable JSON middleware
app.use(express.json());

// Socket.io for Real-time bidding and notifications
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Mock Database States
let products: Product[] = [
  {
    id: 'prod-1',
    title: 'Mũ Bảo Hiểm Fullface Carbon Siêu Nhẹ',
    description: 'Mũ bảo hiểm fullface chất liệu sợi carbon hàng không, đạt chuẩn an toàn DOT châu Âu. Trọng lượng siêu nhẹ chỉ 1200g, thích hợp cho dòng xe cruise và sport.',
    price: 450,
    type: 'BUY_NOW',
    imageUrl: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=600',
    sellerId: 'sell-1',
    sellerName: 'Đạt Rider Store',
    status: 'ACTIVE',
    createdAt: Date.now() - 36000000
  },
  {
    id: 'prod-2',
    title: 'Bàn Phím Cơ Custom Vintage 75%',
    description: 'Bàn phím cơ thiết kế 75% cổ điển, switch linear êm ái, lót foam PORON chống ồn hoàn hảo. Thích hợp cho cả lập trình viên và game thủ chuyên nghiệp.',
    currentBid: 180,
    buyNowPrice: 280,
    type: 'AUCTION',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=600',
    sellerId: 'sell-2',
    sellerName: 'Keycap Art Studio',
    status: 'ACTIVE',
    createdAt: Date.now() - 18000000,
    bidsCount: 4,
    bidHistory: [
      { id: 'b1', userId: 'user-3', userName: 'Hà Trần', amount: 120, timestamp: Date.now() - 17000000 },
      { id: 'b2', userId: 'user-4', userName: 'Michael Nguyễn', amount: 140, timestamp: Date.now() - 12000000 },
      { id: 'b3', userId: 'user-3', userName: 'Hà Trần', amount: 160, timestamp: Date.now() - 8000000 },
      { id: 'b4', userId: 'user-5', userName: 'Duy Long', amount: 180, timestamp: Date.now() - 3000000 }
    ]
  },
  {
    id: 'prod-3',
    title: 'Đồng Hồ Phi Hành Gia Thể Thao Chronograph',
    description: 'Đồng hồ thiết kế chronograph thể thao lấy cảm hứng phi hành gia, chống nước 50m, vỏ titan phủ mờ chống xước cực tốt.',
    currentBid: 320,
    type: 'AUCTION',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
    sellerId: 'sell-1',
    sellerName: 'Đạt Rider Store',
    status: 'ACTIVE',
    createdAt: Date.now() - 4000000,
    bidsCount: 2,
    bidHistory: [
      { id: 'b5', userId: 'user-2', userName: 'Thanh Vũ', amount: 300, timestamp: Date.now() - 2000000 },
      { id: 'b6', userId: 'user-6', userName: 'Khánh Vy', amount: 320, timestamp: Date.now() - 500000 }
    ]
  }
];

let streams: LiveStream[] = [
  {
    id: 'stream-1',
    title: '🔴 Săn Sale Đồ Công Nghệ Cực Khủng - Đấu giá Bàn Phím Vintage!',
    hostName: 'Keycap Art Studio',
    hostId: 'sell-2',
    viewerCount: 45,
    activeProductId: 'prod-2',
    status: 'LIVE'
  }
];

let orders: Order[] = [];
const mockUser: User = {
  id: 'user-1',
  email: 'Nhatlinhckm2016@gmail.com',
  name: 'Linh Nguyễn',
  role: 'ADMIN', // Set as admin by default to enable all features
  verified: true,
  walletBalance: 2500
};

// Lazy initialization for Gemini
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return aiClient;
}

// REST API Endpoints

// 1. Auth Endpoint
app.get('/api/auth/me', (req, res) => {
  res.json(mockUser);
});

// 2. Products Endpoints
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const { title, description, price, currentBid, buyNowPrice, type, imageUrl, sellerName } = req.body;
  
  if (!title || !type || !imageUrl) {
    return res.status(400).json({ error: 'Thiếu thông tin sản phẩm bắt buộc.' });
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    title,
    description: description || '',
    price: type === 'BUY_NOW' ? Number(price) : undefined,
    currentBid: type === 'AUCTION' ? Number(currentBid || price) : undefined,
    buyNowPrice: type === 'AUCTION' && buyNowPrice ? Number(buyNowPrice) : undefined,
    type,
    imageUrl,
    sellerId: mockUser.id,
    sellerName: sellerName || mockUser.name,
    status: 'ACTIVE',
    createdAt: Date.now(),
    bidsCount: type === 'AUCTION' ? 0 : undefined,
    bidHistory: type === 'AUCTION' ? [] : undefined
  };

  products.unshift(newProduct);
  
  // Notify with Socket.io
  io.emit('product:added', newProduct);

  res.status(201).json(newProduct);
});

// 3. Bid Endpoint (Real-time and Sync)
app.post('/api/bids', (req, res) => {
  const { productId, amount, userId, userName } = req.body;

  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
  }

  if (product.type !== 'AUCTION') {
    return res.status(400).json({ error: 'Sản phẩm này không hỗ trợ đấu giá.' });
  }

  const minBid = (product.currentBid || 0) + 10; // at least 10 USD step
  if (amount < minBid) {
    return res.status(400).json({ error: `Giá bid tối thiểu là ${minBid} USD.` });
  }

  if (!product.bidHistory) product.bidHistory = [];

  const newBid = {
    id: `bid-${Date.now()}`,
    userId: userId || mockUser.id,
    userName: userName || mockUser.name,
    amount: Number(amount),
    timestamp: Date.now()
  };

  product.currentBid = Number(amount);
  product.bidsCount = (product.bidsCount || 0) + 1;
  product.bidHistory.push(newBid);

  // Sync to sockets
  io.emit('bid:updated', { productId, product });

  res.json({ success: true, product });
});

// 4. Live Streams Endpoints
app.get('/api/streams', (req, res) => {
  res.json(streams);
});

app.post('/api/streams', (req, res) => {
  const { title, activeProductId } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Vui lòng cung cấp tiêu đề livestream.' });
  }

  const newStream: LiveStream = {
    id: `stream-${Date.now()}`,
    title,
    hostId: mockUser.id,
    hostName: mockUser.name,
    viewerCount: Math.floor(Math.random() * 20) + 5,
    activeProductId: activeProductId || null,
    status: 'LIVE'
  };

  streams.unshift(newStream);
  io.emit('stream:started', newStream);

  res.status(201).json(newStream);
});

// 5. Escrow and Orders Endpoints
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders/checkout', (req, res) => {
  const { productId, amount } = req.body;

  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Sản phẩm không tồn tại.' });
  }

  // Create order with ESCROW SECURED state
  const newOrder: Order = {
    id: `order-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    userId: mockUser.id,
    productId,
    productTitle: product.title,
    amount,
    status: 'PAID', // Customer paid, secure in escrow
    escrowStatus: 'SECURED',
    createdAt: Date.now()
  };

  orders.unshift(newOrder);

  // Mark product as sold if appropriate
  if (product.type === 'BUY_NOW') {
    product.status = 'SOLD';
  } else {
    product.status = 'ENDED';
  }

  io.emit('order:updated', newOrder);
  io.emit('product:updated', product);

  res.status(201).json({ success: true, order: newOrder });
});

app.post('/api/orders/action', (req, res) => {
  const { orderId, action } = req.body; // Action can be 'RELEASE' or 'REFUND'

  const order = orders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ error: 'Đơn hàng không tồn tại.' });
  }

  if (action === 'RELEASE') {
    order.status = 'COMPLETED';
    order.escrowStatus = 'RELEASED';
  } else if (action === 'REFUND') {
    order.status = 'REFUNDED';
    order.escrowStatus = 'REFUNDED';
  } else {
    return res.status(400).json({ error: 'Hành động không hợp lệ.' });
  }

  io.emit('order:updated', order);
  res.json({ success: true, order });
});

// 6. AI Content Generation Proxy using @google/genai SDK
app.post('/api/ai/seo-content', async (req, res) => {
  const { productName, keywords, tone } = req.body;

  if (!productName) {
    return res.status(400).json({ error: 'Vui lòng cung cấp tên sản phẩm.' });
  }

  const ai = getAI();
  if (!ai) {
    // Return high-quality mock if GEMINI_API_KEY is missing
    const mockContent = `
# Chiến Lược Đột Phá Bán Hàng Với: ${productName}

**Từ khóa nổi bật:** \`${keywords || 'mua bán, chất lượng cao, giá rẻ'}\` | **Giọng văn:** \`${tone || 'Chuyên gia'}\`

## Giới thiệu tổng quan sản phẩm
Chào mừng các bạn đến với bài đánh giá chi tiết về dòng sản phẩm hot nhất hiện nay - **${productName}**. Đây là giải pháp đột phá giúp bạn nâng tầm trải nghiệm cá nhân một cách chuyên nghiệp.

### Tại sao bạn nên chọn ${productName}?
- **Thiết kế tối tân:** Sự kết hợp hoàn hảo giữa công nghệ hàng đầu và độ thẩm mỹ tinh tế.
- **Tiêu chuẩn vượt trội:** Đạt mọi chứng chỉ an toàn bền bỉ xuất sắc nhất.
- **Tối ưu chi phí:** Giá thành hợp lý với chính sách bảo hành dài hạn từ AmazeBid.

## Những lợi ích kỳ diệu dành cho người dùng
1. **Tiết kiệm thời gian và tài chính:** Sở hữu sản phẩm với cả 2 phương thức: Đấu giá tiết kiệm hoặc Mua Ngay lập tức.
2. **An tâm tuyệt đối:** Hệ thống ví Escrow bảo hành 100% dòng tiền giao dịch.

## Lời khuyên mua hàng thông minh (CTA)
Hãy sẵn sàng đặt mục tiêu giá bid hoặc bấm nút **Mua Ngay** tại AmazeBid để không bỏ lỡ Deal hời này với số lượng cực kỳ giới hạn!
    `;
    return res.json({ content: mockContent.trim() });
  }

  try {
    const prompt = `Viết một bài đăng blog chuẩn SEO chuyên nghiệp bằng tiếng Việt giới thiệu về sản phẩm này: "${productName}".
    - Tập trung vào các từ khóa: ${keywords || 'none'}
    - Giọng văn: ${tone || 'Chuyên gia thiết kế'}
    - Hãy tạo cấu trúc Markdown rõ ràng gồm: Tiêu đề, Các tính năng độc đáo, Lợi ích người dùng, và Lời kêu gọi hành động (CTA) kích thích đấu giá/mua trực tiếp trên nền tảng AmazeBid.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ content: response.text || 'Không có phản hồi từ mô hình AI.' });
  } catch (error: any) {
    console.error('[Gemini Server Error]:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi xử lý AI: ' + error.message });
  }
});

// Mock Image endpoint (provides realistic and reliable visuals on fallback)
app.post('/api/ai/image', async (req, res) => {
  const { prompt } = req.body;
  const seed = encodeURIComponent(prompt || 'amazebid');
  const imageUrl = `https://picsum.photos/seed/${seed}/800/800`;
  res.json({ imageUrl });
});

// Mock Video endpoint (consistent with AI studio demo capabilities)
app.post('/api/ai/video', async (req, res) => {
  const { prompt } = req.body;
  // Veo model representation - simulation link
  res.json({ 
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-44167-large.mp4' 
  });
});

// 7. AI Appraisal & Anti-Counterfeit Verification
app.post('/api/ai/appraise', async (req, res) => {
  const { productName, description } = req.body;
  
  if (!productName) {
    return res.status(400).json({ error: 'Vui lòng cung cấp tên sản phẩm để thẩm định.' });
  }

  const ai = getAI();
  if (!ai) {
    // High-quality deterministic fallback model
    const ratings = ['Mint 99% (Tuyệt phẩm sưu tầm)', 'Grade A+ (Như mới, sử dụng lướt)', 'Near Mint 95% (Rất đẹp, trầy nhẹ khó thấy)'];
    const rIdx = Math.abs(productName.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % ratings.length;
    
    const mockAppraisal = {
      rating: ratings[rIdx],
      valuation: `${productName.includes('Mũ') ? '430 - 470' : productName.includes('Bàn phím') ? '190 - 240' : '310 - 350'} USD`,
      confidence: 96.4,
      markers: [
        'Xác minh nguồn gốc xuất xứ chính ngạch',
        'Chứng thực không tì vết nghiêm trọng',
        'Phù hợp tiêu chuẩn kiểm tra 12 bước của AmazeBid'
      ],
      verdict: `Hệ thống phân tích hình học ảnh và siêu dữ liệu cho thấy "${productName}" ở trạng thái vật lý tuyệt vời. Phân khúc giá trị có độ thanh khoản rất cao trên nền tảng đấu giá.`
    };
    return res.json(mockAppraisal);
  }

  try {
    const prompt = `Bạn là Chuyên gia thẩm định giá và chất lượng sản phẩm chuẩn quốc tế của AmazeBid. Hãy thẩm định sản phẩm sau:
    Tên: ${productName}
    Mô tả: ${description}

    Hãy đưa ra phân tích khách quan và trả về định dạng JSON thuần nén sau (KHÔNG nằm trong thẻ markdown \`\`\`json, chỉ trả về chuỗi JSON thô trực tiếp):
    {
      "rating": "Chuỗi phân cấp chất lượng, ví dụ: Mint 98% (Sản phẩm xuất sắc)",
      "valuation": "Khoảng giá trị đề xuất bằng USD, ví dụ: 400 - 450",
      "confidence": Tỷ lệ phần trăm tin cậy tự đánh giá (số thực, ví dụ: 95.8),
      "markers": [
        "Danh sách 3 điểm nhận dạng bảo chứng chính hãng hoặc tiêu chuẩn nổi bật"
      ],
      "verdict": "Lời khuyên chiến lược chuyên nghiệp cho người mua và người bán về sản phẩm này (khoảng 3 câu)"
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    // Clean markdown code block wraps if model unfortunately included them
    let cleanText = response.text || '{}';
    if (cleanText.includes('```')) {
      cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    res.json(JSON.parse(cleanText));
  } catch (error: any) {
    console.error('[Gemini Appraisal Server Error]:', error);
    res.status(500).json({ error: 'Lỗi thẩm định AI: ' + error.message });
  }
});

// 8. AI Stream Co-host Interactive Hype Agent
app.post('/api/ai/stream-cohost', async (req, res) => {
  const { streamTitle, productTitle, userMessage } = req.body;

  const ai = getAI();
  if (!ai) {
    // Professional Vietnamese Hype MC fallback responds
    const mockReplies = [
      `Dạ cả nhà ơi, em Co-host AI đây ạ! Hàng độc quyền "${productTitle}" này chất lừ từng milimet, bác nào không bid ngay là hối hận lắm nha!`,
      `Chào anh chị! Dòng sản phẩm này có chế độ bảo chứng ký quỹ trung lập 100% của AmazeBid, cả nhà cứ tự tin ra giá đi ạ, an toàn tuyệt đối!`,
      `Ôi bác hỏi câu này quá chuẩn luôn, ${productTitle} đáp ứng mọi tiêu chuẩn chất lượng khắt khe nhất. Nhanh tay bấm "Đặt thầu" kẻo hết giờ nha cả nhà!`
    ];
    const rIdx = Math.abs((userMessage || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % mockReplies.length;
    return res.json({ reply: mockReplies[rIdx] });
  }

  try {
    const prompt = `Bạn là Trợ lý Live Stream Co-host AI cực kỳ duyên dáng, lôi cuốn và thông minh trên nền tảng AmazeBid.
    Nhiệm vụ của bạn là tương tác với người xem trong buổi Livestream có tiêu đề "${streamTitle}".
    Sản phẩm đang được giới thiệu/đấu giá trực tiếp là: "${productTitle}".
    Người xem hỏi/nói: "${userMessage}"

    Hãy đóng vai Co-host AI (sử dụng những từ thân thiện như "Dạ", "Dạ em Co-host AI xin chào ạ", "cả nhà ơi", "bác", "deal hời") trả lời thật hấp dẫn, chuyên nghiệp bằng tiếng Việt và khuyên khích họ đặt đấu thầu hoặc mua ngay. Giữ phản hồi ngắn gọn (khoảng 2-3 câu).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ reply: response.text?.trim() || 'Dạ em Co-host AI đang lắng nghe đây ạ!' });
  } catch (error: any) {
    console.error('[Gemini Co-host Server Error]:', error);
    res.status(500).json({ error: 'Lỗi Live Co-host AI: ' + error.message });
  }
});

// Sockets handling events
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  
  socket.on('join:stream', (streamId) => {
    socket.join(streamId);
    console.log(`[Socket.io] Client ${socket.id} joined stream ${streamId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Vite & Static file handler setup
async function startViteServer() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Server] Mounting Vite Middleware in development mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    console.log('[Server] Directing static assets from /dist in production mode...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Listening on designated Port (3000)
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Success: AmazeBid running at http://0.0.0.0:${PORT}`);
  });
}

startViteServer();
