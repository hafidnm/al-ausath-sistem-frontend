1. Select / Dropdown

<div className="space-y-2 md:col-span-2">
  <Label>Status Ketuntasan <span className="text-muted-foreground font-normal">(opsional)</span></Label>
  <Select 
    value={statusKetuntasan} 
    onValueChange={(v) => setStatusKetuntasan(v === "none" ? "" : v)}
  >
    <SelectTrigger>
      <SelectValue placeholder="Pilih status ketuntasan (opsional)" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">Tidak ada</SelectItem>
      <SelectItem value="menguasai">Menguasai</SelectItem>
      <SelectItem value="ahli">Ahli</SelectItem>
      <SelectItem value="menerapkan">Menerapkan</SelectItem>
    </SelectContent>
  </Select>
</div>


2. Segmented Control / Button Group

<div className="space-y-2 md:col-span-2">
  <Label>Status Ketuntasan <span className="text-muted-foreground font-normal">(opsional)</span></Label>
  <div className="inline-flex rounded-md shadow-sm border border-input p-1 bg-muted/20">
    {["menguasai", "ahli", "menerapkan"].map((opt) => (
      <button
        key={opt}
        type="button"
        onClick={() => setStatusKetuntasan(statusKetuntasan === opt ? "" : opt)}
        className={`px-4 py-2 text-sm font-medium rounded-sm transition-colors ${
          statusKetuntasan === opt
            ? "bg-background text-foreground shadow-sm" // Active state
            : "text-muted-foreground hover:text-foreground" // Inactive state
        }`}
      >
        {opt.charAt(0).toUpperCase() + opt.slice(1)}
      </button>
    ))}
  </div>
  <p className="text-xs text-muted-foreground">Klik lagi untuk membatalkan pilihan.</p>
</div>


3. Clickable Pills / Tags

<div className="space-y-2 md:col-span-2">
  <Label>Status Ketuntasan <span className="text-muted-foreground font-normal">(opsional)</span></Label>
  <div className="flex flex-wrap gap-2 pt-1">
    {["menguasai", "ahli", "menerapkan"].map((opt) => (
      <Badge
        key={opt}
        variant={statusKetuntasan === opt ? "default" : "outline"}
        className="cursor-pointer px-3 py-1 text-sm font-normal"
        onClick={() => setStatusKetuntasan(statusKetuntasan === opt ? "" : opt)}
      >
        {opt.charAt(0).toUpperCase() + opt.slice(1)}
      </Badge>
    ))}
  </div>
</div>


4. Radio Group (Vertical)

<div className="space-y-2 md:col-span-2">
  <Label>Status Ketuntasan <span className="text-muted-foreground font-normal">(opsional)</span></Label>
  <div className="flex flex-col space-y-1">
    {["menguasai", "ahli", "menerapkan"].map((opt) => (
      <label
        key={opt}
        className="flex items-center space-x-2 cursor-pointer"
      >
        <RadioGroupItem
          value={statusKetuntasan}
          checked={statusKetuntasan === opt}
          onCheckedChange={() => setStatusKetuntasan(opt)}
        />
        <span className="text-sm font-medium">
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </span>
      </label>
    ))}
  </div>
</div>


5. Radio Group (Horizontal)

<div className="space-y-2">
  <Label>Status Ketuntasan <span className="text-muted-foreground font-normal">(opsional)</span></Label>
  <div className="flex items-center gap-6">
    {["menguasai", "ahli", "menerapkan"].map((opt) => (
      <label key={opt} className="flex items-center space-x-2 cursor-pointer">
        <RadioGroupItem 
          value={opt} 
          checked={statusKetuntasan === opt}
          onCheckedChange={() => setStatusKetuntasan(opt)}
        />
        <span className="text-sm font-medium">{opt.charAt(0).toUpperCase() + opt.slice(1)}</span>
      </label>
    ))}
  </div>
</div>
