const fs = require('fs');

const files = [
  {
    path: 'src/app/agent/page.tsx',
    find: `const agentUser = usersData.find(u => u.id === userId);\n      setAgent(agentUser);`,
    replace: `const agentUser = usersData.find(u => u.id === userId);\n      if (!agentUser) {\n        localStorage.removeItem("mandi_user_id");\n        window.location.href = "/";\n        return;\n      }\n      setAgent(agentUser);`
  },
  {
    path: 'src/app/merchant/page.tsx',
    find: `if (usersData && usersData.length > 0) {\n      setMerchant(usersData[0]);\n    }`,
    replace: `if (usersData && usersData.length > 0) {\n      setMerchant(usersData[0]);\n    } else {\n      localStorage.removeItem("mandi_user_id");\n      window.location.href = "/";\n      return;\n    }`
  }
];

files.forEach(f => {
  let code = fs.readFileSync(f.path, 'utf8');
  if (code.includes(f.find)) {
    code = code.replace(f.find, f.replace);
    fs.writeFileSync(f.path, code);
    console.log(`Patched ${f.path}`);
  } else {
    console.log(`Failed to patch ${f.path}`);
  }
});
