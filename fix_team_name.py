with open("src/app/page.tsx", "r") as f:
    content = f.read()

old_jsx = """      {/* Subtle Team Name Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
        <span className="text-white/60 text-xs tracking-wider font-medium backdrop-blur-sm px-4 py-1.5 rounded-full bg-black/20">
          Built by Team TechMinds
        </span>
      </div>"""

new_jsx = """      {/* Subtle Team Name Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
        <span className="text-slate-400 text-xs tracking-wide font-medium">
          Built by Team TechMinds
        </span>
      </div>"""

content = content.replace(old_jsx, new_jsx)

# Also ensure the parent container is relative
content = content.replace(
    '<div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">',
    '<div className="min-h-screen relative bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">'
)

with open("src/app/page.tsx", "w") as f:
    f.write(content)
