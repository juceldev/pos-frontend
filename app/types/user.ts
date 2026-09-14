export interface User {
  id: number
  name: string
  username: string
  email: string
  role: string
  roles?: string[]
  created_at: string
  updated_at: string
}
