"use server"

import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
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
    // Check if admin already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const adminExists = existingUsers?.users?.some(
      (user) => user.email === "admin@2notefirerecord.com"
    )

    if (adminExists) {
      return NextResponse.json(
        { message: "Admin user already exists" },
        { status: 200 }
      )
    }

    // Create admin user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: "admin@2notefirerecord.com",
      password: "admin123",
      email_confirm: true,
      user_metadata: {
        full_name: "Admin User",
        role: "admin",
      },
    })

    if (error) {
      console.error("Error creating admin:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update profile to set admin role
    if (data.user) {
      await supabaseAdmin.from("profiles").upsert({
        id: data.user.id,
        email: "admin@2notefirerecord.com",
        full_name: "Admin User",
        role: "admin",
        department: "management",
      })
    }

    return NextResponse.json(
      { message: "Admin user created successfully", user: data.user },
      { status: 201 }
    )
  } catch (err) {
    console.error("Seed admin error:", err)
    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Use POST to seed admin user" },
    { status: 405 }
  )
}
