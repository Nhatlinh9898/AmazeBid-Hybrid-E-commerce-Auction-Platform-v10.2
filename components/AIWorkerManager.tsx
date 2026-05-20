import React from 'react';
import { edgeAI } from '../services/edgeAIService';
import { p2p } from '../services/p2pService';
import { Cpu, Zap } from 'lucide-react';
import { InfrastructureLogic } from '../services/dataProcessingService';

/**
 * COMPONENT: AIWorkerManager
 * Quản lý việc đóng góp tài nguyên CPU/GPU của người dùng.
 */
export const AIWorkerManager: React.FC<{ isOpen?: boolean }> = ({ isOpen: externalOpen }) => {
  const [caps, setCaps] = React.useState<any>(null);
  const [isContributing, setIsContributing] = React.useState(false);
  const [tasksProcessed, setTasksProcessed] = React.useState(0);
  const [bandwidthSaved, setBandwidthSaved] = React.useState(0); // GB
  const [isHovered, setIsHovered] = React.useState(false);

  const isOpen = externalOpen !== undefined ? externalOpen : isHovered;

  React.useEffect(() => {
    const init = async () => {
      const capabilities = await edgeAI.getCapabilities();
      setCaps(capabilities);

      // Tự động tham gia mạng lưới nếu thiết bị mạnh (Tier HIGH hoặc MEDIUM)
      if (capabilities.tier !== 'LOW') {
        setIsContributing(true);
        
        // Bắt đầu lắng nghe và xử lý tác vụ từ Mesh
        p2p.startListeningForTasks(capabilities, async (task) => {
          console.log('Processing task from Mesh:', task.id);
          const result = await edgeAI.rewrite(task.text, task.instruction);
          setTasksProcessed(prev => prev + 1);
          setBandwidthSaved(prev => prev + (Math.random() * 0.1)); // Giả lập băng thông tiết kiệm
          return result || '';
        });
      }
    };

    init();
  }, []);

  if (!caps) return null;

  const potentialReward = InfrastructureLogic.calculateNodeReward(bandwidthSaved, 99.9, 45);

  return (
    <div 
      className={`fixed transition-all duration-500 left-6 z-[10001] ${isOpen ? 'bottom-14' : 'bottom-[-200px]'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`bg-black/90 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl transition-all duration-500 overflow-hidden flex flex-col-reverse p-5 ${
        isOpen ? 'w-72 max-h-[350px]' : 'w-[68px] max-h-[68px]'
      }`}>
        
        {/* Header / Icon */}
        <div className="flex items-center gap-3 w-full shrink-0">
          <div className={`p-2.5 rounded-2xl shrink-0 transition-colors ${isContributing ? 'bg-indigo-500 text-white' : 'bg-zinc-700 text-zinc-400'}`}>
            <Cpu size={20} />
          </div>
          <div className={`transition-opacity duration-500 whitespace-nowrap ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            <h4 className="text-sm font-black text-white">AI Node Status</h4>
            <div className="flex items-center gap-1.5">
               <div className={`w-1.5 h-1.5 rounded-full ${isContributing ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
               <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                {isContributing ? `${caps.tier} Tier Worker` : 'Observer Mode'}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className={`transition-opacity duration-500 w-full mb-4 shrink-0 space-y-4 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          {isContributing && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                   <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">Tasks</p>
                   <p className="text-sm font-black text-white">{tasksProcessed}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                   <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">Rewards</p>
                   <p className="text-sm font-black text-amber-400">${potentialReward}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-zinc-500">Resource</span>
                  <span className="text-zinc-300">{caps.hasWebGPU ? 'WebGPU (Local AI)' : 'WASM (Standard)'}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-zinc-500">Savings Contribution</span>
                  <span className="text-emerald-400">+{bandwidthSaved.toFixed(2)} GB</span>
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[10px] text-emerald-500 font-black italic">
                  <Zap size={12} className="fill-emerald-500" />
                  <span>Cung cấp tài nguyên cho Mesh...</span>
                </div>
              </div>
            </>
          )}

          {!isContributing && caps.tier === 'LOW' && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
               <p className="text-[10px] text-amber-200/70 font-medium leading-relaxed italic">
                Cấu hình thiết bị của bạn đang ở mức tiết kiệm. Các tác vụ AI sẽ được xử lý bởi các nút mạng mạnh hơn gần bạn.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
