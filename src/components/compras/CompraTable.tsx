"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/shared/DataTable"
import { getCompraColumns, type CompraRow } from "@/components/compras/CompraColumns"
import { CompraForm } from "@/components/compras/CompraForm"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "sonner"

interface CompraTableProps {
  compras: CompraRow[]
  total:   number
}

export function CompraTable({ compras, total }: CompraTableProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta compra? Se revertirá el ajuste de stock.")) return
    const res = await fetch(`/api/compras/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Compra eliminada y stock revertido")
      router.refresh()
    } else {
      toast.error("Error al eliminar")
    }
  }

  const columns = getCompraColumns(handleDelete)

  const toolbar = (
    <div className="flex items-center justify-end w-full">
      <Button size="sm" className="h-8" onClick={() => setFormOpen(true)}>
        <Plus className="h-3.5 w-3.5 mr-1" /> Nueva compra
      </Button>
    </div>
  )

  return (
    <>
      <DataTable columns={columns} data={compras} pageSize={50} toolbar={toolbar} />
      <p className="text-xs text-muted-foreground">{total} compras registradas</p>

      <CompraForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={(msg) => { toast.info(msg); router.refresh() }}
      />
    </>
  )
}
