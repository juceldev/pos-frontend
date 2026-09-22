export interface DatabaseBackup {
  id: number
  filename: string
  size_bytes: number
  user: { id: number; name: string } | null
  created_at: string
}

export interface PaginatedBackups {
  data: DatabaseBackup[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
