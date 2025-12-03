/**
 * Unified Category
 * Each category can contain multiple content items
 */
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  display_order: number
  created_at: string
  updated_at: string
}

/**
 * Unified Content Item
 * Replaces Page, NewsItem, Service, Product, Highlight
 * A single content item that can represent any type of content within a category
 */
export interface Content {
  id: string
  category_id: string
  title: string
  slug: string
  description?: string
  content?: string
  image_url?: string
  is_published: boolean
  display_order: number
  created_at: string
  updated_at: string
}
