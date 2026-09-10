import React from 'react';

export default function LotTimeline({ status, dispatchStatus, paymentStatus }: { status: string, dispatchStatus?: string | null, paymentStatus?: string | null }) {
  const getAuctionedLabel = () => {
    if (paymentStatus === 'PENDING') return 'Auctioned (Pending Payment)';
    if (paymentStatus === 'CLEARED' || paymentStatus === 'PAID' || paymentStatus === 'SETTLED') return 'Auctioned & Settled';
    return 'Auctioned';
  };

  const STAGES = [
    { id: 'ARRIVED', label: 'Arrived' },
    { id: 'WEIGHED', label: 'Weighed & Assessed' },
    { id: 'AUCTIONED', label: getAuctionedLabel() },
    { id: 'DISPATCHED', label: 'Dispatched' }
  ];

  // Determine current index based on status mapping
  let currentIndex = 0;
  if (status === 'WEIGHED') currentIndex = 1;
  else if (status === 'AUCTIONED') {
    currentIndex = dispatchStatus === 'DISPATCHED' ? 3 : 2;
  }
  else if (status === 'DISPATCHED') currentIndex = 3;

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Background tracking line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full" />
        
        {/* Active tracking line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 rounded-full transition-all duration-500" 
          style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
        />

        {STAGES.map((stage, i) => {
          const isActive = i === currentIndex;
          const isCompleted = i < currentIndex;
          
          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center gap-1 group">
              <div className={`w-4 h-4 rounded-full border-2 transition-colors duration-300 ${
                isCompleted ? 'bg-green-500 border-green-500' : 
                isActive ? 'bg-white border-green-500 ring-4 ring-green-100' : 
                'bg-white border-gray-300'
              }`} />
              <span className={`text-[10px] sm:text-xs absolute -bottom-5 whitespace-nowrap font-medium ${
                isCompleted || isActive ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
