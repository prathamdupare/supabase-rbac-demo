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

--- 
--- 
# NOTES 


## **Supabase RBAC & RLS Notes**

**(Based on Supabase Official Documentation Concepts)**

### **1. What is RBAC in Supabase?**

*   **Role-Based Access Control (RBAC):** A security model where access permissions are assigned based on *roles* (e.g., `admin`, `editor`, `viewer`) rather than directly to individual users.
*   **Supabase Implementation:** Supabase doesn't have a separate "RBAC system." Instead, it achieves RBAC by leveraging **PostgreSQL's built-in Row Level Security (RLS)** feature. You define access rules (policies) based on user attributes, which often include their role.

### **2. What is Row Level Security (RLS)?**

*   **RLS:** A powerful PostgreSQL feature that allows database administrators to control which *rows* in a table a user is allowed to access or modify (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
*   **Policy-Based:** RLS works by creating *policies* on tables. These policies are SQL expressions that evaluate to `true` or `false` for each row.
*   **Default Deny:** When RLS is enabled on a table, access is denied by default. You must explicitly create policies to grant access.
*   **Supabase & RLS:** Supabase makes RLS easy to use by integrating it seamlessly with its authentication system.

    *Reference: [Supabase Docs - Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)*

### **3. How Supabase Integrates Auth with RLS**

*   **Authentication:** Supabase Auth handles user sign-up, login, and session management. When a user authenticates, Supabase issues a **JWT (JSON Web Token)**.
*   **User Identity in Postgres:** For every request made using the user's JWT, Supabase makes the user's identity available *within* the PostgreSQL transaction. This is accessible via helper functions in your SQL policies:
    *   `auth.uid()`: Returns the UUID of the currently authenticated user. **This is the most common function used in RLS policies.**
    *   `auth.role()`: Returns the *PostgreSQL* role of the user (e.g., `authenticated`, `anon`). **Caution:** This is usually *not* your application-specific role like 'admin' unless specifically configured.
    *   `auth.jwt()`: Returns the entire JWT payload as a JSON object. Useful for accessing custom claims.

    *Reference: [Supabase Docs - Auth Helpers](https://supabase.com/docs/guides/auth/row-level-security#auth-helpers)*

### **4. Configuring RLS in Supabase**

*   **Enabling RLS:**
    *   **UI:** In the Supabase Dashboard -> Table Editor -> Select your table -> RLS Tab -> Click "Enable RLS".
    *   **SQL:** `ALTER TABLE your_table_name ENABLE ROW LEVEL SECURITY;`
*   **Creating Policies:**
    *   **UI:** In the RLS tab for your table, click "New Policy". You can use templates or write custom expressions.
    *   **SQL:** Use the `CREATE POLICY` command.

    *Reference: [Supabase Docs - Creating Policies](https://supabase.com/docs/guides/auth/row-level-security#creating-policies)*

### **5. Anatomy of an RLS Policy**

A typical `CREATE POLICY` statement includes:

*   `CREATE POLICY policy_name`: A descriptive name.
*   `ON table_name`: The table the policy applies to.
*   `FOR command`: The SQL command (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `ALL`).
*   `TO role_name`: Which PostgreSQL role(s) this policy applies to (often `authenticated`).
*   `USING (expression)`:
    *   Applies to `SELECT`, `UPDATE`, `DELETE`.
    *   Rows for which this expression returns `true` are visible or can be acted upon.
    *   Example: `USING (user_id = auth.uid())` - Only allow access to rows where the `user_id` column matches the logged-in user.
*   `WITH CHECK (expression)`:
    *   Applies to `INSERT`, `UPDATE`.
    *   Rows being inserted or updated *must* satisfy this expression for the command to succeed.
    *   Example: `WITH CHECK (user_id = auth.uid())` - Only allow inserting/updating rows where the `user_id` column matches the logged-in user.

### **6. Implementing RBAC Logic with RLS Policies**

This is where you combine RLS with your application's roles.

*   **Common Pattern: User Accessing Own Data**
    ```sql
    -- Allow users to select their own posts
    CREATE POLICY "Allow individual select access"
      ON posts FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());

    -- Allow users to insert their own posts
    CREATE POLICY "Allow individual insert access"
      ON posts FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
    ```
*   **Handling Roles (e.g., 'admin'):**
    *   **Method 1: Database Lookup (Recommended for App Roles)**
        1.  Create a `users` or `profiles` table linked to `auth.users` with a `role` column (`admin`, `user`, etc.).
        2.  Write policies that query this table using `EXISTS`:
            ```sql
            -- Allow admins to select all posts
            CREATE POLICY "Allow admin select access"
              ON posts FOR SELECT
              TO authenticated
              USING (EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = auth.uid() AND u.role = 'admin'
              ));
            ```
        *Reference: Implicit in examples across Supabase docs and common practice.*
    *   **Method 2: JWT Custom Claims**
        1.  Configure Supabase (e.g., via Edge Functions or DB Functions) to add a custom claim like `app_metadata: { role: 'admin' }` to the JWT upon signup or role change.
        2.  Write policies that check this claim:
            ```sql
            CREATE POLICY "Allow admin access via JWT"
              ON posts FOR SELECT
              TO authenticated
              USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
            ```
        *Reference: Mentioned conceptually, requires understanding JWTs and potentially Edge Functions.*

### **7. Key Takeaways**

*   Supabase RBAC = PostgreSQL RLS + Supabase Auth integration.
*   RLS controls row-level access via policies (`USING`, `WITH CHECK`).
*   Enable RLS on tables where you need fine-grained access control.
*   Use `auth.uid()` extensively in policies to link rows to users.
*   Implement application roles (`admin`, etc.) by either querying a user profile table within policies or checking custom JWT claims.
*   Start with simple policies (user accessing own data) and add complexity (roles) as needed.

---

*This summary is based on the principles and examples found throughout the Supabase Authentication and Database documentation.*
