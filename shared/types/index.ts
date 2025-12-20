// Add this if it doesn't already exist
export interface Industry {
  id: string
  name: string
  subcategories?: {
    id: string
    name: string
  }[]
}
