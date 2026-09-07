const fs = require('fs');
let code = fs.readFileSync('src/app/agent/page.tsx', 'utf8');

// Update lots table to show dispatch requests
const oldActions = `                          {lot.status === 'AUCTIONED' && (
                            <span className="text-gray-400">Sold</span>
                          )}`;
const newActions = `                          {lot.status === 'AUCTIONED' && lot.dispatch_status !== 'READY' && (
                            <span className="text-gray-400">Sold</span>
                          )}
                          {lot.status === 'AUCTIONED' && lot.dispatch_status === 'READY' && (
                            <button onClick={() => updateLotStatus(lot.id, 'DISPATCHED')} className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded">
                              Approve Dispatch
                            </button>
                          )}
                          {lot.status === 'DISPATCHED' && (
                            <span className="text-blue-600 font-bold">Dispatched 🚚</span>
                          )}`;

code = code.replace(oldActions, newActions);

// Also need to fetch dispatch_status
code = code.replace(
  /\.select\("*, users!lots_farmer_id_fkey\(name, phone_number\)"\)/,
  `.select("*, users!lots_farmer_id_fkey(name, phone_number), dispatch_status")`
);

// We should also make sure the Status badge in the table shows DISPATCHED correctly
const oldStatusBadge = `<span className={\`px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${
                            lot.status === 'ARRIVED' ? 'bg-yellow-100 text-yellow-800' :
                            lot.status === 'WEIGHED' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }\`}>`;
const newStatusBadge = `<span className={\`px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${
                            lot.status === 'ARRIVED' ? 'bg-yellow-100 text-yellow-800' :
                            lot.status === 'WEIGHED' ? 'bg-blue-100 text-blue-800' :
                            lot.status === 'DISPATCHED' ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                          }\`}>`;

code = code.replace(oldStatusBadge, newStatusBadge);

fs.writeFileSync('src/app/agent/page.tsx', code);
