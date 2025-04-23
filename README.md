# Supabase RBAC & RLS Demo

This project demonstrates how to implement **Role-Based Access Control (RBAC)** using **Supabase** with **PostgreSQL Row Level Security (RLS)**, and how to enforce admin-only access in a Next.js frontend.

---

## How It Works

- **Supabase Auth** handles user sign-up and login, storing users in the internal, read-only `auth.users` table.
- A custom `public.users` table is created to store user roles (e.g., `user`, `admin`).
- An **AFTER INSERT trigger** on `auth.users` runs a function that syncs new users into `public.users`, copying their ID, email, and role (defaulting to `user` unless specified).
- **Row Level Security (RLS)** is enabled on `public.users`:
  - **INSERT policy:** Allows inserting a row only if the `id` matches the authenticated user.
  - **SELECT/UPDATE policies:** Allow users to access only their own row, except for admins, who can access all rows.
- The **Next.js frontend** uses Supabase Auth for authentication.
  - By default, users are assigned the `user` role.
  - A custom admin sign-up form can assign the `admin` role at registration.
  - The `/protected` route checks the logged-in user's role from `public.users` and only allows access if the role is `admin`.

---

## Key Concepts

- **RBAC:** Assigns permissions based on user roles (e.g., user, admin).
- **RLS:** PostgreSQL feature that restricts which rows a user can access, based on policies.
- **Supabase Auth:** Handles authentication and provides user context to RLS policies via JWT.

---

## Quick Start

1. **Set up Supabase:**

   - Create a `public.users` table with columns: `id` (uuid, PK), `email` (text), `role` (text, default `'user'`).
   - Add an AFTER INSERT trigger on `auth.users` to sync new users into `public.users`.
   - Enable RLS and add appropriate policies for INSERT, SELECT, and UPDATE.

2. **Set up Next.js:**
   - Use Supabase Auth for sign-up and login.
   - Use a custom sign-up form to assign the `admin` role if needed.
   - Protect the `/protected` route by checking the user's role from `public.users`.

---

## Why This Approach?

- **Supabase Auth** is secure and easy, but its user table is read-only.
- **Custom user table** lets you manage roles and other profile data.
- **RLS policies** ensure that only authorized users can access or modify data, directly in the database.
- **RBAC** is enforced both in the database (via RLS) and in the frontend (route protection).

---

## Example RLS Policy (for SELECT)

```sql
-- Allow users to read their own row, or admins to read all
CREATE POLICY "Users can read their own row or admins can read all"
ON public.users
FOR SELECT
USING (
  id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);
```

---

## Summary

This project shows how to combine Supabase Auth, a custom user table, PostgreSQL RLS, and Next.js to build a secure, role-based access system with admin-only routes.
