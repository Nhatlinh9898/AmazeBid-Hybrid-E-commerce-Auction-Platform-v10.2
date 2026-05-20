import React from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, Brain, Calendar, DollarSign, Package, ShoppingBag, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { PhysicalStore } from '../types';
import { getGeminiApiKey } from '../services/aiConfig';

interface RevenueAnalyticsProps {
  store: PhysicalStore;
}

const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({ store }) => {
  const [loadingForecast, setLoadingForecast] = React.useState(false);
  const [forecast, setForecast] = React.useState<string | null>(null);
  
  // Mock revenue data for 7 days
  const data = React.useMemo(() => {
    const today = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
      
      // Random deterministic revenue based on store ID and day
      const baseValue = (store.id.length * 1000000) + (i * 200000);
      const randomFactor = Math.sin(i * 1.5) * 500000;
      const revenue = Math.max(0, baseValue + randomFactor);
      const orders = Math.floor(revenue / 50000);
      
      result.push({
        name: dateStr,
        revenue: revenue,
        orders: orders
      });
    }
    return result;
  }, [store.id]);

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const avgOrderValue = totalRevenue / data.reduce((sum, item) => sum + item.orders, 0);
  const growthRate = ((data[6].revenue - data[0].revenue) / data[0].revenue) * 100;

  const getAIForecast = React.useCallback(async () => {
    setLoadingForecast(true);
    try {
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        setForecast('Chưa cấu hình khóa Gemini (GEMINI_API_KEY hoặc API_KEY trong .env). Khởi động lại dev server sau khi thêm khóa.');
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Dưới đây là dữ liệu doanh thu và đơn hàng của cửa hàng "${store.name}" (Lĩnh vực: ${store.category}) trong 7 ngày qua:
${JSON.stringify(data, null, 2)}

Hãy đóng vai một chuyên gia phân tích dữ liệu kinh doanh. Hãy phân tích xu hướng hiện tại và đưa ra 3 dự báo hoặc lời khuyên cụ thể cho chủ cửa hàng (ví dụ: về nhập hàng, khuyến mãi, hoặc chuẩn bị nhân sự).
Yêu cầu:
- Trả lời bằng tiếng Việt.
- Định dạng súc tích, chia theo các mục rõ ràng.
- Gợi ý cụ thể dựa trên loại hình kinh doanh "${store.category}".`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = (response as { text?: string }).text?.trim() || '';
      setForecast(text || 'Không có nội dung trả về từ mô hình.');
    } catch (error) {
      console.error('Error getting AI forecast:', error);
      setForecast('Không thể lấy dự báo từ AI lúc này. Vui lòng thử lại sau.');
    } finally {
      setLoadingForecast(false);
    }
  }, [store.name, store.category, data]);

  React.useEffect(() => {
    getAIForecast();
  }, [getAIForecast]);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign size={20} />
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-black ${growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {growthRate >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(growthRate).toFixed(1)}%
            </div>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng doanh thu (7N)</p>
          <p className="text-xl font-black text-gray-900">{totalRevenue.toLocaleString()} đ</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <ShoppingBag size={20} />
            </div>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trung bình đơn</p>
          <p className="text-xl font-black text-gray-900">{avgOrderValue.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} đ</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
              <Package size={20} />
            </div>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng đơn hàng</p>
          <p className="text-xl font-black text-gray-900">{data.reduce((sum, item) => sum + item.orders, 0)}</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar size={20} />
            </div>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Doanh thu cao nhất</p>
          <p className="text-xl font-black text-gray-900">{Math.max(...data.map(d => d.revenue)).toLocaleString()} đ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Chart */}
        <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-gray-900 flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={20} />
              Biểu đồ Doanh thu tuần
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  itemStyle={{ fontWeight: 800 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#2563eb" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Forecast */}
        <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Brain size={120} />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Brain size={24} />
                </div>
                <div>
                  <h3 className="font-black text-xl">Smart Forecast</h3>
                  <p className="text-xs text-indigo-100 font-bold opacity-80 uppercase tracking-widest">Trí tuệ nhân tạo Gemini</p>
                </div>
              </div>
              <button 
                onClick={getAIForecast}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                disabled={loadingForecast}
              >
                <Loader2 className={`w-5 h-5 ${loadingForecast ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="bg-white/10 rounded-3xl p-6 backdrop-blur-md border border-white/10 min-h-[220px]">
              {loadingForecast ? (
                <div className="flex flex-col items-center justify-center h-full py-12 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                  <p className="text-sm font-bold text-indigo-50">Đang phân tích dữ liệu bán hàng...</p>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  {forecast ? (
                    <div className="whitespace-pre-wrap leading-relaxed text-indigo-50 font-medium">
                      {forecast}
                    </div>
                  ) : (
                    <p className="text-white/60 italic">Nhấn vào nút làm mới để nhận dự báo từ AI...</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-indigo-200">
              <AlertCircle size={14} />
              <p className="text-[10px] font-bold italic">Dự báo dựa trên mô hình học máy, mang tính chất tham khảo.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalytics;
