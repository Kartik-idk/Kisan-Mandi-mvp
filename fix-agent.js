const fs = require('fs');
let code = fs.readFileSync('src/app/agent/page.tsx', 'utf8');

// Add markTaskPaid function
const funcCode = `
  const markTaskPaid = async (taskId: string) => {
    const { error } = await supabase.from("work_tasks").update({ payment_status: 'PAID' }).eq("id", taskId);
    if (!error) fetchData(false);
  };
`;

code = code.replace(/if \(loading\) \{/, `${funcCode}\n  if (loading) {`);

// Add Palledar Payments UI
const uiCode = `
        </div>
        
        {/* Palledar Tasks Section */}
        <div className="lg:col-span-3 mt-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-indigo-500" />
              Palledar Payments
            </h2>
            
            {tasks.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No palledar tasks assigned yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Palledar</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{task.users?.name || "Unknown"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{task.task_type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={\`px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${
                            task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }\`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">₹{task.payment_amount}</div>
                          <div className={\`text-xs \${task.payment_status === 'PAID' ? 'text-green-600' : 'text-red-500'}\`}>
                            {task.payment_status}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {task.status === 'COMPLETED' && task.payment_status === 'UNPAID' && (
                            <button onClick={() => markTaskPaid(task.id)} className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 px-3 py-1 rounded">
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
`;

code = code.replace(/<\/div>\n      <\/main>/, `${uiCode}\n      </div>\n      </main>`);

fs.writeFileSync('src/app/agent/page.tsx', code);
