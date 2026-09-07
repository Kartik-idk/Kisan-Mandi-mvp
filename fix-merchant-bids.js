const fs = require('fs');
let code = fs.readFileSync('src/app/merchant/page.tsx', 'utf8');

// Modify fetchData in Merchant
code = code.replace(
  /const fetchData = async \(showLoading = true\) => \{/,
  `const fetchData = async (showLoading = true) => {\n    if (showLoading) setLoading(true);\n    // Bids fetch\n    const { data: myBidsData } = await supabase.from('bids').select('*').eq('merchant_id', localStorage.getItem('mandi_user_id'));\n    if (myBidsData) {\n      const bidded = {};\n      myBidsData.forEach(b => { bidded[b.lot_id] = true; });\n      setBiddedLots(bidded);\n    }`
);

// Modify handlePlaceBid
const oldPlaceBid = `const handlePlaceBid = (lot: any) => {
    setBiddedLots(prev => ({...prev, [lot.id]: true}));
    setToast({
      msg: \`Bid placed! Agent \$\{lot.users?.name || "the agent"\} will contact you shortly.\`,
      type: "success"
    });
  };`;

const newPlaceBid = `const handlePlaceBid = async (lot: any) => {
    const amountStr = window.prompt(\`Enter your bid (price per quintal) for \$\{lot.crop_type\}:\`);
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setToast({ msg: "Invalid bid amount", type: "error" });
      return;
    }
    
    setBiddedLots(prev => ({...prev, [lot.id]: true}));
    
    // Insert into bids table (will fail silently if they didn't run the SQL yet)
    const { error } = await supabase.from('bids').insert({
      lot_id: lot.id,
      merchant_id: merchant.id,
      amount: amount,
      status: 'PENDING'
    });
    
    if (error) {
      console.warn("Bids table might not exist yet", error);
      setToast({
        msg: \`Simulated Bid Placed! (Create 'bids' table for real bidding)\`,
        type: "success"
      });
    } else {
      setToast({
        msg: \`Bid of ₹\$\{amount\} placed successfully!\`,
        type: "success"
      });
    }
  };`;

code = code.replace(oldPlaceBid, newPlaceBid);

fs.writeFileSync('src/app/merchant/page.tsx', code);
