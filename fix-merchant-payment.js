const fs = require('fs');
let code = fs.readFileSync('src/app/merchant/page.tsx', 'utf8');

// Add handlePayment function
const handlePaymentFn = `
  const handlePayment = async (txId: string) => {
    const confirm = window.confirm("Confirm payment for this lot?");
    if (!confirm) return;
    
    const { error } = await supabase.from('transactions').update({ payment_status: 'CLEARED' }).eq('id', txId);
    if (!error) {
      setToast({ msg: "Payment successful!", type: "success" });
      fetchData(false);
    } else {
      setToast({ msg: "Payment failed", type: "error" });
    }
  };
`;

code = code.replace(/const handleRequestDispatch/, handlePaymentFn + '\n  const handleRequestDispatch');

// Update UI to include Pay Now button
const oldActions = `{dispatchStatus === "PENDING" && (`;
const newActions = `{tx.payment_status === "PENDING" ? (
                                <button
                                  onClick={() => handlePayment(tx.id)}
                                  className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition font-medium mr-2"
                                >
                                  Pay Now
                                </button>
                              ) : (
                                <span className="text-xs text-green-600 font-medium mr-3">✓ Paid</span>
                              )}
                              {dispatchStatus === "PENDING" && (`

code = code.replace(oldActions, newActions);

fs.writeFileSync('src/app/merchant/page.tsx', code);
