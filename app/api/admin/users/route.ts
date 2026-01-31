import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Helper to verify admin status
async function verifyAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: "Unauthorized", status: 401 }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { error: "Forbidden - Admin access required", status: 403 }
  }

  return { user, profile }
}

// GET - List all users (admin only)
export async function GET() {
  const authResult = await verifyAdmin()
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const supabase = await createServerClient()
  
  const { data: users, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ users })
}

// POST - Create new user (admin only)
export async function POST(request: Request) {
  const authResult = await verifyAdmin()
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const body = await request.json()
  const { email, password, full_name, role, department } = body

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
  }

  // Use service role key for admin operations
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users?.some((u) => u.email === email)

    if (userExists) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
    }

    // Create auth user with email confirmed
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Create profile record
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: authData.user.id,
      email,
      full_name: full_name || null,
      role: role || "user",
      department: department || null,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      // Rollback: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
    }

    // Fetch the created profile to return
    const { data: newProfile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single()

    return NextResponse.json({ 
      message: "User created successfully",
      user: newProfile 
    }, { status: 201 })

  } catch (err) {
    console.error("Create user error:", err)
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : "Failed to create user" 
    }, { status: 500 })
  }
}

// PATCH - Update user (admin only)
export async function PATCH(request: Request) {
  const authResult = await verifyAdmin()
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const body = await request.json()
  const { id, full_name, role, department, status } = body

  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  try {
    // Update profile
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (full_name !== undefined) updateData.full_name = full_name
    if (role !== undefined) updateData.role = role
    if (department !== undefined) updateData.department = department
    if (status !== undefined) updateData.status = status

    const { error: profileError, data: updatedProfile } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // If status is being set to inactive, we can optionally ban the user in auth
    if (status === "inactive") {
      // Ban user to prevent login
      await supabaseAdmin.auth.admin.updateUserById(id, {
        ban_duration: "876000h", // ~100 years (effectively permanent)
      })
    } else if (status === "active") {
      // Unban user
      await supabaseAdmin.auth.admin.updateUserById(id, {
        ban_duration: "none",
      })
    }

    // Update user metadata in auth
    if (full_name !== undefined || role !== undefined) {
      await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: {
          full_name,
          role,
        },
      })
    }

    return NextResponse.json({ 
      message: "User updated successfully",
      user: updatedProfile 
    })

  } catch (err) {
    console.error("Update user error:", err)
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : "Failed to update user" 
    }, { status: 500 })
  }
}

// DELETE - Deactivate user (admin only) - soft delete
export async function DELETE(request: Request) {
  const authResult = await verifyAdmin()
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("id")

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }

  // Prevent self-deactivation
  if (userId === authResult.user.id) {
    return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  try {
    // Soft delete: set status to inactive instead of deleting
    const { error: profileError, data: updatedProfile } = await supabaseAdmin
      .from("profiles")
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Ban user in auth to prevent login
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: "876000h",
    })

    return NextResponse.json({ 
      message: "User deactivated successfully",
      user: updatedProfile 
    })

  } catch (err) {
    console.error("Deactivate user error:", err)
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : "Failed to deactivate user" 
    }, { status: 500 })
  }
}
