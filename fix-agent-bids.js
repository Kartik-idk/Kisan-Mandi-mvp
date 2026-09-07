const fs = require('fs');
let code = fs.readFileSync('src/app/agent/page.tsx', 'utf8');

// Add bids state
code = code.replace(
  /const \[tasks, setTasks\] = useState<any\[\]>\(\[\]\);/,
  `const [tasks, setTasks] = useState<any[]>([]);\n  const [bids, setBids] = useState<any[]>([]);`
);

// Fetch bids in fetchData
code = code.replace(
  /if \(showLoading\) setLoading\(false\);\n  \};\n\n  const handleAddLot/,
  `  // Fetch bids for active lots (fails silently if table doesn't exist)
    const { data: bidsData } = await supabase.from('bids').select('*, users!bids_merchant_id_fkey(name, phone_number)').eq('status', 'PENDING');
    if (bidsData) setBids(bidsData);

    if (showLoading) setLoading(false);
  };

  const handleAddLot`
);

// Modify Auction Modal to show bids
const auctionFormStart = `<form onSubmit={submitAuction} className="p-6 space-y-4">`;
const bidsUI = `
            {/* Live Bids Section */}
            {bids.filter(b => b.lot_id === auctioningLot?.id).length > 0 && (
              <div className="px-6 pt-4">
                <h4 className="text-sm font-bold text-gray-700 mb-2">Live Bids</h4>
                <div className="space-y-2 mb-4">
                  {bids.filter(b => b.lot_id === auctioningLot?.id).map(bid => (
                    <div key={bid.id} className="flex justify-between items-center bg-blue-50 p-3 rounded border border-blue-100">
                      <div>
                        <p className="text-sm font-bold text-blue-900">{bid.users?.name}</p>
                        <p className="text-xs text-blue-700">₹{bid.amount} per Qtl</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setSelectedMerchant(bid.merchant_id);
                          setPricePerQuintal(bid.amount.toString());
                        }}
                        className="bg-blue-600 text-white px-3 py-1 text-xs rounded hover:bg-blue-700"
                      >
                        Select Bid
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <form onSubmit={submitAuction} className="p-6 space-y-4 pt-0">`;

code = code.replace(auctionFormStart, bidsUI);

// After submitAuction finishes, mark bids as resolved (ACCEPTED/REJECTED)
code = code.replace(
  /setAuctioningLot\(null\);\n      fetchData\(\);\n    \} else \{/,
  `// Resolve Bids
      await supabase.from('bids').update({ status: 'REJECTED' }).eq('lot_id', auctioningLot.id).eq('status', 'PENDING');
      if (selectedMerchant) {
        await supabase.from('bids').update({ status: 'ACCEPTED' }).eq('lot_id', auctioningLot.id).eq('merchant_id', selectedMerchant);
      }
      setAuctioningLot(null);
      fetchData(false);
    } else {`
);

fs.writeFileSync('src/app/agent/page.tsx', code);
