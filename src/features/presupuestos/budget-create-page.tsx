import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createBudget, getCustomers } from '@/lib/api/budgets'
import { getBranches } from '@/lib/api/commercial'
import type { BudgetActivityInput, BudgetChapterInput } from '@/types/budgets'

function emptyActivity(): BudgetActivityInput {
  return { description: '', materialQuantity: 0, materialCost: 0, laborCost: 0, equipmentCost: 0 }
}

function emptyChapter(order: number): BudgetChapterInput {
  return { name: '', order, estimatedWeeks: 1, activities: [emptyActivity()] }
}

export function BudgetCreatePage() {
  const navigate = useNavigate()
  const customersQuery = useQuery({ queryKey: ['customers'], queryFn: getCustomers })
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: getBranches })

  const [name, setName] = useState('')
  const [customerId, setCustomerId] = useState<string>('')
  const [branchId, setBranchId] = useState<string>('')
  const [utilityPercentage, setUtilityPercentage] = useState(15)
  const [indirectCostsTotal, setIndirectCostsTotal] = useState(0)
  const [chapters, setChapters] = useState<BudgetChapterInput[]>([emptyChapter(1)])

  const mutation = useMutation({
    mutationFn: createBudget,
    onSuccess: (budget) => {
      toast.success('Presupuesto creado como borrador')
      navigate(`/presupuestos/${budget.id}`)
    },
    onError: () => toast.error('No se pudo crear el presupuesto.'),
  })

  function updateChapter(index: number, patch: Partial<BudgetChapterInput>) {
    setChapters((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  function updateActivity(chapterIndex: number, activityIndex: number, patch: Partial<BudgetActivityInput>) {
    setChapters((prev) =>
      prev.map((c, i) =>
        i === chapterIndex
          ? {
              ...c,
              activities: c.activities.map((a, ai) =>
                ai === activityIndex ? { ...a, ...patch } : a,
              ),
            }
          : c,
      ),
    )
  }

  function addChapter() {
    setChapters((prev) => [...prev, emptyChapter(prev.length + 1)])
  }

  function removeChapter(index: number) {
    setChapters((prev) => prev.filter((_, i) => i !== index))
  }

  function addActivity(chapterIndex: number) {
    setChapters((prev) =>
      prev.map((c, i) =>
        i === chapterIndex ? { ...c, activities: [...c.activities, emptyActivity()] } : c,
      ),
    )
  }

  function removeActivity(chapterIndex: number, activityIndex: number) {
    setChapters((prev) =>
      prev.map((c, i) =>
        i === chapterIndex
          ? { ...c, activities: c.activities.filter((_, ai) => ai !== activityIndex) }
          : c,
      ),
    )
  }

  const estimatedTotal = chapters.reduce(
    (sum, c) =>
      sum +
      c.activities.reduce((aSum, a) => aSum + a.materialCost + a.laborCost + a.equipmentCost, 0),
    0,
  )

  function handleSubmit() {
    if (!name || !customerId || !branchId) {
      toast.error('Completá nombre, cliente y sucursal.')
      return
    }
    mutation.mutate({
      name,
      customerId: Number(customerId),
      branchId: Number(branchId),
      utilityPercentage,
      indirectCostsTotal,
      chapters,
    })
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo presupuesto</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Nombre del presupuesto</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Cliente</Label>
              <Select value={customerId || undefined} onValueChange={(v) => setCustomerId(v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elegí un cliente">
                    {(value: string | null) =>
                      customersQuery.data?.find((c) => String(c.id) === value)?.name ??
                      'Elegí un cliente'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customersQuery.data?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Sucursal</Label>
              <Select value={branchId || undefined} onValueChange={(v) => setBranchId(v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elegí una sucursal">
                    {(value: string | null) =>
                      branchesQuery.data?.find((b) => String(b.id) === value)?.name ??
                      'Elegí una sucursal'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {branchesQuery.data?.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Utilidad (%)</Label>
              <Input
                type="number"
                value={utilityPercentage}
                onChange={(e) => setUtilityPercentage(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Costos indirectos (₡)</Label>
              <Input
                type="number"
                value={indirectCostsTotal}
                onChange={(e) => setIndirectCostsTotal(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t pt-4">
            <Label>Capítulos</Label>
            {chapters.map((chapter, ci) => (
              <div key={ci} className="flex flex-col gap-3 rounded-lg border p-3">
                <div className="flex items-end gap-2">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Nombre del capítulo</Label>
                    <Input
                      value={chapter.name}
                      onChange={(e) => updateChapter(ci, { name: e.target.value })}
                    />
                  </div>
                  <div className="flex w-32 flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Semanas est.</Label>
                    <Input
                      type="number"
                      value={chapter.estimatedWeeks}
                      onChange={(e) =>
                        updateChapter(ci, { estimatedWeeks: Number(e.target.value) })
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChapter(ci)}
                    disabled={chapters.length === 1}
                  >
                    Quitar capítulo
                  </Button>
                </div>

                <div className="flex flex-col gap-2 pl-3">
                  {chapter.activities.map((activity, ai) => (
                    <div key={ai} className="grid grid-cols-6 items-end gap-2">
                      <div className="col-span-2 flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Actividad</Label>
                        <Input
                          value={activity.description}
                          onChange={(e) =>
                            updateActivity(ci, ai, { description: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Materiales</Label>
                        <Input
                          type="number"
                          value={activity.materialCost}
                          onChange={(e) =>
                            updateActivity(ci, ai, { materialCost: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Mano de obra</Label>
                        <Input
                          type="number"
                          value={activity.laborCost}
                          onChange={(e) =>
                            updateActivity(ci, ai, { laborCost: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Equipo</Label>
                        <Input
                          type="number"
                          value={activity.equipmentCost}
                          onChange={(e) =>
                            updateActivity(ci, ai, { equipmentCost: Number(e.target.value) })
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeActivity(ci, ai)}
                        disabled={chapter.activities.length === 1}
                      >
                        Quitar
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => addActivity(ci)}
                  >
                    + Agregar actividad
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addChapter}>
              + Agregar capítulo
            </Button>
          </div>

          <div className="flex justify-between border-t pt-3 text-sm font-semibold">
            <span>Costo directo estimado</span>
            <span className="font-mono tabular-nums">₡{estimatedTotal.toLocaleString('es-CR')}</span>
          </div>

          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Creando…' : 'Crear presupuesto (borrador)'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
