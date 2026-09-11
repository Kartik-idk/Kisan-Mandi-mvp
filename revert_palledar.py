with open("src/app/palledar/page.tsx", "r") as f:
    content = f.read()

old_logic = """    const updatePayload: any = { status: newStatus };
    if (newStatus === "COMPLETED") {
      updatePayload.completed_at = new Date().toISOString();
    }
    const { error } = await supabase.from("work_tasks").update(updatePayload).eq("id", taskId);"""

new_logic = """    const updatePayload: any = { status: newStatus };
    const { error } = await supabase.from("work_tasks").update(updatePayload).eq("id", taskId);"""

content = content.replace(old_logic, new_logic)

with open("src/app/palledar/page.tsx", "w") as f:
    f.write(content)
