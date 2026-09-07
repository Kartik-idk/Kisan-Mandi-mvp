const fs = require('fs');
let code = fs.readFileSync('src/app/merchant/page.tsx', 'utf8');

// Also fetch lot.status
code = code.replace(
  /lot:lot_id\(crop_type, weight_kg, quality_grade, dispatch_status\)/,
  `lot:lot_id(crop_type, weight_kg, quality_grade, dispatch_status, status)`
);

// Update Merchant UI
const oldDispatchUI = `{tx.lot?.dispatch_status === 'READY' ? (
                            <span className="text-yellow-600 font-medium">Pending Dispatch</span>
                          ) : (
                            <button onClick={() => handleRequestDispatch(tx.lot_id)} className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded">
                              Request Dispatch
                            </button>
                          )}`;

const newDispatchUI = `{tx.lot?.status === 'DISPATCHED' ? (
                            <span className="text-green-600 font-bold">Dispatched 🚚</span>
                          ) : tx.lot?.dispatch_status === 'READY' ? (
                            <span className="text-yellow-600 font-medium">Pending Dispatch</span>
                          ) : (
                            <button onClick={() => handleRequestDispatch(tx.lot_id)} className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded">
                              Request Dispatch
                            </button>
                          )}`;

code = code.replace(oldDispatchUI, newDispatchUI);

fs.writeFileSync('src/app/merchant/page.tsx', code);
