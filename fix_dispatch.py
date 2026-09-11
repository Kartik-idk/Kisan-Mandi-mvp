with open("src/app/agent/page.tsx", "r") as f:
    content = f.read()

old_logic = """  const updateLotStatus = async (lotId: string, newStatus: string) => {
    const { error } = await supabase
      .from("lots")
      .update({ status: newStatus })
      .eq("id", lotId);"""

new_logic = """  const updateLotStatus = async (lotId: string, newStatus: string) => {
    const updatePayload: any = { status: newStatus };
    if (newStatus === "DISPATCHED") {
      updatePayload.dispatch_status = "DISPATCHED";
    }
    const { error } = await supabase
      .from("lots")
      .update(updatePayload)
      .eq("id", lotId);"""

content = content.replace(old_logic, new_logic)

with open("src/app/agent/page.tsx", "w") as f:
    f.write(content)
