with open("src/app/page.tsx", "r") as f:
    content = f.read()

old_jsx = """        </div>
      </div>
    </div>"""

new_jsx = """        </div>
      </div>
      
      {/* Subtle Team Name Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
        <span className="text-white/60 text-xs tracking-wider font-medium backdrop-blur-sm px-4 py-1.5 rounded-full bg-black/20">
          Built by Team TechMinds
        </span>
      </div>
    </div>"""

content = content.replace(old_jsx, new_jsx)

with open("src/app/page.tsx", "w") as f:
    f.write(content)
