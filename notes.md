# NOTES

## **Supabase RBAC & RLS Notes**

**(Based on Supabase Official Documentation Concepts)**

### **1. What is RBAC in Supabase?**

- **Role-Based Access Control (RBAC):** A security model where access permissions are assigned based on _roles_ (e.g., `admin`, `editor`, `viewer`) rather than directly to individual users.
- **Supabase Implementation:** Supabase doesn't have a separate "RBAC system." Instead, it achieves RBAC by leveraging **PostgreSQL's built-in Row Level Security (RLS)** feature. You define access rules (policies) based on user attributes, which often include their role.

### **2. What is Row Level Security (RLS)?**

- **RLS:** A powerful PostgreSQL feature that allows database administrators to control which _rows_ in a table a user is allowed to access or modify (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
- **Policy-Based:** RLS works by creating _policies_ on tables. These policies are SQL expressions that evaluate to `true` or `false` for each row.
- **Default Deny:** When RLS is enabled on a table, access is denied by default. You must explicitly create policies to grant access.
- **Supabase & RLS:** Supabase makes RLS easy to use by integrating it seamlessly with its authentication system.

  _Reference: [Supabase Docs - Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)_

### **3. How Supabase Integrates Auth with RLS**

- **Authentication:** Supabase Auth handles user sign-up, login, and session management. When a user authenticates, Supabase issues a **JWT (JSON Web Token)**.
- **User Identity in Postgres:** For every request made using the user's JWT, Supabase makes the user's identity available _within_ the PostgreSQL transaction. This is accessible via helper functions in your SQL policies:

  - `auth.uid()`: Returns the UUID of the currently authenticated user. **This is the most common function used in RLS policies.**
  - `auth.role()`: Returns the _PostgreSQL_ role of the user (e.g., `authenticated`, `anon`). **Caution:** This is usually _not_ your application-specific role like 'admin' unless specifically configured.
  - `auth.jwt()`: Returns the entire JWT payload as a JSON object. Useful for accessing custom claims.

  _Reference: [Supabase Docs - Auth Helpers](https://supabase.com/docs/guides/auth/row-level-security#auth-helpers)_

### **4. Configuring RLS in Supabase**

- **Enabling RLS:**
  - **UI:** In the Supabase Dashboard -> Table Editor -> Select your table -> RLS Tab -> Click "Enable RLS".
  - **SQL:** `ALTER TABLE your_table_name ENABLE ROW LEVEL SECURITY;`
- **Creating Policies:**

  - **UI:** In the RLS tab for your table, click "New Policy". You can use templates or write custom expressions.
  - **SQL:** Use the `CREATE POLICY` command.

  _Reference: [Supabase Docs - Creating Policies](https://supabase.com/docs/guides/auth/row-level-security#creating-policies)_

### **5. Anatomy of an RLS Policy**

A typical `CREATE POLICY` statement includes:

- `CREATE POLICY policy_name`: A descriptive name.
- `ON table_name`: The table the policy applies to.
- `FOR command`: The SQL command (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `ALL`).
- `TO role_name`: Which PostgreSQL role(s) this policy applies to (often `authenticated`).
- `USING (expression)`:
  - Applies to `SELECT`, `UPDATE`, `DELETE`.
  - Rows for which this expression returns `true` are visible or can be acted upon.
  - Example: `USING (user_id = auth.uid())` - Only allow access to rows where the `user_id` column matches the logged-in user.
- `WITH CHECK (expression)`:
  - Applies to `INSERT`, `UPDATE`.
  - Rows being inserted or updated _must_ satisfy this expression for the command to succeed.
  - Example: `WITH CHECK (user_id = auth.uid())` - Only allow inserting/updating rows where the `user_id` column matches the logged-in user.

### **6. Implementing RBAC Logic with RLS Policies**

This is where you combine RLS with your application's roles.

- **Common Pattern: User Accessing Own Data**

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

- **Handling Roles (e.g., 'admin'):**
  - **Method 1: Database Lookup (Recommended for App Roles)**
    1.  Create a `users` or `profiles` table linked to `auth.users` with a `role` column (`admin`, `user`, etc.).
    2.  Write policies that query this table using `EXISTS`:
        `sql
-- Allow admins to select all posts
CREATE POLICY "Allow admin select access"
  ON posts FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ));
`
        _Reference: Implicit in examples across Supabase docs and common practice._
  - **Method 2: JWT Custom Claims**
    1.  Configure Supabase (e.g., via Edge Functions or DB Functions) to add a custom claim like `app_metadata: { role: 'admin' }` to the JWT upon signup or role change.
    2.  Write policies that check this claim:
        `sql
CREATE POLICY "Allow admin access via JWT"
  ON posts FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
`
        _Reference: Mentioned conceptually, requires understanding JWTs and potentially Edge Functions._

### **7. Key Takeaways**

- Supabase RBAC = PostgreSQL RLS + Supabase Auth integration.
- RLS controls row-level access via policies (`USING`, `WITH CHECK`).
- Enable RLS on tables where you need fine-grained access control.
- Use `auth.uid()` extensively in policies to link rows to users.
- Implement application roles (`admin`, etc.) by either querying a user profile table within policies or checking custom JWT claims.
- Start with simple policies (user accessing own data) and add complexity (roles) as needed.

---

_This summary is based on the principles and examples found throughout the Supabase Authentication and Database documentation._
