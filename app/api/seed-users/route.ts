import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const DEFAULT_USERS = [
  {
    email: "admin@2notefirerecord.com",
    password: "admin123",
    full_name: "Admin User",
    role: "admin",
    department: "management",
  },
  {
    email: "finance@2notefirerecord.com",
    password: "finance123",
    full_name: "Finance Manager",
    role: "user",
    department: "finance",
  },
  {
    email: "ar@2notefirerecord.com",
    password: "ar123",
    full_name: "A&R Manager",
    role: "user",
    department: "ar",
  },
  {
    email: "artist@2notefirerecord.com",
    password: "artist123",
    full_name: "Demo Artist",
    role: "artist",
    department: null,
  },
]

export async function POST() {
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

  const results: { email: string; status: string; error?: string }[] = []

  try {
    for (const userData of DEFAULT_USERS) {
      try {
        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const userExists = existingUsers?.users?.some(
          (user) => user.email === userData.email
        )

        if (userExists) {
          results.push({ email: userData.email, status: "exists" })
          continue
        }

        // Create user with email confirmed (no email verification required)
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            full_name: userData.full_name,
            role: userData.role,
          },
        })

        if (error) {
          results.push({ email: userData.email, status: "error", error: error.message })
          continue
        }

        // Create profile
        if (data.user) {
          await supabaseAdmin.from("profiles").upsert({
            id: data.user.id,
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role,
            department: userData.department,
          })
        }

        results.push({ email: userData.email, status: "created" })
      } catch (err) {
        results.push({ 
          email: userData.email, 
          status: "error", 
          error: err instanceof Error ? err.message : "Unknown error" 
        })
      }
    }

    return NextResponse.json({ 
      message: "User seeding complete", 
      results 
    }, { status: 200 })
  } catch (err) {
    console.error("Seed users error:", err)
    return NextResponse.json(
      { error: "Failed to seed users" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Use POST to seed users" },
    { status: 405 }
  )
}
