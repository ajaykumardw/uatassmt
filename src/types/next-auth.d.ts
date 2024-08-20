// import 'next-auth'

import type { DefaultSession } from 'next-auth';


declare module 'next-auth' {
  interface User{
    id?: string | null;
    user_type?: string | null;
    company_name?: string | null;
    email?: string | null;
    avatar?: string | null;
    is_master?: boolean;
    master_id?: string | null;
    agency_id?: string | null;
    role_id?: string | null;
  }
  interface Session{
    user: {
      id?: string | null;
      is_master?: boolean;
      agency_id?: string | null;
      user_type?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role_id?: string | null;
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string | null;
    is_master?: boolean;
    agency_id?: string | null;
    user_type?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role_id?: string | null;
  }
}
