with open("src/app/merchant/page.tsx", "r") as f:
    content = f.read()

old_logic = """const dispatchStatus =
                          lot?.dispatch_status || "PENDING";"""

new_logic = """const dispatchStatus =
                          lot?.status === "DISPATCHED" ? "DISPATCHED" : (lot?.dispatch_status || "PENDING");"""

content = content.replace(old_logic, new_logic)

with open("src/app/merchant/page.tsx", "w") as f:
    f.write(content)
