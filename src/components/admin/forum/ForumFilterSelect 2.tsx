"use client"

import { useState } from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"

type Category = {
  id: string
  name: string
  forums: { id: string; name: string }[]
}

export default function ForumFilterSelect({
  name = "forumId",
  categories,
  value,
}: {
  name?: string
  categories: Category[]
  value?: string
}) {
  const [val, setVal] = useState<string>(value && value.length > 0 ? value : "__ALL__")
  return (
    <div>
      <input type="hidden" name={name} value={val === "__ALL__" ? '' : val} />
      <Select value={val} onValueChange={setVal}>
        <SelectTrigger className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm">
          <SelectValue placeholder="Alle Foren" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__ALL__">Alle Foren</SelectItem>
          {categories.map((cat) => (
            <SelectGroup key={cat.id}>
              <SelectLabel>{cat.name}</SelectLabel>
              {cat.forums.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
