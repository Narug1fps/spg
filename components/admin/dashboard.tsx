"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { getSupabaseClient } from '@/lib/supabase/client'
import { fetchWithAuth } from '@/lib/utils/fetch'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { LogOut, Plus, Trash2, Edit2, Upload, Home } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  display_order: number
  created_at: string
  updated_at: string
}

interface Content {
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

interface SliderImage {
  id: string
  image_url: string
  display_order: number
}

interface AdminDashboardProps {
  onLogout: () => void
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("categories")
  const [categories, setCategories] = useState<Category[]>([])
  const [contents, setContents] = useState<Content[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showContentForm, setShowContentForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingType, setEditingType] = useState<"category" | "content" | null>(null)
  const [loading, setLoading] = useState(false)
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    display_order: 0,
  })
  
  const [contentForm, setContentForm] = useState({
    title: "",
    description: "",
    content: "",
    is_published: true,
    display_order: 0,
  })

  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null)
  const [contentImageFile, setContentImageFile] = useState<File | null>(null)
  const [contentImagePreview, setContentImagePreview] = useState<string | null>(null)
  const contentFileInputRef = useRef<HTMLInputElement | null>(null)

  // Slider admin states
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([])
  const [sliderImageFile, setSliderImageFile] = useState<File | null>(null)
  const [sliderImagePreview, setSliderImagePreview] = useState<string | null>(null)
  const sliderImageFileInputRef = useRef<HTMLInputElement | null>(null)

  // Authentication is handled via Supabase session cookie.
  // Component is mounted only when authenticated, so fetch initial data on mount.
  useEffect(() => {
    fetchCategories()
    fetchSliderImages()
  }, [])

  // (Using Supabase client directly; no response JSON helper needed)

  useEffect(() => {
    if (selectedCategoryId) {
      fetchContents()
    }
  }, [selectedCategoryId])

  useEffect(() => {
    if (contentImageFile) {
      const url = URL.createObjectURL(contentImageFile)
      setContentImagePreview(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setContentImagePreview(null)
    }
  }, [contentImageFile])

  const fetchCategories = async () => {
    try {
      const res = await fetchWithAuth('/api/categories')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('Error fetching categories (server):', err)
        return
      }

      const data = await res.json().catch(() => [])
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchContents = async () => {
    if (!selectedCategoryId) return
    try {
      // Use server API to fetch contents so results match server-side inserts
      const res = await fetchWithAuth(`/api/contents?categoryId=${encodeURIComponent(String(selectedCategoryId))}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('Error fetching contents (server):', err)
        setContents([])
        return
      }

      const data = await res.json().catch(() => [])
      setContents(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching contents:', error)
      setContents([])
    }
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Use server API to perform category create/update so RLS is enforced server-side
      const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'images'

      let res: Response

      if (categoryImageFile) {
        const fd = new FormData()
        fd.append('name', String(categoryForm.name))
        fd.append('description', categoryForm.description || '')
        fd.append('display_order', String(categoryForm.display_order ?? 0))
        fd.append('image', categoryImageFile)

        if (editingId) {
          res = await fetchWithAuth(`/api/categories/${editingId}`, { method: 'PUT', body: fd })
        } else {
          res = await fetchWithAuth('/api/categories', { method: 'POST', body: fd })
        }
      } else {
        const payload = {
          name: String(categoryForm.name),
          description: categoryForm.description || null,
          display_order: Number.isFinite(Number(categoryForm.display_order)) ? Number(categoryForm.display_order) : 0,
        }

        if (editingId) {
          res = await fetchWithAuth(`/api/categories/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
        } else {
          res = await fetchWithAuth('/api/categories', { method: 'POST', body: JSON.stringify(payload) })
        }
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Erro ao salvar categoria')
      }

      toast({ title: 'Sucesso', description: editingId ? 'Categoria atualizada!' : 'Categoria criada!' })
      fetchCategories()
      setShowCategoryForm(false)
      setCategoryForm({ name: "", description: "", display_order: 0 })
      setCategoryImageFile(null)
      setEditingId(null)
      setEditingType(null)
    } catch (error: any) {
      console.error('Error saving category:', error)
      const errMsg = error?.message || 'Erro ao salvar categoria.'
      toast({ title: 'Erro', description: errMsg })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!selectedCategoryId) {
        toast({ title: 'Erro', description: 'Você precisa estar logado e selecionar uma categoria.' })
        return
      }
      const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'images'

      let res: Response

      if (contentImageFile) {
        const fd = new FormData()
        fd.append('title', String(contentForm.title))
        fd.append('description', contentForm.description || '')
        fd.append('content', contentForm.content || '')
        fd.append('category_id', selectedCategoryId)
        fd.append('is_published', String(!!contentForm.is_published))
        fd.append('display_order', String(contentForm.display_order ?? 0))
        fd.append('image', contentImageFile)

        if (editingId) {
          console.log('[admin] PUT /api/contents id=', editingId)
          res = await fetchWithAuth(`/api/contents/${encodeURIComponent(String(editingId))}`, { method: 'PUT', body: fd })
        } else {
          console.log('[admin] POST /api/contents (create)')
          res = await fetchWithAuth('/api/contents', { method: 'POST', body: fd })
        }
      } else {
        const payload = {
          title: contentForm.title,
          description: contentForm.description || null,
          content: contentForm.content || null,
          category_id: selectedCategoryId,
          is_published: !!contentForm.is_published,
          display_order: Number.isFinite(Number(contentForm.display_order)) ? Number(contentForm.display_order) : 0,
        }

        if (editingId) {
          console.log('[admin] PUT /api/contents id=', editingId)
          res = await fetchWithAuth(`/api/contents/${encodeURIComponent(String(editingId))}`, { method: 'PUT', body: JSON.stringify(payload) })
        } else {
          console.log('[admin] POST /api/contents (create)')
          res = await fetchWithAuth('/api/contents', { method: 'POST', body: JSON.stringify(payload) })
        }
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Erro ao salvar conteúdo')
      }

      const result = await res.json().catch(() => null)

      // Update UI immediately
      if (result && (result as any).id) {
        const r: any = result
        setContents((prev) => {
          if (editingId) {
            return prev.map((p) => (p.id === r.id ? r : p))
          }
          return [r, ...(Array.isArray(prev) ? prev : [])]
        })
      }

      toast({ title: 'Sucesso', description: editingId ? 'Conteúdo atualizado!' : 'Conteúdo criado!' })
      setShowContentForm(false)
      setContentForm({ title: "", description: "", content: "", is_published: true, display_order: 0 })
      setContentImageFile(null)
      setContentImagePreview(null)
      setEditingId(null)
      setEditingType(null)
      await fetchContents()
    } catch (error) {
      console.error("Error saving content:", error)
      const errMsg = (error as any)?.message || 'Erro ao salvar conteúdo.'
      toast({ title: 'Erro', description: errMsg })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    const t = toast({
      title: "Confirmar exclusão",
      description: "Esta ação não pode ser desfeita.",
      action: (
        <ToastAction
          altText="Confirmar"
          className="border-red-500 bg-red-500 hover:bg-red-600 text-white"
          onClick={async () => {
            try {
              console.log('[admin] DELETE /api/categories id=', id)
              // Use server API to delete category (server will remove storage files and rows)
              const res = await fetchWithAuth(`/api/categories/${encodeURIComponent(String(id))}`, { method: 'DELETE' })
              if (!res.ok && res.status !== 204) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err?.error || 'Failed to delete category')
              }

              toast({ title: 'Sucesso', description: 'Categoria removida.' })
              fetchCategories()
              if (selectedCategoryId === id) {
                setSelectedCategoryId(null)
                setContents([])
              }
            } catch (error) {
              console.error('Error deleting category:', error)
              const errMsg = (error as any)?.message || 'Erro ao deletar categoria.'
              toast({ title: 'Erro', description: errMsg })
            } finally {
              t.dismiss()
            }
          }}
        >
          Deletar
        </ToastAction>
      ),
    })
  }

  const handleDeleteContent = async (id: string) => {
    const t = toast({
      title: "Confirmar exclusão",
      description: "Esta ação não pode ser desfeita.",
      action: (
        <ToastAction
          altText="Confirmar"
          className="border-red-500 bg-red-500 hover:bg-red-600 text-white"
          onClick={async () => {
            try {
              console.log('[admin] DELETE /api/contents id=', id)
              // Use server API to delete content (server handles storage cleanup)
              const res = await fetchWithAuth(`/api/contents/${encodeURIComponent(String(id))}`, { method: 'DELETE' })
              if (!res.ok && res.status !== 204) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err?.error || 'Failed to delete content')
              }

              toast({ title: 'Sucesso', description: 'Conteúdo removido.' })
              fetchContents()
            } catch (error) {
              console.error('Error deleting content:', error)
              const errMsg = (error as any)?.message || 'Erro ao deletar conteúdo.'
              toast({ title: 'Erro', description: errMsg })
            } finally {
              t.dismiss()
            }
          }}
        >
          Deletar
        </ToastAction>
      ),
    })
  }

  /* -------- Slider images (highlights) -------- */
  const fetchSliderImages = async () => {
    try {
      const res = await fetchWithAuth('/api/highlights/images')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('Error fetching slider images (server):', err)
        setSliderImages([])
        return
      }

      const data = await res.json().catch(() => [])
      setSliderImages(Array.isArray(data) ? data.sort((a, b) => a.display_order - b.display_order) : [])
    } catch (error) {
      console.error('Error fetching slider images:', error)
      setSliderImages([])
    }
  }

  const handleAddSliderImage = async () => {
    if (!sliderImageFile) {
      toast({ title: 'Erro', description: 'Selecione uma imagem para fazer upload.' })
      return
    }

    setLoading(true)
    try {
      // Use server endpoint to handle uploads (service role) and DB inserts.
      const form = new FormData()
      form.append('image', sliderImageFile as File)
      form.append('display_order', String(sliderImages.length))

      const res = await fetchWithAuth('/api/highlights/images', {
        method: 'POST',
        body: form,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to upload slider image')
      }

      toast({ title: 'Sucesso', description: 'Imagem adicionada ao slider.' })
      fetchSliderImages()
      setSliderImageFile(null)
      setSliderImagePreview(null)
      if (sliderImageFileInputRef.current) sliderImageFileInputRef.current.value = ''
    } catch (error) {
      console.error('Error adding slider image:', error)
      const errMsg = (error as any)?.message || 'Erro ao adicionar imagem.'
      toast({ title: 'Erro', description: errMsg })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSliderImage = async (id: string) => {
    const t = toast({
      title: 'Confirmar exclusão',
      description: 'Clique em Confirmar para deletar esta imagem do slider.',
      action: (
              <ToastAction
          altText="Confirmar exclusão"
          className="border-red-500 bg-red-500 hover:bg-red-600 text-white"
          onClick={async () => {
            try {
              // Ask server to delete the slider image (server handles storage cleanup)
              const res = await fetchWithAuth(`/api/highlights/images/${encodeURIComponent(String(id))}`, { method: 'DELETE' })
              if (!res.ok && res.status !== 204) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err?.error || 'Failed to delete slider image')
              }

              fetchSliderImages()
            } catch (error) {
              console.error('Error deleting slider image:', error)
              const errMsg = (error as any)?.message || 'Erro ao deletar imagem.'
              toast({ title: 'Erro', description: errMsg })
            } finally {
              t.dismiss()
            }
          }}
        >
          Confirmar
        </ToastAction>
      ),
    })
  }

  const handleUpdateSliderImageOrder = async () => {
    try {
      // Send the new order to the server which updates `hero_slider_images` with service role
      const payload = { images: sliderImages.map((img, idx) => ({ id: img.id, display_order: idx })) }
      const res = await fetchWithAuth('/api/highlights/images/reorder', { method: 'PUT', body: JSON.stringify(payload) })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to update image order')
      }
      toast({ title: 'Sucesso', description: 'Ordem das imagens atualizada.' })
      fetchSliderImages()
    } catch (error) {
      console.error('Error updating slider image order:', error)
      const errMsg = (error as any)?.message || 'Erro ao atualizar ordem das imagens.'
      toast({ title: 'Erro', description: errMsg })
    }
  }



  const handleEditCategory = (cat: Category) => {
    setCategoryForm({
      name: cat.name,
      description: cat.description || "",
      display_order: cat.display_order,
    })
    setEditingId(cat.id)
    setEditingType("category")
    setShowCategoryForm(true)
  }

  const handleEditContent = (item: Content) => {
    setContentForm({
      title: item.title,
      description: item.description || "",
      content: item.content || "",
      is_published: item.is_published,
      display_order: item.display_order,
    })
    setEditingId(item.id)
    setEditingType("content")
    setShowContentForm(true)
  }

  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('Client signOut failed:', e)
    }

    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    } catch (err) {
      // ignore
    }

    onLogout()
  }

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", description: "", display_order: 0 })
    setCategoryImageFile(null)
    setEditingId(null)
    setEditingType(null)
    setShowCategoryForm(false)
  }

  const resetContentForm = () => {
    setContentForm({ title: "", description: "", content: "", is_published: true, display_order: 0 })
    setContentImageFile(null)
    setEditingId(null)
    setEditingType(null)
    setShowContentForm(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-black text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
                      
              <p className="text-white/80 text-sm mt-1">Gerencie categorias e conteúdos dinamicamente</p>
            </div>
                <Image src="/spg2.png" alt="" width={10} height={10} className="w-30 h-30 object-contain" />
          </div>

          <div className="flex gap-3">
            <Button asChild className="bg-white/10 hover:bg-white/20 text-white">
              <a href="/" className="flex items-center">
                <Home className="w-4 h-4 mr-2" />
                Home
              </a>
            </Button>
            <Button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 text-white">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="categories" className="cursor-pointer">Categorias</TabsTrigger>
            <TabsTrigger value="contents" className="cursor-pointer">Conteúdo</TabsTrigger>
            <TabsTrigger value="slider" className="cursor-pointer">Slider Imagens</TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Gerenciar Categorias</h2>
                <p className="text-foreground/60 mt-1">Crie categorias para organizar seu conteúdo no site</p>
              </div>
              <Button
                onClick={() => {
                  resetCategoryForm()
                  setShowCategoryForm(true)
                }}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
            </div>

            {showCategoryForm && (
              <form
                onSubmit={handleSaveCategory}
                className="bg-accent/5 rounded-lg p-6 border border-accent/20 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nome da Categoria *</label>
                  <Input
                    placeholder="Ex: Artigos, Notícias, Serviços..."
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Descrição</label>
                  <Textarea
                    placeholder="Descrição breve da categoria"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Ordem de Exibição</label>
                  <Input
                    type="number"
                    value={categoryForm.display_order}
                    onChange={(e) => {
                      const parsed = Number.parseInt(e.target.value) || 0
                      setCategoryForm({ ...categoryForm, display_order: parsed })
                    }}
                  />
                  <p className="text-xs text-foreground/50 mt-1">Menor número = aparece primeiro</p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1 bg-primary text-white">
                    {loading ? (
                      <>
                        <Spinner className="mr-2 w-4 h-4" /> Salvando...
                      </>
                    ) : editingType === "category" ? (
                      "Atualizar Categoria"
                    ) : (
                      "Criar Categoria"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetCategoryForm}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

            <div className="grid gap-4">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-card rounded-lg p-4 border border-border hover:shadow-md transition group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground text-lg">{cat.name}</h3>
                        {cat.description && (
                          <p className="text-sm text-foreground/60 mt-1">{cat.description}</p>
                        )}
                        <p className="text-xs text-foreground/40 mt-2">Ordem: {cat.display_order} • Criado: {new Date(cat.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditCategory(cat)}
                          size="sm"
                          variant="outline"
                          className="text-blue-500 border-blue-500 hover:bg-blue-500/10"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteCategory(cat.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-accent/5 rounded-lg border border-dashed border-accent/20">
                  <p className="text-foreground/60">Nenhuma categoria criada ainda</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Slider Images Tab */}
          <TabsContent value="slider" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Gerenciar Slider de Imagens</h2>
                <p className="text-foreground/60 mt-1">Adicione e organize imagens para o slider principal</p>
              </div>
            </div>

            {/* Add Image Section */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold mb-4">Adicionar Nova Imagem</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="slider-image" className="block text-sm font-medium mb-2">Selecionar Imagem</label>
                  <div className="flex items-center gap-4">
                    <input
                      ref={sliderImageFileInputRef}
                      type="file"
                      id="slider-image"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setSliderImageFile(file)
                          const reader = new FileReader()
                          reader.onloadend = () => setSliderImagePreview(reader.result as string)
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                    <Button onClick={() => sliderImageFileInputRef.current?.click()} variant="outline">
                      <Upload className="w-4 h-4 mr-2" /> Escolher Imagem
                    </Button>
                    {sliderImageFile && <span className="text-sm text-foreground/60">{sliderImageFile.name}</span>}
                  </div>
                </div>

                {sliderImagePreview && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Pré-visualização:</p>
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                      <img src={sliderImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}

                <Button onClick={handleAddSliderImage} disabled={!sliderImageFile || loading} className="w-full">
                  {loading ? (<><Spinner className="mr-2" /> Uploading...</>) : (<><Plus className="w-4 h-4 mr-2" /> Adicionar Imagem ao Slider</>) }
                </Button>
              </div>
            </div>

            {/* Images List */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Imagens no Slider ({sliderImages.length})</h3>
                {sliderImages.length > 1 && <Button onClick={handleUpdateSliderImageOrder} size="sm" variant="outline">Salvar Ordem</Button>}
              </div>

              <div className="space-y-3">
                {sliderImages.length > 0 ? (
                  sliderImages.map((image, idx) => (
                    <div key={image.id} className="flex flex-col md:flex-row items-start md:items-center gap-4 p-3 bg-muted/50 rounded-lg border border-border">
                      <div className="flex-shrink-0 w-full md:w-20 h-40 md:h-20 rounded overflow-hidden border border-border">
                        <img src={image.image_url} alt={`Slider ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Posição: {idx + 1}</p>
                        <p className="text-xs text-foreground/60 mt-1 break-all md:truncate max-w-full overflow-hidden">{image.image_url}</p>
                      </div>

                      <div className="flex-shrink-0 flex gap-2 mt-3 md:mt-0">
                        {idx > 0 && (
                          <Button onClick={() => { const newImages = [...sliderImages]; [newImages[idx], newImages[idx - 1]] = [newImages[idx - 1], newImages[idx]]; setSliderImages(newImages) }} size="sm" variant="outline" className="px-2 py-1">
                            ↑
                          </Button>
                        )}
                        {idx < sliderImages.length - 1 && (
                          <Button onClick={() => { const newImages = [...sliderImages]; [newImages[idx], newImages[idx + 1]] = [newImages[idx + 1], newImages[idx]]; setSliderImages(newImages) }} size="sm" variant="outline" className="px-2 py-1">
                            ↓
                          </Button>
                        )}
                        <Button onClick={() => handleDeleteSliderImage(image.id)} size="sm" variant="outline" className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white px-2 py-1">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-foreground/60">Nenhuma imagem adicionada ao slider</div>
                )}
              </div>
            </div>
          </TabsContent>


          {/* Contents Tab */}
          <TabsContent value="contents" className="space-y-6">
            {/* Category Selector */}
            <div className="bg-accent/5 rounded-lg p-4 border border-accent/20">
              <p className="text-sm font-medium text-foreground mb-2">Selecione uma categoria para gerenciar seus conteúdos:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        selectedCategoryId === cat.id
                          ? "bg-primary text-white"
                          : "bg-card border border-border hover:border-primary text-foreground"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))
                ) : (
                  <p className="text-foreground/60 col-span-full">Crie uma categoria primeiro</p>
                )}
              </div>
            </div>

            {selectedCategoryId && (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Conteúdos</h2>
                    <p className="text-foreground/60 mt-1">Gerenciar conteúdos desta categoria</p>
                  </div>
                  <Button
                    onClick={() => {
                      resetContentForm()
                      setShowContentForm(true)
                    }}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Conteúdo
                  </Button>
                </div>

                {showContentForm && (
                  <form
                    onSubmit={handleSaveContent}
                    className="bg-accent/5 rounded-lg p-6 border border-accent/20 space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Título *</label>
                      <Input
                        placeholder="Título do conteúdo"
                        value={contentForm.title}
                        onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Descrição *</label>
                      <Textarea
                        placeholder="Descrição breve (aparece nos cards)"
                        value={contentForm.description}
                        onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })}
                        rows={2}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Conteúdo Completo *</label>
                      <Textarea
                        placeholder="Conteúdo completo (aparece na página individual)"
                        value={contentForm.content}
                        onChange={(e) => setContentForm({ ...contentForm, content: e.target.value })}
                        rows={5}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Imagem</label>
                      <input
                        ref={contentFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setContentImageFile(e.target.files?.[0] || null)}
                      />
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => contentFileInputRef.current?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Selecionar imagem
                        </Button>
                        {(contentImagePreview || contentForm) && contentImagePreview && (
                          <div className="flex items-center gap-2">
                            <img
                              src={contentImagePreview}
                              alt="preview"
                              className="w-24 h-16 object-cover rounded"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Ordem de Exibição</label>
                      <Input
                        type="number"
                        value={contentForm.display_order}
                        onChange={(e) => {
                          const parsed = Number.parseInt(e.target.value) || 0
                          setContentForm({ ...contentForm, display_order: parsed })
                        }}
                      />
                      <p className="text-xs text-foreground/50 mt-1">Menor número = aparece primeiro</p>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading} className="flex-1 hover:scale-101 bg-primary text-white">
                        {loading ? (
                          <>
                            <Spinner className="mr-2 w-4 h-4" /> Salvando...
                          </>
                        ) : editingType === "content" ? (
                          "Atualizar Conteúdo"
                        ) : (
                          "Criar Conteúdo"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetContentForm}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}

                <div className="grid gap-4">
                  {contents.length > 0 ? (
                    contents.map((item) => (
                      <div
                        key={item.id}
                        className="bg-card rounded-lg p-4 border border-border hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start gap-4">
                          {item.image_url ? (
                            <div className="w-36 h-24 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                              <img src={item.image_url} alt={item.title || 'imagem'} className="w-full h-full object-cover" />
                            </div>
                          ) : null}

                          <div className="flex-1">
                            <h3 className="font-bold text-foreground text-lg">{item.title}</h3>
                            <p className="text-sm text-foreground/60 line-clamp-2 mt-1">{item.description}</p>
                            <div className="flex gap-2 mt-3 flex-wrap">
                              <span className={`text-xs px-2 py-1 rounded font-medium ${
                                item.is_published
                                  ? "bg-green-500/20 text-green-700"
                                  : "bg-yellow-500/20 text-yellow-700"
                              }`}>
                                {item.is_published ? "✓ Publicado" : "○ Rascunho"}
                              </span>
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                Ordem: {item.display_order}
                              </span>
                            </div>
                            <p className="text-xs text-foreground/40 mt-2">Atualizado: {new Date(item.updated_at).toLocaleDateString('pt-BR')}</p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEditContent(item)}
                              size="sm"
                              variant="outline"
                              className="text-blue-500 border-blue-500 hover:bg-blue-500/10"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteContent(item.id)}
                              size="sm"
                              variant="outline"
                              className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-accent/5 rounded-lg border border-dashed border-accent/20">
                      <p className="text-foreground/60">Nenhum conteúdo criado nesta categoria</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
